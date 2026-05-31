using Backend.Domain.Entities;

namespace Backend.Application.Gym;

/// <summary>
/// Сборка выданного абонемента из тарифа (со снапшотом полей). Используется и в API
/// (ручная выдача / продление / активация сертификата), и в фоновом авто-продлении.
/// </summary>
public static class GymMembershipFactory
{
    public static DateOnly ComputeEndDate(DateOnly start, GymTariffDuration duration) => duration switch
    {
        GymTariffDuration.Day => start.AddDays(1),
        GymTariffDuration.Week => start.AddDays(7),
        GymTariffDuration.Month => start.AddMonths(1),
        GymTariffDuration.Year => start.AddYears(1),
        _ => start.AddMonths(1),
    };

    public static GymMembership FromTariff(Guid customerId, GymTariff tariff, DateOnly start) => new()
    {
        CustomerId = customerId,
        TariffId = tariff.Id,
        TariffName = tariff.Name,
        Price = tariff.Price,
        Currency = tariff.Currency,
        StartDate = start,
        EndDate = ComputeEndDate(start, tariff.DurationType),
        VisitLimit = tariff.VisitLimit,
        VisitsUsed = 0,
        HasTimeRestriction = tariff.HasTimeRestriction,
        AccessFrom = tariff.AccessFrom,
        AccessTo = tariff.AccessTo,
        DaysOfWeekMask = tariff.DaysOfWeekMask,
        FreezeAllowed = tariff.FreezeAllowed,
        FreezeMaxDays = tariff.FreezeMaxDays,
        TransferAllowed = tariff.TransferAllowed,
        AutoRenew = tariff.AutoRenew,
        Status = GymMembershipStatus.Active,
    };

    /// <summary>
    /// Лимит визитов исчерпан: абонемент закрывается (дата окончания — «вчера», статус Cancelled),
    /// клиент помечается неактивным. Вызывающий после этого снимает клиента с устройства.
    /// </summary>
    public static void ApplyVisitLimitReached(GymMembership m, GymCustomer? customer, DateOnly today)
    {
        m.EndDate = today.AddDays(-1);
        m.Status = GymMembershipStatus.Cancelled;
        m.UpdatedUtc = DateTime.UtcNow;
        if (customer != null)
        {
            customer.IsActive = false;
            customer.UpdatedUtc = DateTime.UtcNow;
        }
    }

    public static string EffectiveStatus(GymMembership m, DateOnly today) =>
        m.Status == GymMembershipStatus.Cancelled ? "Cancelled"
        : (m.FrozenUntil != null && m.FrozenUntil > today) ? "Frozen"
        : (m.EndDate < today || (m.VisitLimit != null && m.VisitsUsed >= m.VisitLimit)) ? "Expired"
        : "Active";
}
