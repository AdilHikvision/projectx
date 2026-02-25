using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.System;

public sealed record DatabaseHealthStatus(
    bool IsConnected,
    double? LatencyMs,
    string Message);

public sealed record SystemStatusSnapshot(
    string ServerStatus,
    ManagedServiceStatus Service,
    DatabaseHealthStatus Database,
    DateTime Utc);

public interface ISystemStatusService
{
    Task<SystemStatusSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default);
    Task<DatabaseHealthStatus> GetDatabaseHealthAsync(CancellationToken cancellationToken = default);
}

public sealed class SystemStatusService(
    AppDbContext dbContext,
    IServiceControlManager serviceControlManager) : ISystemStatusService
{
    public async Task<SystemStatusSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default)
    {
        var dbHealth = await GetDatabaseHealthAsync(cancellationToken);
        var serviceStatus = await serviceControlManager.GetStatusAsync(cancellationToken);

        return new SystemStatusSnapshot(
            "Running",
            serviceStatus,
            dbHealth,
            DateTime.UtcNow);
    }

    public async Task<DatabaseHealthStatus> GetDatabaseHealthAsync(CancellationToken cancellationToken = default)
    {
        var startedAt = DateTime.UtcNow;
        try
        {
            var connected = await dbContext.Database.CanConnectAsync(cancellationToken);
            if (!connected)
            {
                return new DatabaseHealthStatus(false, null, "Database is unreachable.");
            }

            // Fast query to include round-trip timing in health response.
            await dbContext.Database.ExecuteSqlRawAsync("SELECT 1", cancellationToken);
            var latencyMs = (DateTime.UtcNow - startedAt).TotalMilliseconds;
            return new DatabaseHealthStatus(true, latencyMs, "Database connection is healthy.");
        }
        catch (Exception ex)
        {
            return new DatabaseHealthStatus(false, null, $"Database check failed: {ex.Message}");
        }
    }
}
