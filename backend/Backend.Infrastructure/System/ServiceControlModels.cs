namespace Backend.Infrastructure.System;

public enum ManagedServiceState
{
    Unknown = 0,
    Running = 1,
    Stopped = 2,
    StartPending = 3,
    StopPending = 4,
    NotInstalled = 5,
    UnsupportedPlatform = 6
}

public sealed record ManagedServiceStatus(
    string ServiceName,
    ManagedServiceState State,
    string Message);

public sealed record ServiceControlResult(
    bool Success,
    ManagedServiceStatus Status);

public interface IServiceControlManager
{
    Task<ManagedServiceStatus> GetStatusAsync(CancellationToken cancellationToken = default);
    Task<ServiceControlResult> StartAsync(CancellationToken cancellationToken = default);
    Task<ServiceControlResult> StopAsync(CancellationToken cancellationToken = default);
    Task<ServiceControlResult> RestartAsync(CancellationToken cancellationToken = default);
}
