using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Parking;

/// <summary>
/// Следит за машинами, которые стоят дольше разрешённого. Проверка при выезде ловит нарушение
/// задним числом, а этот сервис — пока машина ещё на парковке, чтобы охрана узнала вовремя.
/// Событие пишется один раз на сессию (метка OverstayUtc).
/// </summary>
public sealed class ParkingOverstayService(
    IServiceScopeFactory scopeFactory,
    ILogger<ParkingOverstayService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ScanAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Parking overstay scan failed");
            }

            try { await Task.Delay(Interval, stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task ScanAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var open = await db.ParkingSessions
            .Where(x => x.ExitedUtc == null && x.OverstayUtc == null)
            .ToListAsync(ct);
        if (open.Count == 0) return;

        var now = DateTime.UtcNow;
        var flagged = 0;
        foreach (var session in open)
        {
            var limit = await ParkingAccessService.ResolveTimeLimitAsync(db, session.PlateNormalized, ct);
            if (limit is not { } minutes) continue;

            var stayed = (now - session.EnteredUtc).TotalMinutes;
            if (stayed <= minutes) continue;

            session.OverstayUtc = now;
            session.UpdatedUtc = now;
            db.ParkingEvents.Add(new ParkingEvent
            {
                Type = "overstay",
                Message = $"Still parked {Math.Round(stayed)}m, limit {minutes}m",
                Plate = session.Plate,
                Source = "system"
            });
            flagged++;
        }

        if (flagged > 0)
        {
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Parking: flagged {Count} overstaying vehicle(s)", flagged);
        }
    }
}
