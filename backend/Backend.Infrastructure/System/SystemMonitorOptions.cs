namespace Backend.Infrastructure.System;

public sealed class SystemMonitorOptions
{
    public const string SectionName = "SystemMonitor";

    public string ServiceName { get; set; } = "ProjectXBackend";
    public string? LocalControlKey { get; set; }
}
