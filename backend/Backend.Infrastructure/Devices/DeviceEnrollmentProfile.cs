using Backend.Domain.Entities;

namespace Backend.Infrastructure.Devices;

/// <summary>
/// Энроллер-станции: тип в БД или модель/серийник DS-K1F… (часто устройство заведено не как EnrollerStation).
/// </summary>
public static class DeviceEnrollmentProfile
{
    public static bool UseEnrollerCaptureFlow(Device device) =>
        device.DeviceType == DeviceType.EnrollerStation || LooksLikeHikvisionEnroller(device.DeviceIdentifier, device.Name);

    public static bool LooksLikeHikvisionEnroller(string? deviceIdentifier, string? name)
    {
        var s = $"{deviceIdentifier ?? ""} {name ?? ""}".ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(s.Trim())) return false;
        return s.Contains("DS-K1F", StringComparison.Ordinal)
               || s.Contains("K1F600", StringComparison.Ordinal)
               || s.Contains("K1F510", StringComparison.Ordinal)
               || s.Contains("K1F800", StringComparison.Ordinal);
    }
}
