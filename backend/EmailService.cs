using System.Net;
using System.Net.Mail;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class EmailService(IServiceScopeFactory scopeFactory, ILogger<EmailService> logger) : IEmailService
{
    private async Task<SmtpSettings?> LoadSettingsAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var keys = new[] { "Smtp:Host", "Smtp:Port", "Smtp:Username", "Smtp:Password", "Smtp:FromAddress", "Smtp:FromName", "Smtp:EnableSsl", "Smtp:Enabled" };
        var rows = await db.SystemSettings.AsNoTracking().Where(x => keys.Contains(x.Key)).ToListAsync(ct);
        var map = rows.ToDictionary(x => x.Key, x => x.Value ?? "");

        if (!map.TryGetValue("Smtp:Enabled", out var enabled) || !string.Equals(enabled, "true", StringComparison.OrdinalIgnoreCase))
            return null;
        if (!map.TryGetValue("Smtp:Host", out var host) || string.IsNullOrWhiteSpace(host))
            return null;
        if (!map.TryGetValue("Smtp:FromAddress", out var fromAddr) || string.IsNullOrWhiteSpace(fromAddr))
            return null;

        return new SmtpSettings
        {
            Host = host,
            Port = int.TryParse(map.GetValueOrDefault("Smtp:Port"), out var p) ? p : 587,
            Username = map.GetValueOrDefault("Smtp:Username", ""),
            Password = map.GetValueOrDefault("Smtp:Password", ""),
            FromAddress = map.GetValueOrDefault("Smtp:FromAddress", ""),
            FromName = map.GetValueOrDefault("Smtp:FromName", "ProjectX"),
            EnableSsl = string.Equals(map.GetValueOrDefault("Smtp:EnableSsl", "true"), "true", StringComparison.OrdinalIgnoreCase)
        };
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var cfg = await LoadSettingsAsync(cancellationToken);
        if (cfg is null)
        {
            logger.LogWarning("SMTP not configured or disabled — skipping email to {To}", to);
            return;
        }

        try
        {
            using var client = BuildClient(cfg);
            using var msg = new MailMessage
            {
                From = new MailAddress(cfg.FromAddress, cfg.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            msg.To.Add(to);

            await client.SendMailAsync(msg, cancellationToken);
            logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {To}: {Subject}", to, subject);
            throw new InvalidOperationException($"Failed to send email: {ex.Message}", ex);
        }
    }

    public async Task<bool> TestConnectionAsync(string to, CancellationToken cancellationToken = default)
    {
        var cfg = await LoadSettingsAsync(cancellationToken);
        if (cfg is null) return false;
        try
        {
            using var client = BuildClient(cfg);
            using var msg = new MailMessage
            {
                From = new MailAddress(cfg.FromAddress, cfg.FromName),
                Subject = "ProjectX SMTP Test",
                Body = "<p>SMTP connection test successful.</p>",
                IsBodyHtml = true
            };
            msg.To.Add(to);
            await client.SendMailAsync(msg, cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "SMTP test failed");
            return false;
        }
    }

    private static SmtpClient BuildClient(SmtpSettings cfg)
    {
        var client = new SmtpClient(cfg.Host, cfg.Port)
        {
            EnableSsl = cfg.EnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network
        };
        if (!string.IsNullOrWhiteSpace(cfg.Username))
            client.Credentials = new NetworkCredential(cfg.Username, cfg.Password);
        return client;
    }

    private sealed class SmtpSettings
    {
        public string Host { get; init; } = "";
        public int Port { get; init; } = 587;
        public string Username { get; init; } = "";
        public string Password { get; init; } = "";
        public string FromAddress { get; init; } = "";
        public string FromName { get; init; } = "ProjectX";
        public bool EnableSsl { get; init; } = true;
    }
}
