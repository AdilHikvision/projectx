using System.Security.Claims;
using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Security;

public interface IAuditLogService
{
    Task LogAsync(
        string category,
        string action,
        string method,
        string path,
        ClaimsPrincipal? principal,
        string? ipAddress,
        int? statusCode,
        string? description,
        bool success,
        CancellationToken cancellationToken = default);
}

public sealed class AuditLogService(AppDbContext dbContext, ILogger<AuditLogService> logger) : IAuditLogService
{
    public async Task LogAsync(
        string category,
        string action,
        string method,
        string path,
        ClaimsPrincipal? principal,
        string? ipAddress,
        int? statusCode,
        string? description,
        bool success,
        CancellationToken cancellationToken = default)
    {
        try
        {
            Guid? userId = null;
            string email = "";
            if (principal is not null)
            {
                var idStr = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
                if (Guid.TryParse(idStr, out var uid)) userId = uid;
                email = principal.FindFirstValue(ClaimTypes.Email) ?? principal.FindFirstValue("email") ?? "";
            }

            var entry = new AuditLogEntry
            {
                TimestampUtc = DateTime.UtcNow,
                UserId = userId,
                UserEmail = Truncate(email, 256),
                Category = Truncate(category, 64),
                Action = Truncate(action, 256),
                Method = Truncate(method, 16),
                Path = Truncate(path, 512),
                StatusCode = statusCode,
                IpAddress = Truncate(ipAddress, 64),
                Description = Truncate(description, 2000),
                Success = success
            };

            dbContext.AuditLogs.Add(entry);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to write audit log entry: {Category} {Action}", category, action);
        }
    }

    private static string Truncate(string? s, int max)
    {
        if (string.IsNullOrEmpty(s)) return s ?? "";
        return s.Length <= max ? s : s[..max];
    }
}
