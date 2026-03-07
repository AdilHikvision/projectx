using System.Threading.Channels;
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
                .Select(x => new DiscoveredDevice(x.DeviceIdentifier, x.Name, x.IpAddress, x.Port, x.Model, x.DeviceType, x.MacAddress, x.FirmwareVersion, x.IsActivated))
                .ToArray();
        }
        catch (DllNotFoundException ex)
        {
            logger.LogWarning(ex, "SDK native library is not available. Discovery returns empty result.");
            return Array.Empty<DiscoveredDevice>();
        }
        catch (OperationCanceledException)
        {
            logger.LogDebug("Device discovery cancelled (timeout).");
            return Array.Empty<DiscoveredDevice>();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Device discovery failed.");
            return Array.Empty<DiscoveredDevice>();
        }
    }

    public async Task DiscoverStreamAsync(Func<DiscoveredDevice, CancellationToken, Task> onDevice, CancellationToken cancellationToken = default)
    {
        var channel = Channel.CreateUnbounded<DiscoveredDevice>();
        var writer = channel.Writer;

        var progress = new Progress<SdkDiscoveredDevice>(d =>
        {
            var mapped = new DiscoveredDevice(d.DeviceIdentifier, d.Name, d.IpAddress, d.Port, d.Model, d.DeviceType, d.MacAddress, d.FirmwareVersion, d.IsActivated);
            writer.TryWrite(mapped);
        });

        var discoverTask = Task.Run(async () =>
        {
            try
            {
                await sdkClient.ScanLanAsync(cancellationToken, progress);
            }
            catch (DllNotFoundException ex)
            {
                logger.LogWarning(ex, "SDK native library is not available.");
            }
            catch (OperationCanceledException)
            {
                logger.LogDebug("Device discovery cancelled (timeout).");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Device discovery failed.");
            }
            finally
            {
                writer.Complete();
            }
        }, cancellationToken);

        await foreach (var d in channel.Reader.ReadAllAsync(cancellationToken))
        {
            await onDevice(d, cancellationToken);
        }

        await discoverTask;
    }
}
