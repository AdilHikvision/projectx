using Microsoft.Extensions.Configuration;

namespace Backend.Infrastructure.Devices;

/// <summary>Общие значения для ISAPI (считыватель по умолчанию и т.д.).</summary>
public static class HikvisionIsapiDefaults
{
    /// <summary>Номер считывателя для CaptureFace / CaptureCard / FingerPrint (1 — типично для однодверных терминалов).</summary>
    public static int GetReaderId(IConfiguration configuration) =>
        Math.Clamp(configuration.GetValue("Hikvision:ReaderId", 1), 1, 32);
}
