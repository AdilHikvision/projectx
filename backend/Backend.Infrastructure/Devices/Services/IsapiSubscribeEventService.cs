using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Backend.Application.Devices;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>
/// Parallel push channel via <c>POST /ISAPI/Event/notification/subscribeEvent</c>.
///
/// Some Hikvision firmware versions are silent on the legacy <c>alertStream</c> long-poll
/// (we connect, the device returns 200 + a multipart stream, but no event parts ever arrive).
/// The same device will, however, push events through <c>subscribeEvent</c> if we POST a
/// <c>&lt;SubscribeEvent&gt;</c> body — that activates the device's "armed with subscription"
/// mode (per ISAPI Pro/Ultra/Value §4.4.1.1 / §11.1.1.2).
///
/// We run BOTH services in parallel. Each device may produce events through one channel, the
/// other, or both. <see cref="EventListenerService.IngestAsync"/> deduplicates events by
/// (deviceIdentifier, eventType, occurredUtc, payload-hash) so dual-source devices don't get
/// double-counted on the UI.
/// </summary>
public sealed class IsapiSubscribeEventService(
    IDeviceConnectionManager connectionManager,
    IEventListenerService eventListener,
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<IsapiSubscribeEventService> logger) : BackgroundService
{
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _workers = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Body variants we will try in order until the device accepts one with a multipart
    /// response. Different Hikvision firmware lines accept different request shapes:
    /// some want a fully-attributed root with eventMode/heartbeat, others want the absolute
    /// minimum bare element from §11.1.1.1, others only accept the JSON form.
    /// </summary>
    private static readonly (string PathSuffix, string Body, string MediaType, string Label)[] SubscribeAttempts = new[]
    {
        // Variant A: full XML with namespace + heartbeat + eventMode=all.
        // Works on chatty Pro controllers (e.g. DS-K1F600U-D6E).
        (
            "",
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<SubscribeEvent xmlns=\"http://www.isapi.org/ver20/XMLSchema\" version=\"2.0\">" +
            "<heartbeat>30</heartbeat>" +
            "<eventMode>all</eventMode>" +
            "</SubscribeEvent>",
            "application/xml",
            "xml-full"
        ),
        // Variant B: minimal bare element. Pro Series §4.4.1.1 example shows this exact form.
        (
            "",
            "<SubscribeEvent/>",
            "application/xml",
            "xml-bare"
        ),
        // Variant C: same minimal body with deployID=1 (real-time arming by platform). Some
        // Value Series face terminals only accept the realtime variant.
        (
            "?deployID=1",
            "<SubscribeEvent/>",
            "application/xml",
            "xml-bare-deploy1"
        ),
        // Variant D: JSON body via ?format=json — newer firmwares prefer this.
        (
            "?format=json",
            "{\"SubscribeEvent\":{\"heartbeat\":30,\"eventMode\":\"all\"}}",
            "application/json",
            "json"
        ),
    };

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("IsapiSubscribeEventService started (parallel POST subscribeEvent push channel).");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var active = await connectionManager.GetActiveConnectionsAsync(stoppingToken);
                var activeIds = active.Select(x => x.DeviceIdentifier).ToHashSet(StringComparer.OrdinalIgnoreCase);

                // Stop workers for devices that disconnected from the connection manager.
                foreach (var key in _workers.Keys.ToArray())
                {
                    if (activeIds.Contains(key))
                        continue;
                    if (_workers.TryRemove(key, out var cts))
                    {
                        try { cts.Cancel(); }
                        catch { /* ignore */ }
                        cts.Dispose();
                        logger.LogInformation("ISAPI subscribeEvent stopped for disconnected device {Id}", key);
                    }
                }

                // Spin up a worker for any active device that doesn't yet have one.
                foreach (var conn in active)
                {
                    if (_workers.ContainsKey(conn.DeviceIdentifier))
                        continue;

                    using var scope = scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var device = await db.Devices.AsNoTracking()
                        .FirstOrDefaultAsync(x => x.DeviceIdentifier == conn.DeviceIdentifier, stoppingToken);
                    if (device is null)
                        continue;

                    var user = device.Username ?? configuration["Hikvision:Username"] ?? "admin";
                    var pwd = device.Password ?? configuration["Hikvision:Password"] ?? "";
                    if (string.IsNullOrEmpty(pwd))
                    {
                        logger.LogWarning("ISAPI subscribeEvent skipped for {Id}: empty password", conn.DeviceIdentifier);
                        continue;
                    }

                    var linked = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                    if (!_workers.TryAdd(conn.DeviceIdentifier, linked))
                    {
                        linked.Dispose();
                        continue;
                    }

                    var id = conn.DeviceIdentifier;
                    var ip = device.IpAddress;
                    var port = device.Port;
                    _ = Task.Run(() => RunDeviceLoopAsync(ip, port, user, pwd, id, linked.Token), CancellationToken.None);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "IsapiSubscribeEvent coordinator failed");
            }

            await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);
        }

        foreach (var cts in _workers.Values)
        {
            try { cts.Cancel(); } catch { /* ignore */ }
            cts.Dispose();
        }

        _workers.Clear();
    }

    private async Task RunDeviceLoopAsync(string ip, int devicePort, string user, string pwd, string deviceIdentifier, CancellationToken ct)
    {
        // Some firmware versions return 404 / 501 for /subscribeEvent because they only
        // support the legacy alertStream. After three consecutive "not supported" outcomes
        // we give up on this channel for the rest of the device's session — the parallel
        // alertStream worker is already covering it.
        var unsupportedStrikes = 0;
        const int unsupportedThreshold = 3;

        while (!ct.IsCancellationRequested)
        {
            try
            {
                var outcome = await ConsumeSubscribeEventOnceAsync(ip, devicePort, user, pwd, deviceIdentifier, ct);
                if (outcome == SessionOutcome.Unsupported)
                {
                    unsupportedStrikes++;
                    if (unsupportedStrikes >= unsupportedThreshold)
                    {
                        logger.LogInformation(
                            "ISAPI subscribeEvent giving up on {Id}: device returned not-supported {N} times. Real-time events will rely on alertStream only.",
                            deviceIdentifier, unsupportedStrikes);
                        return;
                    }
                }
                else
                {
                    unsupportedStrikes = 0;
                }
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "ISAPI subscribeEvent for {Id} ended; reconnect in 5 s", deviceIdentifier);
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(5), ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private enum SessionOutcome
    {
        Closed,        // The multipart stream ended normally / connection dropped — retry.
        Unauthorized,  // 401 — wait longer before retry.
        Unsupported,   // 404 / 501 — device doesn't support this endpoint at all.
    }

    private async Task<SessionOutcome> ConsumeSubscribeEventOnceAsync(
        string ip,
        int devicePort,
        string user,
        string pwd,
        string deviceIdentifier,
        CancellationToken ct)
    {
        var anyUnsupported = false;
        var allBodyVariantsRejected = true;

        foreach (var tryPort in IsapiPortHelper.GetPortsToTry(devicePort))
        {
            ct.ThrowIfCancellationRequested();
            var scheme = tryPort == 443 ? "https" : "http";

            // Same Digest pre-auth pattern as IsapiAlertStreamService — without it, the long-poll
            // POST often comes back 401 indefinitely on Hikvision firmwares.
            var baseAuthority = new Uri($"{scheme}://{ip}:{tryPort}/");
            var credCache = new CredentialCache();
            credCache.Add(baseAuthority, "Digest", new NetworkCredential(user, pwd));

            using var handler = new HttpClientHandler
            {
                Credentials = credCache,
                PreAuthenticate = true,
                AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
            };
            if (scheme == "https")
                handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;

            using var client = new HttpClient(handler, disposeHandler: true)
            {
                Timeout = Timeout.InfiniteTimeSpan
            };

            try
            {
                using var warm = new HttpRequestMessage(HttpMethod.Get, new Uri($"{scheme}://{ip}:{tryPort}/ISAPI/System/deviceInfo"));
                using var _ = await client.SendAsync(warm, HttpCompletionOption.ResponseHeadersRead, ct);
            }
            catch
            {
                /* digest nonce warmup; ignore */
            }

            // Try each body variant in order. The first one that returns 200 + multipart
            // wins; the loop short-circuits and we enter the read loop.
            foreach (var attempt in SubscribeAttempts)
            {
                ct.ThrowIfCancellationRequested();
                var uri = new Uri($"{scheme}://{ip}:{tryPort}/ISAPI/Event/notification/subscribeEvent{attempt.PathSuffix}");

                using var request = new HttpRequestMessage(HttpMethod.Post, uri)
                {
                    Content = new StringContent(attempt.Body, Encoding.UTF8, attempt.MediaType),
                };
                request.Headers.Accept.Clear();
                request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("*/*"));

                HttpResponseMessage response;
                try
                {
                    response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    logger.LogDebug(ex, "ISAPI subscribeEvent send failed for {Id} {Uri} variant={Variant}",
                        deviceIdentifier, uri, attempt.Label);
                    continue;
                }

                using (response)
                {
                    if (response.StatusCode == HttpStatusCode.NotFound ||
                        response.StatusCode == HttpStatusCode.NotImplemented ||
                        response.StatusCode == HttpStatusCode.MethodNotAllowed)
                    {
                        // Endpoint genuinely missing on this firmware — no point trying more variants on this port.
                        anyUnsupported = true;
                        break;
                    }

                    if (response.StatusCode == HttpStatusCode.Unauthorized)
                    {
                        logger.LogWarning(
                            "ISAPI subscribeEvent 401 for {Id} at {Uri}. Backing off 60s.",
                            deviceIdentifier, uri);
                        try { await Task.Delay(TimeSpan.FromSeconds(60), ct); }
                        catch (OperationCanceledException) { return SessionOutcome.Closed; }
                        return SessionOutcome.Unauthorized;
                    }

                    if (!response.IsSuccessStatusCode)
                    {
                        // Read a small chunk of the error body so we can see WHY the device rejected us.
                        // Hikvision usually returns a small XML/JSON ResponseStatus with statusString + subStatusCode.
                        string errorSnippet = "";
                        try
                        {
                            var bytes = await response.Content.ReadAsByteArrayAsync(ct);
                            if (bytes.Length > 0)
                                errorSnippet = Encoding.UTF8.GetString(bytes, 0, Math.Min(bytes.Length, 256))
                                    .Replace('\n', ' ').Replace('\r', ' ').Trim();
                        }
                        catch
                        {
                            /* ignore */
                        }

                        logger.LogDebug(
                            "ISAPI subscribeEvent HTTP {Code} for {Id} variant={Variant} body=\"{Err}\"",
                            (int)response.StatusCode, deviceIdentifier, attempt.Label, errorSnippet);
                        continue; // Try next body variant.
                    }

                    var boundary = ResolveBoundary(response.Content.Headers.ContentType);
                    if (string.IsNullOrEmpty(boundary))
                    {
                        // Some firmwares return a one-shot XML acknowledgement instead of streaming
                        // multipart. Treat that as "subscribed but no events" — fall through to next variant.
                        logger.LogDebug(
                            "ISAPI subscribeEvent for {Id} variant={Variant}: response is not multipart (Content-Type {Ct}); trying next variant",
                            deviceIdentifier, attempt.Label, response.Content.Headers.ContentType);
                        continue;
                    }

                    allBodyVariantsRejected = false;
                    logger.LogInformation(
                        "ISAPI subscribeEvent connected for {Id} ({Uri}) variant={Variant}",
                        deviceIdentifier, uri, attempt.Label);
                    await connectionManager.TouchHeartbeatAsync(deviceIdentifier, DateTime.UtcNow, ct);

                    // Same connect-time replay cutoff as alertStream.
                    var connectedUtc = DateTime.UtcNow;
                    var replayCutoffUtc = connectedUtc - TimeSpan.FromSeconds(60);
                    var droppedReplayCount = 0;

                    await using var stream = await response.Content.ReadAsStreamAsync(ct);
                    var reader = new IsapiMultipartReader(stream, boundary);
                    while (!ct.IsCancellationRequested)
                    {
                        var part = await reader.ReadNextPartAsync(ct);
                        if (part is null)
                            break;

                        await connectionManager.TouchHeartbeatAsync(deviceIdentifier, DateTime.UtcNow, ct);

                        var evt = IsapiEventPartParser.TryCreateDeviceEvent(deviceIdentifier, part.Headers, part.Body);
                        if (evt is null)
                            continue;

                        if (evt.EventType != DeviceEventType.Heartbeat && evt.OccurredUtc < replayCutoffUtc)
                        {
                            droppedReplayCount++;
                            if (droppedReplayCount <= 5)
                            {
                                logger.LogDebug(
                                    "subscribeEvent dropped replayed event from {Id}: occurredUtc={Occurred:O} cutoff={Cutoff:O}",
                                    deviceIdentifier, evt.OccurredUtc, replayCutoffUtc);
                            }
                            continue;
                        }

                        eventListener.Publish(evt);
                    }

                    logger.LogInformation(
                        "ISAPI subscribeEvent closed for {Id} variant={Variant}; dropped {Dropped} replayed event(s) this session",
                        deviceIdentifier, attempt.Label, droppedReplayCount);
                    return SessionOutcome.Closed;
                }
            }

            // Tried every body variant on this port. If at least one returned a hard "not
            // supported" we move on to next port; otherwise the device just doesn't accept
            // any of our body shapes — also treated as unsupported so the worker gives up.
        }

        // Tried every port. If we got here, no variant worked anywhere.
        if (anyUnsupported || allBodyVariantsRejected)
            return SessionOutcome.Unsupported;
        return SessionOutcome.Closed;
    }

    private static string? ResolveBoundary(MediaTypeHeaderValue? contentType)
    {
        if (contentType is null)
            return null;
        var mt = contentType.MediaType;
        if (string.IsNullOrEmpty(mt) || !mt.Contains("multipart", StringComparison.OrdinalIgnoreCase))
            return null;
        var p = contentType.Parameters.FirstOrDefault(x => string.Equals(x.Name, "boundary", StringComparison.OrdinalIgnoreCase));
        if (p?.Value is null)
            return null;
        var v = p.Value.Trim().Trim('"');
        return string.IsNullOrEmpty(v) ? null : v;
    }
}
