using System.Collections.Concurrent;
using Backend.Application.Devices;
using Backend.Infrastructure.Devices.Sdk;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Infrastructure.Devices.Services;

public sealed class DeviceConnectionManager(
    IHikvisionSdkClient sdkClient,
    IServiceScopeFactory scopeFactory) : IDeviceConnectionManager
{
    private readonly ConcurrentDictionary<string, DeviceConnection> _activeConnections = new();
    private readonly ConcurrentDictionary<string, DateTime> _lastSeen = new();

    public async Task<DeviceConnection> ConnectAsync(string deviceIdentifier, string ipAddress, int port, CancellationToken cancellationToken = default)
    {
        await sdkClient.ConnectAsync(deviceIdentifier, ipAddress, port, cancellationToken);
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
        await UpdateDbStatusAsync(deviceIdentifier, SeedIds.DeviceStatusOnline, now, cancellationToken);
        return connection;
    }

    public async Task DisconnectAsync(string deviceIdentifier, CancellationToken cancellationToken = default)
    {
        await sdkClient.DisconnectAsync(deviceIdentifier, cancellationToken);
        _activeConnections.TryRemove(deviceIdentifier, out _);
        await UpdateDbStatusAsync(deviceIdentifier, SeedIds.DeviceStatusOffline, null, cancellationToken);
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

    public async Task TouchHeartbeatAsync(string deviceIdentifier, DateTime occurredUtc, CancellationToken cancellationToken = default)
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

        await UpdateDbStatusAsync(deviceIdentifier, SeedIds.DeviceStatusOnline, occurredUtc, cancellationToken);
    }

    public async Task MarkStaleConnectionsOfflineAsync(TimeSpan staleAfter, CancellationToken cancellationToken = default)
    {
        if (staleAfter <= TimeSpan.Zero)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var staleDeviceIds = _activeConnections
            .Where(x => _lastSeen.TryGetValue(x.Key, out var seenUtc) && now - seenUtc > staleAfter)
            .Select(x => x.Key)
            .ToArray();

        foreach (var deviceIdentifier in staleDeviceIds)
        {
            _activeConnections.TryRemove(deviceIdentifier, out _);
            await UpdateDbStatusAsync(deviceIdentifier, SeedIds.DeviceStatusOffline, null, cancellationToken);
        }
    }

    public Task<IReadOnlyCollection<DeviceConnection>> GetActiveConnectionsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyCollection<DeviceConnection>>(_activeConnections.Values.ToArray());
    }

    private async Task UpdateDbStatusAsync(
        string deviceIdentifier,
        Guid deviceStatusId,
        DateTime? lastSeenUtc,
        CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var device = await dbContext.Devices
            .FirstOrDefaultAsync(x => x.DeviceIdentifier == deviceIdentifier, cancellationToken);
        if (device is null)
        {
            return;
        }

        device.DeviceStatusId = deviceStatusId;
        device.LastSeenUtc = lastSeenUtc;
        device.UpdatedUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
