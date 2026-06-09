public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default);
    Task<bool> TestConnectionAsync(string to, CancellationToken cancellationToken = default);
}
