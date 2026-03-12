namespace Backend.Infrastructure.Devices;

/// <summary>
/// Порты для ISAPI (HTTP/HTTPS). Hikvision: ISAPI — 80/443; SDK — 8000 (проприетарный протокол, не HTTP).
/// При port=8000 (CommandPort из SADP) ISAPI доступен только на 80/443. Порт 8000 — для SDK, не для HTTP.
/// </summary>
public static class IsapiPortHelper
{
    /// <summary>Порты для ISAPI. Документация Pro/Value/Controllers: ISAPI по HTTP на 80/443. Порт 8000 — SDK (бинарный), не HTTP.</summary>
    public static int[] GetPortsToTry(int devicePort)
    {
        // DS-K1T670 и др.: ISAPI может быть на 8000, 80 или 443. Пробуем все.
        return devicePort == 8000 ? [8000, 80, 443] : [devicePort];
    }
}
