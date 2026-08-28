public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default);
    Task<EmailTestResult> TestConnectionAsync(string to, SmtpTestOptions? options = null, CancellationToken cancellationToken = default);
}

public sealed record SmtpTestOptions(
    bool Enabled,
    string? Host,
    int Port,
    string? Username,
    string? Password,
    string? FromAddress,
    string? FromName,
    bool EnableSsl);

public sealed record EmailTestResult(bool Success, string? ErrorMessage = null);
