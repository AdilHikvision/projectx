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

        var presentCount = await db.AttendanceRecords.AsNoTracking()
            .Where(r => r.EventTimeUtc >= yesterday && r.EventTimeUtc < today)
            .Select(r => r.EmployeeId)
            .Distinct()
            .CountAsync(ct);

        var absentCount = totalEmployees - presentCount;
        var date = yesterday.ToString("dd.MM.yyyy");

        await notificationService.CreateAsync(
            NotificationTypes.DailyReport,
            $"Ежедневный отчёт — {date}",
            $"Присутствовало: {presentCount} из {totalEmployees}. Отсутствовало: {absentCount}.",
            ct: ct);

        logger.LogInformation("Daily report notification sent for {Date}: {Present}/{Total}", date, presentCount, totalEmployees);
    }
}
