using System.Globalization;
using System.Security;
using System.Xml.Linq;
using Backend.Application.Devices;
using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>Синхронизация времени и часового пояса с Hikvision-устройствами через ISAPI /System/time.
/// Использует manual mode: localTime = серверное UTC + offset из POSIX-строки часового пояса.
/// Формат POSIX timeZone (как на устройстве): "AZT-4:00:00" — UTC+4; знак инвертирован относительно UTC.</summary>
public sealed class DeviceLocalizationService(
    AppDbContext dbContext,
    IConfiguration configuration,
    ILogger<DeviceLocalizationService> logger) : IDeviceLocalizationService
{
    private const string TimeNamespace = "http://www.isapi.org/ver20/XMLSchema";

    public async Task<DeviceTimeInfo> GetDeviceTimeAsync(Guid deviceId, CancellationToken cancellationToken = default)
    {
        var device = await dbContext.Devices.AsNoTracking().FirstOrDefaultAsync(d => d.Id == deviceId, cancellationToken);
        if (device is null)
            return new DeviceTimeInfo(deviceId, "(unknown)", false, null, null, null, "Device not found.");

        var client = CreateClient(device);
        var (success, content, error) = await client.GetAsync("/ISAPI/System/time", cancellationToken);
        if (!success || string.IsNullOrWhiteSpace(content))
            return new DeviceTimeInfo(device.Id, device.Name, false, null, null, null, error ?? "Устройство недоступно.");

        try
        {
            var doc = XDocument.Parse(content);
            var root = doc.Root;
            string? Get(string name) => root?.Descendants().FirstOrDefault(x => string.Equals(x.Name.LocalName, name, StringComparison.OrdinalIgnoreCase))?.Value?.Trim();
            var timeMode = Get("timeMode");
            var localTimeStr = Get("localTime");
            var timeZone = Get("timeZone");
            DateTimeOffset? localTime = null;
            if (!string.IsNullOrWhiteSpace(localTimeStr) &&
                DateTimeOffset.TryParse(localTimeStr, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed))
            {
                localTime = parsed;
            }
            return new DeviceTimeInfo(device.Id, device.Name, true, timeMode, localTime, timeZone, null);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "GetDeviceTime parse failed for {Device}", device.Name);
            return new DeviceTimeInfo(device.Id, device.Name, true, null, null, null, "Не удалось распарсить ответ устройства.");
        }
    }

    public async Task<DeviceTimeSyncResult> SyncDeviceAsync(
        Guid deviceId,
        DateTime serverUtcNow,
        string posixTimeZone,
        CancellationToken cancellationToken = default)
    {
        var device = await dbContext.Devices.AsNoTracking().FirstOrDefaultAsync(d => d.Id == deviceId, cancellationToken);
        if (device is null)
            return new DeviceTimeSyncResult(deviceId, "(unknown)", false, "Device not found.");
        return await SyncDeviceInternalAsync(device, serverUtcNow, posixTimeZone, cancellationToken);
    }

    public async Task<IReadOnlyList<DeviceTimeSyncResult>> SyncAllDevicesAsync(
        DateTime serverUtcNow,
        string posixTimeZone,
        CancellationToken cancellationToken = default)
    {
        var devices = await dbContext.Devices.AsNoTracking().OrderBy(d => d.Name).ToListAsync(cancellationToken);
        if (devices.Count == 0) return [];

        // Параллельно с ограничением 6, иначе при N оффлайн-устройствах общее время = N * timeout.
        using var gate = new SemaphoreSlim(6, 6);
        var results = await Task.WhenAll(devices.Select(async device =>
        {
            await gate.WaitAsync(cancellationToken);
            try
            {
                return await SyncDeviceInternalAsync(device, serverUtcNow, posixTimeZone, cancellationToken);
            }
            finally
            {
                gate.Release();
            }
        }));
        return results;
    }

    private async Task<DeviceTimeSyncResult> SyncDeviceInternalAsync(
        Device device,
        DateTime serverUtcNow,
        string posixTimeZone,
        CancellationToken cancellationToken)
    {
        var offset = ParsePosixOffset(posixTimeZone);
        if (offset is null)
            return new DeviceTimeSyncResult(device.Id, device.Name, false, "Некорректный формат часового пояса (ожидается \"AZT-4:00:00\").");

        var localWallClock = DateTime.SpecifyKind(serverUtcNow, DateTimeKind.Utc).Add(offset.Value);
        var localTimeIso = localWallClock.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);

        // ISAPI /System/time принимает manual mode — пишем localTime (без offset) и timeZone.
        // Сначала ставим часовой пояс отдельно (часть прошивок не применяет timeZone из общего PUT, если до этого был NTP).
        var client = CreateClient(device);

        var tzXml = $"""<?xml version="1.0" encoding="UTF-8"?><TimeZone xmlns="{TimeNamespace}" version="2.0">{SecurityElement.Escape(posixTimeZone)}</TimeZone>""";
        var (tzOk, _, tzErr) = await client.PutAsync("/ISAPI/System/time/timeZone", tzXml, "application/xml", cancellationToken);
        // Не критично: некоторые модели возвращают 404 — пропускаем и полагаемся на общий PUT.
        if (!tzOk)
            logger.LogDebug("PUT /System/time/timeZone for {Device}: {Error}", device.Name, tzErr);

        var timeXml = $"""<?xml version="1.0" encoding="UTF-8"?><Time xmlns="{TimeNamespace}" version="2.0"><timeMode>manual</timeMode><localTime>{localTimeIso}</localTime><timeZone>{SecurityElement.Escape(posixTimeZone)}</timeZone></Time>""";

        var (success, _, error) = await client.PutAsync("/ISAPI/System/time", timeXml, "application/xml", cancellationToken);
        if (!success)
        {
            logger.LogWarning("Sync time for {Device}: {Error}", device.Name, error);
            return new DeviceTimeSyncResult(device.Id, device.Name, false, error ?? "Устройство недоступно.");
        }

        logger.LogInformation("Time synced on {Device}: {Time} ({Tz})", device.Name, localTimeIso, posixTimeZone);
        return new DeviceTimeSyncResult(device.Id, device.Name, true, null);
    }

    /// <summary>Парсит POSIX-строку часового пояса (например, "AZT-4:00:00" → +4ч; "EST5:00:00" → -5ч).
    /// Знак в POSIX инвертирован относительно UTC: "-" перед offset = UTC+; "+" или без знака = UTC-.</summary>
    private static TimeSpan? ParsePosixOffset(string posix)
    {
        if (string.IsNullOrWhiteSpace(posix)) return null;
        var idx = 0;
        while (idx < posix.Length && !char.IsDigit(posix[idx]) && posix[idx] != '-' && posix[idx] != '+') idx++;
        if (idx >= posix.Length) return null;
        var sign = 1;
        if (posix[idx] == '-') { sign = -1; idx++; }
        else if (posix[idx] == '+') { sign = 1; idx++; }
        // Останавливаемся на DST-разделителе (буква), чтобы не захватить DST-часть.
        var endIdx = idx;
        while (endIdx < posix.Length && (char.IsDigit(posix[endIdx]) || posix[endIdx] == ':')) endIdx++;
        var span = posix[idx..endIdx];
        var parts = span.Split(':');
        if (parts.Length == 0 || !int.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out var h)) return null;
        var m = parts.Length > 1 && int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var mm) ? mm : 0;
        var s = parts.Length > 2 && int.TryParse(parts[2], NumberStyles.Integer, CultureInfo.InvariantCulture, out var ss) ? ss : 0;
        // POSIX: положительное число (или "+") = west of UTC = UTC-; отрицательное = east of UTC = UTC+.
        // Возвращаем offset из UTC к локальному (т.е. local = utc + result).
        var totalSeconds = h * 3600 + m * 60 + s;
        return TimeSpan.FromSeconds(-sign * totalSeconds);
    }

    private IsapiClient CreateClient(Device device)
    {
        var username = configuration["Hikvision:Username"] ?? "admin";
        var password = (configuration["Hikvision:Password"] ?? "").Trim();
        if (string.IsNullOrEmpty(password)) password = "12345";
        return new IsapiClient(
            device.IpAddress, device.Port,
            string.IsNullOrWhiteSpace(device.Username) ? username : device.Username,
            string.IsNullOrWhiteSpace(device.Password) ? password : device.Password,
            TimeSpan.FromSeconds(10));
    }
}
