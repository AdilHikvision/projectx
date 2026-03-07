using System.Collections.Concurrent;
using Backend.Application.Devices;
using Backend.Infrastructure.Devices.Sdk;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>Управляет SDK-подключениями для событий. Статус устройств определяется только через ARP (DeviceArpStatusService).</summary>
public sealed class DeviceConnectionManager(IHikvisionSdkClient sdkClient) : IDeviceConnectionManager
{
    private readonly ConcurrentDictionary<string, DeviceConnection> _activeConnections = new();
    private readonly ConcurrentDictionary<string, DateTime> _lastSeen = new();

    public async Task<DeviceConnection> ConnectAsync(string deviceIdentifier, string ipAddress, int port, string? username = null, string? password = null, CancellationToken cancellationToken = default)
    {
        await sdkClient.ConnectAsync(deviceIdentifier, ipAddress, port, username, password, cancellationToken);
        var now = DateTime.UtcNow;

        var connection = new DeviceConnection(
            deviceIdentifier,
            ipAddress,
            port,
            DeviceConnectivityStatus.Connected,
            now,
            now);

        _activeConnections[deviceIdentifier] = connection;
        _lastSeen[deviceIdentifier] = now;
        return connection;
    }

    public async Task DisconnectAsync(string deviceIdentifier, CancellationToken cancellationToken = default)
    {
        await sdkClient.DisconnectAsync(deviceIdentifier, cancellationToken);
        _activeConnections.TryRemove(deviceIdentifier, out _);
    }

    public Task<DeviceRealtimeStatus> GetStatusAsync(string deviceIdentifier, CancellationToken cancellationToken = default)
    {
        var isConnected = _activeConnections.ContainsKey(deviceIdentifier);
        var status = isConnected ? DeviceConnectivityStatus.Connected : DeviceConnectivityStatus.Disconnected;
        _lastSeen.TryGetValue(deviceIdentifier, out var lastSeen);
        var lastSeenValue = lastSeen == default ? (DateTime?)null : lastSeen;
        return Task.FromResult(new DeviceRealtimeStatus(deviceIdentifier, status, lastSeenValue));
    }

    public Task<IReadOnlyCollection<DeviceRealtimeStatus>> GetStatusesAsync(CancellationToken cancellationToken = default)
    {
        var ids = _activeConnections.Keys.Union(_lastSeen.Keys).Distinct().ToArray();
        var statuses = ids
            .Select(id =>
            {
                var isConnected = _activeConnections.ContainsKey(id);
                var status = isConnected ? DeviceConnectivityStatus.Connected : DeviceConnectivityStatus.Disconnected;
                _lastSeen.TryGetValue(id, out var lastSeen);
                var lastSeenValue = lastSeen == default ? (DateTime?)null : lastSeen;
                return new DeviceRealtimeStatus(id, status, lastSeenValue);
            })
            .ToArray();

        return Task.FromResult<IReadOnlyCollection<DeviceRealtimeStatus>>(statuses);
    }

    public Task TouchHeartbeatAsync(string deviceIdentifier, DateTime occurredUtc, CancellationToken cancellationToken = default)
    {
        _lastSeen[deviceIdentifier] = occurredUtc;
        if (_activeConnections.TryGetValue(deviceIdentifier, out var existing))
        {
            _activeConnections[deviceIdentifier] = existing with
            {
                Status = DeviceConnectivityStatus.Connected,
                LastSeenUtc = occurredUtc
            };
        }
        return Task.CompletedTask;
    }

    public Task MarkStaleConnectionsOfflineAsync(TimeSpan staleAfter, CancellationToken cancellationToken = default)
    {
        if (staleAfter <= TimeSpan.Zero)
        {
            return Task.CompletedTask;
        }

        var now = DateTime.UtcNow;
        var staleDeviceIds = _activeConnections
            .Where(x => _lastSeen.TryGetValue(x.Key, out var seenUtc) && now - seenUtc > staleAfter)
            .Select(x => x.Key)
            .ToArray();

        foreach (var deviceIdentifier in staleDeviceIds)
        {
            _activeConnections.TryRemove(deviceIdentifier, out _);
        }
        return Task.CompletedTask;
    }

    public Task<IReadOnlyCollection<DeviceConnection>> GetActiveConnectionsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyCollection<DeviceConnection>>(_activeConnections.Values.ToArray());
    }
}
