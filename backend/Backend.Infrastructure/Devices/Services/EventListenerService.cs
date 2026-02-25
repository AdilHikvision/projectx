using System.Collections.Concurrent;
using Backend.Application.Devices;
using Backend.Infrastructure.Devices.Sdk;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

public sealed class EventListenerService(
    IDeviceConnectionManager connectionManager,
    IHikvisionSdkClient sdkClient,
    ILogger<EventListenerService> logger) : BackgroundService, IEventListenerService
{
    private readonly ConcurrentQueue<DeviceEvent> _buffer = new();
    private const int MaxBufferSize = 1000;
    private static readonly TimeSpan HeartbeatTimeout = TimeSpan.FromSeconds(10);

    public Task<IReadOnlyCollection<DeviceEvent>> ReadRecentEventsAsync(int take = 100, CancellationToken cancellationToken = default)
    {
        if (take <= 0)
        {
            return Task.FromResult<IReadOnlyCollection<DeviceEvent>>([]);
        }

        var snapshot = _buffer.Reverse().Take(take).Reverse().ToArray();
        return Task.FromResult<IReadOnlyCollection<DeviceEvent>>(snapshot);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("EventListenerService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var active = await connectionManager.GetActiveConnectionsAsync(stoppingToken);
                if (active.Count > 0)
                {
                    var deviceIds = active.Select(x => x.DeviceIdentifier).ToArray();
                    var rawEvents = await sdkClient.PullEventsAsync(deviceIds, stoppingToken);
                    foreach (var rawEvent in rawEvents)
                    {
                        await connectionManager.TouchHeartbeatAsync(rawEvent.DeviceIdentifier, rawEvent.OccurredUtc, stoppingToken);
                        Enqueue(MapEvent(rawEvent));
                    }
                }

                await connectionManager.MarkStaleConnectionsOfflineAsync(HeartbeatTimeout, stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to pull device events from SDK.");
            }

            await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
        }
    }

    private static DeviceEvent MapEvent(SdkDeviceEvent sdkEvent)
    {
        var type = sdkEvent.EventCode.ToUpperInvariant() switch
        {
            "DOOR_OPENED" => DeviceEventType.DoorOpened,
            "ACCESS_GRANTED" => DeviceEventType.AccessGranted,
            "ACCESS_DENIED" => DeviceEventType.AccessDenied,
            "HEARTBEAT" => DeviceEventType.Heartbeat,
            _ => DeviceEventType.Unknown
        };

        return new DeviceEvent(sdkEvent.DeviceIdentifier, type, sdkEvent.OccurredUtc, sdkEvent.Payload);
    }

    private void Enqueue(DeviceEvent deviceEvent)
    {
        _buffer.Enqueue(deviceEvent);
        while (_buffer.Count > MaxBufferSize)
        {
            _buffer.TryDequeue(out _);
        }
    }
}
