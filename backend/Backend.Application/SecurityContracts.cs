namespace Backend.Application.Security;

public static class SystemRoles
{
    public const string Admin = "Admin";
    public const string SecurityOperator = "SecurityOperator";
    public const string HrOperator = "HrOperator";

    public static IReadOnlyCollection<string> All => [Admin, SecurityOperator, HrOperator];
}

public sealed class JwtOptions
{
    public string Issuer { get; init; } = "projectx-api";
    public string Audience { get; init; } = "projectx-client";
    public string Key { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 60;
}

public sealed class SeedAdminOptions
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string FirstName { get; init; } = "System";
    public string LastName { get; init; } = "Admin";
}

public interface IJwtTokenService
{
    string CreateToken(Guid userId, string userName, string email, IReadOnlyCollection<string> roles);
}

public interface IDatabaseInitializer
{
    Task InitializeAsync(CancellationToken cancellationToken = default);
}
