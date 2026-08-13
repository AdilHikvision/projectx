using System.Collections.Concurrent;
using Backend.Application.Parking;
using Backend.Domain.Entities;
using Backend.Infrastructure.Devices;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Parking;

/// <summary>
/// Импульс на релейный выход камеры (ISAPI IO output) — то самое «сервер решил, сервер и открыл».
/// Номер выхода берётся у камеры (Device.BarrierOutput), а если не задан — из общей настройки
/// parking.barrierOutput. Ноль или отсутствие значения означает схему «камера открывает сама»:
/// тогда сервер молча ничего не делает и только ведёт учёт.
/// Неудачу пишем в журнал парковки (camera_error): машина стоит перед закрытым шлагбаумом,
/// и это должно быть видно оператору, а не только в логах сервиса.
/// </summary>
public sealed class ParkingBarrierService(
    AppDbContext db,
    IConfiguration configuration,
    ILogger<ParkingBarrierService> logger) : IParkingBarrierService
{
    /// <summary>Реле не сработало с первого раза — пробуем ещё раз, прежде чем сдаться.</summary>
    private const int Attempts = 2;

    public async Task<ParkingBarrierResult> TriggerAsync(Guid deviceId, string reason, string? plate, CancellationToken ct)
    {
        var device = await db.Devices.AsNoTracking().FirstOrDefaultAsync(x => x.Id == deviceId, ct);
        if (device is null) return ParkingBarrierResult.NoDevice;
        return await TriggerForDeviceAsync(device, reason, plate, ct);
    }

    public async Task<ParkingBarrierResult> OpenAsync(
        ParkingCameraDirection direction, Guid? zoneId, string? plate, string? source, CancellationToken ct)
    {
        var fallback = await ReadGlobalOutputAsync(ct);
        var cameras = await db.Devices.AsNoTracking()
            .Where(d => d.DeviceType == DeviceType.AnprCamera && d.ParkingDirection == direction)
            .ToListAsync(ct);

        // Чужую зону не трогаем: открыть шлагбаум на другом конце парковки хуже, чем не открыть
        // вовсе. Сначала камера своей зоны, потом «общая» (зона не задана — обычный случай
        // парковки из одной зоны).
        var camera = cameras
            .Where(d => ResolveOutput(d, fallback) > 0)
            .Where(d => !zoneId.HasValue || d.ParkingZoneId == zoneId || d.ParkingZoneId is null)
            .OrderByDescending(d => zoneId.HasValue && d.ParkingZoneId == zoneId)
            .FirstOrDefault();
        if (camera is null) return ParkingBarrierResult.NoDevice;

        var what = direction == ParkingCameraDirection.Exit ? "manual exit" : "manual entry";
        return await TriggerForDeviceAsync(camera, source is null ? what : $"{what} ({source})", plate, ct);
    }

    private async Task<ParkingBarrierResult> TriggerForDeviceAsync(Device device, string reason, string? plate, CancellationToken ct)
    {
        var output = ResolveOutput(device, await ReadGlobalOutputAsync(ct));
        if (output <= 0)
        {
            logger.LogDebug("Barrier: {Device} has no relay output configured — camera opens the barrier itself", device.Name);
            return new ParkingBarrierResult(false, Skipped: true, device.Name);
        }

        var user = device.Username ?? configuration["Hikvision:Username"] ?? "admin";
        var pwd = device.Password ?? configuration["Hikvision:Password"] ?? "";
        var client = new IsapiClient(device.IpAddress, device.Port, user, pwd, TimeSpan.FromSeconds(8));
        var channel = await ReadBarrierChannelAsync(ct);

        // Два способа открыть. Штатная команда шлагбаума — то, чего камера ждёт в режиме
        // «управление с платформы»: на прямое дёрганье IO-выхода она в этом режиме отвечает
        // 403. На камерах без раздела Parking работает наоборот только IO. Сработавший способ
        // запоминаем, чтобы не ходить каждый раз дважды.
        // Тело — байт в байт то, что шлёт веб-интерфейс самой камеры (проверено на
        // iDS-TCM, прошивка V5.4.0): без namespace, с XML-декларацией.
        var gate = ($"ISAPI/Parking/channels/{channel}/barrierGate",
            """<?xml version="1.0" encoding="UTF-8"?><BarrierGate><ctrlMode>open</ctrlMode></BarrierGate>""",
            "barrierGate");
        var io = ($"ISAPI/System/IO/outputs/{output}/trigger",
            "<IOPortData><outputState>high</outputState></IOPortData>",
            $"IO output {output}");

        var order = PreferredMethod.TryGetValue(device.Id, out var known) && known == "io"
            ? new[] { io, gate }
            : [gate, io];

        var errors = new List<string>();
        foreach (var (path, body, label) in order)
        {
            for (var attempt = 1; attempt <= Attempts; attempt++)
            {
                string? error;
                try
                {
                    var (ok, _, err) = await client.PutAsync(path, body, "application/xml", ct);
                    if (ok)
                    {
                        var method = label.StartsWith("IO", StringComparison.Ordinal) ? "io" : "gate";
                        PreferredMethod[device.Id] = method;
                        logger.LogInformation("Barrier opened: {Device} via {Method} ({Reason})", device.Name, label, reason);
                        return new ParkingBarrierResult(true, Skipped: false, device.Name, output, Method: method);
                    }
                    error = err ?? "unknown error";
                }
                catch (Exception ex)
                {
                    error = ex.Message;
                }
                // Отказ в доступе и «нет такого раздела» вторая попытка не исправит —
                // сразу переходим к следующему способу.
                if (attempt == Attempts || error.Contains("Доступ запрещён", StringComparison.OrdinalIgnoreCase)
                    || error.Contains("404", StringComparison.Ordinal))
                {
                    errors.Add($"{label}: {error}");
                    break;
                }
                await Task.Delay(300, ct);
            }
        }

        PreferredMethod.TryRemove(device.Id, out _);
        var combined = string.Join("; ", errors);
        logger.LogWarning("Barrier trigger failed: {Device} ({Reason}): {Error}", device.Name, reason, combined);
        db.ParkingEvents.Add(new ParkingEvent
        {
            Type = "camera_error",
            Message = $"Barrier not opened ({reason}): {combined}",
            Plate = plate,
            Source = device.Name
        });
        await db.SaveChangesAsync(ct);
        return new ParkingBarrierResult(false, Skipped: false, device.Name, output, combined);
    }

    /// <summary>Какой способ открытия сработал у камеры: "gate" (штатная команда) или "io" (реле).</summary>
    private static readonly ConcurrentDictionary<Guid, string> PreferredMethod = new();

    /// <summary>Номер канала в разделе Parking; у камеры с одним проездом это всегда 1.</summary>
    private async Task<int> ReadBarrierChannelAsync(CancellationToken ct)
    {
        var raw = (await db.SystemSettings.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Key == "parking.barrierChannel", ct))?.Value;
        return int.TryParse(raw, out var v) && v > 0 ? v : 1;
    }

    /// <summary>У камеры свой номер выхода; не задан — общий для всей парковки.</summary>
    private static int ResolveOutput(Device device, int fallback) =>
        device.BarrierOutput is > 0 ? device.BarrierOutput.Value : fallback;

    private async Task<int> ReadGlobalOutputAsync(CancellationToken ct)
    {
        var raw = (await db.SystemSettings.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Key == "parking.barrierOutput", ct))?.Value;
        return int.TryParse(raw, out var v) && v > 0 ? v : 0;
    }
}
