using System.Collections.Concurrent;

namespace Backend.Infrastructure.Devices.Sdk;

public sealed class MockHikvisionSdkClient : IHikvisionSdkClient
{
    private readonly ConcurrentDictionary<string, (string Ip, int Port)> _connections = new();

    public Task<IReadOnlyCollection<SdkDiscoveredDevice>> ScanLanAsync(CancellationToken cancellationToken = default, IProgress<SdkDiscoveredDevice>? progress = null)
    {
        IReadOnlyCollection<SdkDiscoveredDevice> devices =
        [
            new("MOCK-AC-001", "Mock Access Controller #1", "192.168.1.101", 8000, "AC-Controller", "AccessController", "AA:BB:CC:DD:EE:01", "V1.0", true),
            new("MOCK-IC-001", "Mock Intercom #1", "192.168.1.102", 8000, "Intercom", "Intercom", "AA:BB:CC:DD:EE:02", "V1.0", true)
        ];

        foreach (var d in devices)
            progress?.Report(d);

        return Task.FromResult(devices);
    }

    public Task ConnectAsync(string deviceIdentifier, string ipAddress, int port, string? username = null, string? password = null, CancellationToken cancellationToken = default)
    {
        _connections[deviceIdentifier] = (ipAddress, port);
        return Task.CompletedTask;
    }

    public Task DisconnectAsync(string deviceIdentifier, CancellationToken cancellationToken = default)
    {
        _connections.TryRemove(deviceIdentifier, out _);
        return Task.CompletedTask;
    }

    public Task<PullEventsResult> PullEventsAsync(IReadOnlyCollection<string> deviceIdentifiers, CancellationToken cancellationToken = default)
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

        return Task.FromResult(new PullEventsResult(events, []));
    }

    public Task<(bool Success, string? Message)> TryActivateViaSdkAsync(string ipAddress, int port, string password, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<(bool, string?)>((false, null)); // Mock: no SDK, caller should try SADP
    }
}
