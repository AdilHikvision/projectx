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
/// Проверка статуса устройств: ARP + проверка логина/пароля через ISAPI.
/// </summary>
public sealed class DeviceArpStatusService(
    IServiceScopeFactory scopeFactory,
    IDeviceStatusBroadcaster? statusBroadcaster,
    ILogger<DeviceArpStatusService> logger) : BackgroundService, IDeviceArpStatusService
{
    private readonly ConcurrentDictionary<string, (DeviceConnectivityStatus Status, DateTime? LastSeenUtc, string? Message)> _cache = new(StringComparer.OrdinalIgnoreCase);
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(5);
    private const int FailuresBeforeOffline = 2;

    public Task<DeviceRealtimeStatus?> GetStatusAsync(string deviceIdentifier, CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(deviceIdentifier, out var entry))
        {
            return Task.FromResult<DeviceRealtimeStatus?>(new DeviceRealtimeStatus(deviceIdentifier, entry.Status, entry.LastSeenUtc, entry.Message));
        }
        return Task.FromResult<DeviceRealtimeStatus?>(null);
    }

    public Task<IReadOnlyCollection<DeviceRealtimeStatus>> GetStatusesAsync(CancellationToken cancellationToken = default)
    {
        var statuses = _cache
            .Select(kv => new DeviceRealtimeStatus(kv.Key, kv.Value.Status, kv.Value.LastSeenUtc, kv.Value.Message))
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
                    .Select(x => new { x.DeviceIdentifier, x.IpAddress, x.Port, x.Username, x.Password, x.Id })
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
                        var username = string.IsNullOrWhiteSpace(device.Username) ? "admin" : device.Username;
                        var password = device.Password ?? "";
                        var (credValid, credMessage) = await DeviceCredentialVerifier.VerifyAsync(
                            device.IpAddress,
                            device.Port,
                            username,
                            password,
                            stoppingToken);

                        if (credValid)
                        {
                            consecutiveFailures.TryRemove(device.DeviceIdentifier, out _);
                            var now = DateTime.UtcNow;
                            var wasOffline = !_cache.TryGetValue(device.DeviceIdentifier, out var prev) || prev.Status == DeviceConnectivityStatus.Disconnected;
                            _cache[device.DeviceIdentifier] = (DeviceConnectivityStatus.Connected, now, null);
                            if (wasOffline) NotifyStatusChanged(device.DeviceIdentifier, device.Id, true, now, null);
                        }
                        else
                        {
                            consecutiveFailures.TryRemove(device.DeviceIdentifier, out _);
                            var wasOnline = _cache.TryGetValue(device.DeviceIdentifier, out var prev) && prev.Status == DeviceConnectivityStatus.Connected;
                            var msg = credMessage ?? "Неверный логин или пароль.";
                            _cache[device.DeviceIdentifier] = (DeviceConnectivityStatus.Disconnected, default, msg);
                            if (wasOnline) NotifyStatusChanged(device.DeviceIdentifier, device.Id, false, null, msg);
                        }
                    }
                    else
                    {
                        var failCount = consecutiveFailures.AddOrUpdate(device.DeviceIdentifier, 1, (_, c) => c + 1);
                        if (failCount >= FailuresBeforeOffline)
                        {
                            consecutiveFailures.TryRemove(device.DeviceIdentifier, out _);
                            var wasOnline = _cache.TryGetValue(device.DeviceIdentifier, out var prev) && prev.Status == DeviceConnectivityStatus.Connected;
                            var msg = "Сеть недоступна";
                            _cache[device.DeviceIdentifier] = (DeviceConnectivityStatus.Disconnected, default, msg);
                            if (wasOnline) NotifyStatusChanged(device.DeviceIdentifier, device.Id, false, null, msg);
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

    private void NotifyStatusChanged(string deviceIdentifier, Guid deviceId, bool online, DateTime? lastSeenUtc, string? statusMessage)
    {
        var statusStr = online ? "Online" : "Offline";
        if (statusBroadcaster is not null)
        {
            _ = statusBroadcaster.NotifyStatusChangedAsync(deviceId, deviceIdentifier, statusStr, lastSeenUtc, statusMessage, CancellationToken.None);
        }
    }
}
