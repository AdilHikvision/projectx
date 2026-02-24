using System.Collections.Concurrent;
using Backend.Application.Devices;
using Backend.Infrastructure.Devices.Sdk;

namespace Backend.Infrastructure.Devices.Services;

public sealed class DeviceConnectionManager(IHikvisionSdkClient sdkClient) : IDeviceConnectionManager
{
    private readonly ConcurrentDictionary<string, DeviceConnection> _activeConnections = new();

    public async Task<DeviceConnection> ConnectAsync(string deviceIdentifier, string ipAddress, int port, CancellationToken cancellationToken = default)
    {
        await sdkClient.ConnectAsync(deviceIdentifier, ipAddress, port, cancellationToken);

        var connection = new DeviceConnection(
            deviceIdentifier,
            ipAddress,
            port,
            DeviceConnectivityStatus.Connected,
            DateTime.UtcNow);

        _activeConnections[deviceIdentifier] = connection;
        return connection;
    }

    public async Task DisconnectAsync(string deviceIdentifier, CancellationToken cancellationToken = default)
    {
        await sdkClient.DisconnectAsync(deviceIdentifier, cancellationToken);
        _activeConnections.TryRemove(deviceIdentifier, out _);
    }

    public Task<DeviceConnectivityStatus> GetStatusAsync(string deviceIdentifier, CancellationToken cancellationToken = default)
    {
        var isConnected = _activeConnections.ContainsKey(deviceIdentifier);
        return Task.FromResult(isConnected ? DeviceConnectivityStatus.Connected : DeviceConnectivityStatus.Disconnected);
    }

    public Task<IReadOnlyCollection<DeviceConnection>> GetActiveConnectionsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyCollection<DeviceConnection>>(_activeConnections.Values.ToArray());
    }
}
