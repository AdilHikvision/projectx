using Backend.Infrastructure.Security;

namespace Backend;

/// <summary>
/// Пишет аудит-лог для всех мутирующих запросов к /api/* после выполнения.
/// GET, /api/health, /api/audit-logs, /api/auth/login (логируется вручную с email),
/// /api/notifications и self-service исключены, чтобы не засорять журнал.
/// </summary>
public sealed class AuditLogMiddleware(RequestDelegate next, ILogger<AuditLogMiddleware> logger)
{
    private static readonly HashSet<string> MutatingMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "PATCH", "DELETE"
    };

    public async Task InvokeAsync(HttpContext context)
    {
        await next(context);

        try
        {
            var req = context.Request;
            if (!req.Path.HasValue) return;
            var path = req.Path.Value!;
            if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase)) return;
            if (!MutatingMethods.Contains(req.Method)) return;
            if (ShouldSkip(path)) return;

            var (category, action) = AuditPathClassifier.Classify(req.Method, path);
            if (category is null) return;

            var auditService = context.RequestServices.GetService<IAuditLogService>();
            if (auditService is null) return;

            var status = context.Response.StatusCode;
            var success = status < 400;
            var ip = context.Connection.RemoteIpAddress?.ToString();

            await auditService.LogAsync(
                category: category,
                action: action ?? $"{req.Method} {path}",
                method: req.Method,
                path: path,
                principal: context.User,
                ipAddress: ip,
                statusCode: status,
                description: null,
                success: success,
                cancellationToken: context.RequestAborted);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Audit middleware failed for {Method} {Path}", context.Request.Method, context.Request.Path);
        }
    }

    private static bool ShouldSkip(string path)
    {
        if (path.StartsWith("/api/health", StringComparison.OrdinalIgnoreCase)) return true;
        if (path.StartsWith("/api/audit-logs", StringComparison.OrdinalIgnoreCase)) return true;
        if (path.StartsWith("/api/auth/login", StringComparison.OrdinalIgnoreCase)) return true;
        if (path.StartsWith("/api/auth/me", StringComparison.OrdinalIgnoreCase)) return true;
        if (path.StartsWith("/api/notifications", StringComparison.OrdinalIgnoreCase)) return true;
        if (path.StartsWith("/api/self-service", StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }
}
