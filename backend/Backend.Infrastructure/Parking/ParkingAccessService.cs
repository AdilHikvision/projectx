using Backend.Application.Parking;
using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Parking;

/// <summary>
/// Единственное место, где решается, пускать ли машину и как закрывать сессию.
/// Одним и тем же кодом пользуются HTTP-эндпоинт /api/parking/access-decision,
/// ручной въезд с POS и события ANPR-камер — чтобы правила не расходились.
/// </summary>
public sealed class ParkingAccessService(AppDbContext db, ILogger<ParkingAccessService> logger) : IParkingAccessService
{
    /// <summary>Номер без пробелов и дефисов, в верхнем регистре — так же, как в Program.cs.</summary>
    public static string NormalizePlate(string? p) =>
        new((p ?? "").ToUpperInvariant().Where(char.IsLetterOrDigit).ToArray());

    /// <summary>
    /// Стоимость стоянки по тарифу. Часовой: почасовая ставка с ночным/выходным окном
    /// и потолком за сутки. Считается здесь, чтобы касса, выезд по камере и расчёт долга
    /// пользовались одной формулой.
    /// </summary>
    public static decimal ComputeCost(ParkingTariff t, DateTime enteredUtc, DateTime exitedUtc)
    {
        var totalMinutes = Math.Max(0, (exitedUtc - enteredUtc).TotalMinutes);
        if (totalMinutes <= t.FreeMinutes) return 0m;

        if (t.Kind == ParkingTariffKind.Fixed) return t.FixedPrice;
        if (t.Kind == ParkingTariffKind.Daily)
        {
            var days = (int)Math.Ceiling((totalMinutes - t.FreeMinutes) / (60.0 * 24.0));
            return Math.Max(1, days) * t.PricePerDay;
        }

        // Hourly: идём по часовым слотам от (вход + бесплатные минуты) в локальном времени.
        static bool InNightWindow(TimeSpan tod, TimeSpan from, TimeSpan to) =>
            from <= to ? (tod >= from && tod < to) : (tod >= from || tod < to);

        var chargeStart = enteredUtc.AddMinutes(t.FreeMinutes);
        var hours = (int)Math.Ceiling((exitedUtc - chargeStart).TotalMinutes / 60.0);
        decimal total = 0m, dayAccum = 0m;
        var dayAnchor = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(chargeStart, DateTimeKind.Utc), TimeZoneInfo.Local).Date;
        for (var i = 0; i < hours; i++)
        {
            var slotLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(chargeStart.AddHours(i), DateTimeKind.Utc), TimeZoneInfo.Local);
            if (slotLocal.Date != dayAnchor) { dayAnchor = slotLocal.Date; dayAccum = 0m; }
            var isWeekend = slotLocal.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
            decimal rate = t.PricePerHour;
            if (isWeekend && t.WeekendPricePerHour.HasValue) rate = t.WeekendPricePerHour.Value;
            else if (t.NightPricePerHour.HasValue && t.NightFrom.HasValue && t.NightTo.HasValue && InNightWindow(slotLocal.TimeOfDay, t.NightFrom.Value, t.NightTo.Value))
                rate = t.NightPricePerHour.Value;
            var charge = rate;
            if (t.MaxPerDay.HasValue)
            {
                charge = Math.Min(charge, Math.Max(0, t.MaxPerDay.Value - dayAccum));
                dayAccum += charge;
            }
            total += charge;
        }
        return Math.Round(total, 2);
    }

    /// <summary>
    /// Сколько минут этому номеру разрешено стоять — лимит из карточки автомобиля
    /// (поле «Лимит стоянки»). null — без ограничения. Абонемент снимает лимит:
    /// это оплаченный транспорт.
    /// </summary>
    public static async Task<int?> ResolveTimeLimitAsync(AppDbContext db, string plateNormalized, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var hasSubscription = await db.ParkingSubscriptions.AsNoTracking()
            .AnyAsync(s => s.IsActive && s.PlateNormalized == plateNormalized && s.StartDate <= today && s.EndDate >= today, ct);
        if (hasSubscription) return null;

        var vehicle = await db.ParkingVehicles.AsNoTracking()
            .FirstOrDefaultAsync(v => v.IsActive && v.PlateNormalized == plateNormalized, ct);
        return vehicle?.TimeLimitMinutes is > 0 ? vehicle.TimeLimitMinutes : null;
    }

    /// <summary>
    /// Первое свободное место нужного типа: не занято открытой сессией и активно.
    /// Порядок обхода — как на схеме (этаж → ряд → место), чтобы машины заполняли парковку
    /// сверху вниз, а не в случайном порядке. null — свободных мест этого типа нет
    /// (тогда сессия останется без места: занятость по счётчикам считается отдельно).
    /// </summary>
    public static async Task<(Guid SpaceId, Guid ZoneId)?> PickFreeSpaceAsync(
        AppDbContext db, ParkingSpaceType type, Guid? zoneId, CancellationToken ct)
    {
        var taken = await db.ParkingSessions.AsNoTracking()
            .Where(s => s.ExitedUtc == null && s.SpaceId != null)
            .Select(s => s.SpaceId!.Value)
            .ToListAsync(ct);

        var q = db.ParkingSpaces.AsNoTracking()
            .Where(sp => sp.IsActive && sp.Type == type && !taken.Contains(sp.Id));
        if (zoneId.HasValue) q = q.Where(sp => sp.Row!.Floor!.ZoneId == zoneId.Value);

        var found = await q
            .OrderBy(sp => sp.Row!.Floor!.Level)
            .ThenBy(sp => sp.Row!.SortOrder)
            .ThenBy(sp => sp.SortOrder)
            .ThenBy(sp => sp.Code)
            .Select(sp => new { sp.Id, ZoneId = sp.Row!.Floor!.ZoneId })
            .FirstOrDefaultAsync(ct);
        return found is null ? null : (found.Id, found.ZoneId);
    }

    public async Task<ParkingAccessDecision> DecideAsync(ParkingAccessInput input, CancellationToken ct)
    {
        var norm = NormalizePlate(input.Plate);
        if (norm.Length == 0) return new ParkingAccessDecision(false, "empty-plate");

        var spaceType = input.SpaceType != null && Enum.TryParse<ParkingSpaceType>(input.SpaceType, true, out var st)
            ? st
            : ParkingSpaceType.Regular;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        void LogEvent(string type, string? message) => db.ParkingEvents.Add(new ParkingEvent
        {
            Type = type,
            Message = message,
            Plate = input.Plate.Trim(),
            Source = input.Camera ?? input.Operator ?? "system"
        });

        // Чёрный список: не открывать шлагбаум + тревога в журнал событий.
        var blockedEntry = await db.ParkingPlates.AsNoTracking()
            .FirstOrDefaultAsync(x => x.IsActive && x.ListType == ParkingPlateList.Block && x.PlateNormalized == norm, ct);
        if (blockedEntry is not null)
        {
            LogEvent("alarm", $"Blacklisted plate at entry ({blockedEntry.Category ?? "no-reason"}): {blockedEntry.Note ?? ""}".Trim());
            await db.SaveChangesAsync(ct);
            return new ParkingAccessDecision(false, "blacklist", Category: blockedEntry.Category);
        }

        Guid? openedSessionId = null;

        async Task OpenSessionIfRequested(bool paid, string? paymentMethod = null)
        {
            if (!input.OpenSession) return;
            var already = await db.ParkingSessions.FirstOrDefaultAsync(x => x.ExitedUtc == null && x.PlateNormalized == norm, ct);
            if (already is null)
            {
                // Конкретное место нужно, чтобы схема парковки показывала, кто где стоит.
                var space = await PickFreeSpaceAsync(db, spaceType, input.ZoneId, ct);
                var session = new ParkingSession
                {
                    Plate = input.Plate.Trim(),
                    PlateNormalized = norm,
                    // Камера может не знать зону — берём её у выданного места.
                    ZoneId = input.ZoneId ?? space?.ZoneId,
                    SpaceType = spaceType,
                    SpaceId = space?.SpaceId,
                    IsPaid = paid,
                    CameraName = input.Camera,
                    PhotoUrl = input.PhotoUrl,
                    RecognitionConfidence = input.Confidence,
                    Operator = input.Operator,
                    PaymentMethod = paymentMethod
                };
                db.ParkingSessions.Add(session);
                openedSessionId = session.Id;
            }
            else
            {
                openedSessionId = already.Id;
            }
            LogEvent("barrier_open", null);
            await db.SaveChangesAsync(ct);
        }

        // Абонемент: действует по датам; лимит въездов, если задан и не Unlimited.
        var sub = await db.ParkingSubscriptions
            .FirstOrDefaultAsync(s => s.IsActive && s.PlateNormalized == norm && s.StartDate <= today && s.EndDate >= today, ct);
        if (sub is not null && (sub.Unlimited || sub.EntriesLimit == null || sub.EntriesUsed < sub.EntriesLimit))
        {
            if (input.OpenSession && !sub.Unlimited && sub.EntriesLimit != null) sub.EntriesUsed++;
            await OpenSessionIfRequested(paid: false, paymentMethod: "subscription");
            return new ParkingAccessDecision(true, "subscription", Subscription: sub.Name, SessionId: openedSessionId);
        }

        // Машина из белого списка: от неё зависят разрешение на въезд, владелец мест и лимит стоянки.
        var vehicle = await db.ParkingVehicles.AsNoTracking()
            .FirstOrDefaultAsync(v => v.IsActive && v.PlateNormalized == norm, ct);

        /// <summary>Заняты ли все места владельца этой машины (кроме неё самой).</summary>
        async Task<(bool Busy, string Detail)> HolderSpacesBusy()
        {
            if (vehicle?.HolderId is not { } holderId) return (false, "");
            var holder = await db.ParkingHolders.AsNoTracking().FirstOrDefaultAsync(h => h.Id == holderId, ct);
            if (holder is not { IsActive: true }) return (false, "");
            var holderPlates = await db.ParkingVehicles.AsNoTracking()
                .Where(v => v.HolderId == holderId && v.IsActive)
                .Select(v => v.PlateNormalized)
                .ToListAsync(ct);
            // Саму въезжающую машину не считаем: если она уже внутри, это повторное событие камеры.
            var occupied = await db.ParkingSessions.AsNoTracking()
                .CountAsync(s => s.ExitedUtc == null
                    && s.PlateNormalized != norm
                    && holderPlates.Contains(s.PlateNormalized), ct);
            var limit = Math.Max(1, holder.SpacesLimit);
            return (occupied >= limit, $"Holder «{holder.Name}»: {occupied}/{limit} spaces busy");
        }

        // Белый список: машина с непросроченной лицензией и подходящей зоной проходит
        // в любом режиме (кроме чёрного списка выше). Просроченная лицензия или чужая зона —
        // причина отказа: по ней в журнале видно, что именно закрыло шлагбаум.
        var licenseExpired = vehicle?.AccessValidTo is { } validTo && validTo < today;
        var wrongZone = vehicle?.ZoneId is { } allowedZone && input.ZoneId is { } askedZone && allowedZone != askedZone;
        if (vehicle is not null && !licenseExpired && !wrongZone)
        {
            var (busy, detail) = await HolderSpacesBusy();
            if (busy)
            {
                LogEvent("denied", detail);
                await db.SaveChangesAsync(ct);
                return new ParkingAccessDecision(false, "holder-spaces-busy");
            }
            await OpenSessionIfRequested(paid: false, paymentMethod: "whitelist");
            return new ParkingAccessDecision(true, "whitelist", SessionId: openedSessionId);
        }

        var settings = await db.SystemSettings.AsNoTracking()
            .Where(x => x.Key == "parking.mode" || x.Key == "parking.freeSubMode")
            .ToListAsync(ct);
        var mode = settings.FirstOrDefault(x => x.Key == "parking.mode")?.Value ?? "Free";
        var subMode = settings.FirstOrDefault(x => x.Key == "parking.freeSubMode")?.Value ?? "Capacity";
        var isPaidMode = string.Equals(mode, "Paid", StringComparison.OrdinalIgnoreCase);

        async Task<bool> HasFreeSpace()
        {
            var capQ = db.ParkingSpaces.AsNoTracking().Where(sp => sp.IsActive && sp.Type == spaceType);
            if (input.ZoneId.HasValue) capQ = capQ.Where(sp => sp.Row!.Floor!.ZoneId == input.ZoneId.Value);
            var cap = await capQ.CountAsync(ct);
            var usedQ = db.ParkingSessions.AsNoTracking().Where(x => x.ExitedUtc == null && x.SpaceType == spaceType);
            if (input.ZoneId.HasValue) usedQ = usedQ.Where(x => x.ZoneId == input.ZoneId.Value);
            var used = await usedQ.CountAsync(ct);
            return cap - used > 0;
        }

        bool allow;
        string reason;
        // Подробность для журнала: у отказа по местам владельца полезно видеть счёт.
        string? deniedDetail = null;
        if (isPaidMode)
        {
            allow = await HasFreeSpace();
            reason = allow ? "paid-capacity" : "full";
        }
        else if (string.Equals(subMode, "List", StringComparison.OrdinalIgnoreCase))
        {
            // Режим «по белому списку»: машина без действующей записи не проезжает. Годная
            // запись проверена выше и уже вернула бы разрешение, поэтому сюда попадают
            // только отсутствующие, просроченные и приехавшие в чужую зону.
            allow = false;
            reason = vehicle is null ? "not-in-whitelist" : licenseExpired ? "license-expired" : "wrong-zone";
        }
        else
        {
            allow = await HasFreeSpace();
            reason = allow ? "capacity" : "full";
        }

        if (allow)
        {
            await OpenSessionIfRequested(paid: isPaidMode);
        }
        else
        {
            LogEvent("denied", deniedDetail ?? reason);
            await db.SaveChangesAsync(ct);
        }

        logger.LogInformation("Parking decision for {Plate}: allowed={Allowed} reason={Reason} camera={Camera}",
            input.Plate, allow, reason, input.Camera ?? "—");
        return new ParkingAccessDecision(allow, reason, Mode: mode, SubMode: isPaidMode ? null : subMode, SessionId: openedSessionId);
    }

    /// <summary>Сколько минут даётся на выезд после оплаты; 0 — окно не ограничено.</summary>
    public async Task<int> GetExitGraceMinutesAsync(CancellationToken ct)
    {
        var raw = (await db.SystemSettings.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Key == "parking.exitGraceMinutes", ct))?.Value;
        return int.TryParse(raw, out var m) && m >= 0 ? m : 15;
    }

    public async Task<ParkingExitResult> RegisterExitAsync(string plate, string? camera, string? photoUrl, bool force, CancellationToken ct)
    {
        var norm = NormalizePlate(plate);
        if (norm.Length == 0) return new ParkingExitResult(0, 0m);

        var open = await db.ParkingSessions.Where(x => x.ExitedUtc == null && x.PlateNormalized == norm).ToListAsync(ct);
        if (open.Count == 0)
        {
            db.ParkingEvents.Add(new ParkingEvent
            {
                Type = "denied",
                Message = "Exit without an open session",
                Plate = plate.Trim(),
                Source = camera ?? "system"
            });
            await db.SaveChangesAsync(ct);
            return new ParkingExitResult(0, 0m);
        }

        var now = DateTime.UtcNow;

        // Платная сессия: без оплаты или с просроченным окном выезда шлагбаум не открываем —
        // водитель идёт на кассу. Оператор может выпустить принудительно (force).
        if (!force)
        {
            var tariffForCheck = await db.ParkingTariffs.AsNoTracking().Where(x => x.IsActive)
                .OrderByDescending(x => x.IsDefault).ThenBy(x => x.SortOrder).FirstOrDefaultAsync(ct);
            foreach (var s in open.Where(s => s.IsPaid && tariffForCheck is not null))
            {
                if (s.PaidUtc is null)
                {
                    // Ещё не платил: если стоянка бесплатна по времени (льготные минуты) — выпускаем.
                    if (ComputeCost(tariffForCheck!, s.EnteredUtc, now) <= 0) continue;
                    db.ParkingEvents.Add(new ParkingEvent
                    {
                        Type = "denied", Message = "Exit refused: not paid", Plate = plate.Trim(), Source = camera ?? "system"
                    });
                    await db.SaveChangesAsync(ct);
                    return new ParkingExitResult(0, 0m, s.Id, Refused: true, Reason: "unpaid",
                        SurchargeDue: ComputeCost(tariffForCheck!, s.EnteredUtc, now));
                }

                if (s.PaidUntilUtc is { } deadline && now > deadline)
                {
                    // Окно вышло: доплата считается за время сверх оплаченного.
                    var surcharge = ComputeCost(tariffForCheck!, s.PaidUtc.Value, now);
                    db.ParkingEvents.Add(new ParkingEvent
                    {
                        Type = "denied",
                        Message = $"Exit refused: paid window expired at {deadline:HH:mm}, surcharge {surcharge:0.##}",
                        Plate = plate.Trim(),
                        Source = camera ?? "system"
                    });
                    await db.SaveChangesAsync(ct);
                    return new ParkingExitResult(0, 0m, s.Id, Refused: true, Reason: "grace-expired", SurchargeDue: surcharge);
                }
            }
        }

        var tariff = await db.ParkingTariffs.AsNoTracking().Where(x => x.IsActive)
            .OrderByDescending(x => x.IsDefault).ThenBy(x => x.SortOrder).FirstOrDefaultAsync(ct);
        var limitMinutes = await ResolveTimeLimitAsync(db, norm, ct);

        Guid? lastId = null;
        decimal amount = 0m;
        foreach (var s in open)
        {
            s.ExitedUtc = now;
            s.UpdatedUtc = now;
            if (photoUrl != null) s.PhotoUrl ??= photoUrl;
            lastId = s.Id;

            // Выезд без кассы: стоимость всё равно считаем и фиксируем как долг —
            // иначе в отчётах такая стоянка выглядела бы бесплатной.
            if (s.IsPaid && tariff is not null && s.PaidUtc == null)
            {
                var cost = ComputeCost(tariff, s.EnteredUtc, now);
                if (cost > 0)
                {
                    s.Cost = cost;
                    s.TariffId = tariff.Id;
                    amount += cost;
                }
            }
            // Оплатил, но выехал позже отведённого окна (обычно оператор выпустил вручную):
            // время сверх оплаченного — долг. Принятую сумму (PaidAmount) не трогаем,
            // поэтому в отчётах видно и выручку, и недобор по этой сессии.
            else if (s.IsPaid && tariff is not null && s.PaidUtc is not null
                     && s.PaidUntilUtc is { } paidUntil && now > paidUntil)
            {
                var surcharge = ComputeCost(tariff, s.PaidUtc.Value, now);
                if (surcharge > 0)
                {
                    s.Cost = (s.Cost ?? 0m) + surcharge;
                    amount += surcharge;
                }
            }

            // Перепростой: фиксируем один раз, чтобы не плодить одинаковые события.
            var stayed = (now - s.EnteredUtc).TotalMinutes;
            if (limitMinutes is { } limit && stayed > limit && s.OverstayUtc == null)
            {
                s.OverstayUtc = now;
                db.ParkingEvents.Add(new ParkingEvent
                {
                    Type = "overstay",
                    Message = $"Stayed {Math.Round(stayed)}m, limit {limit}m",
                    Plate = plate.Trim(),
                    Source = camera ?? "system"
                });
            }
        }

        db.ParkingEvents.Add(new ParkingEvent
        {
            Type = "barrier_open",
            Message = "exit",
            Plate = plate.Trim(),
            Source = camera ?? "system"
        });
        if (amount > 0)
        {
            db.ParkingEvents.Add(new ParkingEvent
            {
                Type = "debt",
                Message = $"Left without payment: {amount:0.##}",
                Plate = plate.Trim(),
                Source = camera ?? "system"
            });
            logger.LogWarning("Parking: {Plate} left without payment, debt {Amount}", plate, amount);
        }
        await db.SaveChangesAsync(ct);
        return new ParkingExitResult(open.Count, amount, lastId);
    }
}
