using Microsoft.Extensions.Options;
using System.ServiceProcess;

namespace Backend.Infrastructure.System;

public sealed class WindowsServiceControlManager(IOptions<SystemMonitorOptions> options) : IServiceControlManager
{
    private readonly string _serviceName = options.Value.ServiceName;
    private readonly IReadOnlyDictionary<string, ManagedServiceDefinition> _managedServices =
        options.Value.ManagedServices
            .Where(x => !string.IsNullOrWhiteSpace(x.Key) && !string.IsNullOrWhiteSpace(x.ServiceName))
            .ToDictionary(x => x.Key, StringComparer.OrdinalIgnoreCase);

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
            return Task.FromResult(MapStatus(_serviceName, controller.Status, "Service status resolved."));
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
            _serviceName,
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
            _serviceName,
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
            _serviceName,
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

    public async Task<IReadOnlyCollection<ManagedServiceOverview>> GetManagedServicesAsync(CancellationToken cancellationToken = default)
    {
        var statuses = new List<ManagedServiceOverview>();
        foreach (var definition in _managedServices.Values)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var status = await GetStatusByServiceNameAsync(definition.ServiceName, cancellationToken);
            statuses.Add(new ManagedServiceOverview(
                definition.Key,
                definition.ServiceName,
                string.IsNullOrWhiteSpace(definition.DisplayName) ? definition.ServiceName : definition.DisplayName,
                definition.Port,
                definition.IsControllable,
                status.State,
                status.Message));
        }

        return statuses;
    }

    public async Task<ServiceControlResult> ControlByKeyAsync(string key, string action, CancellationToken cancellationToken = default)
    {
        if (!_managedServices.TryGetValue(key, out var definition))
        {
            return new ServiceControlResult(
                false,
                new ManagedServiceStatus(key, ManagedServiceState.Unknown, "Managed service key was not found."));
        }

        if (!definition.IsControllable)
        {
            return new ServiceControlResult(
                false,
                new ManagedServiceStatus(definition.ServiceName, ManagedServiceState.Unknown, "Service is read-only."));
        }

        var operation = action.ToLowerInvariant();
        ManagedServiceStatus status = operation switch
        {
            "start" => await ExecuteAsync(definition.ServiceName, StartService, "Service started.", cancellationToken),
            "stop" => await ExecuteAsync(definition.ServiceName, StopService, "Service stopped.", cancellationToken),
            "restart" => await ExecuteAsync(definition.ServiceName, RestartService, "Service restarted.", cancellationToken),
            _ => new ManagedServiceStatus(definition.ServiceName, ManagedServiceState.Unknown, "Unknown action.")
        };

        var success = operation switch
        {
            "start" => status.State == ManagedServiceState.Running,
            "stop" => status.State == ManagedServiceState.Stopped,
            "restart" => status.State == ManagedServiceState.Running,
            _ => false
        };

        return new ServiceControlResult(success, status);
    }

    public async Task<IReadOnlyCollection<ServiceControlResult>> ControlAllAsync(string action, CancellationToken cancellationToken = default)
    {
        var results = new List<ServiceControlResult>();
        foreach (var definition in _managedServices.Values.Where(x => x.IsControllable))
        {
            cancellationToken.ThrowIfCancellationRequested();
            results.Add(await ControlByKeyAsync(definition.Key, action, cancellationToken));
        }

        return results;
    }

    private Task<ManagedServiceStatus> ExecuteAsync(
        string serviceName,
        Action<ServiceController> action,
        string successMessage,
        CancellationToken cancellationToken)
    {
        if (!OperatingSystem.IsWindows())
        {
            return Task.FromResult(new ManagedServiceStatus(
                serviceName,
                ManagedServiceState.UnsupportedPlatform,
                "Service control is available only on Windows."));
        }

        cancellationToken.ThrowIfCancellationRequested();

        try
        {
            using var controller = new ServiceController(serviceName);
            _ = controller.Status;
            action(controller);
            controller.Refresh();
            return Task.FromResult(MapStatus(serviceName, controller.Status, successMessage));
        }
        catch (InvalidOperationException)
        {
            return Task.FromResult(new ManagedServiceStatus(
                serviceName,
                ManagedServiceState.NotInstalled,
                "Service is not installed."));
        }
        catch (Exception ex)
        {
            return Task.FromResult(new ManagedServiceStatus(
                serviceName,
                ManagedServiceState.Unknown,
                $"Service operation failed: {ex.Message}"));
        }
    }

    private Task<ManagedServiceStatus> GetStatusByServiceNameAsync(string serviceName, CancellationToken cancellationToken = default)
    {
        if (!OperatingSystem.IsWindows())
        {
            return Task.FromResult(new ManagedServiceStatus(
                serviceName,
                ManagedServiceState.UnsupportedPlatform,
                "Service control is available only on Windows."));
        }

        cancellationToken.ThrowIfCancellationRequested();
        try
        {
            using var controller = new ServiceController(serviceName);
            _ = controller.Status;
            return Task.FromResult(MapStatus(serviceName, controller.Status, "Service status resolved."));
        }
        catch (InvalidOperationException)
        {
            return Task.FromResult(new ManagedServiceStatus(
                serviceName,
                ManagedServiceState.NotInstalled,
                "Service is not installed."));
        }
    }

    private static void StartService(ServiceController controller)
    {
        if (controller.Status is ServiceControllerStatus.Running or ServiceControllerStatus.StartPending)
        {
            return;
        }

        controller.Start();
        controller.WaitForStatus(ServiceControllerStatus.Running, TimeSpan.FromSeconds(20));
    }

    private static void StopService(ServiceController controller)
    {
        if (controller.Status is ServiceControllerStatus.Stopped or ServiceControllerStatus.StopPending)
        {
            return;
        }

        controller.Stop();
        controller.WaitForStatus(ServiceControllerStatus.Stopped, TimeSpan.FromSeconds(20));
    }

    private static void RestartService(ServiceController controller)
    {
        if (controller.Status != ServiceControllerStatus.Stopped)
        {
            controller.Stop();
            controller.WaitForStatus(ServiceControllerStatus.Stopped, TimeSpan.FromSeconds(20));
        }

        controller.Start();
        controller.WaitForStatus(ServiceControllerStatus.Running, TimeSpan.FromSeconds(20));
    }

    private static ManagedServiceStatus MapStatus(string serviceName, ServiceControllerStatus status, string message)
    {
        var mapped = status switch
        {
            ServiceControllerStatus.Running => ManagedServiceState.Running,
            ServiceControllerStatus.Stopped => ManagedServiceState.Stopped,
            ServiceControllerStatus.StartPending => ManagedServiceState.StartPending,
            ServiceControllerStatus.StopPending => ManagedServiceState.StopPending,
            _ => ManagedServiceState.Unknown
        };

        return new ManagedServiceStatus(serviceName, mapped, message);
    }
}
