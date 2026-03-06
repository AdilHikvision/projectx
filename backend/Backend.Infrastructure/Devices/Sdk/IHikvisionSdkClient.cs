namespace Backend.Infrastructure.Devices.Sdk;

public sealed record SdkDiscoveredDevice(
    string DeviceIdentifier,
    string Name,
    string IpAddress,
    int Port,
    string? Model,
    string? DeviceType,
    string? MacAddress,
    string? FirmwareVersion,
    bool? IsActivated);

public sealed record SdkDeviceEvent(
    string DeviceIdentifier,
    string EventCode,
    DateTime OccurredUtc,
    string Payload);

public interface IHikvisionSdkClient
{
    Task<IReadOnlyCollection<SdkDiscoveredDevice>> ScanLanAsync(CancellationToken cancellationToken = default);
    Task ConnectAsync(string deviceIdentifier, string ipAddress, int port, CancellationToken cancellationToken = default);
    Task DisconnectAsync(string deviceIdentifier, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<SdkDeviceEvent>> PullEventsAsync(IReadOnlyCollection<string> deviceIdentifiers, CancellationToken cancellationToken = default);
    /// <summary>Activate inactive device via HCNetSDK NET_DVR_ActivateDevice (direct TCP). Returns (Success, Message).</summary>
    Task<(bool Success, string? Message)> TryActivateViaSdkAsync(string ipAddress, int port, string password, CancellationToken cancellationToken = default);
}
