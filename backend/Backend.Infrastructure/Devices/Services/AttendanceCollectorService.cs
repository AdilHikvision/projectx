using Backend.Application.Devices;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>
/// Фоновый сервис: каждые N минут опрашивает все активные устройства через ISAPI
/// AcsEvent/Search и записывает новые события прихода/ухода в attendance_records.
/// </summary>
public sealed class AttendanceCollectorService(
    IServiceScopeFactory scopeFactory,
    ILogger<AttendanceCollectorService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AttendanceCollectorService started, poll interval {Interval}.", PollInterval);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var sync = scope.ServiceProvider.GetRequiredService<IAttendanceLogSyncService>();
                var from = DateTime.UtcNow.AddMinutes(-(PollInterval.TotalMinutes + 2));
                var to = DateTime.UtcNow;
                var result = await sync.SyncAllDevicesAsync(from, to, stoppingToken);
                if (result.RecordsAdded > 0)
                    logger.LogInformation("AttendanceCollector: добавлено записей: {Count}.", result.RecordsAdded);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "AttendanceCollectorService: ошибка цикла опроса.");
            }
            await Task.Delay(PollInterval, stoppingToken);
        }
    }
}
