namespace Backend.Infrastructure.Devices.Sdk;

/// <summary>
/// Общие мелочи разбора SADP-ответов: чистка полезной нагрузки и ключ дедупликации.
/// </summary>
internal static class SadpPayload
{
    /// <summary>Мусор по краям UDP-полезной нагрузки: NUL, BOM, пробелы, переводы строк.</summary>
    private static readonly char[] TrimChars = ['\0', '﻿', ' ', '\t', '\r', '\n'];

    /// <summary>
    /// Чистит полезную нагрузку перед XDocument.Parse.
    /// Часть устройств дописывает '\0' после &lt;/ProbeMatch&gt; — например DS-TCG406-E
    /// (ANPR) шлёт "&lt;/ProbeMatch&gt;\r\n\0". XDocument.Parse на таком байте падает,
    /// и устройство молча теряется в поиске.
    /// </summary>
    public static string Sanitize(string? xml)
    {
        return string.IsNullOrEmpty(xml) ? string.Empty : xml.Trim(TrimChars);
    }

    /// <summary>
    /// Ключ дедупликации найденного устройства: серийник, иначе MAC, иначе IP:порт.
    /// По IP:порт нельзя — на заводском 192.168.1.64:8000 сидит сразу несколько
    /// неактивированных устройств, и все, кроме первого ответившего, пропадали.
    /// </summary>
    public static string DeviceKey(SdkDiscoveredDevice device)
    {
        if (!string.IsNullOrWhiteSpace(device.DeviceIdentifier) &&
            !device.DeviceIdentifier.StartsWith("SADP-", StringComparison.OrdinalIgnoreCase))
        {
            return device.DeviceIdentifier.Trim();
        }

        return !string.IsNullOrWhiteSpace(device.MacAddress)
            ? device.MacAddress.Trim()
            : $"{device.IpAddress}:{device.Port}";
    }
}
