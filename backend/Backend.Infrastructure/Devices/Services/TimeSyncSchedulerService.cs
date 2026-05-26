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
/// Ежедневная синхронизация времени и часового пояса со всеми устройствами в заданное локальное время
/// (настройки TimeSync* в SystemSettings).
/// </summary>
public sealed class TimeSyncSchedulerService(
    IServiceScopeFactory scopeFactory,
    ILogger<TimeSyncSchedulerService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("TimeSyncSchedulerService started.");
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
                logger.LogError(ex, "TimeSyncScheduler: ошибка тика.");
            }
        }
    }

    private async Task TryRunDailySyncAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var localization = scope.ServiceProvider.GetRequiredService<IDeviceLocalizationService>();

        var enabledRaw = await GetSettingAsync(db, "TimeSyncAutoEnabled", ct);
        if (!string.Equals(enabledRaw, "true", StringComparison.OrdinalIgnoreCase))
            return;

        var timeStr = await GetSettingAsync(db, "TimeSyncDailyTime", ct) ?? "03:00";
        if (!TryParseHHmm(timeStr, out var h, out var m))
            return;

        var timeZone = await GetSettingAsync(db, "TimeSyncTimeZone", ct);
        if (string.IsNullOrWhiteSpace(timeZone))
            return;

        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.Local);
        var todayStr = nowLocal.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        var lastDate = await GetSettingAsync(db, "TimeSyncLastAutoDate", ct);
        if (string.Equals(lastDate, todayStr, StringComparison.Ordinal))
            return;

        if (nowLocal.Hour != h || nowLocal.Minute != m)
            return;

        var results = await localization.SyncAllDevicesAsync(DateTime.UtcNow, timeZone!, ct);
        var successCount = results.Count(r => r.Success);

        await UpsertSettingAsync(db, "TimeSyncLastAutoDate", todayStr, ct);
        await UpsertSettingAsync(db, "TimeSyncLastRunUtc", DateTime.UtcNow.ToString("O", CultureInfo.InvariantCulture), ct);
        await UpsertSettingAsync(db, "TimeSyncLastSuccessCount", successCount.ToString(CultureInfo.InvariantCulture), ct);
        await UpsertSettingAsync(db, "TimeSyncLastTotal", results.Count.ToString(CultureInfo.InvariantCulture), ct);
        await UpsertSettingAsync(db, "TimeSyncLastRunKind", "auto", ct);
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "TimeSyncScheduler: ежедневная синхронизация времени завершена, {Success}/{Total} устройств.",
            successCount,
            results.Count);
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
