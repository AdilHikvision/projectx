namespace Backend.Application.Devices;

public enum DeviceConnectivityStatus
{
    Disconnected = 0,
    Connected = 1
}

public enum DeviceEventType
{
    Unknown = 0,
    DoorOpened = 1,
    AccessGranted = 2,
    AccessDenied = 3,
    Heartbeat = 4
}

public sealed record DiscoveredDevice(
    string DeviceIdentifier,
    string Name,
    string IpAddress,
    int Port,
    string? Model);

public sealed record DeviceConnection(
    string DeviceIdentifier,
    string IpAddress,
    int Port,
    DeviceConnectivityStatus Status,
    DateTime ConnectedUtc);

public sealed record DeviceEvent(
    string DeviceIdentifier,
    DeviceEventType EventType,
    DateTime OccurredUtc,
    string Payload);

public interface IDeviceDiscoveryService
{
    Task<IReadOnlyCollection<DiscoveredDevice>> DiscoverAsync(CancellationToken cancellationToken = default);
}

public interface IDeviceConnectionManager
{
    Task<DeviceConnection> ConnectAsync(string deviceIdentifier, string ipAddress, int port, CancellationToken cancellationToken = default);
    Task DisconnectAsync(string deviceIdentifier, CancellationToken cancellationToken = default);
    Task<DeviceConnectivityStatus> GetStatusAsync(string deviceIdentifier, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<DeviceConnection>> GetActiveConnectionsAsync(CancellationToken cancellationToken = default);
}

public interface IEventListenerService
{
    Task<IReadOnlyCollection<DeviceEvent>> ReadRecentEventsAsync(int take = 100, CancellationToken cancellationToken = default);
}
