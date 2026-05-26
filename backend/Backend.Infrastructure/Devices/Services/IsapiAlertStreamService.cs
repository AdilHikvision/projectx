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
        logger.LogInformation("IsapiAlertStreamService started (ISAPI alertStream per device in DB; SDK-independent).");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Раньше использовали connectionManager.GetActiveConnectionsAsync (только устройства
                // с успешным SDK login). Это исключало терминалы у которых SDK отдаёт error=7
                // (NET_DVR_Login_V40 timeout) — а у них при этом ISAPI HTTP вполне может работать.
                // Берём устройства напрямую из БД и держим alertStream worker для каждого.
                using var scope = scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var devices = await db.Devices.AsNoTracking()
                    .Where(x => x.IpAddress != null && x.IpAddress != "")
                    .ToListAsync(stoppingToken);

                var deviceIds = devices.Select(d => d.DeviceIdentifier).ToHashSet(StringComparer.OrdinalIgnoreCase);

                // Останавливаем worker'ы для устройств, которые исчезли из БД (удалены).
                foreach (var key in _workers.Keys.ToArray())
                {
                    if (deviceIds.Contains(key))
                        continue;
                    if (_workers.TryRemove(key, out var cts))
                    {
                        try { cts.Cancel(); }
                        catch { /* ignore */ }
                        cts.Dispose();
                        logger.LogInformation("ISAPI alertStream stopped for removed device {Id}", key);
                    }
                }

                // Запускаем worker'ов для каждого устройства из БД, у которого ещё нет потока.
                foreach (var device in devices)
                {
                    if (_workers.ContainsKey(device.DeviceIdentifier))
                        continue;

                    var user = device.Username ?? configuration["Hikvision:Username"] ?? "admin";
                    var pwd = device.Password ?? configuration["Hikvision:Password"] ?? "";
                    if (string.IsNullOrEmpty(pwd))
                    {
                        logger.LogWarning("ISAPI alertStream skipped for {Id}: empty password", device.DeviceIdentifier);
                        continue;
                    }

                    var linked = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                    if (!_workers.TryAdd(device.DeviceIdentifier, linked))
                    {
                        linked.Dispose();
                        continue;
                    }

                    var id = device.DeviceIdentifier;
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
        // deployID=1 (real-time arming) на некоторых прошивках replay'ит весь ring buffer
        // (видели на DS-K1T342MFX: > 10 дней backlog заливается перед realtime). deployID=0
        // (client-side arming) на тех же устройствах часто игнорирует backlog и шлёт только
        // realtime. Пробуем сначала =0, fallback на =1, fallback без параметра.
        var paths = new[]
        {
            "ISAPI/Event/notification/alertStream?deployID=0",
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

                // Replay horizon based on the DEVICE's own clock. We can't trust the server clock
                // (device RTC may drift days). The only reliable signal is the device's "now" —
                // read straight from /ISAPI/System/time. Anything older than (deviceNowUtc - 30s)
                // is replay; anything newer is real-time.
                //
                // If /System/time is unreachable, we REFUSE to subscribe to alertStream — without
                // a horizon we'd flood the Timeline with the entire ring buffer. Throwing here
                // sends control back to RunDeviceLoopAsync which retries in 5s.
                DateTime deviceHorizonUtc;
                using (var timeReq = new HttpRequestMessage(HttpMethod.Get, new Uri($"{scheme}://{ip}:{tryPort}/ISAPI/System/time")))
                {
                    using var timeCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                    timeCts.CancelAfter(TimeSpan.FromSeconds(8));
                    using var timeResp = await client.SendAsync(timeReq, HttpCompletionOption.ResponseContentRead, timeCts.Token);
                    if (!timeResp.IsSuccessStatusCode)
                        throw new InvalidOperationException($"/ISAPI/System/time returned {(int)timeResp.StatusCode}");
                    var body = await timeResp.Content.ReadAsStringAsync(timeCts.Token);
                    deviceHorizonUtc = ParseDeviceLocalTimeUtc(body) - TimeSpan.FromSeconds(30);
                    logger.LogInformation("alertStream {Id}: device-time horizon = {Horizon:O} (events older than this will be dropped as replay)",
                        deviceIdentifier, deviceHorizonUtc);
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

                var droppedReplayCount = 0;

                // The fact that the multipart stream opened successfully proves the device is alive.
                // Touch the heartbeat now so the housekeeping loop in EventListenerService doesn't
                // mark the device offline before the first event arrives (long quiet periods are
                // normal for access-control devices).
                await connectionManager.TouchHeartbeatAsync(deviceIdentifier, DateTime.UtcNow, ct);

                await using var stream = await response.Content.ReadAsStreamAsync(ct);
                var reader = new IsapiMultipartReader(stream, boundary);
                while (!ct.IsCancellationRequested)
                {
                    var part = await reader.ReadNextPartAsync(ct);
                    if (part is null)
                        break;

                    // Every part received over the alertStream — whether or not we recognise it
                    // as a structured event — proves the device is still talking to us. Refresh
                    // the heartbeat so MarkStaleConnectionsOfflineAsync keeps the device alive.
                    await connectionManager.TouchHeartbeatAsync(deviceIdentifier, DateTime.UtcNow, ct);

                    var evt = IsapiEventPartParser.TryCreateDeviceEvent(deviceIdentifier, part.Headers, part.Body);
                    if (evt is null)
                    {
                        logger.LogInformation("alertStream {Id}: part received but parser returned null (headers={HeaderCount}, body={BodyLen} bytes)",
                            deviceIdentifier, part.Headers.Count, part.Body.Length);
                        continue;
                    }

                    // Heartbeats нужны только для TouchHeartbeatAsync (см. выше) — в Timeline их
                    // не показываем, как и videoloss/DeviceOperation/Unknown шум.
                    if (evt.EventType == DeviceEventType.Heartbeat)
                        continue;

                    // Whitelist: только реально интересующие пользователя события доступа.
                    // DoorOpened (1), DoorClosed (5), AccessGranted (2), AccessDenied (3), AuthTimeout (6).
                    // Всё остальное — шум устройства (videoloss alarm, exit button released, remote login).
                    if (evt.EventType != DeviceEventType.DoorOpened
                        && evt.EventType != DeviceEventType.DoorClosed
                        && evt.EventType != DeviceEventType.AccessGranted
                        && evt.EventType != DeviceEventType.AccessDenied
                        && evt.EventType != DeviceEventType.AuthenticationTimeout)
                    {
                        continue;
                    }

                    // Anything older than the device's own "now minus 30s" is replay from the
                    // ring buffer — drop it. This works regardless of RTC drift or backlog size.
                    if (evt.OccurredUtc < deviceHorizonUtc)
                    {
                        droppedReplayCount++;
                        if (droppedReplayCount <= 3 || droppedReplayCount % 500 == 0)
                        {
                            logger.LogDebug(
                                "Dropped replay from {Id}: occurredUtc={Occurred:O} < horizon={Horizon:O} (total dropped: {Count})",
                                deviceIdentifier, evt.OccurredUtc, deviceHorizonUtc, droppedReplayCount);
                        }
                        continue;
                    }

                    logger.LogInformation("alertStream {Id}: PUBLISH evt type={Type} occurred={Occurred:O} summary={Summary}",
                        deviceIdentifier, evt.EventType, evt.OccurredUtc, evt.Summary ?? "—");
                    eventListener.Publish(evt);
                }

                logger.LogInformation(
                    "ISAPI alertStream closed for {Id} ({Uri}); dropped {Dropped} replayed event(s) this session",
                    deviceIdentifier,
                    uri,
                    droppedReplayCount);
                return;
            }
        }

        logger.LogWarning("ISAPI alertStream: no working URL for device {Id} (tried HTTP(S) ports)", deviceIdentifier);
    }

    /// <summary>
    /// Парсит ответ /ISAPI/System/time и возвращает device's current time in UTC.
    /// Hikvision отдаёт что-то вроде:
    /// <Time>
    ///   <timeMode>NTP</timeMode>
    ///   <localTime>2026-04-20T07:45:31+04:00</localTime>
    ///   <timeZone>CST-4:00:00</timeZone>
    /// </Time>
    /// localTime часто включает offset, иногда нет — оба случая обрабатываем.
    /// </summary>
    private static DateTime ParseDeviceLocalTimeUtc(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
            throw new InvalidOperationException("empty /ISAPI/System/time response");

        // Простой regex-извлечение, чтобы не зависеть от namespace XML.
        var match = global::System.Text.RegularExpressions.Regex.Match(
            body, @"<localTime>\s*([^<]+?)\s*</localTime>", global::System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (!match.Success)
            throw new InvalidOperationException("no <localTime> in /ISAPI/System/time response");

        var raw = match.Groups[1].Value.Trim();
        // Если есть timezone offset (например "+04:00") — DateTimeOffset правильно конвертирует в UTC.
        if (DateTimeOffset.TryParse(raw, global::System.Globalization.CultureInfo.InvariantCulture,
                global::System.Globalization.DateTimeStyles.AssumeLocal, out var dto))
        {
            return dto.UtcDateTime;
        }
        // Если timezone нет — считаем что устройство уже отдало UTC (распространённый случай для
        // прошивок без NTP). Это худший вариант, но мы хоть какой-то horizon получим.
        if (DateTime.TryParse(raw, global::System.Globalization.CultureInfo.InvariantCulture,
                global::System.Globalization.DateTimeStyles.AssumeUniversal | global::System.Globalization.DateTimeStyles.AdjustToUniversal,
                out var dt))
        {
            return dt;
        }
        throw new InvalidOperationException($"unable to parse <localTime>{raw}</localTime>");
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
