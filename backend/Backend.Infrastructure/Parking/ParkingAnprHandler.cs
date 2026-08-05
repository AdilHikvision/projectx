using System.Collections.Concurrent;
using Backend.Application.Parking;
using Backend.Domain.Entities;
using Backend.Infrastructure.Devices;
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

        var access = scope.ServiceProvider.GetRequiredService<IParkingAccessService>();
        var direction = await ResolveDirectionAsync(db, device, norm, plateEvent, ct);

        if (direction == ParkingCameraDirection.Exit)
        {
            var exit = await access.RegisterExitAsync(plateEvent.Plate, device.Name, null, ct);
            _recent[deviceIdentifier] = new Recent(norm, DateTime.UtcNow, exit.SessionId, null);
            logger.LogInformation("ANPR {Device}: exit {Plate}, closed {Closed} session(s)", device.Name, plateEvent.Plate, exit.Closed);
            if (exit.Closed > 0) await TryOpenBarrierAsync(db, device, ct);
            return;
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

        if (decision.Allowed) await TryOpenBarrierAsync(db, device, ct);
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

    /// <summary>
    /// Импульс на реле камеры (ISAPI IO output). Номер выхода — в настройке parking.barrierOutput,
    /// 0 или пусто означает, что шлагбаумом управляет сама камера и трогать её не нужно.
    /// </summary>
    private async Task TryOpenBarrierAsync(AppDbContext db, Device device, CancellationToken ct)
    {
        var output = ReadInt(await ReadSettingAsync(db, "parking.barrierOutput", ct), 0);
        if (output <= 0) return;

        try
        {
            var user = device.Username ?? configuration["Hikvision:Username"] ?? "admin";
            var pwd = device.Password ?? configuration["Hikvision:Password"] ?? "";
            var client = new IsapiClient(device.IpAddress, device.Port, user, pwd, TimeSpan.FromSeconds(8));
            var body = "<IOPortData><outputState>high</outputState></IOPortData>";
            var (ok, _, err) = await client.PutAsync($"ISAPI/System/IO/outputs/{output}/trigger", body, "application/xml", ct);
            if (!ok) logger.LogWarning("ANPR {Device}: barrier trigger failed: {Error}", device.Name, err ?? "unknown");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "ANPR {Device}: barrier trigger threw", device.Name);
        }
    }

    private static async Task<string?> ReadSettingAsync(AppDbContext db, string key, CancellationToken ct) =>
        (await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(x => x.Key == key, ct))?.Value;

    private static int ReadInt(string? raw, int fallback) =>
        int.TryParse(raw, out var v) ? v : fallback;
}
