using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using Backend.Application.Devices;
using Backend.Domain.Entities;
using Backend.Infrastructure.Devices;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

public sealed class EventListenerService(
    IDeviceConnectionManager connectionManager,
    IServiceScopeFactory scopeFactory,
    IDeviceActivityBroadcaster activityBroadcaster,
    ILogger<EventListenerService> logger) : BackgroundService, IEventListenerService
{
    private readonly ConcurrentQueue<DeviceEvent> _buffer = new();
    private const int MaxBufferSize = 1000;

    // Sliding-window deduplication. We now run TWO push channels in parallel
    // (IsapiAlertStreamService + IsapiSubscribeEventService) because some Hikvision
    // firmwares are silent on one or the other. A device that's chatty on both will emit
    // identical events through both pipes — we keep only the first.
    //
    // Key: deviceIdentifier|eventTypeInt|occurredUtcTicks|payloadHash
    // Value: UTC timestamp the dedup entry was created (used for TTL eviction).
    private readonly ConcurrentDictionary<string, DateTime> _recentEventKeys = new(StringComparer.Ordinal);
    private static readonly TimeSpan DedupWindow = TimeSpan.FromSeconds(30);
    private const int DedupCacheSoftLimit = 2000;

    // Real-time events come from IsapiAlertStreamService and/or IsapiSubscribeEventService
    // (device-pushed via ISAPI /Event/notification/alertStream and /subscribeEvent).
    // EventListenerService no longer polls the device SDK on a 1-second timer — that was
    // the "downloading all logs" behaviour: it pulled a 20-minute backward AcsEvent window
    // every second and re-emitted everything. Now this service only owns the in-memory
    // buffer + dedup cache + reconnect/stale-mark housekeeping. The heartbeat timeout is
    // generous because push connections are long-lived and touched by both push services.
    private static readonly TimeSpan HeartbeatTimeout = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan ReconnectInterval = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan HousekeepingInterval = TimeSpan.FromSeconds(5);

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
        logger.LogInformation("EventListenerService started (push-only; alertStream + subscribeEvent are the real-time event sources).");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await connectionManager.MarkStaleConnectionsOfflineAsync(HeartbeatTimeout, stoppingToken);
                await TryReconnectOfflineDevicesAsync(stoppingToken);
                EvictExpiredDedupKeys();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "EventListenerService housekeeping failed.");
            }

            await Task.Delay(HousekeepingInterval, stoppingToken);
        }
    }

    private async Task IngestAsync(DeviceEvent mapped, CancellationToken cancellationToken)
    {
        // Dual push-channel dedup: skip if the same device emitted an identical event
        // (same type, same occurredUtc, same payload) within the last DedupWindow.
        // Heartbeats are also deduped — the two channels both heartbeat ~every 30s.
        var key = BuildDedupKey(mapped);
        var now = DateTime.UtcNow;
        if (_recentEventKeys.TryGetValue(key, out var seenAt) && now - seenAt < DedupWindow)
        {
            // Already published via the other channel; silently drop.
            return;
        }
        _recentEventKeys[key] = now;

        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            mapped = await DeviceEventPersonEnricher.EnrichAsync(mapped, db, cancellationToken);
            // Persist'а в attendance в realtime больше нет: T&A собирает только Log Sync
            // (manual или авто-расписание), пишет в device_auth_logs. Это нужно чтобы
            // повторный sync не дублировал и пользователь явно контролировал что попадает в отчёт.
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Device event enrich failed for {Identifier}", mapped.DeviceIdentifier);
        }

        Enqueue(mapped);
        await EmitBroadcastAsync(mapped, cancellationToken);
    }

private static string BuildDedupKey(DeviceEvent evt)
    {
        // Cheap stable hash of the payload's first 256 chars — collisions inside the same
        // device + same eventType + same occurredUtc would mean two truly distinct events
        // happened at the exact same instant, which we accept as a non-issue.
        var payload = evt.Payload ?? string.Empty;
        var snippet = payload.Length > 256 ? payload[..256] : payload;
        var hash = (uint)snippet.GetHashCode(StringComparison.Ordinal);
        return $"{evt.DeviceIdentifier}|{(int)evt.EventType}|{evt.OccurredUtc.Ticks}|{hash:x8}";
    }

    private void EvictExpiredDedupKeys()
    {
        if (_recentEventKeys.IsEmpty) return;

        var cutoff = DateTime.UtcNow - DedupWindow;
        foreach (var kv in _recentEventKeys)
        {
            if (kv.Value < cutoff)
                _recentEventKeys.TryRemove(kv.Key, out _);
        }

        // Hard cap: if traffic is so heavy that the cache grew past the soft limit even
        // after TTL eviction (unlikely but cheap to guard), drop the oldest entries.
        if (_recentEventKeys.Count > DedupCacheSoftLimit)
        {
            foreach (var kv in _recentEventKeys.OrderBy(x => x.Value).Take(_recentEventKeys.Count - DedupCacheSoftLimit))
                _recentEventKeys.TryRemove(kv.Key, out _);
        }
    }

    private async Task EmitBroadcastAsync(DeviceEvent mapped, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("SignalR LiveDeviceEvent → {Id} type={Type} occurred={Occurred:O}",
                mapped.DeviceIdentifier, mapped.EventType, mapped.OccurredUtc);
            await activityBroadcaster.NotifyLiveEventAsync(mapped, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "LiveDeviceEvent broadcast failed for {Identifier}", mapped.DeviceIdentifier);
        }
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
