namespace Backend.Infrastructure.System;

public sealed class SystemMonitorOptions
{
    public const string SectionName = "SystemMonitor";

    public string ServiceName { get; set; } = "ProjectXBackend";
    public string? LocalControlKey { get; set; }
    public List<ManagedServiceDefinition> ManagedServices { get; set; } =
    [
        new ManagedServiceDefinition
        {
            Key = "backend",
            ServiceName = "ProjectXBackend",
            DisplayName = "ProjectX Backend Service",
            Port = "5055",
            IsControllable = true
        },
        new ManagedServiceDefinition
        {
            Key = "postgres",
            ServiceName = "postgresql-x64-16",
            DisplayName = "PostgreSQL",
            Port = "5432",
            IsControllable = true
        }
    ];
}

public sealed class ManagedServiceDefinition
{
    public string Key { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Port { get; set; }
    public bool IsControllable { get; set; } = true;
}
