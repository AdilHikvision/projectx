using System.Collections.Concurrent;
using Backend.Application.Parking;
using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Parking;

/// <summary>
/// Что делать с номером, распознанным камерой: определить направление, отсеять повторы
/// (камера шлёт одно и то же событие несколько раз за проезд), принять решение о въезде
/// или закрыть сессию на выезде, приложить кадр и, если настроено, открыть шлагбаум.
/// Singleton: держит короткую память о последних распознаваниях, работу с БД делает через scope.
/// </summary>
public sealed class ParkingAnprHandler(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<ParkingAnprHandler> logger) : IParkingAnprHandler
{
    private sealed record Recent(string PlateNormalized, DateTime AtUtc, Guid? SessionId, Guid? EventId);

    /// <summary>Последнее распознавание по каждой камере: и для дедупликации, и чтобы приложить кадр.</summary>
    private readonly ConcurrentDictionary<string, Recent> _recent = new(StringComparer.OrdinalIgnoreCase);

    public async Task HandlePlateAsync(string deviceIdentifier, AnprPlateEvent plateEvent, CancellationToken ct)
    {
        var norm = ParkingAccessService.NormalizePlate(plateEvent.Plate);
        if (norm.Length == 0) return;

        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var device = await db.Devices.AsNoTracking()
            .FirstOrDefaultAsync(x => x.DeviceIdentifier == deviceIdentifier, ct);
        if (device is null || device.DeviceType != DeviceType.AnprCamera)
        {
            // Номера с обычных терминалов нам не нужны — парковкой управляют только ANPR-камеры.
            return;
        }

        var dedupSeconds = ReadInt(await ReadSettingAsync(db, "parking.anprDedupSeconds", ct), 20);
        if (_recent.TryGetValue(deviceIdentifier, out var prev)
            && prev.PlateNormalized == norm
            && (DateTime.UtcNow - prev.AtUtc).TotalSeconds < dedupSeconds)
        {
            logger.LogDebug("ANPR {Device}: duplicate {Plate} within {Sec}s — ignored", device.Name, plateEvent.Plate, dedupSeconds);
            return;
        }

        // Качество распознавания проверяем до любых решений: по обрывку номера нельзя ни
        // открыть шлагбаум, ни закрыть чужую сессию. Отбраковка попадает в журнал —
        // по ней видно, что камера читает плохо.
        var quality = await PlateQualityOptions.LoadAsync(db, ct);
        var check = PlateQuality.Validate(plateEvent.Plate, plateEvent.Confidence, quality);
        if (!check.Ok)
        {
            logger.LogInformation("ANPR {Device}: plate «{Plate}» rejected ({Reason})", device.Name, plateEvent.Plate, check.Reason);
            db.ParkingEvents.Add(new ParkingEvent
            {
                Type = "recognition_error",
                Message = $"Plate rejected: {check.Reason}{(check.Detail is null ? "" : $" — {check.Detail}")}",
                Plate = plateEvent.Plate.Trim(),
                Source = device.Name
            });
            await db.SaveChangesAsync(ct);
            return;
        }

        var access = scope.ServiceProvider.GetRequiredService<IParkingAccessService>();
        var barrier = scope.ServiceProvider.GetRequiredService<IParkingBarrierService>();

        // Режим проезда: «только вход» означает, что выезд камеры не оформляют — сессию
        // закрывает оператор.
        var entryOnly = string.Equals(await ReadSettingAsync(db, "parking.flowMode", ct), "EntryOnly", StringComparison.OrdinalIgnoreCase);
        if (entryOnly && device.ParkingDirection == ParkingCameraDirection.Exit)
        {
            // Выездная камера в этом режиме — только глаза и реле для оператора: ни закрывать
            // сессию, ни тем более открывать новую по её кадру нельзя.
            logger.LogDebug("ANPR {Device}: exit camera ignored in entry-only mode ({Plate})", device.Name, plateEvent.Plate);
            return;
        }
        var direction = entryOnly
            ? ParkingCameraDirection.Entry
            : await ResolveDirectionAsync(db, device, norm, plateEvent, ct);

        if (direction == ParkingCameraDirection.Exit)
        {
            // force: false — камера не выпускает без оплаты и после просроченного окна выезда.
            var exit = await access.RegisterExitAsync(plateEvent.Plate, device.Name, null, force: false, ct);
            _recent[deviceIdentifier] = new Recent(norm, DateTime.UtcNow, exit.SessionId, null);
            if (exit.Refused)
            {
                logger.LogInformation("ANPR {Device}: exit refused for {Plate} ({Reason}), due {Due}",
                    device.Name, plateEvent.Plate, exit.Reason, exit.SurchargeDue);
                return;
            }
            logger.LogInformation("ANPR {Device}: exit {Plate}, closed {Closed} session(s)", device.Name, plateEvent.Plate, exit.Closed);
            if (exit.Closed > 0) await barrier.TriggerAsync(device.Id, "exit", plateEvent.Plate, ct);
            return;
        }

        // Машина уже числится внутри, а камера сняла её на въезде: либо это повторное
        // распознавание, либо «паровозик» — второй проезжает под чужой номер. Шлагбаум
        // не открываем. Если машина застряла внутри из-за пропущенного выезда, оператор
        // закрывает сессию кнопкой «Выпустить» на кассе.
        if (!quality.AllowReentryWhileInside)
        {
            var alreadyInside = await db.ParkingSessions.AsNoTracking()
                .AnyAsync(s => s.ExitedUtc == null && s.PlateNormalized == norm, ct);
            if (alreadyInside)
            {
                logger.LogInformation("ANPR {Device}: entry {Plate} ignored — already inside", device.Name, plateEvent.Plate);
                db.ParkingEvents.Add(new ParkingEvent
                {
                    Type = "denied",
                    Message = "already-inside",
                    Plate = plateEvent.Plate.Trim(),
                    Source = device.Name
                });
                await db.SaveChangesAsync(ct);
                _recent[deviceIdentifier] = new Recent(norm, DateTime.UtcNow, null, null);
                return;
            }
        }

        var decision = await access.DecideAsync(new ParkingAccessInput(
            Plate: plateEvent.Plate,
            ZoneId: device.ParkingZoneId,
            SpaceType: null,
            Camera: device.Name,
            Operator: null,
            PhotoUrl: null,
            Confidence: plateEvent.Confidence,
            OpenSession: true), ct);

        _recent[deviceIdentifier] = new Recent(norm, DateTime.UtcNow, decision.SessionId, null);
        logger.LogInformation("ANPR {Device}: entry {Plate} → allowed={Allowed} ({Reason})",
            device.Name, plateEvent.Plate, decision.Allowed, decision.Reason);

        if (decision.Allowed) await barrier.TriggerAsync(device.Id, $"entry ({decision.Reason})", plateEvent.Plate, ct);
    }

    public async Task AttachSnapshotAsync(string deviceIdentifier, byte[] image, CancellationToken ct)
    {
        if (image.Length == 0) return;
        if (!_recent.TryGetValue(deviceIdentifier, out var recent) || recent.SessionId is null) return;
        // Кадр приходит следующей частью того же сообщения; всё, что пришло сильно позже, — не к этому проезду.
        if ((DateTime.UtcNow - recent.AtUtc).TotalSeconds > 15) return;

        try
        {
            var dir = configuration["Storage:ParkingPath"]
                ?? Path.Combine(AppContext.BaseDirectory, "uploads", "parking");
            Directory.CreateDirectory(dir);
            var name = $"{recent.SessionId:N}-{DateTime.UtcNow:yyyyMMddHHmmssfff}.jpg";
            await File.WriteAllBytesAsync(Path.Combine(dir, name), image, ct);

            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var session = await db.ParkingSessions.FirstOrDefaultAsync(x => x.Id == recent.SessionId, ct);
            if (session is null) return;
            session.PhotoUrl = $"/api/parking/snapshots/{name}";
            session.UpdatedUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            // Кадр к этому проезду уже сохранён — второй раз не переписываем.
            _recent[deviceIdentifier] = recent with { SessionId = null };
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "ANPR {Device}: failed to store snapshot", deviceIdentifier);
        }
    }

    /// <summary>
    /// Направление берём из настройки камеры. Если не задано — определяем по факту:
    /// открытая сессия у этого номера означает, что машина уже внутри, значит это выезд.
    /// Так одна камера на въезд-выезд тоже работает.
    /// </summary>
    private static async Task<ParkingCameraDirection> ResolveDirectionAsync(
        AppDbContext db, Device device, string plateNormalized, AnprPlateEvent evt, CancellationToken ct)
    {
        if (device.ParkingDirection is ParkingCameraDirection.Entry or ParkingCameraDirection.Exit)
            return device.ParkingDirection.Value;

        // Подсказка прошивки, если она есть: reverse обычно означает удаление от камеры.
        if (string.Equals(evt.Direction, "reverse", StringComparison.OrdinalIgnoreCase))
            return ParkingCameraDirection.Exit;

        var hasOpen = await db.ParkingSessions.AsNoTracking()
            .AnyAsync(x => x.ExitedUtc == null && x.PlateNormalized == plateNormalized, ct);
        return hasOpen ? ParkingCameraDirection.Exit : ParkingCameraDirection.Entry;
    }

    private static async Task<string?> ReadSettingAsync(AppDbContext db, string key, CancellationToken ct) =>
        (await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(x => x.Key == key, ct))?.Value;

    private static int ReadInt(string? raw, int fallback) =>
        int.TryParse(raw, out var v) ? v : fallback;
}
