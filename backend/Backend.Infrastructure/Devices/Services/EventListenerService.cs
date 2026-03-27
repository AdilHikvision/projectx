using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using Backend.Application.Devices;
using Backend.Infrastructure.Devices;
using Backend.Infrastructure.Devices.Sdk;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

public sealed class EventListenerService(
    IDeviceConnectionManager connectionManager,
    IHikvisionSdkClient sdkClient,
    IServiceScopeFactory scopeFactory,
    IDeviceActivityBroadcaster activityBroadcaster,
    ILogger<EventListenerService> logger) : BackgroundService, IEventListenerService
{
    private readonly ConcurrentQueue<DeviceEvent> _buffer = new();
    private readonly ConcurrentDictionary<string, int> _consecutiveFailures = new(StringComparer.OrdinalIgnoreCase);
    private const int MaxBufferSize = 1000;
    private const int FailuresBeforeDisconnect = 3;
    private static readonly TimeSpan HeartbeatTimeout = TimeSpan.FromSeconds(20);
    private static readonly TimeSpan ReconnectInterval = TimeSpan.FromSeconds(30);

    public Task<IReadOnlyCollection<DeviceEvent>> ReadRecentEventsAsync(int take = 100, CancellationToken cancellationToken = default)
    {
        if (take <= 0)
        {
            return Task.FromResult<IReadOnlyCollection<DeviceEvent>>([]);
        }

        var snapshot = _buffer.Reverse().Take(take).Reverse().ToArray();
        return Task.FromResult<IReadOnlyCollection<DeviceEvent>>(snapshot);
    }

    public void Publish(DeviceEvent deviceEvent) => _ = IngestAsync(deviceEvent, CancellationToken.None);

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
                    var result = await sdkClient.PullEventsAsync(deviceIds, stoppingToken);
                    var unreachableSet = result.UnreachableDeviceIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
                    var successIds = deviceIds.Where(id => !unreachableSet.Contains(id)).ToHashSet(StringComparer.OrdinalIgnoreCase);
                    foreach (var id in successIds)
                    {
                        _consecutiveFailures.TryRemove(id, out _);
                        await connectionManager.TouchHeartbeatAsync(id, DateTime.UtcNow, stoppingToken);
                    }
                    foreach (var rawEvent in result.Events)
                    {
                        await IngestAsync(MapEvent(rawEvent), stoppingToken);
                    }
                    foreach (var unreachableId in result.UnreachableDeviceIds)
                    {
                        var failCount = _consecutiveFailures.AddOrUpdate(unreachableId, 1, (_, c) => c + 1);
                        if (failCount >= FailuresBeforeDisconnect)
                        {
                            _consecutiveFailures.TryRemove(unreachableId, out _);
                            await connectionManager.DisconnectAsync(unreachableId, stoppingToken);
                            logger.LogInformation("Устройство {Identifier} отключено — {Count} подряд неудачных опросов", unreachableId, failCount);
                        }
                        else
                        {
                            logger.LogDebug("Устройство {Identifier} недоступно при опросе ({Count}/{Threshold})", unreachableId, failCount, FailuresBeforeDisconnect);
                        }
                    }
                }

                await connectionManager.MarkStaleConnectionsOfflineAsync(HeartbeatTimeout, stoppingToken);

                await TryReconnectOfflineDevicesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to pull device events from SDK.");
            }

            await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
        }
    }

    private async Task IngestAsync(DeviceEvent mapped, CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            mapped = await DeviceEventPersonEnricher.EnrichAsync(mapped, db, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Device event enrich failed for {Identifier}", mapped.DeviceIdentifier);
        }

        Enqueue(mapped);
        await EmitBroadcastAsync(mapped, cancellationToken);
    }

    private async Task EmitBroadcastAsync(DeviceEvent mapped, CancellationToken cancellationToken)
    {
        try
        {
            await activityBroadcaster.NotifyLiveEventAsync(mapped, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "LiveDeviceEvent broadcast failed for {Identifier}", mapped.DeviceIdentifier);
        }
    }

    private static DeviceEvent MapEvent(SdkDeviceEvent sdkEvent)
    {
        if (AcsEventMapper.TryParseAcsCode(sdkEvent.EventCode, out var major, out var minor))
        {
            var (type, summary) = AcsEventMapper.Classify(major, minor);
            return new DeviceEvent(sdkEvent.DeviceIdentifier, type, sdkEvent.OccurredUtc, sdkEvent.Payload, summary);
        }

        var legacyType = sdkEvent.EventCode.ToUpperInvariant() switch
        {
            "DOOR_OPENED" => DeviceEventType.DoorOpened,
            "ACCESS_GRANTED" => DeviceEventType.AccessGranted,
            "ACCESS_DENIED" => DeviceEventType.AccessDenied,
            "HEARTBEAT" => DeviceEventType.Heartbeat,
            _ => DeviceEventType.Unknown
        };

        return new DeviceEvent(sdkEvent.DeviceIdentifier, legacyType, sdkEvent.OccurredUtc, sdkEvent.Payload, null);
    }

    private void Enqueue(DeviceEvent deviceEvent)
    {
        _buffer.Enqueue(deviceEvent);
        while (_buffer.Count > MaxBufferSize)
        {
            _buffer.TryDequeue(out _);
        }
    }

    private DateTime _lastReconnectUtc = DateTime.MinValue;
    private bool _sdkUnavailableLogged;

    private async Task TryReconnectOfflineDevicesAsync(CancellationToken cancellationToken)
    {
        if (DateTime.UtcNow - _lastReconnectUtc < ReconnectInterval)
        {
            return;
        }

        _lastReconnectUtc = DateTime.UtcNow;
        var active = await connectionManager.GetActiveConnectionsAsync(cancellationToken);
        var activeIds = active.Select(x => x.DeviceIdentifier).ToHashSet(StringComparer.OrdinalIgnoreCase);

        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var offlineDevices = await dbContext.Devices
            .AsNoTracking()
            .Where(x => !activeIds.Contains(x.DeviceIdentifier))
            .OrderBy(x => x.Name)
            .Take(10)
            .ToListAsync(cancellationToken);

        foreach (var device in offlineDevices)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                await connectionManager.ConnectAsync(
                    device.DeviceIdentifier,
                    device.IpAddress,
                    device.Port,
                    device.Username,
                    device.Password,
                    cancellationToken);
                logger.LogDebug("Reconnected device {Identifier} ({Ip}:{Port})", device.DeviceIdentifier, device.IpAddress, device.Port);
            }
            catch (DllNotFoundException ex) when (!_sdkUnavailableLogged)
            {
                _sdkUnavailableLogged = true;
                logger.LogWarning("Hikvision SDK (hcnetsdk) не найден. Переподключение устройств отключено. Укажите Hikvision:SdkPath в appsettings или скопируйте DLL в папку приложения. {Message}", ex.Message);
                break;
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "Reconnect failed for {Identifier}", device.DeviceIdentifier);
            }
        }
    }
}
