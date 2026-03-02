using Microsoft.Extensions.Options;

namespace Backend.Infrastructure.System;

public sealed class UnsupportedServiceControlManager(IOptions<SystemMonitorOptions> options) : IServiceControlManager
{
    private const string UnsupportedMessage = "Service control is available only on Windows.";

    private readonly string _serviceName = string.IsNullOrWhiteSpace(options.Value.ServiceName)
        ? "ProjectXBackend"
        : options.Value.ServiceName;

    private readonly IReadOnlyDictionary<string, ManagedServiceDefinition> _managedServices =
        options.Value.ManagedServices
            .Where(x => !string.IsNullOrWhiteSpace(x.Key) && !string.IsNullOrWhiteSpace(x.ServiceName))
            .GroupBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(x => x.Key, x => x.Last(), StringComparer.OrdinalIgnoreCase);

    public Task<ManagedServiceStatus> GetStatusAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new ManagedServiceStatus(_serviceName, ManagedServiceState.UnsupportedPlatform, UnsupportedMessage));

    public Task<IReadOnlyCollection<ManagedServiceOverview>> GetManagedServicesAsync(CancellationToken cancellationToken = default)
    {
        var statuses = _managedServices.Values
            .Select(definition => new ManagedServiceOverview(
                definition.Key,
                definition.ServiceName,
                string.IsNullOrWhiteSpace(definition.DisplayName) ? definition.ServiceName : definition.DisplayName,
                definition.Port,
                definition.IsControllable,
                ManagedServiceState.UnsupportedPlatform,
                UnsupportedMessage))
            .ToArray();

        return Task.FromResult<IReadOnlyCollection<ManagedServiceOverview>>(statuses);
    }

    public Task<ServiceControlResult> ControlByKeyAsync(string key, string action, CancellationToken cancellationToken = default) =>
        Task.FromResult(new ServiceControlResult(
            false,
            new ManagedServiceStatus(key, ManagedServiceState.UnsupportedPlatform, UnsupportedMessage)));

    public Task<IReadOnlyCollection<ServiceControlResult>> ControlAllAsync(string action, CancellationToken cancellationToken = default)
    {
        var results = _managedServices.Values
            .Select(definition => new ServiceControlResult(
                false,
                new ManagedServiceStatus(definition.ServiceName, ManagedServiceState.UnsupportedPlatform, UnsupportedMessage)))
            .ToArray();

        return Task.FromResult<IReadOnlyCollection<ServiceControlResult>>(results);
    }

    public Task<ServiceControlResult> StartAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new ServiceControlResult(
            false,
            new ManagedServiceStatus(_serviceName, ManagedServiceState.UnsupportedPlatform, UnsupportedMessage)));

    public Task<ServiceControlResult> StopAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new ServiceControlResult(
            false,
            new ManagedServiceStatus(_serviceName, ManagedServiceState.UnsupportedPlatform, UnsupportedMessage)));

    public Task<ServiceControlResult> RestartAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new ServiceControlResult(
            false,
            new ManagedServiceStatus(_serviceName, ManagedServiceState.UnsupportedPlatform, UnsupportedMessage)));
}
