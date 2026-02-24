using Backend.Application.Devices;
using Backend.Infrastructure.Devices.Sdk;

namespace Backend.Infrastructure.Devices.Services;

public sealed class DeviceDiscoveryService(IHikvisionSdkClient sdkClient) : IDeviceDiscoveryService
{
    public async Task<IReadOnlyCollection<DiscoveredDevice>> DiscoverAsync(CancellationToken cancellationToken = default)
    {
        var discovered = await sdkClient.ScanLanAsync(cancellationToken);
        return discovered
            .Select(x => new DiscoveredDevice(x.DeviceIdentifier, x.Name, x.IpAddress, x.Port, x.Model))
            .ToArray();
    }
}
