namespace Backend.Infrastructure.Devices.Sdk;

public sealed record SdkDiscoveredDevice(
    string DeviceIdentifier,
    string Name,
    string IpAddress,
    int Port,
    string? Model);

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
}
