using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using Backend.Application.Devices;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>
/// ISAPI «arming»: постоянный GET /ISAPI/Event/notification/alertStream (см. Pro/Value/Face Series).
/// Терминалы отдают события в multipart; SDK GET_ACS_EVENT на части устройств пустой или ненадёжен.
/// </summary>
public sealed class IsapiAlertStreamService(
    IDeviceConnectionManager connectionManager,
    IEventListenerService eventListener,
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<IsapiAlertStreamService> logger) : BackgroundService
{
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _workers = new(StringComparer.OrdinalIgnoreCase);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("IsapiAlertStreamService started (ISAPI alertStream per connected device).");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var active = await connectionManager.GetActiveConnectionsAsync(stoppingToken);
                var activeIds = active.Select(x => x.DeviceIdentifier).ToHashSet(StringComparer.OrdinalIgnoreCase);

                foreach (var key in _workers.Keys.ToArray())
                {
                    if (activeIds.Contains(key))
                        continue;
                    if (_workers.TryRemove(key, out var cts))
                    {
                        try { cts.Cancel(); }
                        catch { /* ignore */ }
                        cts.Dispose();
                        logger.LogInformation("ISAPI alertStream stopped for disconnected device {Id}", key);
                    }
                }

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
                        logger.LogWarning("ISAPI alertStream skipped for {Id}: empty password", conn.DeviceIdentifier);
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
                logger.LogError(ex, "IsapiAlertStream coordinator failed");
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
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await ConsumeAlertStreamOnceAsync(ip, devicePort, user, pwd, deviceIdentifier, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "ISAPI alertStream for {Id} ended; reconnect in 5 s", deviceIdentifier);
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
    }

    private async Task ConsumeAlertStreamOnceAsync(
        string ip,
        int devicePort,
        string user,
        string pwd,
        string deviceIdentifier,
        CancellationToken ct)
    {
        var paths = new[]
        {
            "ISAPI/Event/notification/alertStream?deployID=1",
            "ISAPI/Event/notification/alertStream"
        };

        foreach (var tryPort in IsapiPortHelper.GetPortsToTry(devicePort))
        {
            foreach (var path in paths)
            {
                ct.ThrowIfCancellationRequested();
                var scheme = tryPort == 443 ? "https" : "http";
                var uri = new Uri($"{scheme}://{ip}:{tryPort}/{path.TrimStart('/')}");

                // Как в IsapiClient.TryMultipartAsync: явный Digest + CredentialCache, иначе длинный GET alertStream часто остаётся 401.
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
                    /* Digest nonce warmup; ignore */
                }

                using var request = new HttpRequestMessage(HttpMethod.Get, uri);
                request.Headers.Accept.Clear();
                request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("*/*"));

                using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
                if (response.StatusCode == HttpStatusCode.NotFound)
                    continue;
                if (response.StatusCode == HttpStatusCode.Unauthorized)
                {
                    logger.LogWarning(
                        "ISAPI alertStream 401 for {Id} at {Uri} (проверьте логин/пароль устройства в БД и Hikvision:Password). Повтор через 60 с.",
                        deviceIdentifier,
                        uri);
                    try
                    {
                        await Task.Delay(TimeSpan.FromSeconds(60), ct);
                    }
                    catch (OperationCanceledException)
                    {
                        return;
                    }

                    return;
                }

                if (!response.IsSuccessStatusCode)
                    continue;

                var boundary = ResolveBoundary(response.Content.Headers.ContentType);
                if (string.IsNullOrEmpty(boundary))
                {
                    logger.LogWarning("ISAPI alertStream for {Id}: no multipart boundary in Content-Type", deviceIdentifier);
                    continue;
                }

                logger.LogInformation("ISAPI alertStream connected for {Id} ({Uri})", deviceIdentifier, uri);

                await using var stream = await response.Content.ReadAsStreamAsync(ct);
                var reader = new IsapiMultipartReader(stream, boundary);
                while (!ct.IsCancellationRequested)
                {
                    var part = await reader.ReadNextPartAsync(ct);
                    if (part is null)
                        break;

                    var evt = IsapiEventPartParser.TryCreateDeviceEvent(deviceIdentifier, part.Headers, part.Body);
                    if (evt is not null)
                        eventListener.Publish(evt);
                }

                logger.LogInformation("ISAPI alertStream closed for {Id} ({Uri})", deviceIdentifier, uri);
                return;
            }
        }

        logger.LogWarning("ISAPI alertStream: no working URL for device {Id} (tried HTTP(S) ports)", deviceIdentifier);
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
