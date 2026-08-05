using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Переносит важные события парковки в колокольчик: попытку въезда из чёрного списка,
/// отказ из-за переполнения, выезд без оплаты и перепростой. Читает журнал событий,
/// а не парковочный сервис напрямую, — так инфраструктурный слой не тянет за собой
/// зависимость от уведомлений.
/// </summary>
public sealed class ParkingNotificationService(
    IServiceScopeFactory scopeFactory,
    INotificationService notificationService,
    ILogger<ParkingNotificationService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);

    /// <summary>События старше момента запуска не разбираем — иначе после перезапуска
    /// прилетела бы вся история разом.</summary>
    private DateTime _watermarkUtc = DateTime.UtcNow;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("ParkingNotificationService started.");
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await Task.Delay(Interval, stoppingToken); }
            catch (OperationCanceledException) { break; }

            try { await ScanAsync(stoppingToken); }
            catch (Exception ex) { logger.LogWarning(ex, "Parking notification scan failed"); }
        }
    }

    private async Task ScanAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var since = _watermarkUtc;
        var events = await db.ParkingEvents.AsNoTracking()
            .Where(e => e.CreatedUtc > since
                && (e.Type == "alarm" || e.Type == "denied" || e.Type == "debt" || e.Type == "overstay"))
            .OrderBy(e => e.CreatedUtc)
            .Take(50)
            .ToListAsync(ct);

        if (events.Count == 0) return;
        _watermarkUtc = events[^1].CreatedUtc;

        foreach (var e in events)
        {
            var plate = e.Plate ?? "—";
            var (type, titleKey, bodyKey) = e.Type switch
            {
                "alarm" => (NotificationTypes.ParkingBlacklist, "parkingBlacklist", "parkingBlacklist"),
                "debt" => (NotificationTypes.ParkingDebt, "parkingDebt", "parkingDebt"),
                "overstay" => (NotificationTypes.ParkingOverstay, "parkingOverstay", "parkingOverstay"),
                // Отказов много (нет в белом списке, рано вернулся), в колокольчик выносим только переполнение.
                _ when e.Message?.Contains("full", StringComparison.OrdinalIgnoreCase) == true
                    => (NotificationTypes.ParkingFull, "parkingFull", "parkingFull"),
                _ => (string.Empty, string.Empty, string.Empty)
            };
            if (type.Length == 0) continue;

            await notificationService.CreateAsync(
                type,
                NotifText($"notifications.titles.{titleKey}"),
                NotifText($"notifications.bodies.{bodyKey}", new { plate, source = e.Source ?? "system" }),
                userId: null,
                referenceId: e.Id.ToString(),
                ct: ct);
        }
    }

    /// <summary>Тот же формат {k,p}, что и у остальных уведомлений: текст переводится на клиенте.</summary>
    private static string NotifText(string key, object? p = null) =>
        System.Text.Json.JsonSerializer.Serialize(new { k = key, p });
}
