using Backend.Application.Devices;
using Backend.Infrastructure.Devices.Sdk;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

public sealed class DeviceDiscoveryService(
    IHikvisionSdkClient sdkClient,
    ILogger<DeviceDiscoveryService> logger) : IDeviceDiscoveryService
{
    public async Task<IReadOnlyCollection<DiscoveredDevice>> DiscoverAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var discovered = await sdkClient.ScanLanAsync(cancellationToken);
            return discovered
                .Select(x => new DiscoveredDevice(x.DeviceIdentifier, x.Name, x.IpAddress, x.Port, x.Model))
                .ToArray();
        }
        catch (DllNotFoundException ex)
        {
            logger.LogWarning(ex, "SDK native library is not available. Discovery returns empty result.");
            return Array.Empty<DiscoveredDevice>();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Device discovery failed.");
            return Array.Empty<DiscoveredDevice>();
        }
    }
}
