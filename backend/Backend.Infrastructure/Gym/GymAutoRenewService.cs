using Backend.Application.Gym;
using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Gym;

/// <summary>
/// Фоновое авто-продление абонементов Gym: периодически находит истёкшие по дате абонементы
/// с флагом AutoRenew и создаёт для них новый период. Исходный абонемент помечается
/// AutoRenew=false, чтобы не продлевался повторно (цепочку продолжает новый абонемент).
/// </summary>
public sealed class GymAutoRenewService(
    IServiceScopeFactory scopeFactory,
    ILogger<GymAutoRenewService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(6);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("GymAutoRenewService started, interval {Interval}.", Interval);
        // Small delay so the first run doesn't race the startup migration.
        try { await Task.Delay(TimeSpan.FromSeconds(20), stoppingToken); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try { await RunOnceAsync(stoppingToken); }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "GymAutoRenewService: cycle error.");
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

        var due = await db.GymMemberships
            .Where(m => m.AutoRenew
                && m.Status != GymMembershipStatus.Cancelled
                && (m.FrozenUntil == null || m.FrozenUntil <= today)
                && m.EndDate < today)
            .ToListAsync(ct);

        if (due.Count == 0) return;

        var tariffIds = due.Where(m => m.TariffId != null).Select(m => m.TariffId!.Value).Distinct().ToList();
        var tariffs = await db.GymTariffs.Where(t => tariffIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id, ct);

        var renewed = 0;
        foreach (var m in due)
        {
            // Stop this membership from being picked again next cycle, regardless of outcome.
            m.AutoRenew = false;
            m.UpdatedUtc = DateTime.UtcNow;

            if (m.TariffId is null || !tariffs.TryGetValue(m.TariffId.Value, out var tariff)) continue;

            var start = m.EndDate > today ? m.EndDate : today;
            db.GymMemberships.Add(GymMembershipFactory.FromTariff(m.CustomerId, tariff, start));
            renewed++;
        }

        await db.SaveChangesAsync(ct);
        if (renewed > 0) logger.LogInformation("GymAutoRenew: auto-renewed {Count} membership(s).", renewed);
    }
}
