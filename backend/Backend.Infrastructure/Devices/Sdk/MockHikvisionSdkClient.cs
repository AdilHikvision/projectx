using System.Collections.Concurrent;

namespace Backend.Infrastructure.Devices.Sdk;

public sealed class MockHikvisionSdkClient : IHikvisionSdkClient
{
    private readonly ConcurrentDictionary<string, (string Ip, int Port)> _connections = new();

    public Task<IReadOnlyCollection<SdkDiscoveredDevice>> ScanLanAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyCollection<SdkDiscoveredDevice> devices =
        [
            new("MOCK-AC-001", "Mock Access Controller #1", "192.168.1.101", 8000, "AC-Controller"),
            new("MOCK-IC-001", "Mock Intercom #1", "192.168.1.102", 8000, "Intercom")
        ];

        return Task.FromResult(devices);
    }

    public Task ConnectAsync(string deviceIdentifier, string ipAddress, int port, CancellationToken cancellationToken = default)
    {
        _connections[deviceIdentifier] = (ipAddress, port);
        return Task.CompletedTask;
    }

    public Task DisconnectAsync(string deviceIdentifier, CancellationToken cancellationToken = default)
    {
        _connections.TryRemove(deviceIdentifier, out _);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyCollection<SdkDeviceEvent>> PullEventsAsync(IReadOnlyCollection<string> deviceIdentifiers, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var events = new List<SdkDeviceEvent>();

        foreach (var deviceIdentifier in deviceIdentifiers)
        {
            if (_connections.ContainsKey(deviceIdentifier))
            {
                events.Add(new SdkDeviceEvent(
                    deviceIdentifier,
                    "HEARTBEAT",
                    now,
                    """{"source":"mock-sdk","status":"alive"}"""));
            }
        }

        return Task.FromResult<IReadOnlyCollection<SdkDeviceEvent>>(events);
    }
}
