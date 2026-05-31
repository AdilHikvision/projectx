using System.Globalization;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Backend.Application.Devices;
using Backend.Application.Gym;
using Backend.Domain.Entities;
using Backend.Infrastructure.Devices;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Gym;

/// <summary>
/// Страховка поверх real-time счёта визитов: периодически пересчитывает фактические проходы
/// каждого активного абонемента с лимитом по логам устройства (AcsEvent) и корректирует
/// VisitsUsed вверх (max(текущее, факт)). При исчерпании лимита снимает клиента с устройств.
/// Авторитетный пересчёт «по фактам» закрывает потери real-time событий (офлайн/перезапуски).
/// </summary>
public sealed class GymVisitReconcileService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<GymVisitReconcileService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan PerDeviceTimeout = TimeSpan.FromSeconds(20);
    private const int MaxResults = 100;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("GymVisitReconcileService started, interval {Interval}.", Interval);
        try { await Task.Delay(TimeSpan.FromSeconds(40), stoppingToken); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try { await RunOnceAsync(stoppingToken); }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "GymVisitReconcileService: cycle error.");
            }
            try { await Task.Delay(Interval, stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task RunOnceAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var memberships = await db.GymMemberships
            .Where(m => m.VisitLimit != null
                && m.Status != GymMembershipStatus.Cancelled
                && m.EndDate >= today
                && m.VisitsUsed < m.VisitLimit)
            .ToListAsync(ct);
        if (memberships.Count == 0) return;

        var devices = await db.Devices.AsNoTracking().ToListAsync(ct);
        if (devices.Count == 0) return;

        var sync = scope.ServiceProvider.GetRequiredService<IDevicePersonSyncService>();

        foreach (var m in memberships)
        {
            ct.ThrowIfCancellationRequested();
            var customer = await db.GymCustomers.FirstOrDefaultAsync(c => c.Id == m.CustomerId, ct);
            if (customer is null) continue;

            var employeeNo = m.CustomerId.ToString("N")[..32];
            var startUtc = m.StartDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var endUtc = DateTime.UtcNow;

            var total = 0;
            foreach (var device in devices)
            {
                try { total += await CountAccessGrantedAsync(device, employeeNo, startUtc, endUtc, ct); }
                catch (Exception ex) { logger.LogDebug(ex, "Reconcile: AcsEvent query failed for {Device}", device.DeviceIdentifier); }
            }

            // Authoritative correction by facts from device logs — only ever increase.
            var corrected = Math.Max(customer.VisitCount, total);
            if (corrected != customer.VisitCount || m.VisitsUsed != corrected)
            {
                logger.LogInformation("Reconcile: customer {Customer} visits {Old} → {New} (limit {Limit})",
                    m.CustomerId, customer.VisitCount, corrected, m.VisitLimit);
                customer.VisitCount = corrected;
                customer.UpdatedUtc = DateTime.UtcNow;
                m.VisitsUsed = corrected;
                m.UpdatedUtc = DateTime.UtcNow;
                await db.SaveChangesAsync(ct);
            }

            if (m.VisitLimit != null && customer.VisitCount >= m.VisitLimit)
            {
                GymMembershipFactory.ApplyVisitLimitReached(m, customer, today);
                await db.SaveChangesAsync(ct);

                foreach (var device in devices)
                {
                    try { await sync.DeleteGymCustomerAsync(m.CustomerId, device.Id, ct); }
                    catch { /* per-device failure is non-fatal */ }
                }
                logger.LogInformation("Reconcile: customer {Customer} over visit limit; membership expired + customer deactivated + removed from devices.", m.CustomerId);
            }
        }
    }

    private async Task<int> CountAccessGrantedAsync(Device device, string employeeNo, DateTime startUtc, DateTime endUtc, CancellationToken ct)
    {
        var user = device.Username ?? configuration["Hikvision:Username"] ?? "admin";
        var pwd = device.Password ?? configuration["Hikvision:Password"] ?? "";
        if (string.IsNullOrEmpty(pwd)) return 0;

        using var http = BuildClient(device.IpAddress, device.Port, user, pwd);
        var tzOffset = await GetDeviceOffsetAsync(http, ct);

        var startStr = new DateTimeOffset(startUtc, TimeSpan.Zero).ToOffset(tzOffset).ToString("yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture);
        var endStr = new DateTimeOffset(endUtc, TimeSpan.Zero).ToOffset(tzOffset).ToString("yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture);

        var count = 0;
        var position = 0;
        while (true)
        {
            ct.ThrowIfCancellationRequested();
            var json = $$"""
            {
              "AcsEventCond": {
                "searchID": "{{Guid.NewGuid():N}}",
                "searchResultPosition": {{position}},
                "maxResults": {{MaxResults}},
                "major": 5,
                "minor": 0,
                "startTime": "{{startStr}}",
                "endTime": "{{endStr}}",
                "employeeNoString": "{{employeeNo}}"
              }
            }
            """;

            using var req = new HttpRequestMessage(HttpMethod.Post, "/ISAPI/AccessControl/AcsEvent?format=json")
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json"),
            };
            using var resp = await http.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode) break;

            var body = await resp.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("AcsEvent", out var acs)) break;
            if (!acs.TryGetProperty("InfoList", out var infoList) || infoList.ValueKind != JsonValueKind.Array || infoList.GetArrayLength() == 0) break;

            foreach (var item in infoList.EnumerateArray())
            {
                // Filter to this employee (defensive — some firmwares ignore employeeNoString) and to access-granted.
                var emp = item.TryGetProperty("employeeNoString", out var e) ? e.GetString()
                    : item.TryGetProperty("employeeNo", out var e2) ? (e2.ValueKind == JsonValueKind.Number ? e2.GetInt64().ToString() : e2.GetString())
                    : null;
                if (!string.Equals(emp?.Trim(), employeeNo, StringComparison.OrdinalIgnoreCase)) continue;

                var major = item.TryGetProperty("major", out var mj) && mj.ValueKind == JsonValueKind.Number ? mj.GetUInt32() : 0u;
                var minor = item.TryGetProperty("minor", out var mn) && mn.ValueKind == JsonValueKind.Number ? mn.GetUInt32() : 0u;
                if (AcsEventMapper.Classify(major, minor).Type == DeviceEventType.AccessGranted) count++;
            }

            var more = acs.TryGetProperty("responseStatusStrg", out var rs) ? rs.GetString() : null;
            if (string.Equals(more, "MORE", StringComparison.OrdinalIgnoreCase)) { position += MaxResults; continue; }
            break;
        }
        return count;
    }

    private static HttpClient BuildClient(string ip, int port, string user, string pwd)
    {
        var ports = IsapiPortHelper.GetPortsToTry(port);
        var firstPort = ports[0];
        var scheme = firstPort == 443 ? "https" : "http";
        var baseAuthority = new Uri($"{scheme}://{ip}:{firstPort}/");
        var credCache = new CredentialCache { { baseAuthority, "Digest", new NetworkCredential(user, pwd) } };
        var handler = new HttpClientHandler { Credentials = credCache, PreAuthenticate = true };
        if (scheme == "https")
            handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
        return new HttpClient(handler, disposeHandler: true) { BaseAddress = baseAuthority, Timeout = PerDeviceTimeout };
    }

    private static async Task<TimeSpan> GetDeviceOffsetAsync(HttpClient http, CancellationToken ct)
    {
        try
        {
            using var warm = new HttpRequestMessage(HttpMethod.Get, "/ISAPI/System/deviceInfo");
            using var _ = await http.SendAsync(warm, HttpCompletionOption.ResponseHeadersRead, ct);
        }
        catch { /* digest warmup */ }

        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, "/ISAPI/System/time");
            using var resp = await http.SendAsync(req, ct);
            if (resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadAsStringAsync(ct);
                var match = Regex.Match(body, @"<localTime>\s*([^<]+?)\s*</localTime>", RegexOptions.IgnoreCase);
                if (match.Success && DateTimeOffset.TryParse(match.Groups[1].Value.Trim(), CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var dto))
                    return dto.Offset;
            }
        }
        catch { /* fall back to UTC */ }
        return TimeSpan.Zero;
    }
}
