using Microsoft.Extensions.Options;
using System.ServiceProcess;

namespace Backend.Infrastructure.System;

public sealed class WindowsServiceControlManager(IOptions<SystemMonitorOptions> options) : IServiceControlManager
{
    private readonly string _serviceName = options.Value.ServiceName;

    public Task<ManagedServiceStatus> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        if (!OperatingSystem.IsWindows())
        {
            return Task.FromResult(new ManagedServiceStatus(
                _serviceName,
                ManagedServiceState.UnsupportedPlatform,
                "Service control is available only on Windows."));
        }

        try
        {
            using var controller = new ServiceController(_serviceName);
            _ = controller.Status;
            return Task.FromResult(MapStatus(controller.Status, "Service status resolved."));
        }
        catch (InvalidOperationException)
        {
            return Task.FromResult(new ManagedServiceStatus(
                _serviceName,
                ManagedServiceState.NotInstalled,
                "Service is not installed."));
        }
    }

    public async Task<ServiceControlResult> StartAsync(CancellationToken cancellationToken = default)
    {
        var status = await ExecuteAsync(
            action: controller =>
            {
                if (controller.Status is ServiceControllerStatus.Running or ServiceControllerStatus.StartPending)
                {
                    return;
                }

                controller.Start();
                controller.WaitForStatus(ServiceControllerStatus.Running, TimeSpan.FromSeconds(20));
            },
            successMessage: "Service started.",
            cancellationToken);

        return new ServiceControlResult(status.State == ManagedServiceState.Running, status);
    }

    public async Task<ServiceControlResult> StopAsync(CancellationToken cancellationToken = default)
    {
        var status = await ExecuteAsync(
            action: controller =>
            {
                if (controller.Status is ServiceControllerStatus.Stopped or ServiceControllerStatus.StopPending)
                {
                    return;
                }

                controller.Stop();
                controller.WaitForStatus(ServiceControllerStatus.Stopped, TimeSpan.FromSeconds(20));
            },
            successMessage: "Service stopped.",
            cancellationToken);

        return new ServiceControlResult(status.State == ManagedServiceState.Stopped, status);
    }

    public async Task<ServiceControlResult> RestartAsync(CancellationToken cancellationToken = default)
    {
        var status = await ExecuteAsync(
            action: controller =>
            {
                if (controller.Status != ServiceControllerStatus.Stopped)
                {
                    controller.Stop();
                    controller.WaitForStatus(ServiceControllerStatus.Stopped, TimeSpan.FromSeconds(20));
                }

                controller.Start();
                controller.WaitForStatus(ServiceControllerStatus.Running, TimeSpan.FromSeconds(20));
            },
            successMessage: "Service restarted.",
            cancellationToken);

        return new ServiceControlResult(status.State == ManagedServiceState.Running, status);
    }

    private Task<ManagedServiceStatus> ExecuteAsync(
        Action<ServiceController> action,
        string successMessage,
        CancellationToken cancellationToken)
    {
        if (!OperatingSystem.IsWindows())
        {
            return Task.FromResult(new ManagedServiceStatus(
                _serviceName,
                ManagedServiceState.UnsupportedPlatform,
                "Service control is available only on Windows."));
        }

        cancellationToken.ThrowIfCancellationRequested();

        try
        {
            using var controller = new ServiceController(_serviceName);
            _ = controller.Status;
            action(controller);
            controller.Refresh();
            return Task.FromResult(MapStatus(controller.Status, successMessage));
        }
        catch (InvalidOperationException)
        {
            return Task.FromResult(new ManagedServiceStatus(
                _serviceName,
                ManagedServiceState.NotInstalled,
                "Service is not installed."));
        }
        catch (Exception ex)
        {
            return Task.FromResult(new ManagedServiceStatus(
                _serviceName,
                ManagedServiceState.Unknown,
                $"Service operation failed: {ex.Message}"));
        }
    }

    private ManagedServiceStatus MapStatus(ServiceControllerStatus status, string message)
    {
        var mapped = status switch
        {
            ServiceControllerStatus.Running => ManagedServiceState.Running,
            ServiceControllerStatus.Stopped => ManagedServiceState.Stopped,
            ServiceControllerStatus.StartPending => ManagedServiceState.StartPending,
            ServiceControllerStatus.StopPending => ManagedServiceState.StopPending,
            _ => ManagedServiceState.Unknown
        };

        return new ManagedServiceStatus(_serviceName, mapped, message);
    }
}
