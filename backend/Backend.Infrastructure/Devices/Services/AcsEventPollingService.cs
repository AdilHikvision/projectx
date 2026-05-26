using System.Collections.Concurrent;
using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Backend.Application.Devices;
using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>
/// Polling-fallback для устройств, у которых alertStream залит огромным backlog'ом и не отдаёт
/// realtime в разумные сроки. POST /ISAPI/AccessControl/AcsEvent с фильтром по времени, опрос
/// каждые ~2 сек. Dedup в EventListenerService отсекает дубли с alertStream'ом, когда тот
/// наконец дренируется до realtime.
/// </summary>
public sealed class AcsEventPollingService(
    IServiceScopeFactory scopeFactory,
    IEventListenerService eventListener,
    IConfiguration configuration,
    ILogger<AcsEventPollingService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(2);
    private static readonly TimeSpan FirstWindow = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan PerDeviceTimeout = TimeSpan.FromSeconds(8);
    private const int MaxResultsPerPoll = 30;

    // Per-device "last endTime we polled up to" — следующий запрос идёт от этой точки.
    // Хранится в device-local UTC (выведенном из /ISAPI/System/time).
    private readonly ConcurrentDictionary<string, DateTime> _lastEndUtc = new(StringComparer.OrdinalIgnoreCase);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AcsEventPollingService started (polls /ISAPI/AccessControl/AcsEvent every {Sec}s).",
            PollInterval.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var devices = await db.Devices.AsNoTracking()
                    .Where(x => x.IpAddress != null && x.IpAddress != "")
                    .ToListAsync(stoppingToken);

                var tasks = devices.Select(d => PollDeviceAsync(d, stoppingToken));
                await Task.WhenAll(tasks);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                logger.LogError(ex, "AcsEventPollingService cycle failed");
            }

            try { await Task.Delay(PollInterval, stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task PollDeviceAsync(Device device, CancellationToken ct)
    {
        try
        {
            var user = device.Username ?? configuration["Hikvision:Username"] ?? "admin";
            var pwd = device.Password ?? configuration["Hikvision:Password"] ?? "";
            if (string.IsNullOrEmpty(pwd)) return;

            using var http = BuildClient(device.IpAddress, device.Port, user, pwd);
            var (deviceNowUtc, tzOffset) = await GetDeviceTimeAsync(http, device.IpAddress, device.Port, ct);

            var endUtc = deviceNowUtc;
            if (!_lastEndUtc.TryGetValue(device.DeviceIdentifier, out var startUtc))
            {
                // Первый опрос: смотрим назад на FirstWindow, чтобы не пропустить event'ы которые могли
                // произойти между запуском бэка и первым polling-циклом.
                startUtc = endUtc - FirstWindow;
            }
            if (endUtc <= startUtc) return;

            var events = await SearchAsync(http, device, startUtc, endUtc, tzOffset, ct);
            foreach (var evt in events)
            {
                if (!IsAllowed(evt.EventType)) continue;
                eventListener.Publish(evt);
            }

            _lastEndUtc[device.DeviceIdentifier] = endUtc;
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "AcsEvent poll failed for {Id}", device.DeviceIdentifier);
        }
    }

    private static bool IsAllowed(DeviceEventType t) =>
        t == DeviceEventType.DoorOpened ||
        t == DeviceEventType.DoorClosed ||
        t == DeviceEventType.AccessGranted ||
        t == DeviceEventType.AccessDenied ||
        t == DeviceEventType.AuthenticationTimeout;

    private static HttpClient BuildClient(string ip, int port, string user, string pwd)
    {
        var ports = IsapiPortHelper.GetPortsToTry(port);
        var firstPort = ports[0];
        var scheme = firstPort == 443 ? "https" : "http";
        var baseAuthority = new Uri($"{scheme}://{ip}:{firstPort}/");

        var credCache = new CredentialCache();
        credCache.Add(baseAuthority, "Digest", new NetworkCredential(user, pwd));

        var handler = new HttpClientHandler
        {
            Credentials = credCache,
            PreAuthenticate = true,
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
        };
        if (scheme == "https")
            handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;

        return new HttpClient(handler, disposeHandler: true) { BaseAddress = baseAuthority, Timeout = PerDeviceTimeout };
    }

    private async Task<(DateTime nowUtc, TimeSpan offset)> GetDeviceTimeAsync(HttpClient http, string ip, int port, CancellationToken ct)
    {
        // Warmup для Digest nonce (как в alertStream).
        try
        {
            using var warm = new HttpRequestMessage(HttpMethod.Get, "/ISAPI/System/deviceInfo");
            using var _ = await http.SendAsync(warm, HttpCompletionOption.ResponseHeadersRead, ct);
        }
        catch { /* ignore */ }

        using var req = new HttpRequestMessage(HttpMethod.Get, "/ISAPI/System/time");
        using var resp = await http.SendAsync(req, HttpCompletionOption.ResponseContentRead, ct);
        if (!resp.IsSuccessStatusCode)
            throw new InvalidOperationException($"/ISAPI/System/time returned {(int)resp.StatusCode}");
        var body = await resp.Content.ReadAsStringAsync(ct);

        var match = global::System.Text.RegularExpressions.Regex.Match(
            body, @"<localTime>\s*([^<]+?)\s*</localTime>", global::System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (!match.Success) throw new InvalidOperationException("no <localTime> in response");
        var raw = match.Groups[1].Value.Trim();

        if (DateTimeOffset.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var dto))
            return (dto.UtcDateTime, dto.Offset);

        if (DateTime.TryParse(raw, CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var dt))
            return (dt, TimeSpan.Zero);

        throw new InvalidOperationException($"unable to parse <localTime>{raw}</localTime>");
    }

    private async Task<List<DeviceEvent>> SearchAsync(HttpClient http, Device device, DateTime startUtc, DateTime endUtc, TimeSpan tzOffset, CancellationToken ct)
    {
        // AcsEvent ждёт время в **device-local** ISO-8601 с offset (например 2026-05-02T13:00:00+04:00).
        var startStr = new DateTimeOffset(startUtc, TimeSpan.Zero).ToOffset(tzOffset).ToString("yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture);
        var endStr = new DateTimeOffset(endUtc, TimeSpan.Zero).ToOffset(tzOffset).ToString("yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture);

        var result = new List<DeviceEvent>();
        var position = 0;
        while (true)
        {
            var json = $$"""
            {
              "AcsEventCond": {
                "searchID": "{{Guid.NewGuid():N}}",
                "searchResultPosition": {{position}},
                "maxResults": {{MaxResultsPerPoll}},
                "major": 0,
                "minor": 0,
                "startTime": "{{startStr}}",
                "endTime": "{{endStr}}"
              }
            }
            """;

            using var req = new HttpRequestMessage(HttpMethod.Post, "/ISAPI/AccessControl/AcsEvent?format=json");
            req.Content = new StringContent(json, Encoding.UTF8, "application/json");

            using var resp = await http.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode) break;

            var body = await resp.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("AcsEvent", out var acs)) break;

            var infoList = acs.TryGetProperty("InfoList", out var il) && il.ValueKind == JsonValueKind.Array ? il : default;
            if (infoList.ValueKind != JsonValueKind.Array || infoList.GetArrayLength() == 0) break;

            foreach (var item in infoList.EnumerateArray())
            {
                var evt = TryMapItem(device.DeviceIdentifier, item, tzOffset);
                if (evt is not null) result.Add(evt);
            }

            var responseStatusStrg = acs.TryGetProperty("responseStatusStrg", out var rs) ? rs.GetString() : null;
            if (string.Equals(responseStatusStrg, "MORE", StringComparison.OrdinalIgnoreCase))
            {
                position += MaxResultsPerPoll;
                continue;
            }
            break;
        }
        return result;
    }

    private static DeviceEvent? TryMapItem(string deviceIdentifier, JsonElement item, TimeSpan tzOffset)
    {
        try
        {
            var major = item.TryGetProperty("major", out var mj) && mj.ValueKind == JsonValueKind.Number ? mj.GetUInt32() : 0u;
            var minor = item.TryGetProperty("minor", out var mn) && mn.ValueKind == JsonValueKind.Number ? mn.GetUInt32() : 0u;
            var timeStr = item.TryGetProperty("time", out var t) ? t.GetString() : null;
            if (string.IsNullOrWhiteSpace(timeStr)) return null;

            DateTime occurredUtc;
            if (DateTimeOffset.TryParse(timeStr, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var dto))
                occurredUtc = dto.UtcDateTime;
            else if (DateTime.TryParse(timeStr, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var dt))
                occurredUtc = dt;
            else
                return null;

            var (type, summary) = AcsEventMapper.Classify(major, minor);
            var payload = item.GetRawText();
            return new DeviceEvent(deviceIdentifier, type, occurredUtc, payload, summary);
        }
        catch
        {
            return null;
        }
    }
}
