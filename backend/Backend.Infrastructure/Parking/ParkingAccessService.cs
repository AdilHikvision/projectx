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
                var session = new ParkingSession
                {
                    Plate = input.Plate.Trim(),
                    PlateNormalized = norm,
                    ZoneId = input.ZoneId,
                    SpaceType = spaceType,
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

        // Действующий пропуск (permit) на сегодня пропускает всегда (кроме чёрного списка выше).
        var hasPermit = await db.ParkingPermits.AsNoTracking()
            .Include(p => p.Vehicle)
            .AnyAsync(p => p.IsActive
                && p.Vehicle!.IsActive
                && p.Vehicle.PlateNormalized == norm
                && p.ValidFrom <= today
                && (p.ValidTo == null || p.ValidTo >= today)
                && (p.ZoneId == null || input.ZoneId == null || p.ZoneId == input.ZoneId), ct);
        if (hasPermit)
        {
            await OpenSessionIfRequested(paid: false, paymentMethod: "permit");
            return new ParkingAccessDecision(true, "permit", SessionId: openedSessionId);
        }

        var settings = await db.SystemSettings.AsNoTracking()
            .Where(x => x.Key == "parking.mode" || x.Key == "parking.freeSubMode" || x.Key == "parking.reentryMinutes")
            .ToListAsync(ct);
        var mode = settings.FirstOrDefault(x => x.Key == "parking.mode")?.Value ?? "Free";
        var subMode = settings.FirstOrDefault(x => x.Key == "parking.freeSubMode")?.Value ?? "Capacity";
        var isPaidMode = string.Equals(mode, "Paid", StringComparison.OrdinalIgnoreCase);

        // Повторный въезд не раньше, чем через N минут после выезда (бесплатный режим).
        if (!isPaidMode && int.TryParse(settings.FirstOrDefault(x => x.Key == "parking.reentryMinutes")?.Value, out var reentryMin) && reentryMin > 0)
        {
            var lastExit = await db.ParkingSessions.AsNoTracking()
                .Where(x => x.PlateNormalized == norm && x.ExitedUtc != null)
                .OrderByDescending(x => x.ExitedUtc).Select(x => x.ExitedUtc).FirstOrDefaultAsync(ct);
            if (lastExit.HasValue && (DateTime.UtcNow - lastExit.Value).TotalMinutes < reentryMin)
            {
                LogEvent("denied", $"Re-entry cooldown: {reentryMin}m");
                await db.SaveChangesAsync(ct);
                return new ParkingAccessDecision(false, "reentry-cooldown", Mode: mode, SubMode: subMode,
                    WaitMinutes: Math.Ceiling(reentryMin - (DateTime.UtcNow - lastExit.Value).TotalMinutes));
            }
        }

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
        if (isPaidMode)
        {
            allow = await HasFreeSpace();
            reason = allow ? "paid-capacity" : "full";
        }
        else if (string.Equals(subMode, "List", StringComparison.OrdinalIgnoreCase))
        {
            // Белый список с учётом срока действия пропуска.
            var wl = await db.ParkingPlates.AsNoTracking()
                .FirstOrDefaultAsync(x => x.IsActive && x.ListType == ParkingPlateList.Allow && x.PlateNormalized == norm, ct);
            allow = wl is not null && (wl.ValidTo == null || wl.ValidTo >= today);
            reason = wl is null ? "not-in-allowlist" : (allow ? "allowlist" : "allowlist-expired");
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
            LogEvent("denied", reason);
            await db.SaveChangesAsync(ct);
        }

        logger.LogInformation("Parking decision for {Plate}: allowed={Allowed} reason={Reason} camera={Camera}",
            input.Plate, allow, reason, input.Camera ?? "—");
        return new ParkingAccessDecision(allow, reason, Mode: mode, SubMode: isPaidMode ? null : subMode, SessionId: openedSessionId);
    }

    public async Task<ParkingExitResult> RegisterExitAsync(string plate, string? camera, string? photoUrl, CancellationToken ct)
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
        Guid? lastId = null;
        decimal amount = 0m;
        foreach (var s in open)
        {
            s.ExitedUtc = now;
            s.UpdatedUtc = now;
            if (photoUrl != null) s.PhotoUrl ??= photoUrl;
            lastId = s.Id;
        }

        db.ParkingEvents.Add(new ParkingEvent
        {
            Type = "barrier_open",
            Message = "exit",
            Plate = plate.Trim(),
            Source = camera ?? "system"
        });
        await db.SaveChangesAsync(ct);
        return new ParkingExitResult(open.Count, amount, lastId);
    }
}
