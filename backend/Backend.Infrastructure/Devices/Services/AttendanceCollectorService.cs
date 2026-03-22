using System.Globalization;
using System.Text.Json;
using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>
/// Фоновый сервис: каждые N минут опрашивает все активные устройства через ISAPI
/// AcsEvent/Search и записывает новые события прихода/ухода в attendance_records.
/// </summary>
public sealed class AttendanceCollectorService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<AttendanceCollectorService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AttendanceCollectorService started, poll interval {Interval}.", PollInterval);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CollectAllDevicesAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "AttendanceCollectorService: unhandled error during collection cycle.");
            }
            await Task.Delay(PollInterval, stoppingToken);
        }
    }

    private async Task CollectAllDevicesAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var devices = await db.Devices.AsNoTracking().ToListAsync(cancellationToken);
        if (devices.Count == 0) return;

        var globalUsername = configuration["Hikvision:Username"] ?? "admin";
        var globalPassword = (configuration["Hikvision:Password"] ?? "").Trim();

        foreach (var device in devices)
        {
            if (cancellationToken.IsCancellationRequested) break;
            try
            {
                await CollectFromDeviceAsync(db, device, globalUsername, globalPassword, cancellationToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "AttendanceCollector: error collecting from device {DeviceId} ({Ip})", device.Id, device.IpAddress);
            }
        }
    }

    private async Task CollectFromDeviceAsync(AppDbContext db, Domain.Entities.Device device, string globalUser, string globalPass, CancellationToken cancellationToken)
    {
        var client = new IsapiClient(
            device.IpAddress,
            device.Port,
            string.IsNullOrWhiteSpace(device.Username) ? globalUser : device.Username,
            string.IsNullOrWhiteSpace(device.Password) ? globalPass : device.Password,
            TimeSpan.FromSeconds(15));

        var from = DateTime.UtcNow.AddMinutes(-(PollInterval.TotalMinutes + 2)).ToString("yyyy-MM-ddTHH:mm:ss");
        var to = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss");

        var requestBody = JsonSerializer.Serialize(new
        {
            AcsEventCond = new
            {
                searchID = Guid.NewGuid().ToString("N")[..8],
                searchResultPosition = 0,
                maxResults = 200,
                major = 0,
                minor = 0,
                startTime = from,
                endTime = to
            }
        });

        var result = await client.PostJsonAsync(
            "ISAPI/AccessControl/AcsEvent?format=json&security=1&iv=0000000000000000",
            requestBody,
            cancellationToken);

        if (!result.Success || string.IsNullOrWhiteSpace(result.Content))
        {
            logger.LogDebug("AttendanceCollector: device {DeviceId} not reachable or returned error: {Error}", device.Id, result.Error);
            return;
        }

        using var doc = JsonDocument.Parse(result.Content);
        var root = doc.RootElement;
        if (!root.TryGetProperty("AcsEvent", out var acsEventEl) ||
            !acsEventEl.TryGetProperty("InfoList", out var infoListEl))
            return;

        var added = 0;
        foreach (var ev in infoListEl.EnumerateArray())
        {
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
            added++;
        }

        if (added > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("AttendanceCollector: device {DeviceId} — added {Count} records.", device.Id, added);
        }
    }
}
