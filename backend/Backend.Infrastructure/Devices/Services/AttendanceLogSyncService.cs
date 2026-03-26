using System.Globalization;
using System.Text.Json;
using Backend.Application.Devices;
using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>
/// Синхронизация событий ACS (приход/уход) с устройств в <see cref="AttendanceRecord"/> через ISAPI AcsEvent/Search.
/// </summary>
public sealed class AttendanceLogSyncService(
    AppDbContext db,
    IConfiguration configuration,
    ILogger<AttendanceLogSyncService> logger) : IAttendanceLogSyncService
{
    public async Task<AttendanceLogSyncResult> SyncAllDevicesAsync(DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken)
    {
        if (fromUtc >= toUtc)
            return new AttendanceLogSyncResult(0, 0, ["Некорректный интервал: начало не раньше конца."]);

        var devices = await db.Devices.AsNoTracking().ToListAsync(cancellationToken);
        if (devices.Count == 0)
            return new AttendanceLogSyncResult(0, 0, ["Нет зарегистрированных устройств."]);

        var globalUser = configuration["Hikvision:Username"] ?? "admin";
        var globalPass = (configuration["Hikvision:Password"] ?? "").Trim();
        var fromStr = fromUtc.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);
        var toStr = toUtc.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);

        var warnings = new List<string>();
        var totalAdded = 0;
        var processed = 0;

        foreach (var device in devices)
        {
            if (cancellationToken.IsCancellationRequested) break;
            try
            {
                var added = await SyncFromDeviceAsync(db, device, globalUser, globalPass, fromStr, toStr, cancellationToken);
                totalAdded += added;
                processed++;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "LogSync: ошибка устройства {DeviceId} ({Ip})", device.Id, device.IpAddress);
                warnings.Add($"{device.Name}: {ex.Message}");
            }
        }

        return new AttendanceLogSyncResult(totalAdded, processed, warnings);
    }

    private static async Task<int> SyncFromDeviceAsync(
        AppDbContext db,
        Domain.Entities.Device device,
        string globalUser,
        string globalPass,
        string fromStr,
        string toStr,
        CancellationToken cancellationToken)
    {
        var client = new IsapiClient(
            device.IpAddress,
            device.Port,
            string.IsNullOrWhiteSpace(device.Username) ? globalUser : device.Username,
            string.IsNullOrWhiteSpace(device.Password) ? globalPass : device.Password,
            TimeSpan.FromSeconds(60));

        var searchId = Guid.NewGuid().ToString("N")[..8];
        const int maxBatch = 500;
        var position = 0;
        var addedTotal = 0;

        while (true)
        {
            var requestBody = JsonSerializer.Serialize(new
            {
                AcsEventCond = new
                {
                    searchID = searchId,
                    searchResultPosition = position,
                    maxResults = maxBatch,
                    major = 0,
                    minor = 0,
                    startTime = fromStr,
                    endTime = toStr
                }
            });

            var result = await client.PostJsonAsync(
                "ISAPI/AccessControl/AcsEvent?format=json&security=1&iv=0000000000000000",
                requestBody,
                cancellationToken);

            if (!result.Success || string.IsNullOrWhiteSpace(result.Content))
                break;

            using var doc = JsonDocument.Parse(result.Content);
            var root = doc.RootElement;
            if (!root.TryGetProperty("AcsEvent", out var acsEventEl) ||
                !acsEventEl.TryGetProperty("InfoList", out var infoListEl))
                break;

            var batchCount = 0;
            foreach (var ev in infoListEl.EnumerateArray())
            {
                batchCount++;
                if (!ev.TryGetProperty("employeeNoString", out var empNoEl)) continue;
                var empNo = empNoEl.GetString();
                if (string.IsNullOrWhiteSpace(empNo)) continue;

                var employee = await db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.EmployeeNo == empNo, cancellationToken);
                if (employee is null) continue;

                if (!ev.TryGetProperty("time", out var timeEl)) continue;
                if (!DateTime.TryParse(timeEl.GetString(), null, DateTimeStyles.RoundtripKind, out var eventTime)) continue;
                var eventTimeUtc = eventTime.ToUniversalTime();

                var minor = ev.TryGetProperty("minor", out var minorEl) ? minorEl.GetInt32() : 0;
                var eventType = minor == 76 ? AttendanceEventType.Out : AttendanceEventType.In;

                var exists = await db.AttendanceRecords.AnyAsync(
                    r => r.EmployeeId == employee.Id && r.EventTimeUtc == eventTimeUtc,
                    cancellationToken);
                if (exists) continue;

                db.AttendanceRecords.Add(new AttendanceRecord
                {
                    EmployeeId = employee.Id,
                    EventTimeUtc = eventTimeUtc,
                    EventType = eventType,
                    DeviceId = device.Id,
                    Source = "device"
                });
                addedTotal++;
            }

            if (batchCount > 0)
                await db.SaveChangesAsync(cancellationToken);

            if (batchCount == 0 || batchCount < maxBatch)
                break;

            position += batchCount;
            if (position > 200_000)
                break;
        }

        return addedTotal;
    }
}
