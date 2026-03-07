using Backend.Application.Security;
using Backend.Infrastructure.Identity;
using Backend.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Backend.Infrastructure.Initialization;

public sealed class DatabaseInitializer(
    AppDbContext dbContext,
    RoleManager<IdentityRole<Guid>> roleManager,
    UserManager<ApplicationUser> userManager,
    IOptions<SeedAdminOptions> seedAdminOptions,
    ILogger<DatabaseInitializer> logger) : IDatabaseInitializer
{
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.Database.MigrateAsync(cancellationToken);

        // One-time: add Username/Password columns if missing (migration may not have been applied)
        await dbContext.Database.ExecuteSqlRawAsync("""
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS "Username" character varying(64)
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS "Password" character varying(120)
            """, cancellationToken);

        foreach (var role in SystemRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
            }
        }

        if (await userManager.Users.AnyAsync(cancellationToken))
        {
            return;
        }

        var admin = seedAdminOptions.Value;
        if (string.IsNullOrWhiteSpace(admin.Email) || string.IsNullOrWhiteSpace(admin.Password))
        {
            logger.LogWarning("SeedAdmin credentials are missing. Admin user was not created.");
            return;
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = admin.Email,
            Email = admin.Email,
            EmailConfirmed = true,
            FirstName = admin.FirstName,
            LastName = admin.LastName
        };

        var createResult = await userManager.CreateAsync(user, admin.Password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(x => x.Description));
            logger.LogError("Failed to create seed admin user: {Errors}", errors);
            return;
        }

        await userManager.AddToRoleAsync(user, SystemRoles.Admin);
        logger.LogInformation("Seed admin user created with email {Email}", admin.Email);
    }
}
