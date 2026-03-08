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

        // One-time: add columns if missing (migrations may not have been applied in order)
        await dbContext.Database.ExecuteSqlRawAsync("""
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS "DeviceIdentifier" character varying(120) DEFAULT ''
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS "LastSeenUtc" timestamp with time zone
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS "Username" character varying(64)
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS "Password" character varying(120)
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            UPDATE devices SET "DeviceIdentifier" = 'device-' || REPLACE(CAST("Id" AS text), '-', '') WHERE "DeviceIdentifier" IS NULL OR "DeviceIdentifier" = ''
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_devices_DeviceIdentifier" ON devices ("DeviceIdentifier")
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
        if (string.IsNullOrWhiteSpace(admin.Email))
        {
            logger.LogWarning("SeedAdmin email is missing. Admin user was not created.");
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

        string password;
        bool requiresSetup;
        if (string.IsNullOrWhiteSpace(admin.Password))
        {
            password = "TempSetup_" + Guid.NewGuid().ToString("N")[..16] + "!";
            requiresSetup = true;
            logger.LogInformation("SeedAdmin password is missing. Admin created with temporary password; user must set password on first launch.");
        }
        else
        {
            password = admin.Password;
            requiresSetup = false;
        }

        user.RequiresPasswordSetup = requiresSetup;

        var createResult = await userManager.CreateAsync(user, password);
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
