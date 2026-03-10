namespace Backend.Infrastructure.Devices;

/// <summary>
/// Порты для ISAPI (HTTP/HTTPS). Hikvision: ISAPI — 80/443; SDK — 8000 (проприетарный протокол, не HTTP).
/// При port=8000 (CommandPort из SADP) ISAPI доступен только на 80/443. Порт 8000 — для SDK, не для HTTP.
/// </summary>
public static class IsapiPortHelper
{
    /// <summary>Порты для попытки ISAPI. Face Recognition Terminals могут использовать 80, 443 или 8000.</summary>
    public static int[] GetPortsToTry(int devicePort)
    {
        return devicePort == 8000 ? [80, 8000, 443] : [devicePort];
    }
}
