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

        // AddCardsFacesFingerprints: EmployeeNo и таблицы cards/faces/fingerprints
        await dbContext.Database.ExecuteSqlRawAsync("""
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS "EmployeeNo" character varying(32)
            """, cancellationToken);

        // AddEmployeeGenderValid: Gender, ValidFromUtc, ValidToUtc
        await dbContext.Database.ExecuteSqlRawAsync("""
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS "Gender" character varying(16)
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS "ValidFromUtc" timestamp with time zone
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS "ValidToUtc" timestamp with time zone
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_employees_EmployeeNo" ON employees ("EmployeeNo") WHERE "EmployeeNo" IS NOT NULL
            """, cancellationToken);

        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS cards (
                "Id" uuid NOT NULL PRIMARY KEY,
                "EmployeeId" uuid REFERENCES employees("Id") ON DELETE CASCADE,
                "VisitorId" uuid REFERENCES visitors("Id") ON DELETE CASCADE,
                "CardNo" character varying(64) NOT NULL,
                "CardNumber" character varying(120),
                "CreatedUtc" timestamp with time zone NOT NULL,
                "UpdatedUtc" timestamp with time zone,
                CONSTRAINT "CK_Cards_Owner" CHECK (("EmployeeId" IS NOT NULL AND "VisitorId" IS NULL) OR ("EmployeeId" IS NULL AND "VisitorId" IS NOT NULL))
            )
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_cards_CardNo" ON cards ("CardNo")
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE INDEX IF NOT EXISTS "IX_cards_EmployeeId" ON cards ("EmployeeId")
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE INDEX IF NOT EXISTS "IX_cards_VisitorId" ON cards ("VisitorId")
            """, cancellationToken);

        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS faces (
                "Id" uuid NOT NULL PRIMARY KEY,
                "EmployeeId" uuid REFERENCES employees("Id") ON DELETE CASCADE,
                "VisitorId" uuid REFERENCES visitors("Id") ON DELETE CASCADE,
                "FilePath" character varying(500) NOT NULL,
                "FDID" integer NOT NULL DEFAULT 1,
                "CreatedUtc" timestamp with time zone NOT NULL,
                "UpdatedUtc" timestamp with time zone,
                CONSTRAINT "CK_Faces_Owner" CHECK (("EmployeeId" IS NOT NULL AND "VisitorId" IS NULL) OR ("EmployeeId" IS NULL AND "VisitorId" IS NOT NULL))
            )
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE INDEX IF NOT EXISTS "IX_faces_EmployeeId" ON faces ("EmployeeId")
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE INDEX IF NOT EXISTS "IX_faces_VisitorId" ON faces ("VisitorId")
            """, cancellationToken);

        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS fingerprints (
                "Id" uuid NOT NULL PRIMARY KEY,
                "EmployeeId" uuid REFERENCES employees("Id") ON DELETE CASCADE,
                "VisitorId" uuid REFERENCES visitors("Id") ON DELETE CASCADE,
                "TemplateData" bytea NOT NULL,
                "FingerIndex" integer NOT NULL DEFAULT 1,
                "CreatedUtc" timestamp with time zone NOT NULL,
                "UpdatedUtc" timestamp with time zone,
                CONSTRAINT "CK_Fingerprints_Owner" CHECK (("EmployeeId" IS NOT NULL AND "VisitorId" IS NULL) OR ("EmployeeId" IS NULL AND "VisitorId" IS NOT NULL))
            )
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE INDEX IF NOT EXISTS "IX_fingerprints_EmployeeId" ON fingerprints ("EmployeeId")
            """, cancellationToken);
        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE INDEX IF NOT EXISTS "IX_fingerprints_VisitorId" ON fingerprints ("VisitorId")
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
        if (!string.IsNullOrWhiteSpace(admin.Password))
        {
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
                LastName = admin.LastName,
                RequiresPasswordSetup = false
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
        else
        {
            logger.LogInformation("SeedAdmin password is empty. First admin will be created via setup page with user-provided email.");
        }
    }
}
