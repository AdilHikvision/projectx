using Backend.Application.Devices;
using Backend.Application.Gym;
using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Gym;

/// <summary>
/// Программное ограничение посещений для клиентов зала. Железо (терминал) не умеет считать
/// визиты, поэтому софт по событиям AccessGranted инкрементит счётчик визитов активного
/// абонемента, а при достижении лимита снимает клиента со всех устройств — после этого
/// терминал физически перестаёт его пропускать.
/// </summary>
public sealed class GymVisitService(
    IServiceScopeFactory scopeFactory,
    ILogger<GymVisitService> logger)
{
    // Считаем КАЖДЫЙ проход (+1). Склейки по времени нет. Дубли одного и того же события
    // из двух каналов (alertStream + AcsEvent-поллинг) отсекаются на уровне EventListenerService
    // (по deviceId+тип+время+payload) — это не «склейка свайпов», а защита от дубля одного события.

    public async Task HandleAccessGrantedAsync(string employeeNo, CancellationToken ct = default)
    {
        var key = employeeNo?.Trim();
        // employeeNo клиента зала = Guid его Id в формате "N" (32 hex). Это отсекает
        // сотрудников/посетителей: если не парсится как Guid — не наш клиент.
        if (string.IsNullOrEmpty(key) || !Guid.TryParseExact(key, "N", out var customerId))
            return;

        var now = DateTime.UtcNow;

        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var customer = await db.GymCustomers.FirstOrDefaultAsync(c => c.Id == customerId, ct);
            if (customer is null) return;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var membership = await db.GymMemberships
                .Where(m => m.CustomerId == customerId
                    && m.VisitLimit != null
                    && m.Status != GymMembershipStatus.Cancelled
                    && (m.FrozenUntil == null || m.FrozenUntil <= today)
                    && m.EndDate >= today)
                .OrderBy(m => m.EndDate)
                .FirstOrDefaultAsync(ct);

            // Нет абонемента с лимитом визитов (безлимит / нет активного) — считать нечего.
            if (membership is null)
                return;

            // +1 на проход (счётчик на клиенте) и держим в синхроне счётчик абонемента.
            customer.VisitCount += 1;
            customer.UpdatedUtc = now;
            membership.VisitsUsed = customer.VisitCount;
            membership.UpdatedUtc = now;
            await db.SaveChangesAsync(ct);

            logger.LogInformation("Gym visit counted for customer {Customer}: {Used}/{Limit}",
                customerId, customer.VisitCount, membership.VisitLimit);

            // Совпало с лимитом → дата абонемента = вчера, статус Cancelled, клиент неактивен, снять с устройства.
            if (customer.VisitCount >= membership.VisitLimit)
            {
                GymMembershipFactory.ApplyVisitLimitReached(membership, customer, today);
                await db.SaveChangesAsync(ct);

                var sync = scope.ServiceProvider.GetRequiredService<IDevicePersonSyncService>();
                var deviceIds = await db.Devices.Select(d => d.Id).ToListAsync(ct);
                foreach (var deviceId in deviceIds)
                {
                    try { await sync.DeleteGymCustomerAsync(customerId, deviceId, ct); }
                    catch { /* per-device failure is non-fatal */ }
                }
                logger.LogInformation("Gym customer {Customer} reached visit limit ({Limit}); membership expired + customer deactivated + removed from devices.",
                    customerId, membership.VisitLimit);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GymVisitService: failed to handle access for {EmployeeNo}", key);
        }
    }
}
