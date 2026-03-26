using System.Globalization;
using Backend.Application.Devices;
using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>
/// Ежедневная синхронизация логов в заданное локальное время (настройки LogSync* в SystemSettings).
/// </summary>
public sealed class LogSyncSchedulerService(
    IServiceScopeFactory scopeFactory,
    ILogger<LogSyncSchedulerService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("LogSyncSchedulerService started.");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                await TryRunDailySyncAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "LogSyncScheduler: ошибка тика.");
            }
        }
    }

    private async Task TryRunDailySyncAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var sync = scope.ServiceProvider.GetRequiredService<IAttendanceLogSyncService>();

        var enabledRaw = await GetSettingAsync(db, "LogSyncAutoEnabled", ct);
        if (!string.Equals(enabledRaw, "true", StringComparison.OrdinalIgnoreCase))
            return;

        var timeStr = await GetSettingAsync(db, "LogSyncDailyTime", ct) ?? "03:00";
        if (!TryParseHHmm(timeStr, out var h, out var m))
            return;

        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.Local);
        var todayStr = nowLocal.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        var lastDate = await GetSettingAsync(db, "LogSyncLastAutoDate", ct);
        if (string.Equals(lastDate, todayStr, StringComparison.Ordinal))
            return;

        if (nowLocal.Hour != h || nowLocal.Minute != m)
            return;

        var toUtc = DateTime.UtcNow;
        var fromUtc = toUtc.AddDays(-1);

        var result = await sync.SyncAllDevicesAsync(fromUtc, toUtc, ct);

        await UpsertSettingAsync(db, "LogSyncLastAutoDate", todayStr, ct);
        await UpsertSettingAsync(db, "LogSyncLastRunUtc", DateTime.UtcNow.ToString("O", CultureInfo.InvariantCulture), ct);
        await UpsertSettingAsync(db, "LogSyncLastRecordsAdded", result.RecordsAdded.ToString(CultureInfo.InvariantCulture), ct);
        await UpsertSettingAsync(db, "LogSyncLastRunKind", "auto", ct);
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "LogSyncScheduler: ежедневная синхронизация завершена, добавлено записей: {N}, устройств: {D}.",
            result.RecordsAdded,
            result.DevicesProcessed);
    }

    private static bool TryParseHHmm(string s, out int hours, out int minutes)
    {
        hours = 0;
        minutes = 0;
        var parts = s.Trim().Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length != 2) return false;
        if (!int.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out hours)) return false;
        if (!int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out minutes)) return false;
        return hours is >= 0 and <= 23 && minutes is >= 0 and <= 59;
    }

    private static async Task<string?> GetSettingAsync(AppDbContext db, string key, CancellationToken ct)
    {
        var row = await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(x => x.Key == key, ct);
        return row?.Value;
    }

    private static async Task UpsertSettingAsync(AppDbContext db, string key, string? value, CancellationToken ct)
    {
        var entity = await db.SystemSettings.FirstOrDefaultAsync(x => x.Key == key, ct);
        if (entity is null)
        {
            db.SystemSettings.Add(new SystemSetting
            {
                Id = Guid.NewGuid(),
                Key = key,
                Value = value,
                CreatedUtc = DateTime.UtcNow
            });
        }
        else
        {
            entity.Value = value;
            entity.UpdatedUtc = DateTime.UtcNow;
        }
    }
}
