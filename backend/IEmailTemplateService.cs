public record EmailTemplateDto(
    string Key,
    string Name,
    string Description,
    string Subject,
    string HtmlBody,
    string[] Variables,
    bool IsCustomized);

public interface IEmailTemplateService
{
    Task<List<EmailTemplateDto>> GetAllAsync(CancellationToken ct = default);
    Task<EmailTemplateDto> GetAsync(string key, CancellationToken ct = default);
    Task SaveAsync(string key, string subject, string htmlBody, CancellationToken ct = default);
    Task ResetAsync(string key, CancellationToken ct = default);
    Task<(string Subject, string Body)> RenderAsync(string key, Dictionary<string, string> variables, CancellationToken ct = default);
    (string Subject, string Body) GetDefault(string key);
    bool Exists(string key);
}
