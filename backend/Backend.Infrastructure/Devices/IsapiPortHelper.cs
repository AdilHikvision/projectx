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
        // DS-K1T670, Pro/Value Series: ISAPI (HTTP) на 80/443. 
        // Порт 8000 — всегда SDK (бинарный), HTTP запросы к нему вызывают сброс соединения (SocketException 10054).
        if (devicePort == 8000)
        {
            return [80, 443];
        }

        // Если указан не 8000, пробуем его первым, затем стандартные порты
        if (devicePort != 80 && devicePort != 443)
        {
            return [devicePort, 80, 443];
        }

        return [80, 443];
    }
}
