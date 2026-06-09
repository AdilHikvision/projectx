using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

/// <summary>Генерирует broadcast-уведомление о посещаемости за прошедший день каждую ночь в 00:30 UTC.</summary>
public sealed class DailyReportNotificationService(
    IServiceScopeFactory scopeFactory,
    INotificationService notificationService,
    ILogger<DailyReportNotificationService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("DailyReportNotificationService started.");
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            // Next fire at 00:30 UTC
            var nextFire = now.Date.AddDays(1).AddMinutes(30);
            var delay = nextFire - now;
            if (delay < TimeSpan.Zero) delay = TimeSpan.Zero;

            try { await Task.Delay(delay, stoppingToken); }
            catch (OperationCanceledException) { break; }

            try { await GenerateAsync(stoppingToken); }
            catch (Exception ex) { logger.LogError(ex, "Error generating daily attendance report notification."); }
        }
    }

    private async Task GenerateAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        var today = yesterday.AddDays(1);

        var totalEmployees = await db.Employees.AsNoTracking()
            .CountAsync(e => e.IsActive, ct);

        var presentIds = await db.AttendanceRecords.AsNoTracking()
            .Where(r => r.EventTimeUtc >= yesterday && r.EventTimeUtc < today)
            .Select(r => r.EmployeeId)
            .Distinct()
            .ToListAsync(ct);
        var presentCount = presentIds.Count;

        // Employees on an approved leave that day must not be counted as absent.
        var yesterdayDate = DateOnly.FromDateTime(yesterday);
        var onLeaveIds = await db.EmployeeLeaves.AsNoTracking()
            .Where(l => l.Status == LeaveStatus.Approved
                     && l.StartDate <= yesterdayDate && l.EndDate >= yesterdayDate
                     && l.Employee.IsActive)
            .Select(l => l.EmployeeId)
            .Distinct()
            .ToListAsync(ct);
        var presentSet = presentIds.ToHashSet();
        var onLeaveCount = onLeaveIds.Count(id => !presentSet.Contains(id));

        var absentCount = Math.Max(0, totalEmployees - presentCount - onLeaveCount);
        var date = yesterday.ToString("dd.MM.yyyy");

        static string N(string key, object? p = null) =>
            System.Text.Json.JsonSerializer.Serialize(new { k = key, p });

        await notificationService.CreateAsync(
            NotificationTypes.DailyReport,
            N("notifications.titles.dailyReport", new { date }),
            N("notifications.bodies.dailyReport", new { present = presentCount, total = totalEmployees, absent = absentCount, onLeave = onLeaveCount > 0 ? $" On leave: {onLeaveCount}." : "" }),
            ct: ct);

        logger.LogInformation("Daily report notification sent for {Date}: present={Present}, onLeave={OnLeave}, absent={Absent}, total={Total}",
            date, presentCount, onLeaveCount, absentCount, totalEmployees);
    }
}
