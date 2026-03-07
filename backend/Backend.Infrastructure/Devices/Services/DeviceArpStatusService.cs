using System.Collections.Concurrent;
using Backend.Application.Devices;
using Backend.Infrastructure.Devices;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>
/// Проверка статуса устройств только через ARP. Статус в БД не хранится — только кэш и SignalR.
/// </summary>
public sealed class DeviceArpStatusService(
    IServiceScopeFactory scopeFactory,
    IDeviceStatusBroadcaster? statusBroadcaster,
    ILogger<DeviceArpStatusService> logger) : BackgroundService, IDeviceArpStatusService
{
    private readonly ConcurrentDictionary<string, (DeviceConnectivityStatus Status, DateTime LastSeenUtc)> _cache = new(StringComparer.OrdinalIgnoreCase);
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(5);
    private const int FailuresBeforeOffline = 2;

    public Task<DeviceRealtimeStatus?> GetStatusAsync(string deviceIdentifier, CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(deviceIdentifier, out var entry))
        {
            return Task.FromResult<DeviceRealtimeStatus?>(new DeviceRealtimeStatus(deviceIdentifier, entry.Status, entry.LastSeenUtc));
        }
        return Task.FromResult<DeviceRealtimeStatus?>(null);
    }

    public Task<IReadOnlyCollection<DeviceRealtimeStatus>> GetStatusesAsync(CancellationToken cancellationToken = default)
    {
        var statuses = _cache
            .Select(kv => new DeviceRealtimeStatus(kv.Key, kv.Value.Status, kv.Value.LastSeenUtc))
            .ToArray();
        return Task.FromResult<IReadOnlyCollection<DeviceRealtimeStatus>>(statuses);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!OperatingSystem.IsWindows())
        {
            logger.LogWarning("DeviceArpStatusService: ARP доступен только на Windows. Статус устройств не обновляется.");
            return;
        }

        logger.LogInformation("DeviceArpStatusService started (ARP-only status check).");

        var consecutiveFailures = new ConcurrentDictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var devices = await dbContext.Devices
                    .AsNoTracking()
                    .Select(x => new { x.DeviceIdentifier, x.IpAddress, x.Id })
                    .ToListAsync(stoppingToken);

                foreach (var device in devices)
                {
                    stoppingToken.ThrowIfCancellationRequested();

                    if (string.IsNullOrWhiteSpace(device.IpAddress))
                    {
                        continue;
                    }

                    var reachable = ArpReachabilityHelper.IsReachable(device.IpAddress);

                    if (reachable)
                    {
                        consecutiveFailures.TryRemove(device.DeviceIdentifier, out _);
                        var now = DateTime.UtcNow;
                        var wasOffline = !_cache.TryGetValue(device.DeviceIdentifier, out var prev) || prev.Status == DeviceConnectivityStatus.Disconnected;
                        _cache[device.DeviceIdentifier] = (DeviceConnectivityStatus.Connected, now);
                        if (wasOffline) NotifyStatusChanged(device.DeviceIdentifier, device.Id, true, now);
                    }
                    else
                    {
                        var failCount = consecutiveFailures.AddOrUpdate(device.DeviceIdentifier, 1, (_, c) => c + 1);
                        if (failCount >= FailuresBeforeOffline)
                        {
                            consecutiveFailures.TryRemove(device.DeviceIdentifier, out _);
                            var wasOnline = _cache.TryGetValue(device.DeviceIdentifier, out var prev) && prev.Status == DeviceConnectivityStatus.Connected;
                            _cache[device.DeviceIdentifier] = (DeviceConnectivityStatus.Disconnected, default);
                            if (wasOnline) NotifyStatusChanged(device.DeviceIdentifier, device.Id, false, null);
                        }
                    }
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "DeviceArpStatusService: ошибка при ARP-проверке");
            }

            await Task.Delay(PollInterval, stoppingToken);
        }
    }

    private void NotifyStatusChanged(string deviceIdentifier, Guid deviceId, bool online, DateTime? lastSeenUtc)
    {
        var statusStr = online ? "Online" : "Offline";
        if (statusBroadcaster is not null)
        {
            _ = statusBroadcaster.NotifyStatusChangedAsync(deviceId, deviceIdentifier, statusStr, lastSeenUtc, CancellationToken.None);
        }
    }
}
