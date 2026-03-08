using Microsoft.AspNetCore.Identity;

namespace Backend.Infrastructure.Identity;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    /// <summary>При первом запуске, если admin создан без пароля — требуется задать пароль.</summary>
    public bool RequiresPasswordSetup { get; set; }
}
