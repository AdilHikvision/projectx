using System.Globalization;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;
using Npgsql;
using Backend.Application.Security;
using Backend.Application.Devices;
using Backend.Application.Gym;
using Backend.Domain.Entities;
using Backend.Infrastructure;
using Backend.Infrastructure.Devices;
using Backend.Infrastructure.Devices.Sdk;
using Backend;
using Backend.Infrastructure.Identity;
using Backend.Infrastructure.Persistence;
using Backend.Infrastructure.Security;
using Backend.Infrastructure.System;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Options;
using Serilog;
using QuestPDF.Infrastructure;

QuestPDF.Settings.License = LicenseType.Community;

// Подхватить backend/.env в переменные окружения до загрузки конфигурации (Database__Password и т.д.).
foreach (var baseDir in new[]
         {
             Directory.GetCurrentDirectory(),
             Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..")),
             AppContext.BaseDirectory
         })
{
    var envPath = Path.Combine(baseDir, ".env");
    if (!File.Exists(envPath)) continue;
    foreach (var rawLine in File.ReadAllLines(envPath))
    {
        var line = rawLine.Trim();
        if (line.Length == 0 || line.StartsWith('#')) continue;
        var eq = line.IndexOf('=');
        if (eq <= 0) continue;
        var key = line[..eq].Trim();
        var value = line[(eq + 1)..].Trim();
        if (value.StartsWith('"') && value.EndsWith('"') && value.Length >= 2) value = value[1..^1];
        if (key.Length > 0) Environment.SetEnvironmentVariable(key, value);
    }
    break;
}

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseWindowsService(options =>
{
    options.ServiceName = builder.Configuration[$"{SystemMonitorOptions.SectionName}:ServiceName"] ?? "ProjectXBackend";
});

builder.Host.UseSerilog((context, loggerConfiguration) =>
{
    loggerConfiguration.ReadFrom.Configuration(context.Configuration);
});

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddSignalR().AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});
builder.Services.AddSingleton<IDeviceStatusBroadcaster, DeviceStatusBroadcaster>();
builder.Services.AddSingleton<IDeviceActivityBroadcaster, DeviceActivityBroadcaster>();
builder.Services.AddSingleton<INotificationService, NotificationService>();
builder.Services.AddSingleton<IEmailService, EmailService>();
builder.Services.AddSingleton<IEmailTemplateService, EmailTemplateService>();
builder.Services.AddHostedService<DailyReportNotificationService>();
builder.Services.AddInfrastructure(builder.Configuration);

var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
    ?? throw new InvalidOperationException("Jwt configuration is missing.");

if (string.IsNullOrWhiteSpace(jwtOptions.Key))
{
    throw new InvalidOperationException("Jwt:Key must be configured.");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = signingKey
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<IDatabaseInitializer>();
    await initializer.InitializeAsync();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseSerilogRequestLogging();
app.UseCors();
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<AuditLogMiddleware>();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapHub<DevicesHub>("/hubs/devices").AllowAnonymous();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", utc = DateTime.UtcNow }));
app.MapGet("/api/health/db", async (ISystemStatusService systemStatusService, CancellationToken cancellationToken) =>
{
    var dbHealth = await systemStatusService.GetDatabaseHealthAsync(cancellationToken);
    return Results.Ok(dbHealth);
});
app.MapGet("/api/health/sdk", (HikvisionSdkClient sdkClient) =>
{
    var health = sdkClient.GetHealth();
    return Results.Ok(health);
});

app.MapPost("/api/auth/register", async (
    RegisterRequest request,
    HttpContext httpContext,
    UserManager<ApplicationUser> userManager,
    CancellationToken cancellationToken) =>
{
    var hasUsers = await userManager.Users.AnyAsync(cancellationToken);
    var isAdmin = httpContext.User.IsInRole(SystemRoles.Admin);

    if (!hasUsers)
    {
        return Results.BadRequest(new { message = "Complete initial setup first (Initial Setup page) to create the administrator account." });
    }

    if (hasUsers && !isAdmin)
    {
        return Results.Forbid();
    }

    var requestedRole = hasUsers
        ? request.Role ?? SystemRoles.SecurityOperator
        : SystemRoles.Admin;

    if (!SystemRoles.All.Contains(requestedRole))
    {
        return Results.BadRequest(new { message = $"Unknown role: {requestedRole}" });
    }

    var userExists = await userManager.FindByEmailAsync(request.Email);
    if (userExists is not null)
    {
        return Results.Conflict(new { message = "User already exists." });
    }

    var user = new ApplicationUser
    {
        Id = Guid.NewGuid(),
        UserName = request.Email,
        Email = request.Email,
        EmailConfirmed = true,
        FirstName = request.FirstName,
        LastName = request.LastName
    };

    var result = await userManager.CreateAsync(user, request.Password);
    if (!result.Succeeded)
    {
        return Results.BadRequest(new { errors = result.Errors.Select(x => x.Description) });
    }

    await userManager.AddToRoleAsync(user, requestedRole);
    return Results.Ok(new { message = "User created.", role = requestedRole });
}).AllowAnonymous();

app.MapPost("/api/auth/login", async (
    LoginRequest request,
    HttpContext httpContext,
    UserManager<ApplicationUser> userManager,
    IJwtTokenService tokenService,
    IPermissionService permissionService,
    IAuditLogService auditLog,
    ILogger<Program> logger) =>
{
    var ip = httpContext.Connection.RemoteIpAddress?.ToString();
    try
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            await auditLog.LogAsync("Auth", "Failed login (unknown user)", "LOGIN", "/api/auth/login",
                principal: null, ipAddress: ip, statusCode: 401,
                description: $"email={request.Email}", success: false);
            return Results.Unauthorized();
        }

        var passwordValid = await userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordValid)
        {
            await auditLog.LogAsync("Auth", "Failed login (bad password)", "LOGIN", "/api/auth/login",
                principal: null, ipAddress: ip, statusCode: 401,
                description: $"email={user.Email}", success: false);
            return Results.Unauthorized();
        }

        var roles = await userManager.GetRolesAsync(user);
        var token = tokenService.CreateToken(
            user.Id,
            user.UserName ?? user.Email ?? user.Id.ToString(),
            user.Email ?? string.Empty,
            roles.ToArray());

        var permissions = (await permissionService.GetPermissionsForRolesAsync(roles)).ToArray();

        // Build a principal so the audit entry has user-id/email populated.
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email ?? "")
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "audit"));
        await auditLog.LogAsync("Auth", "Login", "LOGIN", "/api/auth/login",
            principal: principal, ipAddress: ip, statusCode: 200,
            description: null, success: true);

        return Results.Ok(new
        {
            accessToken = token,
            expiresInMinutes = jwtOptions.ExpirationMinutes,
            user = new
            {
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                roles,
                permissions
            }
        });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Login failed for {Email}", request.Email);
        return Results.Json(new { error = "Authentication service error. Check server logs." }, statusCode: 500);
    }
}).AllowAnonymous();

app.MapGet("/api/auth/setup-required", async (UserManager<ApplicationUser> userManager, CancellationToken cancellationToken) =>
{
    var adminUsers = await userManager.GetUsersInRoleAsync(SystemRoles.Admin);
    if (adminUsers.Count == 0)
        return Results.Ok(new { required = true, email = "" });
    var adminWithSetup = adminUsers.FirstOrDefault(u => u.RequiresPasswordSetup);
    if (adminWithSetup is null)
        return Results.Ok(new { required = false });
    return Results.Ok(new { required = true, email = adminWithSetup.Email ?? "" });
}).AllowAnonymous();

app.MapPost("/api/auth/setup-admin-password", async (
    SetupAdminPasswordRequest request,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        return Results.BadRequest(new { message = "Email and password are required." });
    if (request.Password != request.ConfirmPassword)
        return Results.BadRequest(new { message = "Passwords do not match." });
    if (request.Password.Length < 8)
        return Results.BadRequest(new { message = "Password must be at least 8 characters." });

    var newEmail = request.Email!.Trim();
    var user = await userManager.Users
        .FirstOrDefaultAsync(u => u.RequiresPasswordSetup, cancellationToken);

    if (user is null)
    {
        if (await userManager.Users.AnyAsync(cancellationToken))
            return Results.BadRequest(new { message = "Setup is not required for this user." });
        var emailExists = await userManager.FindByEmailAsync(newEmail);
        if (emailExists is not null)
            return Results.BadRequest(new { message = "This email is already in use." });
        foreach (var role in SystemRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
        }
        user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = newEmail,
            Email = newEmail,
            EmailConfirmed = true,
            FirstName = "Administrator",
            LastName = "",
            RequiresPasswordSetup = false
        };
        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var err = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Results.BadRequest(new { message = err });
        }
        await userManager.AddToRoleAsync(user, SystemRoles.Admin);
        return Results.Ok(new { message = "Password set successfully." });
    }

    var emailTaken = await userManager.FindByEmailAsync(newEmail);
    if (emailTaken is not null && emailTaken.Id != user.Id)
        return Results.BadRequest(new { message = "This email is already in use." });
    user.Email = newEmail;
    user.UserName = newEmail;

    var result = await userManager.RemovePasswordAsync(user);
    if (result.Succeeded)
        result = await userManager.AddPasswordAsync(user, request.Password);
    if (!result.Succeeded)
    {
        var err = string.Join("; ", result.Errors.Select(e => e.Description));
        return Results.BadRequest(new { message = err });
    }
    user.RequiresPasswordSetup = false;
    await userManager.UpdateAsync(user);
    return Results.Ok(new { message = "Password set successfully." });
}).AllowAnonymous();

app.MapPost("/api/auth/forgot-password", async (
    ForgotPasswordRequest request,
    UserManager<ApplicationUser> userManager,
    IEmailService emailService,
    IEmailTemplateService tplService,
    IHostEnvironment env,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Email))
        return Results.BadRequest(new { message = "Email is required." });

    var user = await userManager.FindByEmailAsync(request.Email.Trim());
    if (user is null)
        return Results.Ok(new { message = "If an account exists with this email, a reset link has been sent." });

    var token = await userManager.GeneratePasswordResetTokenAsync(user);

    var (subject, body) = await tplService.RenderAsync("password_reset", new()
    {
        ["{{firstName}}"] = user.FirstName ?? "",
        ["{{token}}"] = token,
        ["{{companyName}}"] = "ProjectX"
    }, cancellationToken);

    await emailService.SendAsync(user.Email!, subject, body, cancellationToken);

    if (env.IsDevelopment())
        return Results.Ok(new { message = "Password reset token generated.", token });
    return Results.Ok(new { message = "If an account exists with this email, a reset link has been sent." });
}).AllowAnonymous();

app.MapPost("/api/auth/reset-password", async (
    ResetPasswordRequest request,
    UserManager<ApplicationUser> userManager,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Email))
        return Results.BadRequest(new { message = "Email is required." });
    if (string.IsNullOrWhiteSpace(request.Token))
        return Results.BadRequest(new { message = "Reset token is required." });
    if (string.IsNullOrWhiteSpace(request.Password))
        return Results.BadRequest(new { message = "Password is required." });
    if (request.Password != request.ConfirmPassword)
        return Results.BadRequest(new { message = "Passwords do not match." });
    if (request.Password.Length < 8)
        return Results.BadRequest(new { message = "Password must be at least 8 characters." });

    var user = await userManager.FindByEmailAsync(request.Email.Trim());
    if (user is null)
        return Results.BadRequest(new { message = "Invalid email or token." });

    var result = await userManager.ResetPasswordAsync(user, request.Token, request.Password);
    if (!result.Succeeded)
    {
        var err = string.Join("; ", result.Errors.Select(e => e.Description));
        return Results.BadRequest(new { message = err });
    }
    return Results.Ok(new { message = "Password has been reset. You can now sign in." });
}).AllowAnonymous();

app.MapGet("/api/auth/me", async (ClaimsPrincipal user, IPermissionService permissionService, CancellationToken ct) =>
{
    var id = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
    var email = user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email");
    var roles = user.FindAll(ClaimTypes.Role).Select(x => x.Value).ToArray();
    var permissions = (await permissionService.GetPermissionsForRolesAsync(roles, ct)).ToArray();

    return Results.Ok(new { id, email, roles, permissions });
}).RequireAuthorization();

// ─── Audit logs ───────────────────────────────────────────────────────────

app.MapGet("/api/audit-logs", async (
    HttpContext httpContext,
    AppDbContext dbContext,
    string? category,
    string? search,
    int? limit,
    int? offset,
    CancellationToken cancellationToken) =>
{
    var take = Math.Clamp(limit ?? 100, 1, 500);
    var skip = Math.Max(0, offset ?? 0);

    var query = dbContext.AuditLogs.AsNoTracking().AsQueryable();
    if (!string.IsNullOrWhiteSpace(category))
        query = query.Where(x => x.Category == category);
    if (!string.IsNullOrWhiteSpace(search))
    {
        var pattern = $"%{search.Trim()}%";
        query = query.Where(x =>
            EF.Functions.ILike(x.UserEmail, pattern) ||
            EF.Functions.ILike(x.Action, pattern) ||
            EF.Functions.ILike(x.Path, pattern) ||
            (x.Description != null && EF.Functions.ILike(x.Description, pattern)));
    }

    var total = await query.CountAsync(cancellationToken);
    var rows = await query
        .OrderByDescending(x => x.TimestampUtc)
        .Skip(skip)
        .Take(take)
        .Select(x => new
        {
            id = x.Id,
            timestampUtc = x.TimestampUtc,
            userId = x.UserId,
            userEmail = x.UserEmail,
            category = x.Category,
            action = x.Action,
            method = x.Method,
            path = x.Path,
            statusCode = x.StatusCode,
            ipAddress = x.IpAddress,
            description = x.Description,
            success = x.Success
        })
        .ToListAsync(cancellationToken);

    return Results.Ok(new { total, items = rows });
}).RequireAuthorization(Permissions.AuditView);

app.MapGet("/api/audit-logs/categories", async (
    AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var cats = await dbContext.AuditLogs
        .AsNoTracking()
        .Select(x => x.Category)
        .Distinct()
        .OrderBy(c => c)
        .ToListAsync(cancellationToken);
    return Results.Ok(cats);
}).RequireAuthorization(Permissions.AuditView);

// ─── System Users & Roles management ──────────────────────────────────────
// Self-service portal accounts (linked to Employee) are excluded via EmployeeId == null.

app.MapGet("/api/users", async (
    UserManager<ApplicationUser> userManager,
    CancellationToken cancellationToken) =>
{
    var users = await userManager.Users
        .Where(u => u.EmployeeId == null)
        .OrderBy(u => u.Email)
        .ToListAsync(cancellationToken);

    var result = new List<object>(users.Count);
    foreach (var u in users)
    {
        var roles = await userManager.GetRolesAsync(u);
        result.Add(new
        {
            id = u.Id,
            email = u.Email,
            firstName = u.FirstName,
            lastName = u.LastName,
            roles,
            requiresPasswordSetup = u.RequiresPasswordSetup
        });
    }
    return Results.Ok(result);
}).RequireAuthorization();

app.MapPost("/api/users", async (
    CreateSystemUserRequest request,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Email)) return Results.BadRequest(new { message = "Email is required." });
    if (string.IsNullOrWhiteSpace(request.Password)) return Results.BadRequest(new { message = "Password is required." });
    if (request.Password.Length < 8) return Results.BadRequest(new { message = "Password must be at least 8 characters." });

    var email = request.Email.Trim();
    if (await userManager.FindByEmailAsync(email) is not null)
        return Results.Conflict(new { message = "User with this email already exists." });

    var requestedRoles = (request.Roles ?? Array.Empty<string>()).Distinct().ToArray();
    foreach (var r in requestedRoles)
    {
        if (!await roleManager.RoleExistsAsync(r))
            return Results.BadRequest(new { message = $"Unknown role: {r}" });
    }

    var user = new ApplicationUser
    {
        Id = Guid.NewGuid(),
        UserName = email,
        Email = email,
        EmailConfirmed = true,
        FirstName = request.FirstName ?? string.Empty,
        LastName = request.LastName ?? string.Empty
    };

    var createResult = await userManager.CreateAsync(user, request.Password);
    if (!createResult.Succeeded)
        return Results.BadRequest(new { message = string.Join("; ", createResult.Errors.Select(e => e.Description)) });

    if (requestedRoles.Length > 0)
    {
        var addRoleResult = await userManager.AddToRolesAsync(user, requestedRoles);
        if (!addRoleResult.Succeeded)
            return Results.BadRequest(new { message = string.Join("; ", addRoleResult.Errors.Select(e => e.Description)) });
    }

    return Results.Ok(new
    {
        id = user.Id,
        email = user.Email,
        firstName = user.FirstName,
        lastName = user.LastName,
        roles = requestedRoles,
        requiresPasswordSetup = false
    });
}).RequireAuthorization(Permissions.UsersManage);

app.MapPut("/api/users/{id:guid}", async (
    Guid id,
    UpdateSystemUserRequest request,
    HttpContext httpContext,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    CancellationToken cancellationToken) =>
{
    var user = await userManager.FindByIdAsync(id.ToString());
    if (user is null || user.EmployeeId != null) return Results.NotFound();

    var newEmail = (request.Email ?? string.Empty).Trim();
    if (!string.IsNullOrWhiteSpace(newEmail) && !string.Equals(newEmail, user.Email, StringComparison.OrdinalIgnoreCase))
    {
        var taken = await userManager.FindByEmailAsync(newEmail);
        if (taken is not null && taken.Id != user.Id)
            return Results.Conflict(new { message = "Email already in use." });
        user.Email = newEmail;
        user.UserName = newEmail;
        user.NormalizedEmail = newEmail.ToUpperInvariant();
        user.NormalizedUserName = newEmail.ToUpperInvariant();
    }
    if (request.FirstName is not null) user.FirstName = request.FirstName;
    if (request.LastName is not null) user.LastName = request.LastName;

    var updateResult = await userManager.UpdateAsync(user);
    if (!updateResult.Succeeded)
        return Results.BadRequest(new { message = string.Join("; ", updateResult.Errors.Select(e => e.Description)) });

    if (request.Roles is not null)
    {
        var requestedRoles = request.Roles.Distinct().ToArray();
        foreach (var r in requestedRoles)
        {
            if (!await roleManager.RoleExistsAsync(r))
                return Results.BadRequest(new { message = $"Unknown role: {r}" });
        }
        // Forbid removing Admin role from yourself.
        var currentIdStr = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(currentIdStr, out var curId) && curId == user.Id && !requestedRoles.Contains(SystemRoles.Admin))
            return Results.BadRequest(new { message = "You cannot remove the Admin role from yourself." });

        var existing = await userManager.GetRolesAsync(user);
        var toRemove = existing.Except(requestedRoles).ToArray();
        var toAdd = requestedRoles.Except(existing).ToArray();
        if (toRemove.Length > 0)
        {
            var rm = await userManager.RemoveFromRolesAsync(user, toRemove);
            if (!rm.Succeeded)
                return Results.BadRequest(new { message = string.Join("; ", rm.Errors.Select(e => e.Description)) });
        }
        if (toAdd.Length > 0)
        {
            var ad = await userManager.AddToRolesAsync(user, toAdd);
            if (!ad.Succeeded)
                return Results.BadRequest(new { message = string.Join("; ", ad.Errors.Select(e => e.Description)) });
        }
    }

    var finalRoles = await userManager.GetRolesAsync(user);
    return Results.Ok(new
    {
        id = user.Id,
        email = user.Email,
        firstName = user.FirstName,
        lastName = user.LastName,
        roles = finalRoles,
        requiresPasswordSetup = user.RequiresPasswordSetup
    });
}).RequireAuthorization(Permissions.UsersManage);

app.MapDelete("/api/users/{id:guid}", async (
    Guid id,
    HttpContext httpContext,
    UserManager<ApplicationUser> userManager,
    CancellationToken cancellationToken) =>
{
    var currentIdStr = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (Guid.TryParse(currentIdStr, out var curId) && curId == id)
        return Results.BadRequest(new { message = "You cannot delete yourself." });

    var user = await userManager.FindByIdAsync(id.ToString());
    if (user is null || user.EmployeeId != null) return Results.NotFound();

    var deleteResult = await userManager.DeleteAsync(user);
    if (!deleteResult.Succeeded)
        return Results.BadRequest(new { message = string.Join("; ", deleteResult.Errors.Select(e => e.Description)) });
    return Results.Ok(new { message = "User deleted." });
}).RequireAuthorization(Permissions.UsersManage);

app.MapPost("/api/users/{id:guid}/change-password", async (
    Guid id,
    AdminChangePasswordRequest request,
    UserManager<ApplicationUser> userManager,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
        return Results.BadRequest(new { message = "Password must be at least 8 characters." });

    var user = await userManager.FindByIdAsync(id.ToString());
    if (user is null || user.EmployeeId != null) return Results.NotFound();

    var token = await userManager.GeneratePasswordResetTokenAsync(user);
    var res = await userManager.ResetPasswordAsync(user, token, request.NewPassword);
    if (!res.Succeeded)
        return Results.BadRequest(new { message = string.Join("; ", res.Errors.Select(e => e.Description)) });
    return Results.Ok(new { message = "Password changed." });
}).RequireAuthorization(Permissions.UsersManage);

app.MapGet("/api/roles", async (
    RoleManager<IdentityRole<Guid>> roleManager,
    UserManager<ApplicationUser> userManager,
    CancellationToken cancellationToken) =>
{
    var roles = await roleManager.Roles.OrderBy(r => r.Name).ToListAsync(cancellationToken);
    var result = new List<object>(roles.Count);
    foreach (var r in roles)
    {
        var users = await userManager.GetUsersInRoleAsync(r.Name!);
        result.Add(new
        {
            name = r.Name,
            isSystem = SystemRoles.All.Contains(r.Name!),
            userCount = users.Count
        });
    }
    return Results.Ok(result);
}).RequireAuthorization(Permissions.RolesManage);

app.MapPost("/api/roles", async (
    CreateRoleRequest request,
    RoleManager<IdentityRole<Guid>> roleManager,
    CancellationToken cancellationToken) =>
{
    var name = (request.Name ?? string.Empty).Trim();
    if (string.IsNullOrWhiteSpace(name)) return Results.BadRequest(new { message = "Role name is required." });
    if (await roleManager.RoleExistsAsync(name))
        return Results.Conflict(new { message = "Role already exists." });

    var res = await roleManager.CreateAsync(new IdentityRole<Guid>(name));
    if (!res.Succeeded)
        return Results.BadRequest(new { message = string.Join("; ", res.Errors.Select(e => e.Description)) });
    return Results.Ok(new { name, isSystem = false, userCount = 0 });
}).RequireAuthorization(Permissions.RolesManage);

app.MapDelete("/api/roles/{name}", async (
    string name,
    RoleManager<IdentityRole<Guid>> roleManager,
    AppDbContext dbContext,
    IPermissionService permissionService,
    CancellationToken cancellationToken) =>
{
    if (SystemRoles.All.Contains(name))
        return Results.BadRequest(new { message = "System roles cannot be deleted." });

    var role = await roleManager.FindByNameAsync(name);
    if (role is null) return Results.NotFound();

    var res = await roleManager.DeleteAsync(role);
    if (!res.Succeeded)
        return Results.BadRequest(new { message = string.Join("; ", res.Errors.Select(e => e.Description)) });

    // Чистим её permission'ы.
    var existing = await dbContext.RolePermissions.Where(p => p.RoleName == name).ToListAsync(cancellationToken);
    if (existing.Count > 0)
    {
        dbContext.RolePermissions.RemoveRange(existing);
        await dbContext.SaveChangesAsync(cancellationToken);
        permissionService.InvalidateCache();
    }

    return Results.Ok(new { message = "Role deleted." });
}).RequireAuthorization(Permissions.RolesManage);

// ─── Permissions catalog & per-role assignment ─────────────────────────────

app.MapGet("/api/permissions", () =>
{
    var grouped = Permissions.Catalog
        .GroupBy(d => d.Group)
        .Select(g => new
        {
            group = g.Key,
            items = g.Select(d => new { key = d.Key, label = d.Label, description = d.Description }).ToArray()
        })
        .ToArray();
    return Results.Ok(grouped);
}).RequireAuthorization(Permissions.RolesManage);

app.MapGet("/api/roles/{name}/permissions", async (
    string name,
    RoleManager<IdentityRole<Guid>> roleManager,
    IPermissionService permissionService,
    CancellationToken ct) =>
{
    if (!await roleManager.RoleExistsAsync(name)) return Results.NotFound();

    var perms = await permissionService.GetPermissionsForRoleAsync(name, ct);
    return Results.Ok(new
    {
        name,
        isSystem = SystemRoles.All.Contains(name),
        isAdmin = string.Equals(name, SystemRoles.Admin, StringComparison.OrdinalIgnoreCase),
        permissions = perms.OrderBy(p => p).ToArray()
    });
}).RequireAuthorization(Permissions.RolesManage);

app.MapPut("/api/roles/{name}/permissions", async (
    string name,
    UpdateRolePermissionsRequest request,
    RoleManager<IdentityRole<Guid>> roleManager,
    IPermissionService permissionService,
    CancellationToken ct) =>
{
    if (!await roleManager.RoleExistsAsync(name)) return Results.NotFound();
    if (string.Equals(name, SystemRoles.Admin, StringComparison.OrdinalIgnoreCase))
        return Results.BadRequest(new { message = "Admin role always has all permissions and cannot be edited." });

    var requested = request.Permissions ?? Array.Empty<string>();
    var unknown = requested.Where(p => !Permissions.All.Contains(p)).ToArray();
    if (unknown.Length > 0)
        return Results.BadRequest(new { message = $"Unknown permissions: {string.Join(", ", unknown)}" });

    await permissionService.SetPermissionsForRoleAsync(name, requested, ct);
    var perms = await permissionService.GetPermissionsForRoleAsync(name, ct);
    return Results.Ok(new { name, permissions = perms.OrderBy(p => p).ToArray() });
}).RequireAuthorization(Permissions.RolesManage);

app.MapGet("/api/devices/discover", async (
    IDeviceDiscoveryService discoveryService,
    CancellationToken cancellationToken) =>
{
    using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
    cts.CancelAfter(TimeSpan.FromSeconds(30));
    var discovered = await discoveryService.DiscoverAsync(cts.Token);
    return Results.Ok(discovered);
}).AllowAnonymous();

app.MapGet("/api/devices/check-network", (string? ipAddress, IOptions<SadpOptions> sadpOptions) =>
{
    if (string.IsNullOrWhiteSpace(ipAddress) || !IPAddress.TryParse(ipAddress.Trim(), out var deviceIp))
    {
        return Results.BadRequest(new { inSameSubnet = false, message = "Некорректный IP-адрес." });
    }
    var inSameSubnet = SadpRawDiscovery.IsDeviceInSameSubnet(deviceIp, out var localSubnetInfo, sadpOptions.Value.ActivateBindIp);
    return Results.Ok(new
    {
        inSameSubnet,
        message = inSameSubnet ? null : $"Устройство {ipAddress} не в одной сети с сервером. Подсети сервера: {localSubnetInfo}. Для активации и добавления устройство должно быть в одной сети с сервером."
    });
}).AllowAnonymous();

app.MapPost("/api/devices/activate", async (
    ActivateDeviceRequest request,
    IHikvisionSdkClient sdkClient,
    IOptions<SadpOptions> sadpOptions,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.IpAddress) || string.IsNullOrWhiteSpace(request.MacAddress) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new { message = "IP, MAC and password are required." });
    }
    var port = request.Port > 0 ? request.Port : 8000;

    // 1. Try SDK activation first (NET_DVR_ActivateDevice — direct TCP)
    var (sdkSuccess, sdkMessage) = await sdkClient.TryActivateViaSdkAsync(request.IpAddress, port, request.Password, cancellationToken);
    if (sdkSuccess)
    {
        return Results.Ok(new { success = true, message = "Activation sent (SDK)." });
    }
    if (sdkMessage is not null)
    {
        return Results.BadRequest(new { message = sdkMessage });
    }

    // 2. Try ISAPI activation (HTTP — работает по TCP, не требует подсети)
    var (isapiSuccess, isapiMessage) = await IsapiActivationService.TryActivateAsync(request.IpAddress, port, request.Password, logger, cancellationToken);
    if (isapiSuccess)
    {
        return Results.Ok(new { success = true, message = "Activation sent (ISAPI)." });
    }
    if (isapiMessage is not null)
    {
        return Results.BadRequest(new { message = isapiMessage });
    }

    // 3. Fallback to SADP (UDP multicast)
    var (sadpSuccess, sadpMessage) = await SadpRawDiscovery.TryActivateAsync(request.IpAddress, request.MacAddress, request.Password, logger, cancellationToken, sadpOptions.Value);
    return sadpSuccess ? Results.Ok(new { success = true, message = "Activation sent (SADP)." }) : Results.BadRequest(new { message = sadpMessage ?? "Activation failed." });
}).AllowAnonymous();

app.MapGet("/api/devices/doors", async (
    Guid? deviceId,
    IDeviceDoorService doorService,
    CancellationToken cancellationToken) =>
{
    var doors = await doorService.GetDoorsAsync(deviceId, cancellationToken);
    return Results.Ok(doors);
}).RequireAuthorization("Devices.View");

app.MapPost("/api/devices/{deviceId:guid}/doors/{doorIndex:int}/control", async (
    Guid deviceId,
    int doorIndex,
    DoorControlRequest request,
    IDeviceDoorControlService doorControlService,
    CancellationToken cancellationToken) =>
{
    var action = request.Action?.ToLowerInvariant() switch
    {
        "open" => DoorControlAction.Open,
        "close" => DoorControlAction.Close,
        "alwaysopen" or "always_open" => DoorControlAction.AlwaysOpen,
        "alwaysclose" or "always_close" => DoorControlAction.AlwaysClose,
        "visitorcallladder" or "visitor_call_ladder" => DoorControlAction.VisitorCallLadder,
        "householdcallladder" or "household_call_ladder" or "residentcallladder" => DoorControlAction.HouseholdCallLadder,
        _ => (DoorControlAction?)null
    };
    if (action is null)
        return Results.BadRequest(new { message = "Action must be one of: open, close, alwaysOpen, alwaysClose, visitorCallLadder, householdCallLadder." });

    var (success, message) = await doorControlService.ControlDoorAsync(
        deviceId, doorIndex, action.Value, request.CallNumber, request.CallElevatorType, cancellationToken);
    return success ? Results.Ok(new { success = true }) : Results.BadRequest(new { message = message ?? "Command failed." });
}).RequireAuthorization("Devices.ControlDoor");

app.MapGet("/api/devices/{deviceId:guid}/time", async (
    Guid deviceId,
    IDeviceLocalizationService localizationService,
    CancellationToken cancellationToken) =>
{
    var info = await localizationService.GetDeviceTimeAsync(deviceId, cancellationToken);
    return Results.Ok(info);
}).RequireAuthorization("Devices.View");

app.MapPost("/api/devices/{deviceId:guid}/time/sync", async (
    Guid deviceId,
    DeviceTimeSyncRequest request,
    IDeviceLocalizationService localizationService,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.TimeZone))
        return Results.BadRequest(new { message = "TimeZone is required." });
    var result = await localizationService.SyncDeviceAsync(deviceId, DateTime.UtcNow, request.TimeZone, cancellationToken);
    return result.Success ? Results.Ok(result) : Results.BadRequest(result);
}).RequireAuthorization("Devices.Manage");

app.MapPost("/api/devices/time/sync-all", async (
    DeviceTimeSyncRequest request,
    IDeviceLocalizationService localizationService,
    AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.TimeZone))
        return Results.BadRequest(new { message = "TimeZone is required." });
    var results = await localizationService.SyncAllDevicesAsync(DateTime.UtcNow, request.TimeZone, cancellationToken);
    var successCount = results.Count(r => r.Success);
    await UpsertLogSyncSettingAsync(dbContext, "TimeSyncLastRunUtc", DateTime.UtcNow.ToString("O", CultureInfo.InvariantCulture), cancellationToken);
    await UpsertLogSyncSettingAsync(dbContext, "TimeSyncLastSuccessCount", successCount.ToString(CultureInfo.InvariantCulture), cancellationToken);
    await UpsertLogSyncSettingAsync(dbContext, "TimeSyncLastTotal", results.Count.ToString(CultureInfo.InvariantCulture), cancellationToken);
    await UpsertLogSyncSettingAsync(dbContext, "TimeSyncLastRunKind", "manual", cancellationToken);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { total = results.Count, successCount, results });
}).RequireAuthorization("Devices.Manage");

app.MapGet("/api/devices/time/schedule", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var keys = new[] { "TimeSyncAutoEnabled", "TimeSyncDailyTime", "TimeSyncTimeZone", "TimeSyncLastRunUtc", "TimeSyncLastSuccessCount", "TimeSyncLastTotal", "TimeSyncLastRunKind" };
    var list = await dbContext.SystemSettings.AsNoTracking().Where(x => keys.Contains(x.Key)).ToListAsync(cancellationToken);
    var map = list.ToDictionary(x => x.Key, x => x.Value);
    var auto = string.Equals(map.GetValueOrDefault("TimeSyncAutoEnabled"), "true", StringComparison.OrdinalIgnoreCase);
    var daily = map.GetValueOrDefault("TimeSyncDailyTime") ?? "03:00";
    var tz = map.GetValueOrDefault("TimeSyncTimeZone");
    DateTime? lastRunUtc = null;
    if (map.TryGetValue("TimeSyncLastRunUtc", out var lru) && !string.IsNullOrWhiteSpace(lru) && DateTime.TryParse(lru, null, DateTimeStyles.RoundtripKind, out var dt))
        lastRunUtc = dt.ToUniversalTime();
    int? lastSuccess = null;
    if (map.TryGetValue("TimeSyncLastSuccessCount", out var ls) && int.TryParse(ls, NumberStyles.Integer, CultureInfo.InvariantCulture, out var lsi))
        lastSuccess = lsi;
    int? lastTotal = null;
    if (map.TryGetValue("TimeSyncLastTotal", out var lt) && int.TryParse(lt, NumberStyles.Integer, CultureInfo.InvariantCulture, out var lti))
        lastTotal = lti;
    var kind = map.GetValueOrDefault("TimeSyncLastRunKind");
    return Results.Ok(new TimeSyncScheduleResponse(auto, daily, tz, lastRunUtc, lastSuccess, lastTotal, kind));
}).RequireAuthorization("Settings.Manage");

app.MapPost("/api/devices/time/schedule", async (TimeSyncScheduleRequest req, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var daily = (req.DailyTimeLocal ?? "03:00").Trim();
    if (!TryParseHHmmLogSync(daily, out _, out _))
        return Results.BadRequest(new { message = "DailyTimeLocal: формат HH:mm (24 часа)." });
    daily = NormalizeHHmmLogSync(daily);
    if (req.AutoEnabled && string.IsNullOrWhiteSpace(req.TimeZone))
        return Results.BadRequest(new { message = "TimeZone обязателен при включённом расписании." });
    await UpsertLogSyncSettingAsync(dbContext, "TimeSyncAutoEnabled", req.AutoEnabled ? "true" : "false", cancellationToken);
    await UpsertLogSyncSettingAsync(dbContext, "TimeSyncDailyTime", daily, cancellationToken);
    if (!string.IsNullOrWhiteSpace(req.TimeZone))
        await UpsertLogSyncSettingAsync(dbContext, "TimeSyncTimeZone", req.TimeZone.Trim(), cancellationToken);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { message = "Сохранено." });
}).RequireAuthorization("Settings.Manage");

app.MapGet("/api/devices", async (
    AppDbContext dbContext,
    IDeviceArpStatusService arpStatusService,
    CancellationToken cancellationToken) =>
{
    var devices = await dbContext.Devices.OrderBy(x => x.Name).ToListAsync(cancellationToken);
    var statuses = (await arpStatusService.GetStatusesAsync(cancellationToken)).ToDictionary(x => x.DeviceIdentifier, x => x, StringComparer.OrdinalIgnoreCase);
    return Results.Ok(devices.Select(d =>
    {
        var st = statuses.GetValueOrDefault(d.DeviceIdentifier);
        return MapDeviceResponse(d, st is not null ? MapConnectivityStatus(st.Status) : "Offline", st?.LastSeenUtc, st?.StatusMessage);
    }));
}).RequireAuthorization("Devices.View");

app.MapGet("/api/devices/{id:guid}", async (
    Guid id,
    AppDbContext dbContext,
    IDeviceArpStatusService arpStatusService,
    CancellationToken cancellationToken) =>
{
    var device = await dbContext.Devices.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (device is null)
    {
        return Results.NotFound();
    }
    var st = await arpStatusService.GetStatusAsync(device.DeviceIdentifier, cancellationToken);
    return Results.Ok(MapDeviceResponse(device, st is not null ? MapConnectivityStatus(st.Status) : "Offline", st?.LastSeenUtc, st?.StatusMessage));
}).RequireAuthorization("Devices.View");

app.MapPost("/api/devices", async (
    CreateDeviceRequest request,
    AppDbContext dbContext,
    IDeviceConnectionManager connectionManager,
    CancellationToken cancellationToken) =>
{
    var exists = await dbContext.Devices
        .AnyAsync(x => x.DeviceIdentifier == request.DeviceIdentifier, cancellationToken);
    if (exists)
    {
        return Results.Conflict(new { message = "Device with this identifier already exists." });
    }

    var username = string.IsNullOrWhiteSpace(request.Username) ? "admin" : request.Username.Trim();
    var password = string.IsNullOrWhiteSpace(request.Password) ? null : request.Password;
    if (string.IsNullOrEmpty(password))
    {
        return Results.BadRequest(new { message = "Пароль обязателен." });
    }

    var (valid, verifyMessage) = await DeviceCredentialVerifier.VerifyAsync(
        request.IpAddress,
        request.Port,
        username,
        password,
        cancellationToken);
    if (!valid)
    {
        return Results.BadRequest(new { message = verifyMessage ?? "Не удалось проверить учётные данные." });
    }

    var device = new Device
    {
        Id = Guid.NewGuid(),
        DeviceIdentifier = request.DeviceIdentifier,
        Name = request.Name,
        IpAddress = request.IpAddress,
        Port = request.Port,
        Location = request.Location,
        DeviceType = request.DeviceType,
        Username = username,
        Password = password,
        DeviceStatusId = SeedIds.DeviceStatusOffline,
        CreatedUtc = DateTime.UtcNow
    };

    dbContext.Devices.Add(device);
    await dbContext.SaveChangesAsync(cancellationToken);

    var created = await dbContext.Devices.FirstAsync(x => x.Id == device.Id, cancellationToken);

    _ = Task.Run(async () =>
    {
        try
        {
            await connectionManager.ConnectAsync(created.DeviceIdentifier, created.IpAddress, created.Port, created.Username, created.Password, CancellationToken.None);
        }
        catch (Exception)
        {
            // Офлайн — фоновый сервис будет периодически пытаться переподключить
        }
    });

    return Results.Created($"/api/devices/{created.Id}", MapDeviceResponse(created, "Offline", null));
}).RequireAuthorization("Devices.Manage");

app.MapPut("/api/devices/{id:guid}", async (
    Guid id,
    UpdateDeviceRequest request,
    AppDbContext dbContext,
    IDeviceConnectionManager connectionManager,
    IDeviceArpStatusService arpStatusService,
    IServiceScopeFactory scopeFactory,
    CancellationToken cancellationToken) =>
{
    var device = await dbContext.Devices.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (device is null)
    {
        return Results.NotFound();
    }

    var hasConflict = await dbContext.Devices
        .AnyAsync(x => x.Id != id && x.DeviceIdentifier == request.DeviceIdentifier, cancellationToken);
    if (hasConflict)
    {
        return Results.Conflict(new { message = "Device with this identifier already exists." });
    }

    var oldIdentifier = device.DeviceIdentifier;
    var sdkConnected = (await connectionManager.GetStatusAsync(oldIdentifier, cancellationToken)).Status == DeviceConnectivityStatus.Connected;

    device.DeviceIdentifier = request.DeviceIdentifier;
    device.Name = request.Name;
    device.IpAddress = request.IpAddress;
    device.Port = request.Port;
    device.Location = request.Location;
    device.DeviceType = request.DeviceType;
    if (request.Username is not null) device.Username = string.IsNullOrWhiteSpace(request.Username) ? "admin" : request.Username.Trim();
    if (request.Password is not null) device.Password = string.IsNullOrWhiteSpace(request.Password) ? null : request.Password;
    device.UpdatedUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);

    if (sdkConnected)
    {
        await connectionManager.DisconnectAsync(oldIdentifier, cancellationToken);
    }
    var deviceId = id;
    var connMgr = connectionManager;
    _ = Task.Run(async () =>
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var d = await ctx.Devices.AsNoTracking().FirstAsync(x => x.Id == deviceId, CancellationToken.None);
            await connMgr.ConnectAsync(d.DeviceIdentifier, d.IpAddress, d.Port, d.Username, d.Password, CancellationToken.None);
        }
        catch { /* reconnect in background */ }
    });

    var updated = await dbContext.Devices.FirstAsync(x => x.Id == id, cancellationToken);
    var st = await arpStatusService.GetStatusAsync(updated.DeviceIdentifier, cancellationToken);
    return Results.Ok(MapDeviceResponse(updated, st is not null ? MapConnectivityStatus(st.Status) : "Offline", st?.LastSeenUtc, st?.StatusMessage));
}).RequireAuthorization("Devices.Manage");

app.MapDelete("/api/devices/{id:guid}", async (
    Guid id,
    AppDbContext dbContext,
    IDeviceConnectionManager connectionManager,
    CancellationToken cancellationToken) =>
{
    var device = await dbContext.Devices.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (device is null)
    {
        return Results.NotFound();
    }

    var realtimeStatus = await connectionManager.GetStatusAsync(device.DeviceIdentifier, cancellationToken);
    if (realtimeStatus.Status == DeviceConnectivityStatus.Connected)
    {
        await connectionManager.DisconnectAsync(device.DeviceIdentifier, cancellationToken);
    }

    dbContext.Devices.Remove(device);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("Devices.Manage");

app.MapPost("/api/devices/{id:guid}/connect", async (
    Guid id,
    AppDbContext dbContext,
    IDeviceConnectionManager connectionManager,
    IDeviceArpStatusService arpStatusService,
    CancellationToken cancellationToken) =>
{
    var device = await dbContext.Devices.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (device is null)
    {
        return Results.NotFound();
    }

    await connectionManager.ConnectAsync(device.DeviceIdentifier, device.IpAddress, device.Port, device.Username, device.Password, cancellationToken);
    var updated = await dbContext.Devices.FirstAsync(x => x.Id == id, cancellationToken);
    var st = await arpStatusService.GetStatusAsync(updated.DeviceIdentifier, cancellationToken);
    return Results.Ok(MapDeviceResponse(updated, st is not null ? MapConnectivityStatus(st.Status) : "Offline", st?.LastSeenUtc, st?.StatusMessage));
}).RequireAuthorization("Devices.Manage");

app.MapPost("/api/devices/{id:guid}/disconnect", async (
    Guid id,
    AppDbContext dbContext,
    IDeviceConnectionManager connectionManager,
    IDeviceArpStatusService arpStatusService,
    CancellationToken cancellationToken) =>
{
    var device = await dbContext.Devices.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (device is null)
    {
        return Results.NotFound();
    }

    await connectionManager.DisconnectAsync(device.DeviceIdentifier, cancellationToken);
    var updated = await dbContext.Devices.FirstAsync(x => x.Id == id, cancellationToken);
    var st = await arpStatusService.GetStatusAsync(updated.DeviceIdentifier, cancellationToken);
    return Results.Ok(MapDeviceResponse(updated, st is not null ? MapConnectivityStatus(st.Status) : "Offline", st?.LastSeenUtc, st?.StatusMessage));
}).RequireAuthorization("Devices.Manage");

app.MapGet("/api/devices/{id:guid}/status", async (
    Guid id,
    AppDbContext dbContext,
    IDeviceArpStatusService arpStatusService,
    CancellationToken cancellationToken) =>
{
    var device = await dbContext.Devices.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (device is null)
    {
        return Results.NotFound();
    }

    var status = await arpStatusService.GetStatusAsync(device.DeviceIdentifier, cancellationToken);
    if (status is null)
    {
        return Results.Ok(new DeviceStatusResponse(device.Id, device.DeviceIdentifier, "Offline", null, null));
    }
    return Results.Ok(new DeviceStatusResponse(
        device.Id,
        device.DeviceIdentifier,
        MapConnectivityStatus(status.Status),
        status.LastSeenUtc,
        status.StatusMessage));
}).RequireAuthorization("Devices.View");

app.MapGet("/api/devices/{id:guid}/isapi-test", async (
    Guid id,
    AppDbContext dbContext,
    IConfiguration configuration,
    CancellationToken cancellationToken) =>
{
    var device = await dbContext.Devices.FindAsync([id], cancellationToken);
    if (device is null) return Results.NotFound();

    var username = configuration["Hikvision:Username"] ?? "admin";
    var password = (configuration["Hikvision:Password"] ?? "").Trim();
    if (string.IsNullOrEmpty(password)) password = "12345";
    var cred = new NetworkCredential(
        string.IsNullOrWhiteSpace(device.Username) ? username : device.Username,
        string.IsNullOrWhiteSpace(device.Password) ? password : device.Password);

    var client = new IsapiClient(device.IpAddress, device.Port, cred.UserName ?? "admin", cred.Password ?? "", TimeSpan.FromSeconds(10));
    var (success, content, error) = await client.GetAsync("ISAPI/System/deviceInfo?format=json", cancellationToken);

    return Results.Ok(new { success, error, deviceAddress = $"{device.IpAddress}:{device.Port}", contentLength = content?.Length ?? 0 });
}).RequireAuthorization("Devices.Manage");

app.MapGet("/api/devices/{id:guid}/users-raw", async (
    Guid id,
    string? format,
    AppDbContext dbContext,
    IConfiguration configuration,
    CancellationToken cancellationToken) =>
{
    var device = await dbContext.Devices.FindAsync([id], cancellationToken);
    if (device is null) return Results.NotFound();

    var username = configuration["Hikvision:Username"] ?? "admin";
    var password = (configuration["Hikvision:Password"] ?? "").Trim();
    if (string.IsNullOrEmpty(password)) password = "12345";
    var cred = new NetworkCredential(
        string.IsNullOrWhiteSpace(device.Username) ? username : device.Username,
        string.IsNullOrWhiteSpace(device.Password) ? password : device.Password);

    var client = new IsapiClient(device.IpAddress, device.Port, cred.UserName ?? "admin", cred.Password ?? "", TimeSpan.FromSeconds(15));
    var fmt = string.Equals(format, "xml", StringComparison.OrdinalIgnoreCase) ? "xml" : "json";

    var searchBody = fmt == "xml"
        ? """<?xml version="1.0" encoding="UTF-8"?><UserInfoSearchCond xmlns="http://www.isapi.org/ver20/XMLSchema"><searchID>""" + Guid.NewGuid().ToString("N")[..20] + """</searchID><searchResultPosition>0</searchResultPosition><maxResults>100</maxResults></UserInfoSearchCond>"""
        : System.Text.Json.JsonSerializer.Serialize(new { UserInfoSearchCond = new { searchID = Guid.NewGuid().ToString("N")[..20], searchResultPosition = 0, maxResults = 100 } });
    var contentType = fmt == "xml" ? "application/xml" : "application/json";

    var (success, content, error) = await client.PostAsync(
        $"ISAPI/AccessControl/UserInfo/Search?format={fmt}",
        searchBody,
        contentType,
        cancellationToken);

    if (!success)
        return Results.BadRequest(new { error, deviceAddress = $"{device.IpAddress}:{device.Port}" });

    return Results.Content(content ?? "", fmt == "xml" ? "application/xml" : "application/json");
}).RequireAuthorization("Devices.Manage");

// Прямой запрос к устройству (без БД) — для просмотра реальной структуры ответа. Только Development.
app.MapGet("/api/devices/users-raw-direct", async (
    string ip,
    int? port,
    string? username,
    string? password,
    string? format,
    IHostEnvironment env,
    CancellationToken cancellationToken) =>
{
    if (!env.IsDevelopment())
        return Results.NotFound();
    if (string.IsNullOrWhiteSpace(ip) || !IPAddress.TryParse(ip.Trim(), out _))
        return Results.BadRequest(new { error = "ip required (e.g. 192.168.1.64)" });

    var p = port ?? 80;
    var user = string.IsNullOrWhiteSpace(username) ? "admin" : username.Trim();
    var pass = string.IsNullOrWhiteSpace(password) ? "12345" : password;
    var fmt = string.Equals(format, "xml", StringComparison.OrdinalIgnoreCase) ? "xml" : "json";

    var client = new IsapiClient(ip.Trim(), p, user, pass, TimeSpan.FromSeconds(15));
    var searchBody = fmt == "xml"
        ? """<?xml version="1.0" encoding="UTF-8"?><UserInfoSearchCond xmlns="http://www.isapi.org/ver20/XMLSchema"><searchID>""" + Guid.NewGuid().ToString("N")[..20] + """</searchID><searchResultPosition>0</searchResultPosition><maxResults>100</maxResults></UserInfoSearchCond>"""
        : System.Text.Json.JsonSerializer.Serialize(new { UserInfoSearchCond = new { searchID = Guid.NewGuid().ToString("N")[..20], searchResultPosition = 0, maxResults = 100 } });
    var contentType = fmt == "xml" ? "application/xml" : "application/json";

    var (success, content, error) = await client.PostAsync(
        $"ISAPI/AccessControl/UserInfo/Search?format={fmt}",
        searchBody,
        contentType,
        cancellationToken);

    if (!success)
        return Results.BadRequest(new { error, device = $"{ip}:{p}" });

    return Results.Content(content ?? "", fmt == "xml" ? "application/xml" : "application/json");
}).AllowAnonymous();

app.MapPost("/api/devices/{id:guid}/faces/capture", async (
    Guid id,
    CaptureFaceRequest request,
    IDeviceFaceCaptureService captureService,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.PersonId) || !Guid.TryParse(request.PersonId, out var personId))
        return Results.BadRequest(new { message = "PersonId обязателен." });
    if (string.IsNullOrWhiteSpace(request.PersonType) || (request.PersonType != "employee" && request.PersonType != "visitor"))
        return Results.BadRequest(new { message = "PersonType должен быть 'employee' или 'visitor'." });
    var result = await captureService.StartCaptureAsync(id, personId, request.PersonType, cancellationToken);
    if (!result.Success)
        return Results.BadRequest(new { message = result.Message });
    return Results.Ok();
}).RequireAuthorization("Credentials.Manage");

app.MapGet("/api/devices/{id:guid}/faces/capture/progress", async (
    Guid id,
    IDeviceFaceCaptureService captureService,
    CancellationToken cancellationToken) =>
{
    var progress = await captureService.GetProgressAsync(id, cancellationToken);
    return Results.Ok(new { progress.Status, progress.Progress, progress.Message, progress.FaceId });
}).RequireAuthorization("Credentials.Manage");

app.MapPost("/api/devices/{id:guid}/cards/capture", async (
    Guid id,
    CaptureFaceRequest request,
    IDeviceCardCaptureService captureService,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.PersonId) || !Guid.TryParse(request.PersonId, out var personId))
        return Results.BadRequest(new { message = "PersonId обязателен." });
    if (string.IsNullOrWhiteSpace(request.PersonType) || (request.PersonType != "employee" && request.PersonType != "visitor"))
        return Results.BadRequest(new { message = "PersonType должен быть 'employee' или 'visitor'." });
    var result = await captureService.StartCaptureAsync(id, personId, request.PersonType, cancellationToken);
    if (!result.Success)
        return Results.BadRequest(new { message = result.Message });
    return Results.Ok();
}).RequireAuthorization("Credentials.Manage");

app.MapGet("/api/devices/{id:guid}/cards/capture/progress", async (
    Guid id,
    IDeviceCardCaptureService captureService,
    CancellationToken cancellationToken) =>
{
    var progress = await captureService.GetProgressAsync(id, cancellationToken);
    return Results.Ok(new { progress.Status, progress.Message, progress.CardId });
}).RequireAuthorization("Credentials.Manage");

app.MapPost("/api/devices/{id:guid}/fingerprints/capture", async (
    Guid id,
    CaptureFingerprintRequest request,
    IDeviceFingerprintCaptureService captureService,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.PersonId) || !Guid.TryParse(request.PersonId, out var personId))
        return Results.BadRequest(new { message = "PersonId обязателен." });
    if (string.IsNullOrWhiteSpace(request.PersonType) || (request.PersonType != "employee" && request.PersonType != "visitor"))
        return Results.BadRequest(new { message = "PersonType должен быть 'employee' или 'visitor'." });
    var fingerIndex = Math.Clamp(request.FingerIndex, 1, 10);
    var result = await captureService.StartCaptureAsync(id, personId, request.PersonType, fingerIndex, cancellationToken);
    if (!result.Success)
        return Results.BadRequest(new { message = result.Message });
    return Results.Ok();
}).RequireAuthorization("Credentials.Manage");

app.MapGet("/api/devices/{id:guid}/fingerprints/capture/progress", async (
    Guid id,
    IDeviceFingerprintCaptureService captureService,
    CancellationToken cancellationToken) =>
{
    var progress = await captureService.GetProgressAsync(id, cancellationToken);
    return Results.Ok(new { progress.Status, progress.Message, progress.FingerprintId });
}).RequireAuthorization("Credentials.Manage");

app.MapGet("/api/devices/{id:guid}/access-control/capabilities", async (
    Guid id,
    AppDbContext dbContext,
    IConfiguration configuration,
    CancellationToken cancellationToken) =>
{
    var device = await dbContext.Devices.FindAsync([id], cancellationToken);
    if (device is null) return Results.NotFound();

    var username = configuration["Hikvision:Username"] ?? "admin";
    var password = (configuration["Hikvision:Password"] ?? "").Trim();
    if (string.IsNullOrEmpty(password)) password = "12345";
    var cred = new NetworkCredential(
        string.IsNullOrWhiteSpace(device.Username) ? username : device.Username,
        string.IsNullOrWhiteSpace(device.Password) ? password : device.Password);

    var client = new IsapiClient(device.IpAddress, device.Port, cred.UserName ?? "admin", cred.Password ?? "", TimeSpan.FromSeconds(10));
    var (success, content, error) = await client.GetAsync("ISAPI/AccessControl/capabilities?format=xml", cancellationToken);

    if (!success)
        return Results.BadRequest(new { error, deviceAddress = $"{device.IpAddress}:{device.Port}" });

    static bool ParseBool(string? v) => string.Equals(v, "true", StringComparison.OrdinalIgnoreCase);

    var payload = new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase);
    var raw = (content ?? "").Trim();
    if (raw.StartsWith("<", StringComparison.Ordinal))
    {
        try
        {
            var doc = XDocument.Parse(content!);
            var root = doc.Root;
            if (root is not null)
            {
                var ns = root.Name.Namespace;
                foreach (var el in root.Elements())
                {
                    var name = el.Name.LocalName;
                    if (!payload.ContainsKey(name))
                        payload[name] = ParseBool(el.Value);
                }
            }
        }
        catch
        {
            payload["_parseError"] = true;
        }
    }
    else
    {
        try
        {
            var json = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, System.Text.Json.JsonElement>>(raw);
            if (json is not null)
                foreach (var kv in json)
                    if (kv.Value.ValueKind == System.Text.Json.JsonValueKind.True || kv.Value.ValueKind == System.Text.Json.JsonValueKind.False)
                        payload[kv.Key] = kv.Value.GetBoolean();
        }
        catch
        {
            payload["_parseError"] = true;
        }
    }

    var result = new
    {
        isSupportFingerPrintCfg = payload.GetValueOrDefault("isSupportFingerPrintCfg", false),
        isSupportFDLib = payload.GetValueOrDefault("isSupportFDLib", false),
        isSupportCaptureFace = payload.GetValueOrDefault("isSupportCaptureFace", false),
        isSupportIrisInfo = payload.GetValueOrDefault("isSupportIrisInfo", false),
        isSupportEventCardLinkageCfg = payload.GetValueOrDefault("isSupportEventCardLinkageCfg", false),
        isSupportCardInfo = payload.GetValueOrDefault("isSupportCardInfo", false),
    };
    return Results.Json(result);
}).RequireAuthorization("Devices.View");

app.MapGet("/api/devices/statuses", async (
    AppDbContext dbContext,
    IDeviceArpStatusService arpStatusService,
    CancellationToken cancellationToken) =>
{
    var statuses = await arpStatusService.GetStatusesAsync(cancellationToken);
    var realtimeByIdentifier = statuses.ToDictionary(x => x.DeviceIdentifier, x => x, StringComparer.OrdinalIgnoreCase);
    var devices = await dbContext.Devices
        .AsNoTracking()
        .Select(x => new { x.Id, x.DeviceIdentifier })
        .ToListAsync(cancellationToken);

    var payload = devices.Select(device =>
    {
        if (realtimeByIdentifier.TryGetValue(device.DeviceIdentifier, out var realtime))
        {
            return new DeviceStatusResponse(
                device.Id,
                device.DeviceIdentifier,
                MapConnectivityStatus(realtime.Status),
                realtime.LastSeenUtc,
                realtime.StatusMessage);
        }

        return new DeviceStatusResponse(device.Id, device.DeviceIdentifier, "Offline", null, null);
    });

    return Results.Ok(payload);
}).AllowAnonymous();

app.MapGet("/api/devices/events", async (
    int? take,
    IEventListenerService eventListenerService,
    CancellationToken cancellationToken) =>
{
    var clampedTake = Math.Clamp(take ?? 100, 1, 1000);
    var events = await eventListenerService.ReadRecentEventsAsync(clampedTake, cancellationToken);
    return Results.Ok(events);
}).RequireAuthorization("Devices.View");

app.MapGet("/api/access-levels", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var levels = await dbContext.AccessLevels
        .AsNoTracking()
        .Include(x => x.Doors)
        .ThenInclude(d => d.Device)
        .OrderBy(x => x.Name)
        .ToListAsync(cancellationToken);
    var list = levels.Select(x => new AccessLevelResponse(
        x.Id, x.Name, x.Description, x.CreatedUtc, x.UpdatedUtc,
        x.Doors.Select(d => new AccessLevelDoorDto(d.DeviceId, d.Device?.Name ?? "", d.DoorIndex, d.Device?.DeviceType == DeviceType.ElevatorController)).ToList()));
    return Results.Ok(list);
}).RequireAuthorization("AccessLevels.View");

app.MapGet("/api/access-levels/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.AccessLevels
        .AsNoTracking()
        .Include(x => x.Doors)
        .ThenInclude(d => d.Device)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();
    var doors = entity.Doors.Select(d => new AccessLevelDoorDto(d.DeviceId, d.Device?.Name ?? "", d.DoorIndex, d.Device?.DeviceType == DeviceType.ElevatorController)).ToList();
    return Results.Ok(new AccessLevelResponse(entity.Id, entity.Name, entity.Description, entity.CreatedUtc, entity.UpdatedUtc, doors));
}).RequireAuthorization("AccessLevels.View");

app.MapPost("/api/access-levels", async (CreateAccessLevelRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var name = (request.Name ?? "").Trim();
    if (string.IsNullOrEmpty(name))
        return Results.BadRequest(new { message = "Name is required." });

    var exists = await dbContext.AccessLevels.AnyAsync(x => x.Name == name, cancellationToken);
    if (exists)
        return Results.Conflict(new { message = "Access level with this name already exists." });

    var entity = new AccessLevel
    {
        Id = Guid.NewGuid(),
        Name = name,
        Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
        CreatedUtc = DateTime.UtcNow
    };
    dbContext.AccessLevels.Add(entity);
    await dbContext.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/access-levels/{entity.Id}", new AccessLevelResponse(entity.Id, entity.Name, entity.Description, entity.CreatedUtc, entity.UpdatedUtc, []));
}).RequireAuthorization("AccessLevels.Manage");

app.MapPost("/api/access-levels/{id:guid}/doors", async (Guid id, AddAccessLevelDoorRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var level = await dbContext.AccessLevels.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (level is null)
        return Results.NotFound();
    var device = await dbContext.Devices.FirstOrDefaultAsync(x => x.Id == request.DeviceId, cancellationToken);
    if (device is null)
        return Results.NotFound(new { message = "Device not found." });
    if (request.DoorIndex < 0)
        return Results.BadRequest(new { message = "DoorIndex must be >= 0." });
    var exists = await dbContext.AccessLevelDoors.AnyAsync(x => x.AccessLevelId == id && x.DeviceId == request.DeviceId && x.DoorIndex == request.DoorIndex, cancellationToken);
    if (exists)
        return Results.Conflict(new { message = "This door is already assigned to this access level." });
    dbContext.AccessLevelDoors.Add(new AccessLevelDoor { AccessLevelId = id, DeviceId = request.DeviceId, DoorIndex = request.DoorIndex });
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("AccessLevels.Manage");

app.MapDelete("/api/access-levels/{id:guid}/doors/{deviceId:guid}/{doorIndex:int}", async (Guid id, Guid deviceId, int doorIndex, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var link = await dbContext.AccessLevelDoors.FirstOrDefaultAsync(x => x.AccessLevelId == id && x.DeviceId == deviceId && x.DoorIndex == doorIndex, cancellationToken);
    if (link is null)
        return Results.NotFound();
    dbContext.AccessLevelDoors.Remove(link);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("AccessLevels.Manage");

app.MapPut("/api/access-levels/{id:guid}", async (Guid id, UpdateAccessLevelRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.AccessLevels.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();

    var name = (request.Name ?? "").Trim();
    if (string.IsNullOrEmpty(name))
        return Results.BadRequest(new { message = "Name is required." });

    var hasConflict = await dbContext.AccessLevels.AnyAsync(x => x.Id != id && x.Name == name, cancellationToken);
    if (hasConflict)
        return Results.Conflict(new { message = "Access level with this name already exists." });

    entity.Name = name;
    entity.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
    entity.UpdatedUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);

    var doors = await dbContext.AccessLevelDoors.Where(x => x.AccessLevelId == id).Include(x => x.Device).ToListAsync(cancellationToken);
    return Results.Ok(new AccessLevelResponse(entity.Id, entity.Name, entity.Description, entity.CreatedUtc, entity.UpdatedUtc,
        doors.Select(d => new AccessLevelDoorDto(d.DeviceId, d.Device?.Name ?? "", d.DoorIndex, d.Device?.DeviceType == DeviceType.ElevatorController)).ToList()));
}).RequireAuthorization("AccessLevels.Manage");

app.MapDelete("/api/access-levels/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.AccessLevels.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();

    dbContext.AccessLevels.Remove(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("AccessLevels.Manage");

// Companies
app.MapGet("/api/companies", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var list = await dbContext.Companies
        .AsNoTracking()
        .OrderBy(x => x.Name)
        .ToListAsync(cancellationToken);
    return Results.Ok(list.Select(x => new CompanyResponse(x.Id, x.Name, x.Description, x.CreatedUtc, x.UpdatedUtc)));
}).RequireAuthorization("Companies.View");

app.MapPost("/api/companies", async (CreateCompanyRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var name = (request.Name ?? "").Trim();
    if (string.IsNullOrEmpty(name))
        return Results.BadRequest(new { message = "Name is required." });

    var entity = new Company
    {
        Id = Guid.NewGuid(),
        Name = name,
        Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
        CreatedUtc = DateTime.UtcNow
    };
    dbContext.Companies.Add(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Created($"/api/companies/{entity.Id}", new CompanyResponse(entity.Id, entity.Name, entity.Description, entity.CreatedUtc, entity.UpdatedUtc));
}).RequireAuthorization("Companies.Manage");

app.MapPut("/api/companies/{id:guid}", async (Guid id, UpdateCompanyRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Companies.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null) return Results.NotFound();

    var name = (request.Name ?? "").Trim();
    if (string.IsNullOrEmpty(name))
        return Results.BadRequest(new { message = "Name is required." });

    entity.Name = name;
    entity.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
    entity.UpdatedUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new CompanyResponse(entity.Id, entity.Name, entity.Description, entity.CreatedUtc, entity.UpdatedUtc));
}).RequireAuthorization("Companies.Manage");

app.MapDelete("/api/companies/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Companies.Include(x => x.Departments).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null) return Results.NotFound();
    if (entity.Departments.Count > 0)
        return Results.BadRequest(new { message = "Cannot delete company with departments. Delete or move them first." });

    dbContext.Companies.Remove(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("Companies.Manage");

// System Settings
app.MapGet("/api/system-settings", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var list = await dbContext.SystemSettings.AsNoTracking().ToListAsync(cancellationToken);
    return Results.Ok(list.Select(x => new SystemSettingResponse(x.Key, x.Value)));
}).RequireAuthorization();

app.MapGet("/api/system-settings/{key}", async (string key, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var setting = await dbContext.SystemSettings.AsNoTracking().FirstOrDefaultAsync(x => x.Key == key, cancellationToken);
    if (setting is null) return Results.NotFound();
    return Results.Ok(new SystemSettingResponse(setting.Key, setting.Value));
}).RequireAuthorization();

app.MapPost("/api/system-settings", async (SystemSettingRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var key = (request.Key ?? "").Trim();
    if (string.IsNullOrEmpty(key)) return Results.BadRequest(new { message = "Key is required." });

    var setting = await dbContext.SystemSettings.FirstOrDefaultAsync(x => x.Key == key, cancellationToken);
    if (setting == null)
    {
        setting = new SystemSetting { Id = Guid.NewGuid(), Key = key, Value = request.Value, CreatedUtc = DateTime.UtcNow };
        dbContext.SystemSettings.Add(setting);
    }
    else
    {
        setting.Value = request.Value;
        setting.UpdatedUtc = DateTime.UtcNow;
    }

    if (key == "CompanyMode" && request.Value == "Single")
    {
        var companies = await dbContext.Companies.OrderBy(c => c.CreatedUtc).ToListAsync(cancellationToken);
        if (companies.Count > 1)
        {
            var firstId = companies[0].Id;
            foreach (var company in companies.Skip(1))
            {
                await dbContext.Departments.Where(d => d.CompanyId == company.Id)
                    .ExecuteUpdateAsync(s => s.SetProperty(d => d.CompanyId, firstId), cancellationToken);
                await dbContext.Employees.Where(e => e.CompanyId == company.Id)
                    .ExecuteUpdateAsync(s => s.SetProperty(e => e.CompanyId, firstId), cancellationToken);
                await dbContext.Visitors.Where(v => v.CompanyId == company.Id)
                    .ExecuteUpdateAsync(s => s.SetProperty(v => v.CompanyId, firstId), cancellationToken);
                dbContext.Companies.Remove(company);
            }
        }
    }

    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new SystemSettingResponse(setting.Key, setting.Value));
}).RequireAuthorization("Settings.Manage");

// ─── SMTP Settings ────────────────────────────────────────────────────────────

app.MapGet("/api/settings/smtp", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var keys = new[] { "Smtp:Host", "Smtp:Port", "Smtp:Username", "Smtp:Password", "Smtp:FromAddress", "Smtp:FromName", "Smtp:EnableSsl", "Smtp:Enabled" };
    var rows = await dbContext.SystemSettings.AsNoTracking().Where(x => keys.Contains(x.Key)).ToListAsync(cancellationToken);
    var map = rows.ToDictionary(x => x.Key, x => x.Value ?? "");
    return Results.Ok(new
    {
        enabled = string.Equals(map.GetValueOrDefault("Smtp:Enabled"), "true", StringComparison.OrdinalIgnoreCase),
        host = map.GetValueOrDefault("Smtp:Host", ""),
        port = int.TryParse(map.GetValueOrDefault("Smtp:Port"), out var p) ? p : 587,
        username = map.GetValueOrDefault("Smtp:Username", ""),
        password = map.GetValueOrDefault("Smtp:Password", ""),
        fromAddress = map.GetValueOrDefault("Smtp:FromAddress", ""),
        fromName = map.GetValueOrDefault("Smtp:FromName", ""),
        enableSsl = !string.Equals(map.GetValueOrDefault("Smtp:EnableSsl", "true"), "false", StringComparison.OrdinalIgnoreCase)
    });
}).RequireAuthorization("Settings.Manage");

app.MapPut("/api/settings/smtp", async (SmtpSettingsRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var updates = new Dictionary<string, string>
    {
        ["Smtp:Enabled"] = request.Enabled ? "true" : "false",
        ["Smtp:Host"] = request.Host ?? "",
        ["Smtp:Port"] = (request.Port > 0 ? request.Port : 587).ToString(),
        ["Smtp:Username"] = request.Username ?? "",
        ["Smtp:Password"] = request.Password ?? "",
        ["Smtp:FromAddress"] = request.FromAddress ?? "",
        ["Smtp:FromName"] = request.FromName ?? "",
        ["Smtp:EnableSsl"] = request.EnableSsl ? "true" : "false"
    };
    foreach (var (key, value) in updates)
    {
        var setting = await dbContext.SystemSettings.FirstOrDefaultAsync(x => x.Key == key, cancellationToken);
        if (setting is null)
        {
            setting = new SystemSetting { Id = Guid.NewGuid(), Key = key, Value = value, CreatedUtc = DateTime.UtcNow };
            dbContext.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = value;
            setting.UpdatedUtc = DateTime.UtcNow;
        }
    }
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { message = "SMTP settings saved." });
}).RequireAuthorization("Settings.Manage");

app.MapPost("/api/settings/smtp/test", async (IEmailService emailService, CancellationToken cancellationToken) =>
{
    var ok = await emailService.TestConnectionAsync(cancellationToken);
    return ok ? Results.Ok(new { message = "Test email sent successfully." }) : Results.BadRequest(new { message = "Failed to send test email. Check SMTP settings." });
}).RequireAuthorization("Settings.Manage");

// ─── Email Templates ──────────────────────────────────────────────────────────

app.MapGet("/api/email-templates", async (IEmailTemplateService tplService, CancellationToken ct) =>
    Results.Ok(await tplService.GetAllAsync(ct))
).RequireAuthorization();

app.MapGet("/api/email-templates/{key}", async (string key, IEmailTemplateService tplService, CancellationToken ct) =>
{
    if (!tplService.Exists(key)) return Results.NotFound();
    return Results.Ok(await tplService.GetAsync(key, ct));
}).RequireAuthorization("Settings.Manage");

app.MapPut("/api/email-templates/{key}", async (string key, EmailTemplateUpdateRequest req, IEmailTemplateService tplService, CancellationToken ct) =>
{
    if (!tplService.Exists(key)) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(req.Subject)) return Results.BadRequest(new { message = "Subject is required." });
    if (string.IsNullOrWhiteSpace(req.HtmlBody)) return Results.BadRequest(new { message = "Body is required." });
    await tplService.SaveAsync(key, req.Subject.Trim(), req.HtmlBody, ct);
    return Results.Ok(await tplService.GetAsync(key, ct));
}).RequireAuthorization("Settings.Manage");

app.MapPost("/api/email-templates/{key}/reset", async (string key, IEmailTemplateService tplService, CancellationToken ct) =>
{
    if (!tplService.Exists(key)) return Results.NotFound();
    await tplService.ResetAsync(key, ct);
    return Results.Ok(await tplService.GetAsync(key, ct));
}).RequireAuthorization("Settings.Manage");

app.MapPost("/api/email-templates/{key}/preview", async (string key, EmailTemplatePreviewRequest req, IEmailTemplateService tplService, CancellationToken ct) =>
{
    if (!tplService.Exists(key)) return Results.NotFound();
    var sampleVars = GetSampleVariables(key);
    // Allow caller to override subject/body for live preview without saving
    string subject, body;
    if (!string.IsNullOrWhiteSpace(req.Subject) || !string.IsNullOrWhiteSpace(req.HtmlBody))
    {
        var tmpSubject = req.Subject ?? tplService.GetDefault(key).Subject;
        var tmpBody = req.HtmlBody ?? tplService.GetDefault(key).Body;
        subject = RenderTemplate(tmpSubject, sampleVars);
        body = RenderTemplate(tmpBody, sampleVars);
    }
    else
    {
        (subject, body) = await tplService.RenderAsync(key, sampleVars, ct);
    }
    return Results.Ok(new { subject, body });
}).RequireAuthorization("Settings.Manage");

static Dictionary<string, string> GetSampleVariables(string key) => key switch
{
    "password_reset" => new() {
        ["{{firstName}}"] = "Alex",
        ["{{token}}"] = "A1B2-C3D4-E5F6",
        ["{{companyName}}"] = "Acme Corp"
    },
    "selfservice_created" => new() {
        ["{{firstName}}"] = "Maria",
        ["{{lastName}}"] = "Johnson",
        ["{{email}}"] = "m.johnson@acme.com",
        ["{{password}}"] = "SS_Temp1234!",
        ["{{companyName}}"] = "Acme Corp"
    },
    "attendance_report" => new() {
        ["{{companyName}}"] = "Acme Corp",
        ["{{fromDate}}"] = "01.05.2026",
        ["{{toDate}}"] = "31.05.2026",
        ["{{tableRows}}"] = "<tr><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0'>01.05.2026</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0'>Alex Smith</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0'>Engineering</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0;text-align:center'>09:02</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0;text-align:center'>18:15</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0;text-align:center'>9.2</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0;text-align:center'>+2m</td></tr>",
        ["{{generatedAt}}"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm") + " UTC"
    },
    "payroll_report" => new() {
        ["{{companyName}}"] = "Acme Corp",
        ["{{month}}"] = "May",
        ["{{year}}"] = "2026",
        ["{{status}}"] = "Approved",
        ["{{employeeCount}}"] = "24",
        ["{{totalGross}}"] = "48,320.00",
        ["{{totalTax}}"] = "6,764.80",
        ["{{totalNet}}"] = "41,555.20",
        ["{{tableRows}}"] = "<tr><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0'>Alex Smith</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0'>Engineering</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0;text-align:center'>22</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0;text-align:center'>176.0</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0;text-align:right'>2,000.00</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0;text-align:right'>2,150.00</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0;text-align:right'>301.00</td><td style='padding:5px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600'>1,849.00</td></tr>",
        ["{{generatedAt}}"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm") + " UTC"
    },
    _ => new()
};

static string RenderTemplate(string template, Dictionary<string, string> vars)
{
    return System.Text.RegularExpressions.Regex.Replace(template, @"\{\{(\w+)\}\}", m =>
    {
        var key = "{{" + m.Groups[1].Value + "}}";
        return vars.TryGetValue(key, out var val) ? val : m.Value;
    });
}

// Departments (древовидная структура отделов)
app.MapGet("/api/departments", async (Guid? companyId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.Departments.AsNoTracking().AsQueryable();
    if (companyId.HasValue) query = query.Where(x => x.CompanyId == companyId);

    var list = await query
        .OrderBy(x => x.SortOrder)
        .ThenBy(x => x.Name)
        .ToListAsync(cancellationToken);
    var childCounts = await dbContext.Departments.Where(d => d.ParentId != null).GroupBy(d => d.ParentId).Select(g => new { g.Key, C = g.Count() }).ToListAsync(cancellationToken);
    var empCounts = await dbContext.Employees.Where(e => e.DepartmentId != null).GroupBy(e => e.DepartmentId).Select(g => new { g.Key, C = g.Count() }).ToListAsync(cancellationToken);
    var visCounts = await dbContext.Visitors.Where(v => v.DepartmentId != null).GroupBy(v => v.DepartmentId).Select(g => new { g.Key, C = g.Count() }).ToListAsync(cancellationToken);
    return Results.Ok(list.Select(d => new DepartmentResponse(d.Id, d.Name, d.Description, d.SortOrder, d.ParentId, d.CompanyId,
        childCounts.FirstOrDefault(c => c.Key == d.Id)?.C ?? 0,
        empCounts.FirstOrDefault(c => c.Key == d.Id)?.C ?? 0,
        visCounts.FirstOrDefault(c => c.Key == d.Id)?.C ?? 0)));
}).RequireAuthorization("Departments.View");

app.MapGet("/api/departments/tree", async (Guid? companyId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.Departments.AsNoTracking().AsQueryable();
    if (companyId.HasValue) query = query.Where(x => x.CompanyId == companyId);

    var list = await query.OrderBy(x => x.SortOrder).ThenBy(x => x.Name).ToListAsync(cancellationToken);
    var empCounts = await dbContext.Employees.Where(e => e.DepartmentId != null).GroupBy(e => e.DepartmentId).Select(g => new { g.Key, C = g.Count() }).ToListAsync(cancellationToken);
    var visCounts = await dbContext.Visitors.Where(v => v.DepartmentId != null).GroupBy(v => v.DepartmentId).Select(g => new { g.Key, C = g.Count() }).ToListAsync(cancellationToken);
    var items = list.Select(d => new DepartmentTreeItem(d.Id, d.Name, d.Description, d.SortOrder, d.ParentId, d.CompanyId, empCounts.FirstOrDefault(c => c.Key == d.Id)?.C ?? 0, visCounts.FirstOrDefault(c => c.Key == d.Id)?.C ?? 0)).ToList();
    return Results.Ok(items);
}).RequireAuthorization("Departments.View");

app.MapGet("/api/departments/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Departments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();
    return Results.Ok(new DepartmentResponse(entity.Id, entity.Name, entity.Description, entity.SortOrder, entity.ParentId, entity.CompanyId, 0, 0, 0));
}).RequireAuthorization("Departments.View");

app.MapPost("/api/departments", async (CreateDepartmentRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var name = (request.Name ?? "").Trim();
    if (string.IsNullOrEmpty(name))
        return Results.BadRequest(new { message = "Name is required." });

    if (request.ParentId.HasValue)
    {
        var parentExists = await dbContext.Departments.AnyAsync(x => x.Id == request.ParentId.Value, cancellationToken);
        if (!parentExists)
            return Results.BadRequest(new { message = "Parent department not found." });
    }

    var maxOrder = await dbContext.Departments
        .Where(d => d.ParentId == request.ParentId)
        .Select(d => (int?)d.SortOrder)
        .MaxAsync(cancellationToken) ?? -1;

    var entity = new Department
    {
        Id = Guid.NewGuid(),
        Name = name,
        Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
        SortOrder = maxOrder + 1,
        ParentId = request.ParentId,
        CompanyId = request.CompanyId,
        CreatedUtc = DateTime.UtcNow
    };
    dbContext.Departments.Add(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Created($"/api/departments/{entity.Id}", new DepartmentResponse(entity.Id, entity.Name, entity.Description, entity.SortOrder, entity.ParentId, entity.CompanyId, 0, 0, 0));
}).RequireAuthorization("Departments.Manage");

app.MapPut("/api/departments/{id:guid}", async (Guid id, UpdateDepartmentRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Departments.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();

    var name = (request.Name ?? "").Trim();
    if (string.IsNullOrEmpty(name))
        return Results.BadRequest(new { message = "Name is required." });

    var hasConflict = await dbContext.Departments.AnyAsync(x => x.Id != id && x.Name == name && x.ParentId == entity.ParentId, cancellationToken);
    if (hasConflict)
        return Results.Conflict(new { message = "Department with this name already exists in the same level." });

    if (request.ParentId.HasValue && request.ParentId.Value == id)
        return Results.BadRequest(new { message = "Department cannot be its own parent." });

    if (request.ParentId.HasValue)
    {
        var parentExists = await dbContext.Departments.AnyAsync(x => x.Id == request.ParentId.Value, cancellationToken);
        if (!parentExists)
            return Results.BadRequest(new { message = "Parent department not found." });
    }

    entity.Name = name;
    entity.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
    entity.SortOrder = request.SortOrder ?? entity.SortOrder;
    entity.ParentId = request.ParentId;
    entity.CompanyId = request.CompanyId;
    entity.UpdatedUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new DepartmentResponse(entity.Id, entity.Name, entity.Description, entity.SortOrder, entity.ParentId, entity.CompanyId, 0, 0, 0));
}).RequireAuthorization("Departments.Manage");

app.MapDelete("/api/departments/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Departments
        .Include(x => x.Children)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();

    if (entity.Children.Count > 0)
        return Results.BadRequest(new { message = "Cannot delete department with sub-departments. Move or delete them first." });

    dbContext.Departments.Remove(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("Departments.Manage");

// Employees
app.MapGet("/api/employees", async (
    string? search,
    bool? isActive,
    AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var query = dbContext.Employees.AsNoTracking()
        .Include(e => e.AccessLevels)
        .ThenInclude(a => a.AccessLevel)
        .Include(e => e.Department)
        .Include(e => e.Cards)
        .Include(e => e.Faces)
        .Include(e => e.Fingerprints)
        .Include(e => e.Irises)
        .AsQueryable();
    if (isActive.HasValue)
        query = query.Where(e => e.IsActive == isActive.Value);
    if (!string.IsNullOrWhiteSpace(search))
    {
        var s = search.Trim().ToLower();
        query = query.Where(e =>
            (e.FirstName != null && e.FirstName.ToLower().Contains(s)) ||
            (e.LastName != null && e.LastName.ToLower().Contains(s)) ||
            (e.EmployeeNo != null && e.EmployeeNo.ToLower().Contains(s)));
    }
    var list = await query.OrderBy(e => e.LastName).ThenBy(e => e.FirstName).ToListAsync(cancellationToken);
    return Results.Ok(list.Select(MapEmployeeResponse));
}).RequireAuthorization("Employees.View");

app.MapGet("/api/employees/next-personnel-number", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    return Results.Ok(new { nextPersonnelNumber = await GetNextPersonIdAsync(dbContext, cancellationToken) });
}).RequireAuthorization("Employees.View");

app.MapGet("/api/employees/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var e = await dbContext.Employees
        .AsNoTracking()
        .Include(x => x.AccessLevels)
        .ThenInclude(a => a.AccessLevel)
        .Include(x => x.Department)
        .Include(x => x.WorkSchedule)
        .Include(x => x.Cards)
        .Include(x => x.Faces)
        .Include(x => x.Fingerprints)
        .Include(x => x.Irises)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (e is null)
        return Results.NotFound();
    return Results.Ok(MapEmployeeDetailResponse(e));
}).RequireAuthorization("Employees.View");

app.MapPost("/api/employees", async (CreateEmployeeRequest request, AppDbContext dbContext, IDevicePersonSyncService syncService, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    var firstName = (request.FirstName ?? "").Trim();
    var lastName = (request.LastName ?? "").Trim();
    if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(lastName))
        return Results.BadRequest(new { message = "FirstName и LastName обязательны." });

    var entityId = Guid.NewGuid();
    var employeeNo = entityId.ToString("N")[..32];

    // По умолчанию: с сегодняшней даты до 31 дек 2037
    var defaultValidFrom = DateTime.UtcNow.Date;
    var defaultValidTo = new DateTime(2037, 12, 31, 23, 59, 59, DateTimeKind.Utc);
    var companyId = request.CompanyId;
    if (companyId == null)
    {
        var mode = await dbContext.SystemSettings.FirstOrDefaultAsync(s => s.Key == "CompanyMode", cancellationToken);
        if (mode?.Value == "Single")
        {
            companyId = (await dbContext.Companies.OrderBy(c => c.CreatedUtc).FirstOrDefaultAsync(cancellationToken))?.Id;
        }
    }

    var entity = new Employee
    {
        Id = entityId,
        FirstName = firstName,
        LastName = lastName,
        EmployeeNo = employeeNo,
        Gender = string.IsNullOrWhiteSpace(request.Gender) ? null : request.Gender.Trim().ToLowerInvariant(),
        ValidFromUtc = request.ValidFromUtc ?? defaultValidFrom,
        ValidToUtc = request.ValidToUtc ?? defaultValidTo,
        IsActive = true,
        OnlyVerify = request.OnlyVerify ?? false,
        DepartmentId = request.DepartmentId,
        CompanyId = companyId,
        CreatedUtc = DateTime.UtcNow
    };
    dbContext.Employees.Add(entity);

    if (request.AccessLevelIds?.Length > 0)
    {
        foreach (var alId in request.AccessLevelIds)
        {
            if (await dbContext.AccessLevels.AnyAsync(x => x.Id == alId, cancellationToken))
                dbContext.EmployeeAccessLevels.Add(new EmployeeAccessLevel { EmployeeId = entity.Id, AccessLevelId = alId });
        }
    }
    await dbContext.SaveChangesAsync(cancellationToken);

    var deviceIds = request.AccessLevelIds?.Length > 0
        ? await dbContext.AccessLevelDoors
            .Where(d => request.AccessLevelIds.Contains(d.AccessLevelId))
            .Select(d => d.DeviceId)
            .Distinct()
            .ToListAsync(cancellationToken)
        : [];
    var syncWarnings = new List<string>();
    var devices = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    foreach (var deviceId in deviceIds)
    {
        var result = await syncService.SyncEmployeeAsync(entity.Id, deviceId, cancellationToken);
        if (!result.Success && devices.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Устройство \"{dev.Name}\": {result.Message}");
            logger.LogWarning("Синхронизация сотрудника {EmployeeId} на устройство {DeviceId}: {Message}", entity.Id, deviceId, result.Message);
        }
    }

    var created = await dbContext.Employees
        .Include(e => e.AccessLevels).ThenInclude(a => a.AccessLevel)
        .Include(e => e.Department)
        .Include(e => e.Cards).Include(e => e.Faces).Include(e => e.Fingerprints).Include(e => e.Irises)
        .FirstAsync(x => x.Id == entity.Id, cancellationToken);
    var createdResp = MapEmployeeDetailResponse(created);
    return Results.Created($"/api/employees/{entity.Id}", new { createdResp.Id, createdResp.FirstName, createdResp.LastName, createdResp.EmployeeNo, createdResp.Gender, createdResp.ValidFromUtc, createdResp.ValidToUtc, createdResp.IsActive, createdResp.OnlyVerify, createdResp.Department, createdResp.CompanyId, createdResp.AccessLevels, createdResp.Cards, createdResp.Faces, createdResp.Fingerprints, createdResp.Irises, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
}).RequireAuthorization("Employees.Manage");

app.MapPut("/api/employees/{id:guid}", async (
    Guid id,
    UpdateEmployeeRequest request,
    AppDbContext dbContext,
    IDevicePersonSyncService syncService,
    IDeviceConnectionManager connectionManager,
    IDeviceActivityBroadcaster activityBroadcaster,
    UserManager<ApplicationUser> userManager,
    IEmailService emailService,
    IEmailTemplateService emailTemplateService,
    HttpRequest httpRequest,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Employees
        .Include(e => e.AccessLevels)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();

    // The frontend generates an X-Sync-Id per save operation so it can match SignalR
    // PersonSyncProgress events to its own progress bar (and ignore syncs from other tabs).
    // If absent we still run the sync; the broadcasts just won't be paired with a UI.
    var syncId = httpRequest.Headers.TryGetValue("X-Sync-Id", out var sidVals) && !string.IsNullOrWhiteSpace(sidVals.ToString())
        ? sidVals.ToString()
        : Guid.NewGuid().ToString("N");

    var firstName = (request.FirstName ?? "").Trim();
    var lastName = (request.LastName ?? "").Trim();
    if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(lastName))
        return Results.BadRequest(new { message = "FirstName и LastName обязательны." });

    entity.FirstName = firstName;
    entity.LastName = lastName;
    if (request.Gender != null) entity.Gender = string.IsNullOrWhiteSpace(request.Gender) ? null : request.Gender.Trim().ToLowerInvariant();
    entity.ValidFromUtc = request.ValidFromUtc;
    entity.ValidToUtc = request.ValidToUtc;
    if (request.IsActive.HasValue) entity.IsActive = request.IsActive.Value;
    if (request.OnlyVerify.HasValue) entity.OnlyVerify = request.OnlyVerify.Value;
    if (request.DepartmentId.HasValue) entity.DepartmentId = request.DepartmentId.Value;
    else if (request.DepartmentId == null) entity.DepartmentId = null;
    if (request.CompanyId.HasValue) entity.CompanyId = request.CompanyId.Value;
    else if (request.CompanyId == null) entity.CompanyId = null;
    // When clearing the default schedule, also remove all day-pattern assignments
    // so old patterns don't continue overriding the "no schedule" state in the report.
    if (request.WorkScheduleId == null && entity.WorkScheduleId != null)
    {
        var patternsToRemove = await dbContext.EmployeeDayPatterns
            .Where(p => p.EmployeeId == entity.Id && p.WorkScheduleId != null)
            .ToListAsync(cancellationToken);
        dbContext.EmployeeDayPatterns.RemoveRange(patternsToRemove);
    }
    entity.WorkScheduleId = request.WorkScheduleId;
    entity.UpdatedUtc = DateTime.UtcNow;

    // Self-service account management
    string? selfServiceTempPassword = null;
    if (request.SelfServiceEnabled == true && !string.IsNullOrWhiteSpace(request.SelfServiceEmail))
    {
        var email = request.SelfServiceEmail.Trim().ToLowerInvariant();
        entity.SelfServiceEnabled = true;
        entity.SelfServiceEmail = email;

        var existingUser = await userManager.FindByEmailAsync(email);
        if (existingUser is null)
        {
            var tempPassword = $"SS_{Guid.NewGuid():N}!1";
            var newUser = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                FirstName = entity.FirstName,
                LastName = entity.LastName,
                EmployeeId = entity.Id,
                // Сгенерированный пароль — при первом входе сотрудник обязан сменить.
                RequiresPasswordSetup = true
            };
            var createResult = await userManager.CreateAsync(newUser, tempPassword);
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(newUser, SystemRoles.Employee);
                selfServiceTempPassword = tempPassword;

                var (emailSubject, emailBody) = await emailTemplateService.RenderAsync("selfservice_created", new()
                {
                    ["{{firstName}}"] = entity.FirstName ?? "",
                    ["{{lastName}}"] = entity.LastName ?? "",
                    ["{{email}}"] = email,
                    ["{{password}}"] = tempPassword,
                    ["{{companyName}}"] = "ProjectX"
                }, cancellationToken);
                await emailService.SendAsync(email, emailSubject, emailBody, cancellationToken);
            }
            else
            {
                logger.LogWarning("Ошибка создания аккаунта самообслуживания для сотрудника {EmployeeId}: {Errors}", id, string.Join("; ", createResult.Errors.Select(e => e.Description)));
            }
        }
        else if (!existingUser.EmployeeId.HasValue)
        {
            existingUser.EmployeeId = entity.Id;
            await userManager.UpdateAsync(existingUser);
            if (!await userManager.IsInRoleAsync(existingUser, SystemRoles.Employee))
                await userManager.AddToRoleAsync(existingUser, SystemRoles.Employee);
        }
    }
    else if (request.SelfServiceEnabled == false)
    {
        entity.SelfServiceEnabled = false;
    }

    var accessLevelIds = (request.AccessLevelIds ?? entity.AccessLevels.Select(a => a.AccessLevelId).ToArray()).ToList();
    if (request.AccessLevelIds is not null)
    {
        dbContext.EmployeeAccessLevels.RemoveRange(entity.AccessLevels);
        foreach (var alId in request.AccessLevelIds)
        {
            if (await dbContext.AccessLevels.AnyAsync(x => x.Id == alId, cancellationToken))
                dbContext.EmployeeAccessLevels.Add(new EmployeeAccessLevel { EmployeeId = id, AccessLevelId = alId });
        }
    }
    await dbContext.SaveChangesAsync(cancellationToken);

    var deviceIds = accessLevelIds.Count > 0
        ? await dbContext.AccessLevelDoors
            .Where(d => accessLevelIds.Contains(d.AccessLevelId))
            .Select(d => d.DeviceId)
            .Distinct()
            .ToListAsync(cancellationToken)
        : [];
    var devices = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    // Sync employee + credentials (face, fingerprints, cards) to devices from access levels
    var empFaces = await dbContext.Faces.Where(f => f.EmployeeId == id).ToListAsync(cancellationToken);
    var empFingerprints = await dbContext.Fingerprints.Where(f => f.EmployeeId == id).ToListAsync(cancellationToken);
    var empCards = await dbContext.Cards.Where(c => c.EmployeeId == id).ToListAsync(cancellationToken);
    var syncWarnings = await SyncPersonToDevicesWithProgressAsync(
        syncId,
        id,
        isEmployee: true,
        deviceIds,
        empFaces,
        empFingerprints,
        empCards,
        devices,
        syncService,
        connectionManager,
        activityBroadcaster,
        logger,
        cancellationToken);

    var updated = await dbContext.Employees
        .Include(e => e.AccessLevels).ThenInclude(a => a.AccessLevel)
        .Include(e => e.Department)
        .Include(e => e.WorkSchedule)
        .Include(e => e.Cards).Include(e => e.Faces).Include(e => e.Fingerprints).Include(e => e.Irises)
        .FirstAsync(x => x.Id == id, cancellationToken);
    var updatedResp = MapEmployeeDetailResponse(updated);
    return Results.Ok(new { updatedResp.Id, updatedResp.FirstName, updatedResp.LastName, updatedResp.EmployeeNo, updatedResp.Gender, updatedResp.ValidFromUtc, updatedResp.ValidToUtc, updatedResp.IsActive, updatedResp.OnlyVerify, updatedResp.Department, updatedResp.CompanyId, updatedResp.AccessLevels, updatedResp.Cards, updatedResp.Faces, updatedResp.Fingerprints, updatedResp.Irises, updatedResp.SelfServiceEnabled, updatedResp.SelfServiceEmail, updatedResp.WorkScheduleId, updatedResp.WorkScheduleName, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null, selfServiceTempPassword });
}).RequireAuthorization("Employees.Manage");

app.MapDelete("/api/employees/{id:guid}", async (Guid id, AppDbContext dbContext, IDevicePersonSyncService syncService, IConfiguration configuration, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Employees
        .Include(e => e.AccessLevels)
        .ThenInclude(a => a.AccessLevel)
        .ThenInclude(al => al!.Doors)
        .Include(e => e.Faces)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();

    var employeeNo = TruncateEmployeeNo(!string.IsNullOrWhiteSpace(entity.EmployeeNo) ? entity.EmployeeNo!.Trim() : entity.Id.ToString("N")[..32]);

    var deviceIds = await dbContext.Devices.AsNoTracking().ToListAsync(cancellationToken);
    var syncWarnings = new List<string>();
    foreach (var device in deviceIds)
    {
        var result = await syncService.DeletePersonFromDeviceAsync(employeeNo, device.Id, cancellationToken);
        if (!result.Success)
        {
            syncWarnings.Add($"Устройство \"{device.Name}\": {result.Message}");
            logger.LogWarning("Delete employee {EmployeeNo} from device {DeviceId}: {Error}", employeeNo, device.Id, result.Message);
        }
    }

    var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
    foreach (var face in entity.Faces)
    {
        var fullPath = Path.Combine(facesPath, face.FilePath.TrimStart('/', '\\'));
        if (File.Exists(fullPath)) File.Delete(fullPath);
    }

    dbContext.EmployeeAccessLevels.RemoveRange(entity.AccessLevels);
    dbContext.Employees.Remove(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return syncWarnings.Count > 0 ? Results.Ok(new { syncWarnings }) : Results.NoContent();
}).RequireAuthorization("Employees.Manage");

app.MapPost("/api/employees/{id:guid}/sync", async (Guid id, SyncToDevicesRequest request, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var results = new List<object>();
    foreach (var deviceId in request.DeviceIds ?? [])
    {
        var result = await syncService.SyncEmployeeAsync(id, deviceId, cancellationToken);
        results.Add(new { deviceId, success = result.Success, message = result.Message });
    }
    return Results.Ok(results);
}).RequireAuthorization("Employees.Manage");

app.MapPost("/api/sync/employees", async (AppDbContext dbContext, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var employees = await dbContext.Employees
        .AsNoTracking()
        .Include(e => e.AccessLevels)
        .ThenInclude(a => a.AccessLevel)
        .ThenInclude(al => al!.Doors)
        .Where(e => e.IsActive)
        .ToListAsync(cancellationToken);

    var devices = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    var results = new List<object>();

    foreach (var emp in employees)
    {
        var deviceIds = emp.AccessLevels
            .Where(a => a.AccessLevel != null)
            .SelectMany(a => a.AccessLevel!.Doors)
            .Select(d => d.DeviceId)
            .Distinct()
            .ToList();

        foreach (var deviceId in deviceIds)
        {
            if (!devices.TryGetValue(deviceId, out var device))
                continue;
            var result = await syncService.SyncEmployeeAsync(emp.Id, deviceId, cancellationToken);
            results.Add(new
            {
                employeeId = emp.Id,
                employeeName = $"{emp.FirstName} {emp.LastName}".Trim(),
                deviceId,
                deviceName = device.Name,
                success = result.Success,
                error = result.Message
            });
        }
    }

    return Results.Ok(new { results });
}).RequireAuthorization("Employees.Manage");

// Visitors
app.MapGet("/api/visitors", async (
    string? search,
    bool? isActive,
    DateTime? visitDateFrom,
    DateTime? visitDateTo,
    AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var query = dbContext.Visitors.AsNoTracking()
        .Include(v => v.AccessLevels).ThenInclude(a => a.AccessLevel)
        .Include(v => v.Department)
        .Include(v => v.Cards).Include(v => v.Faces).Include(v => v.Fingerprints).Include(v => v.Irises)
        .AsQueryable();
    if (isActive.HasValue)
        query = query.Where(v => v.IsActive == isActive.Value);
    if (visitDateFrom.HasValue)
        query = query.Where(v => v.VisitDateUtc >= visitDateFrom.Value);
    if (visitDateTo.HasValue)
        query = query.Where(v => v.VisitDateUtc <= visitDateTo.Value);
    if (!string.IsNullOrWhiteSpace(search))
    {
        var s = search.Trim().ToLower();
        query = query.Where(v =>
            (v.FirstName != null && v.FirstName.ToLower().Contains(s)) ||
            (v.LastName != null && v.LastName.ToLower().Contains(s)) ||
            (v.DocumentNumber != null && v.DocumentNumber.ToLower().Contains(s)));
    }
    var list = await query.OrderByDescending(v => v.VisitDateUtc).ToListAsync(cancellationToken);
    return Results.Ok(list.Select(MapVisitorResponse));
}).RequireAuthorization("Visitors.View");

app.MapGet("/api/visitors/next-document-number", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    return Results.Ok(new { nextDocumentNumber = await GetNextPersonIdAsync(dbContext, cancellationToken) });
}).RequireAuthorization("Visitors.View");

app.MapGet("/api/visitors/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var v = await dbContext.Visitors
        .AsNoTracking()
        .Include(x => x.AccessLevels).ThenInclude(a => a.AccessLevel)
        .Include(x => x.Department)
        .Include(x => x.Cards).Include(x => x.Faces).Include(x => x.Fingerprints).Include(x => x.Irises)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (v is null)
        return Results.NotFound();
    return Results.Ok(MapVisitorDetailResponse(v));
}).RequireAuthorization("Visitors.View");

app.MapPost("/api/visitors", async (CreateVisitorRequest request, AppDbContext dbContext, IDevicePersonSyncService syncService, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    var firstName = (request.FirstName ?? "").Trim();
    var lastName = (request.LastName ?? "").Trim();
    if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(lastName))
        return Results.BadRequest(new { message = "FirstName и LastName обязательны." });

    var documentNumber = string.IsNullOrWhiteSpace(request.DocumentNumber) ? null : request.DocumentNumber.Trim();
    if (documentNumber == null)
    {
        documentNumber = await GetNextPersonIdAsync(dbContext, cancellationToken);
    }
    else
    {
        var existsInEmployees = await dbContext.Employees.AnyAsync(x => x.EmployeeNo == documentNumber, cancellationToken);
        var existsInVisitors = await dbContext.Visitors.AnyAsync(x => x.DocumentNumber == documentNumber, cancellationToken);
        if (existsInEmployees || existsInVisitors)
            return Results.Conflict(new { message = "Такой номер документа уже занят другим сотрудником или посетителем." });
    }

    // По умолчанию: с текущего момента на 24 часа
    var now = DateTime.UtcNow;
    var validFrom = request.ValidFromUtc ?? now;
    var validTo = request.ValidToUtc ?? validFrom.AddHours(24);

    var companyId = request.CompanyId;
    if (companyId == null)
    {
        var mode = await dbContext.SystemSettings.FirstOrDefaultAsync(s => s.Key == "CompanyMode", cancellationToken);
        if (mode?.Value == "Single")
        {
            companyId = (await dbContext.Companies.OrderBy(c => c.CreatedUtc).FirstOrDefaultAsync(cancellationToken))?.Id;
        }
    }

    var entity = new Visitor
    {
        Id = Guid.NewGuid(),
        FirstName = firstName,
        LastName = lastName,
        DocumentNumber = documentNumber,
        VisitDateUtc = validFrom,
        ValidFromUtc = validFrom,
        DepartmentId = request.DepartmentId,
        CompanyId = companyId,
        ValidToUtc = validTo,
        IsActive = true,
        CreatedUtc = DateTime.UtcNow
    };
    dbContext.Visitors.Add(entity);

    if (request.AccessLevelIds?.Length > 0)
    {
        foreach (var alId in request.AccessLevelIds)
        {
            if (await dbContext.AccessLevels.AnyAsync(x => x.Id == alId, cancellationToken))
                dbContext.VisitorAccessLevels.Add(new VisitorAccessLevel { VisitorId = entity.Id, AccessLevelId = alId });
        }
    }
    // Авто-генерация QR-карты для входа через устройства Hikvision
    var qrCard = new Card
    {
        Id = Guid.NewGuid(),
        VisitorId = entity.Id,
        CardNo = Guid.NewGuid().ToString("N")[..20],
        CardType = "qrCode",
        CreatedUtc = DateTime.UtcNow
    };
    dbContext.Cards.Add(qrCard);
    await dbContext.SaveChangesAsync(cancellationToken);

    var deviceIds = request.AccessLevelIds?.Length > 0
        ? await dbContext.AccessLevelDoors
            .Where(d => request.AccessLevelIds.Contains(d.AccessLevelId))
            .Select(d => d.DeviceId)
            .Distinct()
            .ToListAsync(cancellationToken)
        : [];
    var syncWarnings = new List<string>();
    var devices = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    foreach (var deviceId in deviceIds)
    {
        var result = await syncService.SyncVisitorAsync(entity.Id, deviceId, cancellationToken);
        if (!result.Success && devices.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Устройство \"{dev.Name}\": {result.Message}");
            logger.LogWarning("Синхронизация посетителя {VisitorId} на устройство {DeviceId}: {Message}", entity.Id, deviceId, result.Message);
        }
        else
        {
            // Синхронизируем QR-карту на устройство
            var cardResult = await syncService.SyncCardAsync(qrCard.Id, deviceId, cancellationToken);
            if (!cardResult.Success && devices.TryGetValue(deviceId, out var cardDev))
                logger.LogWarning("Синхронизация QR-карты посетителя {VisitorId} на устройство {DeviceId}: {Message}", entity.Id, deviceId, cardResult.Message);
        }
    }

    var created = await dbContext.Visitors
        .Include(v => v.AccessLevels).ThenInclude(a => a.AccessLevel)
        .Include(v => v.Department)
        .Include(v => v.Cards).Include(v => v.Faces).Include(v => v.Fingerprints).Include(v => v.Irises)
        .FirstAsync(x => x.Id == entity.Id, cancellationToken);
    var createdResp = MapVisitorDetailResponse(created);
    return Results.Created($"/api/visitors/{entity.Id}", new { createdResp.Id, createdResp.FirstName, createdResp.LastName, createdResp.DocumentNumber, createdResp.ValidFromUtc, createdResp.ValidToUtc, createdResp.IsActive, createdResp.Department, createdResp.CompanyId, createdResp.AccessLevels, createdResp.Cards, createdResp.Faces, createdResp.Fingerprints, createdResp.Irises, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
}).RequireAuthorization("Visitors.Manage");

app.MapPut("/api/visitors/{id:guid}", async (
    Guid id,
    UpdateVisitorRequest request,
    AppDbContext dbContext,
    IDevicePersonSyncService syncService,
    IDeviceConnectionManager connectionManager,
    IDeviceActivityBroadcaster activityBroadcaster,
    HttpRequest httpRequest,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Visitors
        .Include(v => v.AccessLevels)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();

    var syncId = httpRequest.Headers.TryGetValue("X-Sync-Id", out var sidVals) && !string.IsNullOrWhiteSpace(sidVals.ToString())
        ? sidVals.ToString()
        : Guid.NewGuid().ToString("N");

    var firstName = (request.FirstName ?? "").Trim();
    var lastName = (request.LastName ?? "").Trim();
    if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(lastName))
        return Results.BadRequest(new { message = "FirstName и LastName обязательны." });

    entity.FirstName = firstName;
    entity.LastName = lastName;
    entity.DocumentNumber = string.IsNullOrWhiteSpace(request.DocumentNumber) ? null : request.DocumentNumber.Trim();
    if (request.ValidFromUtc.HasValue) entity.ValidFromUtc = request.ValidFromUtc.Value;
    if (request.ValidToUtc.HasValue) entity.ValidToUtc = request.ValidToUtc.Value;
    if (request.IsActive.HasValue) entity.IsActive = request.IsActive.Value;
    if (request.DepartmentId.HasValue) entity.DepartmentId = request.DepartmentId.Value;
    else if (request.DepartmentId == null) entity.DepartmentId = null;
    if (request.CompanyId.HasValue) entity.CompanyId = request.CompanyId.Value;
    else if (request.CompanyId == null) entity.CompanyId = null;
    entity.UpdatedUtc = DateTime.UtcNow;

    var accessLevelIds = (request.AccessLevelIds ?? entity.AccessLevels.Select(a => a.AccessLevelId).ToArray()).ToList();
    if (request.AccessLevelIds is not null)
    {
        dbContext.VisitorAccessLevels.RemoveRange(entity.AccessLevels);
        foreach (var alId in request.AccessLevelIds)
        {
            if (await dbContext.AccessLevels.AnyAsync(x => x.Id == alId, cancellationToken))
                dbContext.VisitorAccessLevels.Add(new VisitorAccessLevel { VisitorId = id, AccessLevelId = alId });
        }
    }
    await dbContext.SaveChangesAsync(cancellationToken);

    var deviceIds = accessLevelIds.Count > 0
        ? await dbContext.AccessLevelDoors
            .Where(d => accessLevelIds.Contains(d.AccessLevelId))
            .Select(d => d.DeviceId)
            .Distinct()
            .ToListAsync(cancellationToken)
        : [];
    var devices = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    // Sync visitor + credentials (face, fingerprints, cards) to devices from access levels
    var visFaces = await dbContext.Faces.Where(f => f.VisitorId == id).ToListAsync(cancellationToken);
    var visFingerprints = await dbContext.Fingerprints.Where(f => f.VisitorId == id).ToListAsync(cancellationToken);
    var visCards = await dbContext.Cards.Where(c => c.VisitorId == id).ToListAsync(cancellationToken);
    var syncWarnings = await SyncPersonToDevicesWithProgressAsync(
        syncId,
        id,
        isEmployee: false,
        deviceIds,
        visFaces,
        visFingerprints,
        visCards,
        devices,
        syncService,
        connectionManager,
        activityBroadcaster,
        logger,
        cancellationToken);

    var updated = await dbContext.Visitors
        .Include(v => v.AccessLevels).ThenInclude(a => a.AccessLevel)
        .Include(v => v.Department)
        .Include(v => v.Cards).Include(v => v.Faces).Include(v => v.Fingerprints).Include(v => v.Irises)
        .FirstAsync(x => x.Id == id, cancellationToken);
    var updatedResp = MapVisitorDetailResponse(updated);
    return Results.Ok(new { updatedResp.Id, updatedResp.FirstName, updatedResp.LastName, updatedResp.DocumentNumber, updatedResp.ValidFromUtc, updatedResp.ValidToUtc, updatedResp.IsActive, updatedResp.Department, updatedResp.CompanyId, updatedResp.AccessLevels, updatedResp.Cards, updatedResp.Faces, updatedResp.Fingerprints, updatedResp.Irises, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
}).RequireAuthorization("Visitors.Manage");

app.MapDelete("/api/visitors/{id:guid}", async (Guid id, AppDbContext dbContext, IDevicePersonSyncService syncService, IConfiguration configuration, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Visitors
        .Include(v => v.AccessLevels)
        .ThenInclude(a => a.AccessLevel)
        .ThenInclude(al => al!.Doors)
        .Include(v => v.Faces)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();

    var employeeNo = !string.IsNullOrWhiteSpace(entity.DocumentNumber)
        ? entity.DocumentNumber.Trim()
        : entity.Id.ToString("N")[..Math.Min(32, 32)];

    var deviceIds = await dbContext.Devices.AsNoTracking().ToListAsync(cancellationToken);
    var syncWarnings = new List<string>();
    foreach (var device in deviceIds)
    {
        var result = await syncService.DeletePersonFromDeviceAsync(employeeNo, device.Id, cancellationToken);
        if (!result.Success)
        {
            syncWarnings.Add($"Устройство \"{device.Name}\": {result.Message}");
            logger.LogWarning("Delete visitor {EmployeeNo} from device {DeviceId}: {Error}", employeeNo, device.Id, result.Message);
        }
    }

    var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
    foreach (var face in entity.Faces)
    {
        var fullPath = Path.Combine(facesPath, face.FilePath.TrimStart('/', '\\'));
        if (File.Exists(fullPath)) File.Delete(fullPath);
    }

    dbContext.VisitorAccessLevels.RemoveRange(entity.AccessLevels);
    dbContext.Visitors.Remove(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return syncWarnings.Count > 0 ? Results.Ok(new { syncWarnings }) : Results.NoContent();
}).RequireAuthorization("Visitors.Manage");

app.MapPost("/api/visitors/{id:guid}/sync", async (Guid id, SyncToDevicesRequest request, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var results = new List<object>();
    foreach (var deviceId in request.DeviceIds ?? [])
    {
        var result = await syncService.SyncVisitorAsync(id, deviceId, cancellationToken);
        results.Add(new { deviceId, success = result.Success, message = result.Message });
    }
    return Results.Ok(results);
}).RequireAuthorization("Visitors.Manage");

app.MapPost("/api/people/import-from-devices", async (ImportFromDevicesRequest request, IDevicePersonImportService importService, CancellationToken cancellationToken) =>
{
    if (request.DeviceIds is null || request.DeviceIds.Length == 0)
        return Results.BadRequest(new { message = "Выберите хотя бы одно устройство." });
    var result = await importService.ImportFromDevicesAsync(request.DeviceIds, request.CompanyId, cancellationToken);
    return Results.Ok(new
    {
        importedCount = result.ImportedCount,
        skippedCount = result.SkippedCount,
        errorCount = result.ErrorCount,
        items = result.Items.Select(x => new
        {
            x.EmployeeNo,
            x.Name,
            x.DeviceId,
            x.DeviceName,
            x.Success,
            x.Message,
            x.CardsImported,
            x.FacesImported,
            x.FingerprintsImported
        })
    });
}).RequireAuthorization("Employees.Manage");

// Cards
app.MapGet("/api/cards", async (Guid? employeeId, Guid? visitorId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.Cards.AsNoTracking().Include(c => c.Employee).Include(c => c.Visitor).AsQueryable();
    if (employeeId.HasValue) query = query.Where(c => c.EmployeeId == employeeId);
    if (visitorId.HasValue) query = query.Where(c => c.VisitorId == visitorId);
    var list = await query.OrderBy(c => c.CardNo).ToListAsync(cancellationToken);
    return Results.Ok(list.Select(c => new CardRef(c.Id, c.CardNo, c.CardNumber, c.CardType)));
}).RequireAuthorization("Employees.View");

app.MapGet("/api/cards/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var c = await dbContext.Cards.AsNoTracking().Include(x => x.Employee).Include(x => x.Visitor).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (c is null) return Results.NotFound();
    return Results.Ok(new { c.Id, c.CardNo, c.CardNumber, EmployeeId = c.EmployeeId, VisitorId = c.VisitorId, c.CreatedUtc });
}).RequireAuthorization("Employees.View");

app.MapPost("/api/cards", async (CreateCardRequest request, AppDbContext dbContext, IDevicePersonSyncService syncService, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.CardNo))
        return Results.BadRequest(new { message = "CardNo обязателен." });
    var cardNo = request.CardNo.Trim();
    var exists = await dbContext.Cards.AnyAsync(x => x.CardNo == cardNo, cancellationToken);
    if (exists)
        return Results.Conflict(new { message = "Карта с таким номером уже существует." });

    if (request.EmployeeId.HasValue == request.VisitorId.HasValue)
        return Results.BadRequest(new { message = "Укажите либо EmployeeId, либо VisitorId (но не оба)." });

    var card = new Card
    {
        Id = Guid.NewGuid(),
        EmployeeId = request.EmployeeId,
        VisitorId = request.VisitorId,
        CardNo = cardNo,
        CardNumber = string.IsNullOrWhiteSpace(request.CardNumber) ? null : request.CardNumber.Trim(),
        CreatedUtc = DateTime.UtcNow
    };
    dbContext.Cards.Add(card);
    await dbContext.SaveChangesAsync(cancellationToken);

    var syncWarnings = new List<string>();
    var devices = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    foreach (var deviceId in request.DeviceIds ?? [])
    {
        var result = await syncService.SyncCardAsync(card.Id, deviceId, cancellationToken);
        if (!result.Success && devices.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Устройство \"{dev.Name}\": {result.Message}");
            logger.LogWarning("Sync card {CardNo} to device {DeviceId}: {Message}", cardNo, deviceId, result.Message);
        }
    }

    return Results.Created($"/api/cards/{card.Id}", new { card.Id, card.CardNo, card.CardNumber, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
}).RequireAuthorization("Credentials.Manage");

app.MapPut("/api/cards/{id:guid}", async (Guid id, UpdateCardRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var card = await dbContext.Cards.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (card is null) return Results.NotFound();
    if (!string.IsNullOrWhiteSpace(request.CardNumber))
        card.CardNumber = request.CardNumber.Trim();
    card.UpdatedUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { card.Id, card.CardNo, card.CardNumber });
}).RequireAuthorization("Credentials.Manage");

app.MapDelete("/api/cards/{id:guid}", async (Guid id, AppDbContext dbContext, IDevicePersonSyncService syncService, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    var card = await dbContext.Cards.Include(c => c.Employee).Include(c => c.Visitor).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (card is null) return Results.NotFound();
    var cardNo = card.CardNo;

    string? employeeNo = null;
    if (card.Employee != null)
        employeeNo = TruncateEmployeeNo(!string.IsNullOrWhiteSpace(card.Employee.EmployeeNo) ? card.Employee.EmployeeNo.Trim() : card.Employee.Id.ToString("N")[..32]);
    else if (card.Visitor != null)
        employeeNo = !string.IsNullOrWhiteSpace(card.Visitor.DocumentNumber)
            ? TruncateEmployeeNo(card.Visitor.DocumentNumber.Trim())
            : card.Visitor.Id.ToString("N")[..32];

    var deviceIds = await dbContext.Devices.Select(d => d.Id).ToListAsync(cancellationToken);
    var devicesDict = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    var syncWarnings = new List<string>();
    foreach (var deviceId in deviceIds)
    {
        var result = await syncService.DeleteCardFromDeviceAsync(cardNo, deviceId, employeeNo, cancellationToken);
        if (!result.Success && devicesDict.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Устройство \"{dev.Name}\": {result.Message}");
            logger.LogWarning("Delete card {CardNo} from device {DeviceId}: {Message}", cardNo, deviceId, result.Message);
        }
    }

    dbContext.Cards.Remove(card);
    await dbContext.SaveChangesAsync(cancellationToken);
    return syncWarnings.Count > 0
        ? Results.Ok(new { syncWarnings })
        : Results.NoContent();
}).RequireAuthorization("Credentials.Manage");

app.MapPost("/api/cards/{id:guid}/sync", async (Guid id, SyncToDevicesRequest request, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var results = new List<object>();
    foreach (var deviceId in request.DeviceIds ?? [])
    {
        var result = await syncService.SyncCardAsync(id, deviceId, cancellationToken);
        results.Add(new { deviceId, success = result.Success, message = result.Message });
    }
    return Results.Ok(results);
}).RequireAuthorization("Credentials.Manage");

// Faces
app.MapGet("/api/faces", async (Guid? employeeId, Guid? visitorId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.Faces.AsNoTracking().AsQueryable();
    if (employeeId.HasValue) query = query.Where(f => f.EmployeeId == employeeId);
    if (visitorId.HasValue) query = query.Where(f => f.VisitorId == visitorId);
    var list = await query.ToListAsync(cancellationToken);
    return Results.Ok(list.Select(f => new FaceRef(f.Id, f.FDID)));
}).RequireAuthorization("Employees.View");

app.MapGet("/api/faces/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var f = await dbContext.Faces.AsNoTracking().Include(x => x.Employee).Include(x => x.Visitor).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (f is null) return Results.NotFound();
    return Results.Ok(new { f.Id, f.FilePath, f.FDID, EmployeeId = f.EmployeeId, VisitorId = f.VisitorId, f.CreatedUtc });
}).RequireAuthorization("Employees.View");

app.MapGet("/api/faces/{id:guid}/image", async (Guid id, AppDbContext dbContext, IConfiguration configuration, CancellationToken cancellationToken) =>
{
    var face = await dbContext.Faces.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (face is null) return Results.NotFound();
    var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
    var fullPath = Path.Combine(facesPath, face.FilePath.TrimStart('/', '\\'));
    if (!File.Exists(fullPath)) return Results.NotFound();
    return Results.File(fullPath, "image/jpeg");
}).RequireAuthorization();

app.MapPost("/api/faces", async (HttpRequest request, AppDbContext dbContext, IDevicePersonSyncService syncService, IConfiguration configuration, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest(new { message = "Ожидается multipart/form-data." });
    var form = await request.ReadFormAsync(cancellationToken);
    var employeeId = form["EmployeeId"].FirstOrDefault() is { } eId && Guid.TryParse(eId, out var empId) ? empId : (Guid?)null;
    var visitorId = form["VisitorId"].FirstOrDefault() is { } vId && Guid.TryParse(vId, out var visId) ? visId : (Guid?)null;
    if (employeeId.HasValue == visitorId.HasValue)
        return Results.BadRequest(new { message = "Укажите либо EmployeeId, либо VisitorId." });
    var fdId = int.TryParse(form["FDID"].FirstOrDefault(), out var fdid) ? fdid : 1;
    var file = form.Files.GetFile("Image");
    if (file is null || file.Length == 0)
        return Results.BadRequest(new { message = "Файл изображения обязателен." });

    var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
    Directory.CreateDirectory(facesPath);
    var fileName = $"{Guid.NewGuid():N}.jpg";
    var filePath = Path.Combine(facesPath, fileName);
    await using (var stream = File.Create(filePath))
        await file.CopyToAsync(stream, cancellationToken);

    var face = new Face
    {
        Id = Guid.NewGuid(),
        EmployeeId = employeeId,
        VisitorId = visitorId,
        FilePath = fileName,
        FDID = fdId,
        CreatedUtc = DateTime.UtcNow
    };
    dbContext.Faces.Add(face);
    await dbContext.SaveChangesAsync(cancellationToken);

    var deviceIds = new HashSet<Guid>();
    if (employeeId.HasValue)
    {
        var empDeviceIds = await dbContext.Set<EmployeeAccessLevel>()
            .Where(eal => eal.EmployeeId == employeeId.Value)
            .SelectMany(eal => eal.AccessLevel!.Doors.Select(d => d.DeviceId))
            .Distinct()
            .ToListAsync(cancellationToken);
        foreach (var did in empDeviceIds) deviceIds.Add(did);
    }
    else if (visitorId.HasValue)
    {
        var visDeviceIds = await dbContext.Set<VisitorAccessLevel>()
            .Where(val => val.VisitorId == visitorId.Value)
            .SelectMany(val => val.AccessLevel!.Doors.Select(d => d.DeviceId))
            .Distinct()
            .ToListAsync(cancellationToken);
        foreach (var did in visDeviceIds) deviceIds.Add(did);
    }

    var syncWarnings = new List<string>();
    var devices = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    foreach (var deviceId in deviceIds)
    {
        var result = await syncService.SyncFaceAsync(face.Id, deviceId, cancellationToken);
        if (!result.Success && devices.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Лицо → \"{dev.Name}\": {result.Message}");
            logger.LogWarning("Sync face {FaceId} to device {DeviceId}: {Message}", face.Id, deviceId, result.Message);
        }
    }

    return Results.Created($"/api/faces/{face.Id}", new { face.Id, face.FilePath, face.FDID, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
}).RequireAuthorization("Credentials.Manage");

app.MapDelete("/api/faces/{id:guid}", async (Guid id, AppDbContext dbContext, IDevicePersonSyncService syncService, IConfiguration configuration, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    var face = await dbContext.Faces.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (face is null) return Results.NotFound();

    // Determine devices from access levels
    var deviceIds = new HashSet<Guid>();
    if (face.EmployeeId.HasValue)
    {
        var ids = await dbContext.Set<EmployeeAccessLevel>()
            .Where(eal => eal.EmployeeId == face.EmployeeId.Value)
            .SelectMany(eal => eal.AccessLevel!.Doors.Select(d => d.DeviceId))
            .Distinct().ToListAsync(cancellationToken);
        foreach (var did in ids) deviceIds.Add(did);
    }
    else if (face.VisitorId.HasValue)
    {
        var ids = await dbContext.Set<VisitorAccessLevel>()
            .Where(val => val.VisitorId == face.VisitorId.Value)
            .SelectMany(val => val.AccessLevel!.Doors.Select(d => d.DeviceId))
            .Distinct().ToListAsync(cancellationToken);
        foreach (var did in ids) deviceIds.Add(did);
    }

    var syncWarnings = new List<string>();
    var devices = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    foreach (var deviceId in deviceIds)
    {
        var result = await syncService.DeleteFaceFromDeviceAsync(id, deviceId, cancellationToken);
        if (!result.Success && devices.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Лицо → \"{dev.Name}\": {result.Message}");
            logger.LogWarning("DeleteFace {FaceId} from device {DeviceId}: {Message}", id, deviceId, result.Message);
        }
    }

    var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
    var fullPath = Path.Combine(facesPath, face.FilePath.TrimStart('/', '\\'));
    if (File.Exists(fullPath)) File.Delete(fullPath);
    dbContext.Faces.Remove(face);
    await dbContext.SaveChangesAsync(cancellationToken);

    return syncWarnings.Count > 0
        ? Results.Ok(new { syncWarnings })
        : Results.NoContent();
}).RequireAuthorization("Credentials.Manage");

app.MapPost("/api/faces/{id:guid}/sync", async (Guid id, SyncToDevicesRequest request, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var results = new List<object>();
    foreach (var deviceId in request.DeviceIds ?? [])
    {
        var result = await syncService.SyncFaceAsync(id, deviceId, cancellationToken);
        results.Add(new { deviceId, success = result.Success, message = result.Message });
    }
    return Results.Ok(results);
}).RequireAuthorization("Credentials.Manage");

// Fingerprints
app.MapGet("/api/fingerprints", async (Guid? employeeId, Guid? visitorId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.Fingerprints.AsNoTracking().AsQueryable();
    if (employeeId.HasValue) query = query.Where(f => f.EmployeeId == employeeId);
    if (visitorId.HasValue) query = query.Where(f => f.VisitorId == visitorId);
    var list = await query.ToListAsync(cancellationToken);
    return Results.Ok(list.Select(f => new FingerprintRef(f.Id, f.FingerIndex)));
}).RequireAuthorization("Employees.View");

app.MapGet("/api/fingerprints/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var f = await dbContext.Fingerprints.AsNoTracking().Include(x => x.Employee).Include(x => x.Visitor).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (f is null) return Results.NotFound();
    return Results.Ok(new { f.Id, f.FingerIndex, EmployeeId = f.EmployeeId, VisitorId = f.VisitorId, f.CreatedUtc });
}).RequireAuthorization("Employees.View");

app.MapPost("/api/fingerprints", async (CreateFingerprintRequest request, AppDbContext dbContext, IDevicePersonSyncService syncService, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    if (request.EmployeeId.HasValue == request.VisitorId.HasValue)
        return Results.BadRequest(new { message = "Укажите либо EmployeeId, либо VisitorId." });
    if (request.TemplateData is null || request.TemplateData.Length == 0)
        return Results.BadRequest(new { message = "TemplateData (base64) обязателен." });
    byte[] templateData;
    try { templateData = Convert.FromBase64String(request.TemplateData); }
    catch { return Results.BadRequest(new { message = "TemplateData должен быть в формате base64." }); }
    var fingerIndex = Math.Clamp(request.FingerIndex, 1, 10);

    var fp = new Fingerprint
    {
        Id = Guid.NewGuid(),
        EmployeeId = request.EmployeeId,
        VisitorId = request.VisitorId,
        TemplateData = templateData,
        FingerIndex = fingerIndex,
        CreatedUtc = DateTime.UtcNow
    };
    dbContext.Fingerprints.Add(fp);
    await dbContext.SaveChangesAsync(cancellationToken);

    var syncWarnings = new List<string>();
    var devices = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    foreach (var deviceId in request.DeviceIds ?? [])
    {
        var result = await syncService.SyncFingerprintAsync(fp.Id, deviceId, cancellationToken);
        if (!result.Success && devices.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Устройство \"{dev.Name}\": {result.Message}");
            logger.LogWarning("Sync fingerprint {FpId} to device {DeviceId}: {Message}", fp.Id, deviceId, result.Message);
        }
    }

    return Results.Created($"/api/fingerprints/{fp.Id}", new { fp.Id, fp.FingerIndex, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
}).RequireAuthorization("Credentials.Manage");

app.MapDelete("/api/fingerprints/{id:guid}", async (Guid id, AppDbContext dbContext, IDevicePersonSyncService syncService, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    var fp = await dbContext.Fingerprints.Include(f => f.Employee).Include(f => f.Visitor).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (fp is null) return Results.NotFound();
    var employeeNo = fp.Employee != null
        ? TruncateEmployeeNo(!string.IsNullOrWhiteSpace(fp.Employee.EmployeeNo) ? fp.Employee.EmployeeNo.Trim() : fp.Employee.Id.ToString("N")[..32])
        : (!string.IsNullOrWhiteSpace(fp.Visitor!.DocumentNumber)
            ? TruncateEmployeeNo(fp.Visitor.DocumentNumber.Trim())
            : fp.Visitor.Id.ToString("N")[..32]);

    var deviceIds = await dbContext.Devices.Select(d => d.Id).ToListAsync(cancellationToken);
    var devicesDict = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    var syncWarnings = new List<string>();
    if (deviceIds.Count == 0)
    {
        syncWarnings.Add("В системе нет зарегистрированных устройств — отпечаток на терминале не удалялся.");
        return Results.Ok(new { syncWarnings });
    }

    foreach (var deviceId in deviceIds)
    {
        var result = await syncService.DeleteFingerprintFromDeviceAsync(fp.Id, deviceId, cancellationToken);
        if (!result.Success && devicesDict.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Устройство \"{dev.Name}\": {result.Message}");
            logger.LogWarning("Delete fingerprint from device {DeviceId}: {Message}", deviceId, result.Message);
        }
    }

    if (syncWarnings.Count > 0)
        return Results.Ok(new { syncWarnings });

    dbContext.Fingerprints.Remove(fp);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("Credentials.Manage");

app.MapDelete("/api/irises/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var iris = await dbContext.Irises.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (iris is null) return Results.NotFound();
    dbContext.Irises.Remove(iris);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("Credentials.Manage");

app.MapPost("/api/fingerprints/{id:guid}/sync", async (Guid id, SyncToDevicesRequest request, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var results = new List<object>();
    foreach (var deviceId in request.DeviceIds ?? [])
    {
        var result = await syncService.SyncFingerprintAsync(id, deviceId, cancellationToken);
        results.Add(new { deviceId, success = result.Success, message = result.Message });
    }
    return Results.Ok(results);
}).RequireAuthorization("Credentials.Manage");

app.MapGet("/api/system/status", async (
    ISystemStatusService systemStatusService,
    CancellationToken cancellationToken) =>
{
    var status = await systemStatusService.GetSnapshotAsync(cancellationToken);
    return Results.Ok(new SystemStatusResponse(
        status.ServerStatus,
        status.Service.ServiceName,
        status.Service.State.ToString(),
        status.Service.Message,
        status.Database.IsConnected ? "Connected" : "Disconnected",
        status.Database.LatencyMs,
        status.Database.Message,
        status.Utc));
}).AllowAnonymous();

app.MapGet("/api/system/services", async (
    IServiceControlManager serviceControlManager,
    CancellationToken cancellationToken) =>
{
    var services = await serviceControlManager.GetManagedServicesAsync(cancellationToken);
    return Results.Ok(services.Select(x => new ManagedServiceResponse(
        x.Key,
        x.ServiceName,
        x.DisplayName,
        x.Port,
        x.IsControllable,
        x.State.ToString(),
        x.Message)));
}).AllowAnonymous();

app.MapPost("/api/system/service/{action}", async (
    string action,
    HttpContext httpContext,
    IServiceControlManager serviceControlManager,
    IOptions<SystemMonitorOptions> options,
    CancellationToken cancellationToken) =>
{
    var guardResult = ValidateLocalControlRequest(httpContext, options.Value.LocalControlKey);
    if (guardResult is not null)
    {
        return guardResult;
    }

    var operation = action.ToLowerInvariant();
    ServiceControlResult result = operation switch
    {
        "start" => await serviceControlManager.StartAsync(cancellationToken),
        "stop" => await serviceControlManager.StopAsync(cancellationToken),
        "restart" => await serviceControlManager.RestartAsync(cancellationToken),
        _ => new ServiceControlResult(false, new ManagedServiceStatus(options.Value.ServiceName, ManagedServiceState.Unknown, "Unknown action."))
    };

    if (operation is not ("start" or "stop" or "restart"))
    {
        return Results.BadRequest(new { message = "Action must be start|stop|restart." });
    }

    return Results.Ok(new ServiceControlResponse(
        result.Success,
        result.Status.ServiceName,
        result.Status.State.ToString(),
        result.Status.Message));
}).RequireAuthorization("System.Manage");

app.MapPost("/api/system/services/{key}/{action}", async (
    string key,
    string action,
    HttpContext httpContext,
    IServiceControlManager serviceControlManager,
    IOptions<SystemMonitorOptions> options,
    CancellationToken cancellationToken) =>
{
    var guardResult = ValidateLocalControlRequest(httpContext, options.Value.LocalControlKey);
    if (guardResult is not null)
    {
        return guardResult;
    }

    if (action is not ("start" or "stop" or "restart"))
    {
        return Results.BadRequest(new { message = "Action must be start|stop|restart." });
    }

    var result = await serviceControlManager.ControlByKeyAsync(key, action, cancellationToken);
    return Results.Ok(new ServiceControlResponse(
        result.Success,
        result.Status.ServiceName,
        result.Status.State.ToString(),
        result.Status.Message));
}).RequireAuthorization("System.Manage");

app.MapPost("/api/system/services/{action}-all", async (
    string action,
    HttpContext httpContext,
    IServiceControlManager serviceControlManager,
    IOptions<SystemMonitorOptions> options,
    CancellationToken cancellationToken) =>
{
    var guardResult = ValidateLocalControlRequest(httpContext, options.Value.LocalControlKey);
    if (guardResult is not null)
    {
        return guardResult;
    }

    if (action is not ("start" or "stop" or "restart"))
    {
        return Results.BadRequest(new { message = "Action must be start|stop|restart." });
    }

    var results = await serviceControlManager.ControlAllAsync(action, cancellationToken);
    var payload = results.Select(result => new ServiceControlResponse(
        result.Success,
        result.Status.ServiceName,
        result.Status.State.ToString(),
        result.Status.Message));
    return Results.Ok(payload);
}).RequireAuthorization("System.Manage");

// ─── Work Schedules ───────────────────────────────────────────────────────────

app.MapGet("/api/work-schedules", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var schedules = await dbContext.WorkSchedules.AsNoTracking()
        .Include(s => s.Shifts.OrderBy(sh => sh.SortOrder))
        .OrderBy(s => s.Name)
        .ToListAsync(cancellationToken);
    var result = schedules.Select(s => new WorkScheduleResponse(
        s.Id, s.Name, s.Type.ToString(), s.ShiftStart, s.ShiftEnd, s.RequiredHoursPerDay, s.Color, s.CreatedUtc,
        s.Shifts.Count > 0 ? s.Shifts.OrderBy(sh => sh.SortOrder).Select(sh => new WorkScheduleShiftDto(sh.Id, sh.Name, sh.ShiftStart, sh.ShiftEnd, sh.ValidEntryFrom, sh.ValidEntryTo, sh.RequiredHoursPerDay, sh.SortOrder)).ToArray() : null,
        s.CountEarlyArrival, s.OvertimeDailyThresholdMinutes
    )).ToList();
    return Results.Ok(result);
}).RequireAuthorization("Schedules.View");

app.MapGet("/api/work-schedules/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var s = await dbContext.WorkSchedules.AsNoTracking()
        .Include(ws => ws.Shifts.OrderBy(sh => sh.SortOrder))
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (s is null) return Results.NotFound();
    var shiftsDto = s.Shifts.Count > 0 ? s.Shifts.OrderBy(sh => sh.SortOrder).Select(sh => new WorkScheduleShiftDto(sh.Id, sh.Name, sh.ShiftStart, sh.ShiftEnd, sh.ValidEntryFrom, sh.ValidEntryTo, sh.RequiredHoursPerDay, sh.SortOrder)).ToArray() : null;
    return Results.Ok(new WorkScheduleResponse(s.Id, s.Name, s.Type.ToString(), s.ShiftStart, s.ShiftEnd, s.RequiredHoursPerDay, s.Color, s.CreatedUtc, shiftsDto, s.CountEarlyArrival, s.OvertimeDailyThresholdMinutes));
}).RequireAuthorization("Schedules.View");

app.MapPost("/api/work-schedules", async (CreateWorkScheduleRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    if (!Enum.TryParse<ScheduleType>(request.Type, true, out var scheduleType))
        return Results.BadRequest(new { message = "Неверный тип расписания. Допустимые значения: Standard, Shift, Flexible, Multi, Off." });
    var entity = new WorkSchedule
    {
        Name = request.Name.Trim(),
        Type = scheduleType,
        ShiftStart = request.ShiftStart,
        ShiftEnd = request.ShiftEnd,
        RequiredHoursPerDay = request.RequiredHoursPerDay ?? 8m,
        Color = !string.IsNullOrWhiteSpace(request.Color) ? request.Color.Trim() : "#6366f1",
        CountEarlyArrival = request.CountEarlyArrival ?? true,
        OvertimeDailyThresholdMinutes = Math.Max(0, request.OvertimeDailyThresholdMinutes ?? 0),
    };
    dbContext.WorkSchedules.Add(entity);
    if (scheduleType == ScheduleType.Multi && request.Shifts is { Length: > 0 })
    {
        foreach (var sh in request.Shifts)
        {
            dbContext.WorkScheduleShifts.Add(new WorkScheduleShift
            {
                WorkScheduleId = entity.Id,
                Name = sh.Name.Trim(),
                ShiftStart = sh.ShiftStart,
                ShiftEnd = sh.ShiftEnd,
                ValidEntryFrom = sh.ValidEntryFrom,
                ValidEntryTo = sh.ValidEntryTo,
                RequiredHoursPerDay = sh.RequiredHoursPerDay,
                SortOrder = sh.SortOrder,
            });
        }
    }
    await dbContext.SaveChangesAsync(cancellationToken);
    var shiftsDto = scheduleType == ScheduleType.Multi && request.Shifts is { Length: > 0 }
        ? request.Shifts.OrderBy(sh => sh.SortOrder).Select(sh => new WorkScheduleShiftDto(null, sh.Name, sh.ShiftStart, sh.ShiftEnd, sh.ValidEntryFrom, sh.ValidEntryTo, sh.RequiredHoursPerDay, sh.SortOrder)).ToArray()
        : null;
    return Results.Created($"/api/work-schedules/{entity.Id}", new WorkScheduleResponse(entity.Id, entity.Name, entity.Type.ToString(), entity.ShiftStart, entity.ShiftEnd, entity.RequiredHoursPerDay, entity.Color, entity.CreatedUtc, shiftsDto, entity.CountEarlyArrival, entity.OvertimeDailyThresholdMinutes));
}).RequireAuthorization("Schedules.Manage");

app.MapPut("/api/work-schedules/{id:guid}", async (Guid id, CreateWorkScheduleRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.WorkSchedules
        .Include(ws => ws.Shifts)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null) return Results.NotFound();
    if (!Enum.TryParse<ScheduleType>(request.Type, true, out var scheduleType))
        return Results.BadRequest(new { message = "Неверный тип расписания." });
    entity.Name = request.Name.Trim();
    entity.Type = scheduleType;
    entity.ShiftStart = request.ShiftStart;
    entity.ShiftEnd = request.ShiftEnd;
    entity.RequiredHoursPerDay = request.RequiredHoursPerDay ?? 8m;
    entity.Color = !string.IsNullOrWhiteSpace(request.Color) ? request.Color.Trim() : entity.Color;
    if (request.CountEarlyArrival.HasValue) entity.CountEarlyArrival = request.CountEarlyArrival.Value;
    if (request.OvertimeDailyThresholdMinutes.HasValue) entity.OvertimeDailyThresholdMinutes = Math.Max(0, request.OvertimeDailyThresholdMinutes.Value);
    entity.UpdatedUtc = DateTime.UtcNow;
    // Replace shifts for Multi schedules
    dbContext.WorkScheduleShifts.RemoveRange(entity.Shifts);
    if (scheduleType == ScheduleType.Multi && request.Shifts is { Length: > 0 })
    {
        foreach (var sh in request.Shifts)
        {
            dbContext.WorkScheduleShifts.Add(new WorkScheduleShift
            {
                WorkScheduleId = entity.Id,
                Name = sh.Name.Trim(),
                ShiftStart = sh.ShiftStart,
                ShiftEnd = sh.ShiftEnd,
                ValidEntryFrom = sh.ValidEntryFrom,
                ValidEntryTo = sh.ValidEntryTo,
                RequiredHoursPerDay = sh.RequiredHoursPerDay,
                SortOrder = sh.SortOrder,
            });
        }
    }
    await dbContext.SaveChangesAsync(cancellationToken);
    var shiftsDto = scheduleType == ScheduleType.Multi && request.Shifts is { Length: > 0 }
        ? request.Shifts.OrderBy(sh => sh.SortOrder).Select(sh => new WorkScheduleShiftDto(null, sh.Name, sh.ShiftStart, sh.ShiftEnd, sh.ValidEntryFrom, sh.ValidEntryTo, sh.RequiredHoursPerDay, sh.SortOrder)).ToArray()
        : null;
    return Results.Ok(new WorkScheduleResponse(entity.Id, entity.Name, entity.Type.ToString(), entity.ShiftStart, entity.ShiftEnd, entity.RequiredHoursPerDay, entity.Color, entity.CreatedUtc, shiftsDto, entity.CountEarlyArrival, entity.OvertimeDailyThresholdMinutes));
}).RequireAuthorization("Schedules.Manage");

// Returns the current assignment state for a schedule: which employees are assigned,
// the date range (min/max of their day patterns), and days-of-week derived from pattern dates.
app.MapGet("/api/work-schedules/{id:guid}/assignment", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    // Employees assigned via default WorkScheduleId
    var empWithDefault = await dbContext.Employees.AsNoTracking()
        .Where(e => e.IsActive && e.WorkScheduleId == id)
        .Select(e => e.Id)
        .ToListAsync(cancellationToken);

    // Day patterns for this schedule
    var patterns = await dbContext.EmployeeDayPatterns.AsNoTracking()
        .Where(p => p.WorkScheduleId == id)
        .Select(p => new { p.EmployeeId, p.Date })
        .ToListAsync(cancellationToken);

    var empWithPatterns = patterns.Select(p => p.EmployeeId).Distinct().ToList();
    var allEmpIds = empWithDefault.Union(empWithPatterns).Distinct().ToList();

    DateOnly? fromDate = patterns.Count > 0 ? patterns.Min(p => p.Date) : null;
    DateOnly? toDate   = patterns.Count > 0 ? patterns.Max(p => p.Date) : null;

    // Derive distinct days of week (1=Mon … 7=Sun, ISO) from pattern dates
    var daysOfWeek = patterns
        .Select(p => p.Date.DayOfWeek == DayOfWeek.Sunday ? 7 : (int)p.Date.DayOfWeek)
        .Distinct()
        .OrderBy(d => d)
        .ToList();

    return Results.Ok(new
    {
        employeeIds = allEmpIds,
        fromDate = fromDate?.ToString("yyyy-MM-dd"),
        toDate   = toDate?.ToString("yyyy-MM-dd"),
        daysOfWeek,
    });
}).RequireAuthorization("Schedules.View");

app.MapDelete("/api/work-schedules/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.WorkSchedules.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null) return Results.NotFound();
    dbContext.WorkSchedules.Remove(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("Schedules.Manage");

// Bulk-assign default schedule to multiple employees (sets Employee.WorkScheduleId).
app.MapPut("/api/employees/bulk-schedule", async (
    BulkAssignScheduleRequest request,
    AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    if (request.EmployeeIds is null || request.EmployeeIds.Length == 0)
        return Results.BadRequest(new { message = "No employee IDs provided." });
    var employees = await dbContext.Employees
        .Where(e => request.EmployeeIds.Contains(e.Id))
        .ToListAsync(cancellationToken);
    foreach (var emp in employees)
    {
        emp.WorkScheduleId = request.ScheduleId;
        emp.UpdatedUtc = DateTime.UtcNow;
    }
    // When removing the schedule (null), delete ALL day-pattern assignments for these employees
    // so old patterns don't keep overriding in the attendance report.
    if (request.ScheduleId == null)
    {
        var patterns = await dbContext.EmployeeDayPatterns
            .Where(p => request.EmployeeIds.Contains(p.EmployeeId) && p.WorkScheduleId != null)
            .ToListAsync(cancellationToken);
        dbContext.EmployeeDayPatterns.RemoveRange(patterns);
    }
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { count = employees.Count });
}).RequireAuthorization("Schedules.Manage");

// Bulk-assign day patterns for multiple employees in a single transaction.
// If ReplaceScheduleId is provided, deletes ALL old patterns for that schedule
// before writing new ones — so re-assigning always produces a clean state.
app.MapPut("/api/schedule-planner/bulk-days", async (
    BulkSchedulePlannerRequest request,
    AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    if (request.EmployeeIds is null || request.EmployeeIds.Length == 0)
        return Results.BadRequest(new { message = "No employee IDs provided." });
    if (request.Days is null || request.Days.Length == 0)
        return Results.BadRequest(new { message = "No days provided." });

    var newDates = request.Days.Select(d => d.Date).ToArray();

    // Delete ALL existing patterns for these employees on the target dates
    // (regardless of WorkScheduleId) to avoid UNIQUE(EmployeeId, Date) violations.
    var existing = await dbContext.EmployeeDayPatterns
        .Where(p => request.EmployeeIds.Contains(p.EmployeeId) && newDates.Contains(p.Date))
        .ToListAsync(cancellationToken);
    dbContext.EmployeeDayPatterns.RemoveRange(existing);

    // Also delete any patterns with the replaced schedule outside the new date range
    // so old assignments don't linger beyond the new range.
    if (request.ReplaceScheduleId.HasValue)
    {
        var oldOutside = await dbContext.EmployeeDayPatterns
            .Where(p => request.EmployeeIds.Contains(p.EmployeeId)
                     && p.WorkScheduleId == request.ReplaceScheduleId.Value
                     && !newDates.Contains(p.Date))
            .ToListAsync(cancellationToken);
        dbContext.EmployeeDayPatterns.RemoveRange(oldOutside);
    }

    // Insert fresh patterns for the new date range + days of week.
    foreach (var empId in request.EmployeeIds)
    {
        foreach (var day in request.Days)
        {
            dbContext.EmployeeDayPatterns.Add(new EmployeeDayPattern
            {
                Id = Guid.NewGuid(),
                EmployeeId = empId,
                Date = day.Date,
                IsDayOff = false,
                WorkScheduleId = day.ScheduleId,
                CreatedUtc = DateTime.UtcNow,
            });
        }
    }

    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("Schedules.Manage");

// ─── Schedule Planner ─────────────────────────────────────────────────────────

app.MapGet("/api/schedule-planner", async (DateOnly? from, DateOnly? to, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var fromDate = from ?? new DateOnly(today.Year, today.Month, 1);
    var toDate = to ?? new DateOnly(today.Year, today.Month, DateTime.DaysInMonth(today.Year, today.Month));

    var scheduleEntities = await dbContext.WorkSchedules.AsNoTracking()
        .OrderBy(s => s.Name)
        .ToListAsync(cancellationToken);

    var allShifts = await dbContext.WorkScheduleShifts.AsNoTracking()
        .OrderBy(sh => sh.SortOrder)
        .ToListAsync(cancellationToken);

    var shiftsBySchedule = allShifts.GroupBy(sh => sh.WorkScheduleId)
        .ToDictionary(g => g.Key, g => g.ToList());

    var scheduleDtos = scheduleEntities.Select(s => new
    {
        id = s.Id,
        name = s.Name,
        type = s.Type.ToString(),
        shiftStart = s.ShiftStart?.ToString(@"hh\:mm"),
        shiftEnd = s.ShiftEnd?.ToString(@"hh\:mm"),
        requiredHoursPerDay = s.RequiredHoursPerDay,
        color = s.Color,
        shifts = shiftsBySchedule.TryGetValue(s.Id, out var sh) ? sh.Select(x => new
        {
            id = x.Id,
            name = x.Name,
            shiftStart = x.ShiftStart.ToString(@"hh\:mm"),
            shiftEnd = x.ShiftEnd.ToString(@"hh\:mm"),
            validEntryFrom = x.ValidEntryFrom.ToString(@"hh\:mm"),
            validEntryTo = x.ValidEntryTo.ToString(@"hh\:mm"),
            requiredHoursPerDay = x.RequiredHoursPerDay,
        }).ToArray() : Array.Empty<object>(),
    }).ToList();

    var employees = await dbContext.Employees.AsNoTracking()
        .Where(e => e.IsActive && (e.WorkScheduleId != null || e.DayPatterns.Any(dp => dp.Date >= fromDate && dp.Date <= toDate)))
        .Include(e => e.WorkSchedule)
        .Include(e => e.DayPatterns.Where(dp => dp.Date >= fromDate && dp.Date <= toDate))
            .ThenInclude(dp => dp.WorkSchedule)
        .OrderBy(e => e.FirstName).ThenBy(e => e.LastName)
        .ToListAsync(cancellationToken);

    var leaves = await dbContext.EmployeeLeaves.AsNoTracking()
        .Where(l => l.StartDate <= toDate && l.EndDate >= fromDate && l.Status != LeaveStatus.Rejected && l.Status != LeaveStatus.Cancelled)
        .ToListAsync(cancellationToken);

    var fromDt = DateTime.SpecifyKind(fromDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
    var toDt = DateTime.SpecifyKind(toDate.ToDateTime(TimeOnly.MaxValue), DateTimeKind.Utc);
    var selfServiceRequests = await dbContext.AttendanceRequests.AsNoTracking()
        .Where(r => (r.Type == AttendanceRequestType.Absence || r.Type == AttendanceRequestType.Vacation || r.Type == AttendanceRequestType.Overtime)
                    && r.Status != AttendanceRequestStatus.Rejected
                    && r.RequestedTimeUtc <= toDt
                    && (r.RequestedEndTimeUtc == null ? r.RequestedTimeUtc >= fromDt : r.RequestedEndTimeUtc >= fromDt))
        .ToListAsync(cancellationToken);

    var empResult = employees.Select(e =>
    {
        // Merge explicit DayPatterns + leave-only dates (leaves without a DayPattern)
        var patternDates = e.DayPatterns.Select(p => p.Date).ToHashSet();
        var empLeaves = leaves.Where(l => l.EmployeeId == e.Id).ToList();

        // Build leave-only dates not covered by DayPatterns
        var leaveDates = new List<DateOnly>();
        foreach (var lv in empLeaves)
        {
            for (var d = lv.StartDate > fromDate ? lv.StartDate : fromDate;
                 d <= (lv.EndDate < toDate ? lv.EndDate : toDate);
                 d = d.AddDays(1))
            {
                if (!patternDates.Contains(d)) leaveDates.Add(d);
            }
        }

        object BuildDate(DateOnly date, Guid? scheduleId, string? scheduleName, string? shiftStart, string? shiftEnd, bool isDayOff)
        {
            var leave = empLeaves.FirstOrDefault(l => l.StartDate <= date && l.EndDate >= date);
            var req = selfServiceRequests.FirstOrDefault(r => {
                if (r.EmployeeId != e.Id) return false;
                var reqStart = DateOnly.FromDateTime(r.RequestedTimeUtc);
                var reqEnd = r.RequestedEndTimeUtc.HasValue ? DateOnly.FromDateTime(r.RequestedEndTimeUtc.Value) : reqStart;
                return reqStart <= date && reqEnd >= date;
            });
            return new
            {
                date = date.ToString("yyyy-MM-dd"),
                scheduleId,
                scheduleName,
                shiftStart,
                shiftEnd,
                isDayOff,
                leaveId = leave?.Id,
                leaveType = leave?.LeaveType.ToString(),
                leaveIsPaid = leave?.IsPaid,
                leaveStatus = leave?.Status.ToString(),
                leaveReason = leave?.Reason,
                requestId = req?.Id,
                requestType = req?.Type.ToString(),
                requestStatus = req?.Status.ToString(),
                requestComment = req?.Comment,
            };
        }

        var dates = e.DayPatterns
            .Select(p => BuildDate(p.Date, p.WorkScheduleId, p.WorkSchedule?.Name,
                p.WorkSchedule?.ShiftStart?.ToString(@"hh\:mm"), p.WorkSchedule?.ShiftEnd?.ToString(@"hh\:mm"), p.IsDayOff))
            .Concat(leaveDates.Select(d => BuildDate(d, null, null, null, null, false)))
            .OrderBy(x => ((dynamic)x).date)
            .ToArray();

        return new
        {
            employeeId = e.Id,
            employeeName = e.FirstName + " " + e.LastName,
            defaultScheduleId = e.WorkScheduleId,
            defaultScheduleName = e.WorkSchedule?.Name,
            defaultShiftStart = e.WorkSchedule?.ShiftStart?.ToString(@"hh\:mm"),
            defaultShiftEnd = e.WorkSchedule?.ShiftEnd?.ToString(@"hh\:mm"),
            defaultColor = e.WorkSchedule?.Color,
            dates,
        };
    });

    return Results.Ok(new { schedules = scheduleDtos, employees = empResult });
}).RequireAuthorization("Schedules.View");

app.MapPut("/api/schedule-planner/{employeeId:guid}/days", async (
    Guid employeeId,
    SchedulePlannerDayRequest[] request,
    AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var employee = await dbContext.Employees.FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken);
    if (employee is null) return Results.NotFound();

    var dates = request.Select(r => r.Date).ToArray();
    var existing = await dbContext.EmployeeDayPatterns
        .Where(p => p.EmployeeId == employeeId && dates.Contains(p.Date))
        .ToListAsync(cancellationToken);

    foreach (var req in request)
    {
        var pattern = existing.FirstOrDefault(p => p.Date == req.Date);

        if (req.Reset)
        {
            if (pattern is not null) dbContext.EmployeeDayPatterns.Remove(pattern);
            continue;
        }

        if (pattern is null)
        {
            pattern = new EmployeeDayPattern { Id = Guid.NewGuid(), EmployeeId = employeeId, Date = req.Date, CreatedUtc = DateTime.UtcNow };
            dbContext.EmployeeDayPatterns.Add(pattern);
        }

        pattern.IsDayOff = req.IsDayOff;
        pattern.WorkScheduleId = req.IsDayOff ? null : req.ScheduleId;
        pattern.UpdatedUtc = DateTime.UtcNow;
    }

    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("Schedules.Manage");

// ─── Leaves ────────────────────────────────────────────────────────────────────

app.MapGet("/api/leaves", async (AppDbContext db, Guid? employeeId, DateOnly? from, DateOnly? to, CancellationToken ct) =>
{
    var q = db.EmployeeLeaves.Include(l => l.Employee).ThenInclude(e => e.Department).AsNoTracking().AsQueryable();
    if (employeeId.HasValue) q = q.Where(l => l.EmployeeId == employeeId.Value);
    if (from.HasValue) q = q.Where(l => l.EndDate >= from.Value);
    if (to.HasValue) q = q.Where(l => l.StartDate <= to.Value);
    var list = await q.OrderByDescending(l => l.StartDate).ToListAsync(ct);
    return Results.Ok(list.Select(l => new {
        l.Id, l.EmployeeId,
        employeeName = $"{l.Employee.FirstName} {l.Employee.LastName}",
        department = l.Employee.Department?.Name,
        leaveType = l.LeaveType.ToString(),
        l.IsPaid, l.StartDate, l.EndDate, l.Reason,
        status = l.Status.ToString(), l.Notes, l.ApprovedAt
    }));
}).RequireAuthorization("Leaves.View");

app.MapPost("/api/leaves", async (CreateLeaveRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (!Enum.TryParse<LeaveType>(req.LeaveType, true, out var lt))
        return Results.BadRequest(new { message = "Invalid leaveType. Use Vacation or DayOff." });
    var emp = await db.Employees.FirstOrDefaultAsync(e => e.Id == req.EmployeeId, ct);
    if (emp is null) return Results.NotFound(new { message = "Employee not found." });
    if (req.EndDate < req.StartDate) return Results.BadRequest(new { message = "EndDate must be >= StartDate." });
    var leave = new EmployeeLeave {
        EmployeeId = req.EmployeeId, LeaveType = lt, IsPaid = req.IsPaid,
        StartDate = req.StartDate, EndDate = req.EndDate,
        Reason = req.Reason, Notes = req.Notes, Status = LeaveStatus.Pending
    };
    db.EmployeeLeaves.Add(leave);
    await db.SaveChangesAsync(ct);
    return Results.Created($"/api/leaves/{leave.Id}", new { leave.Id, leave.EmployeeId, leaveType = leave.LeaveType.ToString(), leave.IsPaid, leave.StartDate, leave.EndDate, leave.Reason, status = leave.Status.ToString() });
}).RequireAuthorization("Leaves.Manage");

app.MapPut("/api/leaves/{id:guid}", async (Guid id, UpdateLeaveRequest req, AppDbContext db, CancellationToken ct) =>
{
    var leave = await db.EmployeeLeaves.FirstOrDefaultAsync(l => l.Id == id, ct);
    if (leave is null) return Results.NotFound();
    if (leave.Status == LeaveStatus.Approved) return Results.BadRequest(new { message = "Cannot edit an approved leave." });
    if (!Enum.TryParse<LeaveType>(req.LeaveType, true, out var lt)) return Results.BadRequest(new { message = "Invalid leaveType." });
    leave.LeaveType = lt; leave.IsPaid = req.IsPaid; leave.StartDate = req.StartDate;
    leave.EndDate = req.EndDate; leave.Reason = req.Reason; leave.Notes = req.Notes;
    leave.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { leave.Id, leaveType = leave.LeaveType.ToString(), leave.IsPaid, leave.StartDate, leave.EndDate, leave.Reason, status = leave.Status.ToString() });
}).RequireAuthorization("Leaves.Manage");

app.MapDelete("/api/leaves/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var leave = await db.EmployeeLeaves.FirstOrDefaultAsync(l => l.Id == id, ct);
    if (leave is null) return Results.NotFound();
    db.EmployeeLeaves.Remove(leave);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization("Leaves.Manage");

app.MapPost("/api/leaves/{id:guid}/approve", async (Guid id, AppDbContext db, ClaimsPrincipal user, CancellationToken ct) =>
{
    var leave = await db.EmployeeLeaves.FirstOrDefaultAsync(l => l.Id == id, ct);
    if (leave is null) return Results.NotFound();
    leave.Status = LeaveStatus.Approved;
    leave.ApprovedAt = DateTime.UtcNow;
    if (Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var uid)) leave.ApprovedByUserId = uid;
    leave.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { leave.Id, status = leave.Status.ToString() });
}).RequireAuthorization("Leaves.Manage");

app.MapPost("/api/leaves/{id:guid}/reject", async (Guid id, NoteRequest? req, AppDbContext db, CancellationToken ct) =>
{
    var leave = await db.EmployeeLeaves.FirstOrDefaultAsync(l => l.Id == id, ct);
    if (leave is null) return Results.NotFound();
    leave.Status = LeaveStatus.Rejected;
    if (req?.Note is not null) leave.Notes = req.Note;
    leave.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { leave.Id, status = leave.Status.ToString() });
}).RequireAuthorization("Leaves.Manage");

// ─── Attendance Records ────────────────────────────────────────────────────────

app.MapGet("/api/attendance", async (Guid? employeeId, DateTime? from, DateTime? to, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.AttendanceRecords.AsNoTracking()
        .Include(r => r.Employee)
        .AsQueryable();
    if (employeeId.HasValue) query = query.Where(r => r.EmployeeId == employeeId.Value);
    if (from.HasValue) query = query.Where(r => r.EventTimeUtc >= from.Value.ToUniversalTime());
    if (to.HasValue) query = query.Where(r => r.EventTimeUtc <= to.Value.ToUniversalTime());
    var records = await query.OrderByDescending(r => r.EventTimeUtc)
        .Select(r => new AttendanceRecordResponse(r.Id, r.EmployeeId, r.Employee.FirstName + " " + r.Employee.LastName, r.EventTimeUtc, r.EventType.ToString(), r.DeviceId, r.Source, r.CreatedUtc))
        .ToListAsync(cancellationToken);
    return Results.Ok(records);
}).RequireAuthorization("Attendance.View");

// Daily report за ОДИН день. Показывает сотрудников у которых назначен WorkSchedule
// или есть хотя бы один день в Schedule Planner.
app.MapGet("/api/attendance/daily", async (DateTime? date, Guid? employeeId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var dayStartUtc = (date ?? DateTime.UtcNow).ToUniversalTime().Date;
    var dayEndUtc = dayStartUtc.AddDays(1);
    var dayDate = DateOnly.FromDateTime(dayStartUtc);

    var employeesQuery = dbContext.Employees.AsNoTracking()
        .Include(e => e.WorkSchedule).ThenInclude(ws => ws!.Shifts)
        .Include(e => e.DayPatterns.Where(dp => dp.Date == dayDate)).ThenInclude(dp => dp.WorkSchedule).ThenInclude(ws => ws!.Shifts)
        .Where(e => e.IsActive && (e.WorkScheduleId != null || e.DayPatterns.Any(dp => dp.WorkScheduleId != null)));
    if (employeeId.HasValue) employeesQuery = employeesQuery.Where(e => e.Id == employeeId.Value);
    var employees = await employeesQuery.OrderBy(e => e.FirstName).ThenBy(e => e.LastName).ToListAsync(cancellationToken);

    // EmployeeNo (string) — это id из устройства. Джоиним DeviceAuthLogs по нему.
    var empNos = employees
        .Where(e => !string.IsNullOrWhiteSpace(e.EmployeeNo))
        .Select(e => e.EmployeeNo!.Trim())
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    var logs = await dbContext.DeviceAuthLogs.AsNoTracking()
        .Where(r => r.EventTimeUtc >= dayStartUtc && r.EventTimeUtc < dayEndUtc)
        .Select(r => new { r.EmployeeNoString, r.EventTimeUtc })
        .ToListAsync(cancellationToken);

    var byEmpNo = logs
        .Where(r => empNos.Contains(r.EmployeeNoString.Trim()))
        .GroupBy(r => r.EmployeeNoString.Trim(), StringComparer.OrdinalIgnoreCase)
        .ToDictionary(
            g => g.Key,
            g => new { First = g.Min(x => x.EventTimeUtc), Last = g.Max(x => x.EventTimeUtc), Count = g.Count() },
            StringComparer.OrdinalIgnoreCase);

    var byEmployee = employees
        .Where(e => !string.IsNullOrWhiteSpace(e.EmployeeNo))
        .Select(e => new { e.Id, EmpNo = e.EmployeeNo!.Trim() })
        .Where(x => byEmpNo.ContainsKey(x.EmpNo))
        .ToDictionary(
            x => x.Id,
            x => byEmpNo[x.EmpNo]);

    // Корректировки админа: перекрывают check-in/check-out поверх raw логов.
    var corrections = await dbContext.AttendanceCorrections.AsNoTracking()
        .Where(c => c.DateUtc == dayStartUtc)
        .ToDictionaryAsync(c => c.EmployeeId, cancellationToken);

    var rows = employees.Select(e =>
    {
        byEmployee.TryGetValue(e.Id, out var stat);
        var first = stat?.First;
        var last = stat?.Last;
        var name = (e.FirstName + " " + e.LastName).Trim();

        // Перекрываем коррекцией если есть. Поля nullable: можно фиксить только check-in,
        // только check-out, или оба.
        var hasCorrection = corrections.TryGetValue(e.Id, out var corr);
        if (hasCorrection)
        {
            if (corr!.CheckInUtc.HasValue) first = corr.CheckInUtc.Value;
            if (corr.CheckOutUtc.HasValue) last = corr.CheckOutUtc.Value;
        }

        // Определяем эффективный шедул: сначала из DayPattern на конкретную дату, иначе базовый
        var dayPattern = e.DayPatterns.FirstOrDefault(dp => dp.Date == dayDate);
        var effectiveSchedule = (dayPattern is not null && !dayPattern.IsDayOff)
            ? (dayPattern.WorkSchedule ?? e.WorkSchedule)
            : e.WorkSchedule;

        var isDayOff = (dayPattern?.IsDayOff ?? false) || effectiveSchedule?.Type == ScheduleType.Off;

        // For Multi schedules, pick the sub-shift matching the check-in window
        WorkScheduleShift? matchedShift = null;
        if (effectiveSchedule?.Type == ScheduleType.Multi && first.HasValue && effectiveSchedule.Shifts.Any())
        {
            var checkInLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(first.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
            var checkInTime = checkInLocal.TimeOfDay;
            var orderedShifts = effectiveSchedule.Shifts.OrderBy(s => s.SortOrder).ToList();
            // Берём первую смену, в чьё окно попал check-in (по ValidEntryTo). Если check-in позже всех
            // окон — назначаем последнюю смену (опоздание будет считаться от её ShiftStart).
            matchedShift = orderedShifts.FirstOrDefault(s => checkInTime <= s.ValidEntryTo)
                           ?? orderedShifts.LastOrDefault();
        }

        var shiftStartForCalc = matchedShift is not null ? (TimeSpan?)matchedShift.ShiftStart : effectiveSchedule?.ShiftStart;
        var shiftEndForCalc   = matchedShift is not null ? (TimeSpan?)matchedShift.ShiftEnd   : effectiveSchedule?.ShiftEnd;
        var normHoursForCalc  = matchedShift is not null ? (double)matchedShift.RequiredHoursPerDay
                              : (!isDayOff && effectiveSchedule is not null ? (double)effectiveSchedule.RequiredHoursPerDay : 0d);
        var shiftNameForCalc  = matchedShift is not null ? $"{effectiveSchedule!.Name} / {matchedShift.Name}" : effectiveSchedule?.Name;

        // Если у расписания отключён учёт раннего прихода — отсчитываем total от ShiftStart, а не от фактического check-in.
        var effectiveFirst = first;
        if (first.HasValue && shiftStartForCalc is TimeSpan ssForClamp
            && effectiveSchedule is { CountEarlyArrival: false })
        {
            var firstLocalForClamp = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(first.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
            if (firstLocalForClamp.TimeOfDay < ssForClamp)
            {
                var clampedLocal = firstLocalForClamp.Date + ssForClamp;
                effectiveFirst = TimeZoneInfo.ConvertTimeToUtc(clampedLocal, TimeZoneInfo.Local);
            }
        }
        var totalHoursVal = (effectiveFirst.HasValue && last.HasValue) ? Math.Round((last!.Value - effectiveFirst.Value).TotalHours, 2) : 0d;
        var normHours = (!isDayOff && effectiveSchedule is not null) ? normHoursForCalc : 0d;
        var overtimeHours = (normHours > 0 && totalHoursVal > normHours) ? Math.Round(totalHoursVal - normHours, 2) : 0d;
        if (overtimeHours > 0 && effectiveSchedule is { OvertimeDailyThresholdMinutes: > 0 } && overtimeHours * 60.0 < effectiveSchedule.OvertimeDailyThresholdMinutes) overtimeHours = 0;
        var isAbsent = !isDayOff && effectiveSchedule is not null && !first.HasValue;

        int? lateMinutes = null;
        int? earlyLeaveMinutes = null;
        if (!isDayOff && effectiveSchedule is not null && shiftStartForCalc is TimeSpan shiftStart && first.HasValue)
        {
            var firstLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(first.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
            var diff = (firstLocal.TimeOfDay - shiftStart).TotalMinutes;
            lateMinutes = (int)Math.Max(0, Math.Round(diff));
        }
        if (!isDayOff && effectiveSchedule is not null && shiftEndForCalc is TimeSpan shiftEnd && last.HasValue)
        {
            var lastLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(last.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
            var diff = (shiftEnd - lastLocal.TimeOfDay).TotalMinutes;
            earlyLeaveMinutes = (int)Math.Max(0, Math.Round(diff));
        }

        return new
        {
            employeeId = e.Id,
            employeeName = string.IsNullOrEmpty(name) ? null : name,
            date = dayStartUtc,
            scheduleName = shiftNameForCalc,
            shiftStart = shiftStartForCalc?.ToString(@"hh\:mm"),
            shiftEnd = shiftEndForCalc?.ToString(@"hh\:mm"),
            checkInUtc = first,
            checkOutUtc = (first.HasValue && last.HasValue && first != last) ? last : (DateTime?)null,
            totalHours = totalHoursVal,
            normHours,
            overtimeHours,
            isDayOff,
            isAbsent,
            eventCount = stat?.Count ?? 0,
            lateMinutes,
            earlyLeaveMinutes,
            corrected = hasCorrection,
            correctionComment = hasCorrection ? corr!.Comment : null
        };
    }).ToList();

    return Results.Ok(rows);
}).RequireAuthorization("Attendance.View");

// Период (week/month): для каждого дня в диапазоне даёт ту же daily-строку, что и /daily.
// Возвращает плоский массив (по сотруднику × по дню), фронт группирует/агрегирует на своей стороне.
app.MapGet("/api/attendance/period", async (DateTime? from, DateTime? to, Guid? employeeId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var fromUtc = (from ?? DateTime.UtcNow.AddDays(-7)).ToUniversalTime().Date;
    var toUtc = (to ?? DateTime.UtcNow).ToUniversalTime().Date;
    if (toUtc < fromUtc) toUtc = fromUtc;
    if ((toUtc - fromUtc).TotalDays > 366) toUtc = fromUtc.AddDays(366);

    var fromDate = DateOnly.FromDateTime(fromUtc);
    var toDate = DateOnly.FromDateTime(toUtc);

    var employeesQuery = dbContext.Employees.AsNoTracking()
        .Include(e => e.WorkSchedule).ThenInclude(ws => ws!.Shifts)
        .Include(e => e.DayPatterns.Where(dp => dp.Date >= fromDate && dp.Date <= toDate)).ThenInclude(dp => dp.WorkSchedule).ThenInclude(ws => ws!.Shifts)
        .Where(e => e.IsActive && (e.WorkScheduleId != null || e.DayPatterns.Any(dp => dp.WorkScheduleId != null)));
    if (employeeId.HasValue) employeesQuery = employeesQuery.Where(e => e.Id == employeeId.Value);
    var employees = await employeesQuery.OrderBy(e => e.FirstName).ThenBy(e => e.LastName).ToListAsync(cancellationToken);

    var empNos = employees
        .Where(e => !string.IsNullOrWhiteSpace(e.EmployeeNo))
        .Select(e => e.EmployeeNo!.Trim())
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    var rangeEndExclusive = toUtc.AddDays(1);
    var logs = await dbContext.DeviceAuthLogs.AsNoTracking()
        .Where(r => r.EventTimeUtc >= fromUtc && r.EventTimeUtc < rangeEndExclusive)
        .Select(r => new { r.EmployeeNoString, r.EventTimeUtc })
        .ToListAsync(cancellationToken);

    var corrections = await dbContext.AttendanceCorrections.AsNoTracking()
        .Where(c => c.DateUtc >= fromUtc && c.DateUtc <= toUtc)
        .ToListAsync(cancellationToken);
    var corrByEmpDate = corrections.ToDictionary(c => (c.EmployeeId, c.DateUtc));

    var byEmpNoDay = logs
        .GroupBy(r => (Emp: r.EmployeeNoString.Trim().ToLowerInvariant(), Day: r.EventTimeUtc.Date))
        .ToDictionary(
            g => g.Key,
            g => new { First = g.Min(x => x.EventTimeUtc), Last = g.Max(x => x.EventTimeUtc), Count = g.Count() });

    var rows = new List<object>();
    foreach (var e in employees)
    {
        var empKeyLower = (e.EmployeeNo ?? "").Trim().ToLowerInvariant();
        var name = (e.FirstName + " " + e.LastName).Trim();
        var patternsByDate = e.DayPatterns.ToDictionary(dp => dp.Date);
        for (var day = fromUtc; day <= toUtc; day = day.AddDays(1))
        {
            var dayKey = DateOnly.FromDateTime(day);
            patternsByDate.TryGetValue(dayKey, out var dayPat);
            var effectiveSched = (dayPat is not null && !dayPat.IsDayOff)
                ? (dayPat.WorkSchedule ?? e.WorkSchedule)
                : e.WorkSchedule;

            DateTime? first = null;
            DateTime? last = null;
            var count = 0;
            if (byEmpNoDay.TryGetValue((empKeyLower, day), out var stat))
            {
                first = stat.First; last = stat.Last; count = stat.Count;
            }
            var hasCorrection = corrByEmpDate.TryGetValue((e.Id, day), out var corr);
            if (hasCorrection)
            {
                if (corr!.CheckInUtc.HasValue) first = corr.CheckInUtc.Value;
                if (corr.CheckOutUtc.HasValue) last = corr.CheckOutUtc.Value;
            }

            var isDayOff = (dayPat?.IsDayOff ?? false) || effectiveSched?.Type == ScheduleType.Off;

            // For Multi schedules, pick the sub-shift matching the check-in window
            WorkScheduleShift? matchedShiftP = null;
            if (effectiveSched?.Type == ScheduleType.Multi && first.HasValue && effectiveSched.Shifts.Any())
            {
                var checkInLocalP = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(first.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
                var checkInTimeP = checkInLocalP.TimeOfDay;
                var orderedShiftsP = effectiveSched.Shifts.OrderBy(s => s.SortOrder).ToList();
                matchedShiftP = orderedShiftsP.FirstOrDefault(s => checkInTimeP <= s.ValidEntryTo)
                                ?? orderedShiftsP.LastOrDefault();
            }

            var shiftStartForCalcP = matchedShiftP is not null ? (TimeSpan?)matchedShiftP.ShiftStart : effectiveSched?.ShiftStart;
            var shiftEndForCalcP   = matchedShiftP is not null ? (TimeSpan?)matchedShiftP.ShiftEnd   : effectiveSched?.ShiftEnd;
            var normHoursForCalcP  = matchedShiftP is not null ? (double)matchedShiftP.RequiredHoursPerDay
                                  : (!isDayOff && effectiveSched is not null ? (double)effectiveSched.RequiredHoursPerDay : 0d);
            var shiftNameForCalcP  = matchedShiftP is not null ? $"{effectiveSched!.Name} / {matchedShiftP.Name}" : effectiveSched?.Name;

            var effectiveFirstP = first;
            if (first.HasValue && shiftStartForCalcP is TimeSpan ssForClampP
                && effectiveSched is { CountEarlyArrival: false })
            {
                var firstLocalForClampP = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(first.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
                if (firstLocalForClampP.TimeOfDay < ssForClampP)
                {
                    var clampedLocalP = firstLocalForClampP.Date + ssForClampP;
                    effectiveFirstP = TimeZoneInfo.ConvertTimeToUtc(clampedLocalP, TimeZoneInfo.Local);
                }
            }
            var totalHoursVal = (effectiveFirstP.HasValue && last.HasValue) ? Math.Round((last!.Value - effectiveFirstP.Value).TotalHours, 2) : 0d;
            var normHours = (!isDayOff && effectiveSched is not null) ? normHoursForCalcP : 0d;
            var overtimeHours = (normHours > 0 && totalHoursVal > normHours) ? Math.Round(totalHoursVal - normHours, 2) : 0d;
            // Daily-порог: дневной OT ниже schedule.OvertimeDailyThresholdMinutes не считается.
            if (overtimeHours > 0 && effectiveSched is { OvertimeDailyThresholdMinutes: > 0 } && overtimeHours * 60.0 < effectiveSched.OvertimeDailyThresholdMinutes) overtimeHours = 0;
            var isAbsent = !isDayOff && effectiveSched is not null && !first.HasValue;

            int? lateMinutes = null;
            int? earlyLeaveMinutes = null;
            if (!isDayOff && effectiveSched is not null && shiftStartForCalcP is TimeSpan shiftStart && first.HasValue)
            {
                var firstLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(first.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
                var diff = (firstLocal.TimeOfDay - shiftStart).TotalMinutes;
                lateMinutes = (int)Math.Max(0, Math.Round(diff));
            }
            if (!isDayOff && effectiveSched is not null && shiftEndForCalcP is TimeSpan shiftEnd && last.HasValue)
            {
                var lastLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(last.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
                var diff = (shiftEnd - lastLocal.TimeOfDay).TotalMinutes;
                earlyLeaveMinutes = (int)Math.Max(0, Math.Round(diff));
            }

            rows.Add(new
            {
                employeeId = e.Id,
                employeeName = string.IsNullOrEmpty(name) ? null : name,
                date = day,
                scheduleName = shiftNameForCalcP,
                shiftStart = shiftStartForCalcP?.ToString(@"hh\:mm"),
                shiftEnd = shiftEndForCalcP?.ToString(@"hh\:mm"),
                checkInUtc = first,
                checkOutUtc = (first.HasValue && last.HasValue && first != last) ? last : (DateTime?)null,
                totalHours = totalHoursVal,
                normHours,
                overtimeHours,
                isDayOff,
                isAbsent,
                lateMinutes,
                earlyLeaveMinutes,
                corrected = hasCorrection
            });
        }
    }

    return Results.Ok(rows);
}).RequireAuthorization("Attendance.View");

// Создать/обновить корректировку check-in/check-out за день. Уникальна по (employeeId, date).
app.MapPost("/api/attendance/daily/correction", async (
    AttendanceCorrectionRequest req,
    AppDbContext dbContext,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var dayStartUtc = req.Date.ToUniversalTime().Date;
    var existing = await dbContext.AttendanceCorrections
        .FirstOrDefaultAsync(c => c.EmployeeId == req.EmployeeId && c.DateUtc == dayStartUtc, cancellationToken);

    Guid? userId = null;
    var userIdStr = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (Guid.TryParse(userIdStr, out var u)) userId = u;

    if (existing is null)
    {
        existing = new AttendanceCorrection
        {
            EmployeeId = req.EmployeeId,
            DateUtc = dayStartUtc,
            CheckInUtc = req.CheckInUtc,
            CheckOutUtc = req.CheckOutUtc,
            Comment = req.Comment,
            CorrectedByUserId = userId
        };
        dbContext.AttendanceCorrections.Add(existing);
    }
    else
    {
        existing.CheckInUtc = req.CheckInUtc;
        existing.CheckOutUtc = req.CheckOutUtc;
        existing.Comment = req.Comment;
        existing.CorrectedByUserId = userId;
    }
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { id = existing.Id });
}).RequireAuthorization("Attendance.Manage");

// Удалить корректировку — Daily-отчёт вернётся к raw-логам.
app.MapDelete("/api/attendance/daily/correction", async (
    Guid employeeId, DateTime date, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var dayStartUtc = date.ToUniversalTime().Date;
    var existing = await dbContext.AttendanceCorrections
        .FirstOrDefaultAsync(c => c.EmployeeId == employeeId && c.DateUtc == dayStartUtc, cancellationToken);
    if (existing is null) return Results.NotFound();
    dbContext.AttendanceCorrections.Remove(existing);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("Attendance.Manage");

// Синхронизация ACS → attendance_records (настройки и ручной диапазон; пути под /api/attendance — как sync-from-device)
app.MapGet("/api/attendance/log-sync-settings", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var keys = new[] { "LogSyncAutoEnabled", "LogSyncDailyTime", "LogSyncLastRunUtc", "LogSyncLastRecordsAdded", "LogSyncLastRunKind" };
    var list = await dbContext.SystemSettings.AsNoTracking().Where(x => keys.Contains(x.Key)).ToListAsync(cancellationToken);
    var map = list.ToDictionary(x => x.Key, x => x.Value);
    var auto = string.Equals(map.GetValueOrDefault("LogSyncAutoEnabled"), "true", StringComparison.OrdinalIgnoreCase);
    var daily = map.GetValueOrDefault("LogSyncDailyTime") ?? "03:00";
    DateTime? lastRunUtc = null;
    if (map.TryGetValue("LogSyncLastRunUtc", out var lru) && !string.IsNullOrWhiteSpace(lru) && DateTime.TryParse(lru, null, DateTimeStyles.RoundtripKind, out var dt))
        lastRunUtc = dt.ToUniversalTime();
    int? lastRec = null;
    if (map.TryGetValue("LogSyncLastRecordsAdded", out var lr) && int.TryParse(lr, NumberStyles.Integer, CultureInfo.InvariantCulture, out var ir))
        lastRec = ir;
    var kind = map.GetValueOrDefault("LogSyncLastRunKind");
    return Results.Ok(new LogSyncSettingsResponse(auto, daily, lastRunUtc, lastRec, kind));
}).RequireAuthorization("Attendance.View");

app.MapPost("/api/attendance/log-sync-settings", async (LogSyncSettingsRequest req, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var daily = (req.DailyTimeLocal ?? "03:00").Trim();
    if (!TryParseHHmmLogSync(daily, out _, out _))
        return Results.BadRequest(new { message = "DailyTimeLocal: формат HH:mm (24 часа)." });
    daily = NormalizeHHmmLogSync(daily);
    await UpsertLogSyncSettingAsync(dbContext, "LogSyncAutoEnabled", req.AutoEnabled ? "true" : "false", cancellationToken);
    await UpsertLogSyncSettingAsync(dbContext, "LogSyncDailyTime", daily, cancellationToken);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { message = "Сохранено." });
}).RequireAuthorization("Settings.Manage");

app.MapPost("/api/attendance/sync-logs", async (LogSyncManualRequest req, IAttendanceLogSyncService sync, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    if (!DateOnly.TryParse(req.FromDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var from))
        return Results.BadRequest(new { message = "Неверная FromDate (yyyy-MM-dd)." });
    if (!DateOnly.TryParse(req.ToDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var to))
        return Results.BadRequest(new { message = "Неверная ToDate (yyyy-MM-dd)." });
    if (from > to)
        return Results.BadRequest(new { message = "Начало периода не может быть позже конца." });
    if ((to.DayNumber - from.DayNumber) > 366)
        return Results.BadRequest(new { message = "Интервал не более 366 дней." });

    var tz = TimeZoneInfo.Local;
    var startLocal = from.ToDateTime(TimeOnly.MinValue);
    var endLocal = to.ToDateTime(new TimeOnly(23, 59, 59));
    var fromUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(startLocal, DateTimeKind.Unspecified), tz);
    var toUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(endLocal, DateTimeKind.Unspecified), tz);

    var result = await sync.SyncAllDevicesAsync(fromUtc, toUtc, cancellationToken);
    await UpsertLogSyncSettingAsync(dbContext, "LogSyncLastRunUtc", DateTime.UtcNow.ToString("O", CultureInfo.InvariantCulture), cancellationToken);
    await UpsertLogSyncSettingAsync(dbContext, "LogSyncLastRecordsAdded", result.RecordsAdded.ToString(CultureInfo.InvariantCulture), cancellationToken);
    await UpsertLogSyncSettingAsync(dbContext, "LogSyncLastRunKind", "manual", cancellationToken);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { result.RecordsAdded, result.DevicesProcessed, result.Warnings });
}).RequireAuthorization("Attendance.Manage");

app.MapPost("/api/attendance/sync-from-device/{deviceId:guid}", async (Guid deviceId, AppDbContext dbContext, IConfiguration configuration, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    var device = await dbContext.Devices.AsNoTracking().FirstOrDefaultAsync(d => d.Id == deviceId, cancellationToken);
    if (device is null) return Results.NotFound(new { message = "Устройство не найдено." });
    try
    {
        var username = configuration["Hikvision:Username"] ?? "admin";
        var password = (configuration["Hikvision:Password"] ?? "").Trim();
        var client = new Backend.Infrastructure.Devices.IsapiClient(
            device.IpAddress, device.Port,
            string.IsNullOrWhiteSpace(device.Username) ? username : device.Username,
            string.IsNullOrWhiteSpace(device.Password) ? password : device.Password,
            TimeSpan.FromSeconds(30));

        var from = DateTime.UtcNow.AddDays(-7).ToString("yyyy-MM-ddTHH:mm:ss");
        var to = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss");
        var body = System.Text.Json.JsonSerializer.Serialize(new
        {
            AcsEventCond = new
            {
                searchID = Guid.NewGuid().ToString("N")[..8],
                searchResultPosition = 0,
                maxResults = 500,
                major = 0,
                minor = 0,
                startTime = from,
                endTime = to
            }
        });
        var (success, content, error) = await client.PostJsonAsync("ISAPI/AccessControl/AcsEvent?format=json&security=1&iv=0000000000000000", body, cancellationToken);
        if (!success || string.IsNullOrWhiteSpace(content))
        {
            logger.LogWarning("Sync-from-device {DeviceId}: {Error}", deviceId, error);
            return Results.Problem($"Не удалось получить события с устройства: {error}");
        }

        using var doc = System.Text.Json.JsonDocument.Parse(content);
        var root = doc.RootElement;
        var eventList = root.TryGetProperty("AcsEvent", out var acsEventEl) && acsEventEl.TryGetProperty("InfoList", out var infoListEl)
            ? infoListEl.EnumerateArray()
            : (System.Text.Json.JsonElement.ArrayEnumerator)default;

        var added = 0;
        foreach (var ev in eventList)
        {
            if (!ev.TryGetProperty("employeeNoString", out var empNoEl)) continue;
            var empNo = empNoEl.GetString();
            if (string.IsNullOrWhiteSpace(empNo)) continue;

            var employee = await dbContext.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.EmployeeNo == empNo, cancellationToken);
            if (employee is null) continue;

            if (!ev.TryGetProperty("time", out var timeEl)) continue;
            if (!DateTime.TryParse(timeEl.GetString(), null, System.Globalization.DateTimeStyles.RoundtripKind, out var eventTime)) continue;
            var eventTimeUtc = eventTime.ToUniversalTime();

            // minor: 75=check-in, 76=check-out; fallback to "in" for unknown
            var minor = ev.TryGetProperty("minor", out var minorEl) ? minorEl.GetInt32() : 0;
            var eventType = minor == 76 ? AttendanceEventType.Out : AttendanceEventType.In;

            var exists = await dbContext.AttendanceRecords.AnyAsync(r => r.EmployeeId == employee.Id && r.EventTimeUtc == eventTimeUtc, cancellationToken);
            if (exists) continue;
            dbContext.AttendanceRecords.Add(new AttendanceRecord
            {
                EmployeeId = employee.Id,
                EventTimeUtc = eventTimeUtc,
                EventType = eventType,
                DeviceId = deviceId,
                Source = "device"
            });
            added++;
        }
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { added, message = $"Синхронизировано {added} записей." });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка синхронизации событий с устройства {DeviceId}", deviceId);
        return Results.Problem($"Ошибка получения данных с устройства: {ex.Message}");
    }
}).RequireAuthorization("Attendance.Manage");

// ─── Attendance Requests ───────────────────────────────────────────────────────

app.MapGet("/api/attendance-requests", async (Guid? employeeId, string? status, string? types, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.AttendanceRequests.AsNoTracking()
        .Include(r => r.Employee)
        .AsQueryable();
    if (employeeId.HasValue) query = query.Where(r => r.EmployeeId == employeeId.Value);
    if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<AttendanceRequestStatus>(status, true, out var statusEnum))
        query = query.Where(r => r.Status == statusEnum);
    if (!string.IsNullOrWhiteSpace(types))
    {
        var typeList = types.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(t => Enum.TryParse<AttendanceRequestType>(t, true, out var parsed) ? (AttendanceRequestType?)parsed : null)
            .Where(t => t.HasValue).Select(t => t!.Value).ToList();
        if (typeList.Count > 0) query = query.Where(r => typeList.Contains(r.Type));
    }
    var items = await query.OrderByDescending(r => r.CreatedUtc)
        .Select(r => new AttendanceRequestResponse(r.Id, r.EmployeeId, r.Employee.FirstName + " " + r.Employee.LastName, r.Type.ToString(), r.RequestedTimeUtc, r.RequestedEndTimeUtc, r.Comment, r.Status.ToString(), r.ReviewedByUserId, r.ReviewedAtUtc, r.ReviewComment, r.CreatedUtc, r.Latitude, r.Longitude, r.GeoZoneName))
        .ToListAsync(cancellationToken);
    return Results.Ok(items);
}).RequireAuthorization("Attendance.View");

app.MapPost("/api/attendance-requests", async (CreateAttendanceRequestBody request, AppDbContext dbContext, ClaimsPrincipal user, UserManager<ApplicationUser> userManager, INotificationService notifService, CancellationToken cancellationToken) =>
{
    if (!Enum.TryParse<AttendanceRequestType>(request.Type, true, out var reqType))
        return Results.BadRequest(new { message = "Неверный тип заявки." });

    Guid employeeId;
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (user.IsInRole(SystemRoles.Employee) && Guid.TryParse(userIdStr, out var uid))
    {
        var appUser = await userManager.FindByIdAsync(uid.ToString());
        if (appUser?.EmployeeId is null) return Results.Forbid();
        employeeId = appUser.EmployeeId.Value;
    }
    else
    {
        if (!request.EmployeeId.HasValue) return Results.BadRequest(new { message = "EmployeeId обязателен." });
        employeeId = request.EmployeeId.Value;
    }

    var employee = await dbContext.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken);
    if (employee is null) return Results.NotFound(new { message = "Сотрудник не найден." });

    var entity = new AttendanceRequest
    {
        EmployeeId = employeeId,
        Type = reqType,
        RequestedTimeUtc = request.RequestedTimeUtc.ToUniversalTime(),
        RequestedEndTimeUtc = request.RequestedEndTimeUtc?.ToUniversalTime(),
        Comment = request.Comment,
        Status = AttendanceRequestStatus.Pending
    };
    dbContext.AttendanceRequests.Add(entity);
    await dbContext.SaveChangesAsync(cancellationToken);

    var employeeName = $"{employee.FirstName} {employee.LastName}";
    _ = notifService.CreateAsync(
        NotificationTypes.ApprovalRequest,
        "Новая заявка на утверждение",
        $"{employeeName} подал(а) заявку: {reqType}.",
        referenceId: entity.Id.ToString(),
        ct: cancellationToken);

    return Results.Created($"/api/attendance-requests/{entity.Id}", new { entity.Id, entity.EmployeeId, entity.Type, entity.RequestedTimeUtc, entity.Status });
}).RequireAuthorization("Attendance.Manage");

app.MapPut("/api/attendance-requests/{id:guid}/approve", async (Guid id, ReviewAttendanceRequestBody? request, AppDbContext dbContext, ClaimsPrincipal user, UserManager<ApplicationUser> userManager, INotificationService notifService, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.AttendanceRequests
        .Include(r => r.Employee)
        .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    if (entity is null) return Results.NotFound();
    if (entity.Status != AttendanceRequestStatus.Pending)
        return Results.BadRequest(new { message = "Заявка уже обработана." });

    Guid? reviewerId = Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var rv) ? rv : null;
    entity.Status = AttendanceRequestStatus.Approved;
    entity.ReviewedByUserId = reviewerId;
    entity.ReviewedAtUtc = DateTime.UtcNow;
    entity.ReviewComment = request?.Comment;
    entity.UpdatedUtc = DateTime.UtcNow;

    if (entity.Type == AttendanceRequestType.CheckIn || entity.Type == AttendanceRequestType.CheckOut)
    {
        // Check-in/Check-out request = correction за день: только одно из (check-in, check-out).
        // Создаём/обновляем AttendanceCorrection (overlay над device_auth_logs).
        var dateUtc = entity.RequestedTimeUtc.ToUniversalTime().Date;
        var existingCorr = await dbContext.AttendanceCorrections
            .FirstOrDefaultAsync(c => c.EmployeeId == entity.EmployeeId && c.DateUtc == dateUtc, cancellationToken);
        if (existingCorr is null)
        {
            existingCorr = new AttendanceCorrection
            {
                EmployeeId = entity.EmployeeId,
                DateUtc = dateUtc,
                Comment = entity.Comment,
                CorrectedByUserId = reviewerId
            };
            dbContext.AttendanceCorrections.Add(existingCorr);
        }
        else
        {
            existingCorr.Comment = entity.Comment ?? existingCorr.Comment;
            existingCorr.CorrectedByUserId = reviewerId;
        }
        if (entity.Type == AttendanceRequestType.CheckIn)
            existingCorr.CheckInUtc = entity.RequestedTimeUtc;
        else
            existingCorr.CheckOutUtc = entity.RequestedTimeUtc;
    }
    await dbContext.SaveChangesAsync(cancellationToken);

    // Notify the employee whose request was approved
    var requesterUser = await userManager.Users.FirstOrDefaultAsync(u => u.EmployeeId == entity.EmployeeId, cancellationToken);
    if (requesterUser is not null)
        _ = notifService.CreateAsync(
            NotificationTypes.ApprovalApproved,
            "Заявка одобрена",
            $"Ваша заявка «{entity.Type}» одобрена.",
            userId: requesterUser.Id,
            referenceId: entity.Id.ToString(),
            ct: cancellationToken);

    return Results.Ok(new { entity.Id, entity.Status, entity.ReviewedAtUtc });
}).RequireAuthorization("Attendance.Manage");

app.MapPut("/api/attendance-requests/{id:guid}/reject", async (Guid id, ReviewAttendanceRequestBody? request, AppDbContext dbContext, ClaimsPrincipal user, UserManager<ApplicationUser> userManager, INotificationService notifService, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.AttendanceRequests
        .Include(r => r.Employee)
        .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    if (entity is null) return Results.NotFound();
    if (entity.Status != AttendanceRequestStatus.Pending)
        return Results.BadRequest(new { message = "Заявка уже обработана." });

    Guid? reviewerId = Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var rv) ? rv : null;
    entity.Status = AttendanceRequestStatus.Rejected;
    entity.ReviewedByUserId = reviewerId;
    entity.ReviewedAtUtc = DateTime.UtcNow;
    entity.ReviewComment = request?.Comment;
    entity.UpdatedUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);

    // Notify the employee whose request was rejected
    var requesterUser = await userManager.Users.FirstOrDefaultAsync(u => u.EmployeeId == entity.EmployeeId, cancellationToken);
    if (requesterUser is not null)
        _ = notifService.CreateAsync(
            NotificationTypes.ApprovalRejected,
            "Заявка отклонена",
            $"Ваша заявка «{entity.Type}» отклонена.{(string.IsNullOrWhiteSpace(request?.Comment) ? "" : " Комментарий: " + request.Comment)}",
            userId: requesterUser.Id,
            referenceId: entity.Id.ToString(),
            ct: cancellationToken);

    return Results.Ok(new { entity.Id, entity.Status, entity.ReviewedAtUtc });
}).RequireAuthorization("Attendance.Manage");

// ─── Report Exports ────────────────────────────────────────────────────────────

static async Task<(List<AttendancePeriodRow> rows, string? empName)> BuildAttendanceRows(
    DateTime fromUtc, DateTime toUtc, Guid? employeeId, AppDbContext dbContext, CancellationToken ct)
{
    var fromDate = DateOnly.FromDateTime(fromUtc);
    var toDate = DateOnly.FromDateTime(toUtc);

    var empQuery = dbContext.Employees.AsNoTracking()
        .Include(e => e.WorkSchedule)
        .Include(e => e.Department)
        .Include(e => e.DayPatterns.Where(dp => dp.Date >= fromDate && dp.Date <= toDate)).ThenInclude(dp => dp.WorkSchedule)
        .Where(e => e.IsActive && (e.WorkScheduleId != null || e.DayPatterns.Any(dp => dp.WorkScheduleId != null)));
    if (employeeId.HasValue) empQuery = empQuery.Where(e => e.Id == employeeId.Value);
    var employees = await empQuery.OrderBy(e => e.FirstName).ThenBy(e => e.LastName).ToListAsync(ct);

    var rangeEnd = toUtc.AddDays(1);
    var logs = await dbContext.DeviceAuthLogs.AsNoTracking()
        .Where(r => r.EventTimeUtc >= fromUtc && r.EventTimeUtc < rangeEnd)
        .Select(r => new { r.EmployeeNoString, r.EventTimeUtc })
        .ToListAsync(ct);

    var corrections = await dbContext.AttendanceCorrections.AsNoTracking()
        .Where(c => c.DateUtc >= fromUtc && c.DateUtc <= toUtc)
        .ToListAsync(ct);
    var corrByEmpDate = corrections.ToDictionary(c => (c.EmployeeId, c.DateUtc));

    var byEmpNoDay = logs
        .GroupBy(r => (Emp: r.EmployeeNoString.Trim().ToLowerInvariant(), Day: r.EventTimeUtc.Date))
        .ToDictionary(g => g.Key, g => new { First = g.Min(x => x.EventTimeUtc), Last = g.Max(x => x.EventTimeUtc) });

    var rows = new List<AttendancePeriodRow>();
    string? singleEmpName = null;
    foreach (var e in employees)
    {
        var empKeyLower = (e.EmployeeNo ?? "").Trim().ToLowerInvariant();
        var name = (e.FirstName + " " + e.LastName).Trim();
        singleEmpName = name;
        var patternsByDate = e.DayPatterns.ToDictionary(dp => dp.Date);
        for (var day = fromUtc; day <= toUtc; day = day.AddDays(1))
        {
            var dayKey = DateOnly.FromDateTime(day);
            patternsByDate.TryGetValue(dayKey, out var dayPat);
            var sched = dayPat is not null && !dayPat.IsDayOff
                ? (dayPat.WorkSchedule ?? e.WorkSchedule) : e.WorkSchedule;

            DateTime? first = null, last = null;
            if (byEmpNoDay.TryGetValue((empKeyLower, day), out var stat)) { first = stat.First; last = stat.Last; }
            if (corrByEmpDate.TryGetValue((e.Id, day), out var corr))
            {
                if (corr.CheckInUtc.HasValue) first = corr.CheckInUtc.Value;
                if (corr.CheckOutUtc.HasValue) last = corr.CheckOutUtc.Value;
            }

            int? lateMin = null;
            if (sched?.ShiftStart is TimeSpan ss && first.HasValue)
            {
                var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(first.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
                lateMin = (int)Math.Max(0, Math.Round((local.TimeOfDay - ss).TotalMinutes));
            }

            rows.Add(new AttendancePeriodRow(
                e.Id, name, e.Department?.Name, dayKey,
                sched?.Name,
                sched?.ShiftStart?.ToString(@"hh\:mm"),
                sched?.ShiftEnd?.ToString(@"hh\:mm"),
                first,
                first.HasValue && last.HasValue && first != last ? last : null,
                first.HasValue && last.HasValue ? Math.Round((last!.Value - first.Value).TotalHours, 2) : 0d,
                lateMin,
                corrByEmpDate.ContainsKey((e.Id, day))));
        }
    }
    return (rows, employees.Count == 1 ? singleEmpName : null);
}

app.MapGet("/api/reports/work-hours/excel", async (DateTime? from, DateTime? to, Guid? employeeId, AppDbContext dbContext, CancellationToken ct) =>
{
    var fromUtc = (from ?? DateTime.UtcNow.AddDays(-30)).ToUniversalTime().Date;
    var toUtc = (to ?? DateTime.UtcNow).ToUniversalTime().Date;
    if (toUtc < fromUtc) toUtc = fromUtc;
    if ((toUtc - fromUtc).TotalDays > 366) toUtc = fromUtc.AddDays(366);
    var (rows, empName) = await BuildAttendanceRows(fromUtc, toUtc, employeeId, dbContext, ct);
    var bytes = ExcelReportBuilder.BuildAttendance(rows, fromUtc, toUtc, empName);
    return Results.File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        $"work-hours-{fromUtc:yyyyMMdd}-{toUtc:yyyyMMdd}.xlsx");
}).RequireAuthorization("Reports.View");

app.MapGet("/api/reports/work-hours/pdf", async (DateTime? from, DateTime? to, Guid? employeeId, AppDbContext dbContext, CancellationToken ct) =>
{
    var fromUtc = (from ?? DateTime.UtcNow.AddDays(-30)).ToUniversalTime().Date;
    var toUtc = (to ?? DateTime.UtcNow).ToUniversalTime().Date;
    if (toUtc < fromUtc) toUtc = fromUtc;
    if ((toUtc - fromUtc).TotalDays > 366) toUtc = fromUtc.AddDays(366);
    var (rows, empName) = await BuildAttendanceRows(fromUtc, toUtc, employeeId, dbContext, ct);
    var bytes = PdfReportBuilder.BuildAttendance(rows, fromUtc, toUtc, empName);
    return Results.File(bytes, "application/pdf", $"work-hours-{fromUtc:yyyyMMdd}-{toUtc:yyyyMMdd}.pdf");
}).RequireAuthorization("Reports.View");

// ─── Schedule Planner reports ─────────────────────────────────────────────────
static async Task<List<SchedulePlannerRow>> BuildSchedulePlannerRowsAsync(
    DateOnly fromDate, DateOnly toDate, AppDbContext dbContext, CancellationToken ct)
{
    var employees = await dbContext.Employees.AsNoTracking()
        .Include(e => e.Department)
        .Include(e => e.WorkSchedule)
        .Include(e => e.DayPatterns.Where(dp => dp.Date >= fromDate && dp.Date <= toDate))
            .ThenInclude(dp => dp.WorkSchedule)
        .Where(e => e.IsActive && (e.WorkScheduleId != null || e.DayPatterns.Any(dp => dp.WorkScheduleId != null)))
        .OrderBy(e => e.FirstName).ThenBy(e => e.LastName)
        .ToListAsync(ct);

    var leaves = await dbContext.EmployeeLeaves.AsNoTracking()
        .Where(l => l.StartDate <= toDate && l.EndDate >= fromDate
                 && l.Status != LeaveStatus.Rejected && l.Status != LeaveStatus.Cancelled)
        .ToListAsync(ct);
    var leavesByEmp = leaves.GroupBy(l => l.EmployeeId).ToDictionary(g => g.Key, g => g.ToList());

    var rows = new List<SchedulePlannerRow>();
    foreach (var e in employees)
    {
        var fullName = $"{e.FirstName} {e.LastName}".Trim();
        var dept = e.Department?.Name;
        var patternsByDate = e.DayPatterns.ToDictionary(p => p.Date);
        var empLeaves = leavesByEmp.TryGetValue(e.Id, out var lv) ? lv : new();

        for (var day = fromDate; day <= toDate; day = day.AddDays(1))
        {
            patternsByDate.TryGetValue(day, out var pat);
            var leave = empLeaves.FirstOrDefault(l => l.StartDate <= day && l.EndDate >= day);
            var sched = (pat is not null && !pat.IsDayOff) ? (pat.WorkSchedule ?? e.WorkSchedule) : e.WorkSchedule;
            var isDayOff = (pat?.IsDayOff ?? false) || sched?.Type == ScheduleType.Off;
            rows.Add(new SchedulePlannerRow(
                fullName, dept, day,
                sched?.Name,
                sched?.ShiftStart?.ToString(@"hh\:mm"),
                sched?.ShiftEnd?.ToString(@"hh\:mm"),
                isDayOff,
                leave?.LeaveType.ToString(),
                sched?.Color,
                sched?.Type.ToString()));
        }
    }
    return rows;
}

app.MapGet("/api/reports/schedule-planner/excel", async (DateOnly? from, DateOnly? to, AppDbContext dbContext, CancellationToken ct) =>
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var fromDate = from ?? new DateOnly(today.Year, today.Month, 1);
    var toDate = to ?? new DateOnly(today.Year, today.Month, DateTime.DaysInMonth(today.Year, today.Month));
    if (toDate < fromDate) toDate = fromDate;
    if (toDate.DayNumber - fromDate.DayNumber > 366) toDate = fromDate.AddDays(366);
    var rows = await BuildSchedulePlannerRowsAsync(fromDate, toDate, dbContext, ct);
    var bytes = ExcelReportBuilder.BuildSchedulePlanner(rows, fromDate, toDate);
    return Results.File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        $"schedule-{fromDate:yyyyMMdd}-{toDate:yyyyMMdd}.xlsx");
}).RequireAuthorization("Reports.View");

app.MapGet("/api/reports/schedule-planner/pdf", async (DateOnly? from, DateOnly? to, AppDbContext dbContext, CancellationToken ct) =>
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var fromDate = from ?? new DateOnly(today.Year, today.Month, 1);
    var toDate = to ?? new DateOnly(today.Year, today.Month, DateTime.DaysInMonth(today.Year, today.Month));
    if (toDate < fromDate) toDate = fromDate;
    if (toDate.DayNumber - fromDate.DayNumber > 366) toDate = fromDate.AddDays(366);
    var rows = await BuildSchedulePlannerRowsAsync(fromDate, toDate, dbContext, ct);
    var bytes = PdfReportBuilder.BuildSchedulePlanner(rows, fromDate, toDate);
    return Results.File(bytes, "application/pdf", $"schedule-{fromDate:yyyyMMdd}-{toDate:yyyyMMdd}.pdf");
}).RequireAuthorization("Reports.View");

app.MapPost("/api/reports/schedule-planner/send-email", async (
    SendScheduleReportRequest request,
    AppDbContext dbContext,
    IEmailService emailService,
    CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(request.To))
        return Results.BadRequest(new { message = "Recipient email is required." });
    var rows = await BuildSchedulePlannerRowsAsync(request.From, request.ToDate, dbContext, ct);
    var companyName = (await dbContext.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == "CompanyName", ct))?.Value ?? "ProjectX";

    var dates = new List<DateOnly>();
    for (var d = request.From; d <= request.ToDate; d = d.AddDays(1)) dates.Add(d);

    var employees = rows.GroupBy(r => r.EmployeeName)
        .Select(g => new { Name = g.Key, Dept = g.First().Department, ByDate = g.ToDictionary(x => x.Date) })
        .OrderBy(x => x.Name).ToList();

    var sb = new System.Text.StringBuilder();
    sb.Append("<thead><tr>");
    sb.Append("<th style='padding:6px 8px;background:#4f46e5;color:#fff;text-align:left;position:sticky;left:0'>Employee</th>");
    sb.Append("<th style='padding:6px 8px;background:#4f46e5;color:#fff;text-align:left'>Department</th>");
    foreach (var d in dates)
    {
        var weekend = d.DayOfWeek == DayOfWeek.Saturday || d.DayOfWeek == DayOfWeek.Sunday;
        var bg = weekend ? "#fef2f2" : "#4f46e5";
        var fg = weekend ? "#dc2626" : "#ffffff";
        sb.Append($"<th style='padding:6px 8px;background:{bg};color:{fg};text-align:center;font-size:10px'>{d:dd}<br/><span style='font-weight:normal;font-size:9px'>{d:ddd}</span></th>");
    }
    sb.Append("</tr></thead><tbody>");

    foreach (var emp in employees)
    {
        sb.Append("<tr>");
        sb.Append($"<td style='padding:6px 8px;border-bottom:1px solid #e2e8f0;font-weight:bold;position:sticky;left:0;background:#fff'>{System.Net.WebUtility.HtmlEncode(emp.Name)}</td>");
        sb.Append($"<td style='padding:6px 8px;border-bottom:1px solid #e2e8f0;color:#666'>{System.Net.WebUtility.HtmlEncode(emp.Dept ?? "—")}</td>");
        foreach (var d in dates)
        {
            if (!emp.ByDate.TryGetValue(d, out var cellRow))
            {
                sb.Append("<td style='padding:6px 4px;border-bottom:1px solid #e2e8f0'></td>");
                continue;
            }
            if (cellRow.IsDayOff)
            {
                sb.Append("<td style='padding:6px 4px;border-bottom:1px solid #e2e8f0;background:#fee2e2;color:#dc2626;font-weight:bold;text-align:center;font-size:10px'>OFF</td>");
            }
            else
            {
                var color = string.IsNullOrEmpty(cellRow.Color) ? "#6366f1" : cellRow.Color!;
                var sched = string.IsNullOrEmpty(cellRow.ScheduleName) ? "—" : cellRow.ScheduleName!;
                var times = (cellRow.ShiftStart is null && cellRow.ShiftEnd is null)
                    ? (cellRow.ScheduleType ?? "")
                    : $"{cellRow.ShiftStart ?? "—"}-{cellRow.ShiftEnd ?? "—"}";
                sb.Append($"<td style='padding:6px 4px;border-bottom:1px solid #e2e8f0;background:{color}22;color:{color};text-align:center;font-size:9px'><b>{System.Net.WebUtility.HtmlEncode(sched)}</b>");
                if (!string.IsNullOrEmpty(times)) sb.Append($"<br/><span style='font-weight:normal;font-size:8px'>{times}</span>");
                sb.Append("</td>");
            }
        }
        sb.Append("</tr>");
    }
    sb.Append("</tbody>");

    var subject = $"Schedule Planner — {request.From:dd.MM.yyyy} – {request.ToDate:dd.MM.yyyy}";
    var body = $@"<div style='font-family:Arial,sans-serif;color:#1e293b'>
<h2 style='color:#4f46e5;margin:0 0 8px 0'>Schedule Planner — {companyName}</h2>
<p style='color:#475569'>Period: <b>{request.From:dd.MM.yyyy} – {request.ToDate:dd.MM.yyyy}</b></p>
<div style='overflow-x:auto'>
<table style='border-collapse:collapse;font-size:11px'>{sb}</table>
</div>
<p style='color:#94a3b8;font-size:11px;margin-top:12px'>Generated {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</p>
</div>";
    await emailService.SendAsync(request.To, subject, body, ct);
    return Results.Ok(new { message = $"Report sent to {request.To}." });
}).RequireAuthorization("Reports.View");

app.MapGet("/api/reports/payroll/{periodId:guid}/excel", async (Guid periodId, AppDbContext db, CancellationToken ct) =>
{
    var period = await db.PayrollPeriods.AsNoTracking().FirstOrDefaultAsync(p => p.Id == periodId, ct);
    if (period is null) return Results.NotFound();
    var entries = await db.PayrollEntries.AsNoTracking()
        .Where(e => e.PeriodId == periodId)
        .Include(e => e.Employee).ThenInclude(e => e.Department)
        .OrderBy(e => e.Employee.LastName)
        .ToListAsync(ct);
    var rows = entries.Select(e => new PayrollReportRow(
        $"{e.Employee.FirstName} {e.Employee.LastName}", e.Employee.EmployeeNo,
        e.Employee.Department?.Name,
        (double)e.WorkedDays, (double)e.WorkedHours, (double)e.OvertimeHours, e.AbsentDays,
        e.BasePay, e.OvertimePay, e.AllowancesTotal, e.BonusesTotal,
        e.GrossPay, e.DeductionsTotal, e.TaxAmount, e.NetPay)).ToList();
    var bytes = ExcelReportBuilder.BuildPayroll(rows, period.Year, period.Month, period.Status.ToString());
    return Results.File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        $"payroll-{period.Year}-{period.Month:D2}.xlsx");
}).RequireAuthorization("Reports.View");

app.MapGet("/api/reports/payroll/{periodId:guid}/pdf", async (Guid periodId, AppDbContext db, CancellationToken ct) =>
{
    var period = await db.PayrollPeriods.AsNoTracking().FirstOrDefaultAsync(p => p.Id == periodId, ct);
    if (period is null) return Results.NotFound();
    var entries = await db.PayrollEntries.AsNoTracking()
        .Where(e => e.PeriodId == periodId)
        .Include(e => e.Employee).ThenInclude(e => e.Department)
        .OrderBy(e => e.Employee.LastName)
        .ToListAsync(ct);
    var rows = entries.Select(e => new PayrollReportRow(
        $"{e.Employee.FirstName} {e.Employee.LastName}", e.Employee.EmployeeNo,
        e.Employee.Department?.Name,
        (double)e.WorkedDays, (double)e.WorkedHours, (double)e.OvertimeHours, e.AbsentDays,
        e.BasePay, e.OvertimePay, e.AllowancesTotal, e.BonusesTotal,
        e.GrossPay, e.DeductionsTotal, e.TaxAmount, e.NetPay)).ToList();
    var bytes = PdfReportBuilder.BuildPayroll(rows, period.Year, period.Month, period.Status.ToString());
    return Results.File(bytes, "application/pdf", $"payroll-{period.Year}-{period.Month:D2}.pdf");
}).RequireAuthorization("Reports.View");

// ─── Notifications ─────────────────────────────────────────────────────────────

app.MapGet("/api/notifications", async (ClaimsPrincipal user, INotificationService notifService, CancellationToken ct) =>
{
    if (!Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        return Results.Unauthorized();
    var items = await notifService.GetForUserAsync(userId, ct: ct);
    return Results.Ok(items);
}).RequireAuthorization();

app.MapGet("/api/notifications/unread-count", async (ClaimsPrincipal user, INotificationService notifService, CancellationToken ct) =>
{
    if (!Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        return Results.Unauthorized();
    var count = await notifService.GetUnreadCountAsync(userId, ct);
    return Results.Ok(new { count });
}).RequireAuthorization();

app.MapPost("/api/notifications/{id:guid}/read", async (Guid id, ClaimsPrincipal user, INotificationService notifService, CancellationToken ct) =>
{
    if (!Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        return Results.Unauthorized();
    await notifService.MarkReadAsync(id, userId, ct);
    return Results.Ok();
}).RequireAuthorization();

app.MapPost("/api/notifications/read-all", async (ClaimsPrincipal user, INotificationService notifService, CancellationToken ct) =>
{
    if (!Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        return Results.Unauthorized();
    await notifService.MarkAllReadAsync(userId, ct);
    return Results.Ok();
}).RequireAuthorization();

// ─── Self-Service Auth ─────────────────────────────────────────────────────────

app.MapPost("/api/self-service/login", async (SelfServiceLoginRequest request, UserManager<ApplicationUser> userManager, IJwtTokenService jwtService, CancellationToken cancellationToken) =>
{
    var user = await userManager.FindByEmailAsync(request.Email);
    if (user is null || !user.EmployeeId.HasValue) return Results.Unauthorized();
    if (!await userManager.CheckPasswordAsync(user, request.Password)) return Results.Unauthorized();
    var roles = await userManager.GetRolesAsync(user);
    if (!roles.Contains(SystemRoles.Employee)) return Results.Unauthorized();
    var token = jwtService.CreateToken(user.Id, user.UserName ?? user.Email!, user.Email!, roles.ToList().AsReadOnly());
    return Results.Ok(new { token, employeeId = user.EmployeeId, requiresPasswordSetup = user.RequiresPasswordSetup });
});

// Смена пароля сотрудника. Используется при первом входе с временным паролем.
app.MapPost("/api/self-service/change-password", async (
    SelfServiceChangePasswordRequest request,
    ClaimsPrincipal principal,
    UserManager<ApplicationUser> userManager,
    CancellationToken cancellationToken) =>
{
    var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();
    var user = await userManager.FindByIdAsync(userId.ToString());
    if (user is null || !user.EmployeeId.HasValue) return Results.Unauthorized();

    if (string.IsNullOrEmpty(request.NewPassword) || request.NewPassword.Length < 6)
        return Results.BadRequest(new { message = "Password must be at least 6 characters." });

    if (!await userManager.CheckPasswordAsync(user, request.CurrentPassword ?? string.Empty))
        return Results.BadRequest(new { message = "Current password is incorrect." });

    var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword ?? string.Empty, request.NewPassword);
    if (!result.Succeeded)
        return Results.BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

    user.RequiresPasswordSetup = false;
    await userManager.UpdateAsync(user);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Self-Service Portal (role Employee) ──────────────────────────────────────

app.MapGet("/api/self-service/me", async (ClaimsPrincipal user, UserManager<ApplicationUser> userManager, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();
    var appUser = await userManager.FindByIdAsync(userId.ToString());
    if (appUser?.EmployeeId is null) return Results.Unauthorized();

    var employee = await dbContext.Employees.AsNoTracking()
        .Include(e => e.WorkSchedule)
        .Include(e => e.Department)
        .FirstOrDefaultAsync(e => e.Id == appUser.EmployeeId, cancellationToken);
    if (employee is null) return Results.NotFound();

    var today = DateTime.UtcNow.Date;
    var todayRecords = await dbContext.AttendanceRecords.AsNoTracking()
        .Where(r => r.EmployeeId == employee.Id && r.EventTimeUtc >= today && r.EventTimeUtc < today.AddDays(1))
        .OrderBy(r => r.EventTimeUtc)
        .Select(r => new AttendanceRecordResponse(r.Id, r.EmployeeId, "", r.EventTimeUtc, r.EventType.ToString(), r.DeviceId, r.Source, r.CreatedUtc))
        .ToListAsync(cancellationToken);

    return Results.Ok(new
    {
        id = employee.Id,
        firstName = employee.FirstName,
        lastName = employee.LastName,
        employeeNo = employee.EmployeeNo,
        department = employee.Department?.Name,
        workSchedule = employee.WorkSchedule == null ? null : new { employee.WorkSchedule.Id, employee.WorkSchedule.Name, type = employee.WorkSchedule.Type.ToString() },
        todayRecords
    });
}).RequireAuthorization();

app.MapGet("/api/self-service/requests", async (ClaimsPrincipal user, UserManager<ApplicationUser> userManager, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();
    var appUser = await userManager.FindByIdAsync(userId.ToString());
    if (appUser?.EmployeeId is null) return Results.Unauthorized();

    var requests = await dbContext.AttendanceRequests.AsNoTracking()
        .Where(r => r.EmployeeId == appUser.EmployeeId)
        .OrderByDescending(r => r.CreatedUtc)
        .Take(50)
        .Select(r => new AttendanceRequestResponse(r.Id, r.EmployeeId, "", r.Type.ToString(), r.RequestedTimeUtc, r.RequestedEndTimeUtc, r.Comment, r.Status.ToString(), r.ReviewedByUserId, r.ReviewedAtUtc, r.ReviewComment, r.CreatedUtc, r.Latitude, r.Longitude, r.GeoZoneName))
        .ToListAsync(cancellationToken);
    return Results.Ok(requests);
}).RequireAuthorization();

app.MapPost("/api/self-service/requests", async (CreateAttendanceRequestBody request, ClaimsPrincipal user, UserManager<ApplicationUser> userManager, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();
    var appUser = await userManager.FindByIdAsync(userId.ToString());
    if (appUser?.EmployeeId is null) return Results.Unauthorized();

    if (!Enum.TryParse<AttendanceRequestType>(request.Type, true, out var reqType))
        return Results.BadRequest(new { message = "Invalid request type." });

    // Гео-проверка: если CheckIn/CheckOut и координаты в радиусе активной зоны → авто-аппрув.
    string? matchedZone = null;
    var inZone = false;
    if ((reqType == AttendanceRequestType.CheckIn || reqType == AttendanceRequestType.CheckOut)
        && request.Latitude.HasValue && request.Longitude.HasValue)
    {
        var zones = await dbContext.GeoZones.AsNoTracking().Where(z => z.IsActive).ToListAsync(cancellationToken);
        foreach (var z in zones)
        {
            var d = HaversineMeters(z.Latitude, z.Longitude, request.Latitude.Value, request.Longitude.Value);
            if (d <= z.RadiusMeters) { inZone = true; matchedZone = z.Name; break; }
        }
    }

    var entity = new AttendanceRequest
    {
        EmployeeId = appUser.EmployeeId.Value,
        Type = reqType,
        RequestedTimeUtc = request.RequestedTimeUtc.ToUniversalTime(),
        RequestedEndTimeUtc = request.RequestedEndTimeUtc?.ToUniversalTime(),
        Comment = request.Comment,
        Latitude = request.Latitude,
        Longitude = request.Longitude,
        GeoZoneName = matchedZone,
        Status = inZone ? AttendanceRequestStatus.Approved : AttendanceRequestStatus.Pending,
        ReviewedAtUtc = inZone ? DateTime.UtcNow : null,
        ReviewComment = inZone ? $"Auto-approved (in zone: {matchedZone})" : null
    };
    dbContext.AttendanceRequests.Add(entity);

    // Если auto-approved CheckIn/CheckOut — сразу пишем в AttendanceCorrection.
    if (inZone)
    {
        var dateUtc = entity.RequestedTimeUtc.Date;
        var existingCorr = await dbContext.AttendanceCorrections
            .FirstOrDefaultAsync(c => c.EmployeeId == entity.EmployeeId && c.DateUtc == dateUtc, cancellationToken);
        if (existingCorr is null)
        {
            existingCorr = new AttendanceCorrection
            {
                EmployeeId = entity.EmployeeId,
                DateUtc = dateUtc,
                Comment = $"Auto-approved geo check-{(reqType == AttendanceRequestType.CheckIn ? "in" : "out")} ({matchedZone})"
            };
            dbContext.AttendanceCorrections.Add(existingCorr);
        }
        if (reqType == AttendanceRequestType.CheckIn)
            existingCorr.CheckInUtc = entity.RequestedTimeUtc;
        else
            existingCorr.CheckOutUtc = entity.RequestedTimeUtc;
    }

    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Created($"/api/self-service/requests/{entity.Id}", new { entity.Id, entity.Type, entity.RequestedTimeUtc, entity.Status, autoApproved = inZone, matchedZone });
}).RequireAuthorization();

// Отмена собственной Pending-заявки. Approved/Rejected уже не отменяются — это решение админа.
app.MapDelete("/api/self-service/requests/{id:guid}", async (
    Guid id, ClaimsPrincipal user, UserManager<ApplicationUser> userManager, AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();
    var appUser = await userManager.FindByIdAsync(userId.ToString());
    if (appUser?.EmployeeId is null) return Results.Unauthorized();

    var req = await dbContext.AttendanceRequests.FirstOrDefaultAsync(
        r => r.Id == id && r.EmployeeId == appUser.EmployeeId, cancellationToken);
    if (req is null) return Results.NotFound();
    if (req.Status != AttendanceRequestStatus.Pending)
        return Results.BadRequest(new { message = "Only pending requests can be cancelled." });

    dbContext.AttendanceRequests.Remove(req);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Self-Service: own attendance history ─────────────────────────────────────

app.MapGet("/api/self-service/attendance", async (
    DateTime? from, DateTime? to,
    ClaimsPrincipal user, UserManager<ApplicationUser> userManager, AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();
    var appUser = await userManager.FindByIdAsync(userId.ToString());
    if (appUser?.EmployeeId is null) return Results.Unauthorized();

    // Дефолт — последние 30 дней; жёсткий cap 92 дня, чтобы клиент не утянул всю историю.
    var toUtc = (to ?? DateTime.UtcNow).ToUniversalTime();
    var fromUtc = (from ?? toUtc.AddDays(-30)).ToUniversalTime();
    if ((toUtc - fromUtc).TotalDays > 92) fromUtc = toUtc.AddDays(-92);

    var records = await dbContext.AttendanceRecords.AsNoTracking()
        .Where(r => r.EmployeeId == appUser.EmployeeId
                 && r.EventTimeUtc >= fromUtc && r.EventTimeUtc <= toUtc)
        .OrderByDescending(r => r.EventTimeUtc)
        .Select(r => new AttendanceRecordResponse(r.Id, r.EmployeeId, "", r.EventTimeUtc, r.EventType.ToString(), r.DeviceId, r.Source, r.CreatedUtc))
        .ToListAsync(cancellationToken);
    return Results.Ok(records);
}).RequireAuthorization();

// ─── Self-Service: own work schedule (date range, merged with day patterns + leaves) ──

app.MapGet("/api/self-service/schedule", async (
    DateOnly? from, DateOnly? to,
    ClaimsPrincipal user, UserManager<ApplicationUser> userManager, AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();
    var appUser = await userManager.FindByIdAsync(userId.ToString());
    if (appUser?.EmployeeId is null) return Results.Unauthorized();

    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var fromDate = from ?? new DateOnly(today.Year, today.Month, 1);
    var toDate = to ?? fromDate.AddDays(DateTime.DaysInMonth(fromDate.Year, fromDate.Month) - 1);
    if (toDate < fromDate) toDate = fromDate;
    if (toDate.DayNumber - fromDate.DayNumber > 92) toDate = fromDate.AddDays(92);

    var employee = await dbContext.Employees.AsNoTracking()
        .Include(e => e.WorkSchedule)
        .Include(e => e.DayPatterns.Where(p => p.Date >= fromDate && p.Date <= toDate))
            .ThenInclude(p => p.WorkSchedule)
        .FirstOrDefaultAsync(e => e.Id == appUser.EmployeeId, cancellationToken);
    if (employee is null) return Results.NotFound();

    var leaves = await dbContext.EmployeeLeaves.AsNoTracking()
        .Where(l => l.EmployeeId == appUser.EmployeeId
                 && l.StartDate <= toDate && l.EndDate >= fromDate
                 && l.Status != LeaveStatus.Rejected && l.Status != LeaveStatus.Cancelled)
        .ToListAsync(cancellationToken);

    var patternsByDate = employee.DayPatterns.ToDictionary(p => p.Date);
    var days = new List<object>();
    for (var d = fromDate; d <= toDate; d = d.AddDays(1))
    {
        patternsByDate.TryGetValue(d, out var pat);
        var sched = (pat is not null && !pat.IsDayOff) ? (pat.WorkSchedule ?? employee.WorkSchedule) : employee.WorkSchedule;
        var isDayOff = (pat?.IsDayOff ?? false) || sched?.Type == ScheduleType.Off;
        var leave = leaves.FirstOrDefault(l => l.StartDate <= d && l.EndDate >= d);
        days.Add(new
        {
            date = d.ToString("yyyy-MM-dd"),
            scheduleId = sched?.Id,
            scheduleName = sched?.Name,
            shiftStart = sched?.ShiftStart?.ToString(@"hh\:mm"),
            shiftEnd = sched?.ShiftEnd?.ToString(@"hh\:mm"),
            color = sched?.Color,
            isDayOff,
            leaveType = leave?.LeaveType.ToString(),
            leaveStatus = leave?.Status.ToString()
        });
    }

    return Results.Ok(new
    {
        from = fromDate.ToString("yyyy-MM-dd"),
        to = toDate.ToString("yyyy-MM-dd"),
        defaultSchedule = employee.WorkSchedule == null ? null : new
        {
            employee.WorkSchedule.Id,
            employee.WorkSchedule.Name,
            type = employee.WorkSchedule.Type.ToString(),
            shiftStart = employee.WorkSchedule.ShiftStart?.ToString(@"hh\:mm"),
            shiftEnd = employee.WorkSchedule.ShiftEnd?.ToString(@"hh\:mm"),
            color = employee.WorkSchedule.Color
        },
        days
    });
}).RequireAuthorization();

// ─── Self-Service: own leaves ─────────────────────────────────────────────────

app.MapGet("/api/self-service/leaves", async (
    ClaimsPrincipal user, UserManager<ApplicationUser> userManager, AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();
    var appUser = await userManager.FindByIdAsync(userId.ToString());
    if (appUser?.EmployeeId is null) return Results.Unauthorized();

    var leaves = await dbContext.EmployeeLeaves.AsNoTracking()
        .Where(l => l.EmployeeId == appUser.EmployeeId)
        .OrderByDescending(l => l.StartDate)
        .Take(100)
        .Select(l => new
        {
            l.Id,
            leaveType = l.LeaveType.ToString(),
            l.IsPaid,
            l.StartDate,
            l.EndDate,
            l.Reason,
            status = l.Status.ToString(),
            l.Notes,
            l.CreatedUtc,
            l.ApprovedAt
        })
        .ToListAsync(cancellationToken);
    return Results.Ok(leaves);
}).RequireAuthorization();

app.MapPost("/api/self-service/leaves", async (
    SelfServiceLeaveRequest request,
    ClaimsPrincipal user, UserManager<ApplicationUser> userManager, AppDbContext dbContext,
    INotificationService notifService,
    CancellationToken cancellationToken) =>
{
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();
    var appUser = await userManager.FindByIdAsync(userId.ToString());
    if (appUser?.EmployeeId is null) return Results.Unauthorized();

    if (!Enum.TryParse<LeaveType>(request.LeaveType, true, out var lt))
        return Results.BadRequest(new { message = "Invalid leaveType. Use Vacation or DayOff." });
    if (request.EndDate < request.StartDate)
        return Results.BadRequest(new { message = "endDate must be >= startDate." });

    var leave = new EmployeeLeave
    {
        EmployeeId = appUser.EmployeeId.Value,
        LeaveType = lt,
        IsPaid = request.IsPaid,
        StartDate = request.StartDate,
        EndDate = request.EndDate,
        Reason = request.Reason,
        Status = LeaveStatus.Pending
    };
    dbContext.EmployeeLeaves.Add(leave);
    await dbContext.SaveChangesAsync(cancellationToken);

    // Broadcast менеджерам — approver-flow тот же, что и у обычных attendance-requests.
    await notifService.CreateAsync(
        NotificationTypes.ApprovalRequest,
        "New leave request",
        $"{appUser.UserName} requested {lt} from {request.StartDate:yyyy-MM-dd} to {request.EndDate:yyyy-MM-dd}.",
        referenceId: leave.Id.ToString(),
        ct: cancellationToken);

    return Results.Created($"/api/self-service/leaves/{leave.Id}", new
    {
        leave.Id,
        leaveType = leave.LeaveType.ToString(),
        leave.IsPaid,
        leave.StartDate,
        leave.EndDate,
        leave.Reason,
        status = leave.Status.ToString()
    });
}).RequireAuthorization();

app.MapDelete("/api/self-service/leaves/{id:guid}", async (
    Guid id, ClaimsPrincipal user, UserManager<ApplicationUser> userManager, AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();
    var appUser = await userManager.FindByIdAsync(userId.ToString());
    if (appUser?.EmployeeId is null) return Results.Unauthorized();

    var leave = await dbContext.EmployeeLeaves.FirstOrDefaultAsync(
        l => l.Id == id && l.EmployeeId == appUser.EmployeeId, cancellationToken);
    if (leave is null) return Results.NotFound();
    if (leave.Status != LeaveStatus.Pending)
        return Results.BadRequest(new { message = "Only pending leaves can be cancelled." });

    leave.Status = LeaveStatus.Cancelled;
    leave.UpdatedUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Self-Service: notifications (own user) ──────────────────────────────────

app.MapGet("/api/self-service/notifications", async (
    ClaimsPrincipal user, INotificationService notifService, CancellationToken ct) =>
{
    if (!Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        return Results.Unauthorized();
    return Results.Ok(await notifService.GetForUserAsync(userId, ct: ct));
}).RequireAuthorization();

app.MapGet("/api/self-service/notifications/unread-count", async (
    ClaimsPrincipal user, INotificationService notifService, CancellationToken ct) =>
{
    if (!Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        return Results.Unauthorized();
    return Results.Ok(new { count = await notifService.GetUnreadCountAsync(userId, ct) });
}).RequireAuthorization();

app.MapPost("/api/self-service/notifications/{id:guid}/read", async (
    Guid id, ClaimsPrincipal user, INotificationService notifService, CancellationToken ct) =>
{
    if (!Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        return Results.Unauthorized();
    await notifService.MarkReadAsync(id, userId, ct);
    return Results.NoContent();
}).RequireAuthorization();

app.MapPost("/api/self-service/notifications/read-all", async (
    ClaimsPrincipal user, INotificationService notifService, CancellationToken ct) =>
{
    if (!Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        return Results.Unauthorized();
    await notifService.MarkAllReadAsync(userId, ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Self-Service: own payroll (visible only after period Approved/Paid) ──────

app.MapGet("/api/self-service/payroll", async (
    ClaimsPrincipal user, UserManager<ApplicationUser> userManager, AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();
    var appUser = await userManager.FindByIdAsync(userId.ToString());
    if (appUser?.EmployeeId is null) return Results.Unauthorized();

    var entries = await dbContext.PayrollEntries.AsNoTracking()
        .Include(e => e.Period)
        .Where(e => e.EmployeeId == appUser.EmployeeId
                 && (e.Period.Status == PayrollPeriodStatus.Approved
                  || e.Period.Status == PayrollPeriodStatus.Paid))
        .OrderByDescending(e => e.Period.Year).ThenByDescending(e => e.Period.Month)
        .Select(e => new
        {
            e.Id,
            periodId = e.PeriodId,
            year = e.Period.Year,
            month = e.Period.Month,
            startDate = e.Period.StartDate ?? new DateOnly(e.Period.Year, e.Period.Month, 1),
            endDate = e.Period.EndDate ?? new DateOnly(e.Period.Year, e.Period.Month, 1).AddMonths(1).AddDays(-1),
            periodStatus = e.Period.Status.ToString(),
            e.WorkedDays, e.WorkedHours, e.OvertimeHours,
            e.LatenessMinutes, e.EarlyLeaveMinutes, e.AbsentDays,
            e.BasePay, e.OvertimePay, e.AllowancesTotal, e.BonusesTotal,
            e.GrossPay, e.DeductionsTotal, e.LatenessDeduction, e.EarlyLeaveDeduction,
            e.TaxRate, e.TaxAmount, e.NetPay,
            status = e.Status.ToString()
        })
        .ToListAsync(cancellationToken);

    return Results.Ok(entries);
}).RequireAuthorization();

// ─── Self-Service: active geo-zones (preview before submitting check-in/out) ──

app.MapGet("/api/self-service/geo-zones", async (AppDbContext db, CancellationToken ct) =>
{
    var zones = await db.GeoZones.AsNoTracking()
        .Where(z => z.IsActive)
        .OrderBy(z => z.Name)
        .Select(z => new { z.Id, z.Name, z.Latitude, z.Longitude, z.RadiusMeters })
        .ToListAsync(ct);
    return Results.Ok(zones);
}).RequireAuthorization();

// ─── Self-Service: month summary widget ──────────────────────────────────────

app.MapGet("/api/self-service/summary", async (
    int? year, int? month,
    ClaimsPrincipal user, UserManager<ApplicationUser> userManager, AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdStr, out var userId)) return Results.Unauthorized();
    var appUser = await userManager.FindByIdAsync(userId.ToString());
    if (appUser?.EmployeeId is null) return Results.Unauthorized();

    var today = DateTime.UtcNow;
    var y = year ?? today.Year;
    var m = month ?? today.Month;
    var monthStart = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Utc);
    var monthEnd = monthStart.AddMonths(1);
    var monthStartD = DateOnly.FromDateTime(monthStart);
    var monthLastD = DateOnly.FromDateTime(monthEnd.AddDays(-1));

    var records = await dbContext.AttendanceRecords.AsNoTracking()
        .Where(r => r.EmployeeId == appUser.EmployeeId
                 && r.EventTimeUtc >= monthStart && r.EventTimeUtc < monthEnd)
        .Select(r => r.EventTimeUtc)
        .ToListAsync(cancellationToken);
    var workedDays = records.Select(r => r.Date).Distinct().Count();

    var pendingRequests = await dbContext.AttendanceRequests.AsNoTracking()
        .CountAsync(r => r.EmployeeId == appUser.EmployeeId
                      && r.Status == AttendanceRequestStatus.Pending, cancellationToken);
    var pendingLeaves = await dbContext.EmployeeLeaves.AsNoTracking()
        .CountAsync(l => l.EmployeeId == appUser.EmployeeId
                      && l.Status == LeaveStatus.Pending, cancellationToken);

    var approvedLeaves = await dbContext.EmployeeLeaves.AsNoTracking()
        .Where(l => l.EmployeeId == appUser.EmployeeId
                 && l.Status == LeaveStatus.Approved
                 && l.StartDate <= monthLastD && l.EndDate >= monthStartD)
        .Select(l => new { l.StartDate, l.EndDate })
        .ToListAsync(cancellationToken);
    var leaveDays = approvedLeaves.Sum(l =>
    {
        var s = l.StartDate > monthStartD ? l.StartDate : monthStartD;
        var e = l.EndDate < monthLastD ? l.EndDate : monthLastD;
        return Math.Max(0, e.DayNumber - s.DayNumber + 1);
    });

    return Results.Ok(new
    {
        year = y, month = m,
        workedDays,
        recordsCount = records.Count,
        pendingRequests,
        pendingLeaves,
        leaveDaysApproved = leaveDays
    });
}).RequireAuthorization();

// Haversine: расстояние между двумя WGS84-координатами в метрах. R=6371000.
static double HaversineMeters(double lat1, double lon1, double lat2, double lon2)
{
    var R = 6371000.0;
    var toRad = Math.PI / 180.0;
    var dLat = (lat2 - lat1) * toRad;
    var dLon = (lon2 - lon1) * toRad;
    var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(lat1 * toRad) * Math.Cos(lat2 * toRad) *
            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
    return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
}

// CRUD geo-zones
app.MapGet("/api/geo-zones", async (AppDbContext db, CancellationToken ct) =>
    Results.Ok(await db.GeoZones.AsNoTracking().OrderBy(z => z.Name).ToListAsync(ct))
).RequireAuthorization();

app.MapPost("/api/geo-zones", async (GeoZoneRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name required." });
    if (req.RadiusMeters <= 0) return Results.BadRequest(new { message = "Radius must be positive." });
    var z = new GeoZone { Name = req.Name.Trim(), Latitude = req.Latitude, Longitude = req.Longitude, RadiusMeters = req.RadiusMeters, IsActive = req.IsActive };
    db.GeoZones.Add(z);
    await db.SaveChangesAsync(ct);
    return Results.Ok(z);
}).RequireAuthorization("GeoZones.Manage");

app.MapPut("/api/geo-zones/{id:guid}", async (Guid id, GeoZoneRequest req, AppDbContext db, CancellationToken ct) =>
{
    var z = await db.GeoZones.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (z is null) return Results.NotFound();
    z.Name = req.Name.Trim();
    z.Latitude = req.Latitude;
    z.Longitude = req.Longitude;
    z.RadiusMeters = req.RadiusMeters;
    z.IsActive = req.IsActive;
    await db.SaveChangesAsync(ct);
    return Results.Ok(z);
}).RequireAuthorization("GeoZones.Manage");

app.MapDelete("/api/geo-zones/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var z = await db.GeoZones.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (z is null) return Results.NotFound();
    db.GeoZones.Remove(z);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization("GeoZones.Manage");

// ─── Payroll: Components ────────────────────────────────────────────────────────

app.MapGet("/api/payroll/components", async (AppDbContext db, CancellationToken ct) =>
{
    var items = await db.PayrollComponents.AsNoTracking().OrderBy(c => c.ComponentType).ThenBy(c => c.Name).ToListAsync(ct);
    return Results.Ok(items.Select(c => new
    {
        c.Id, c.Name,
        componentType = c.ComponentType.ToString(),
        c.IsFixed, c.Amount, c.Percentage, c.IsDefault, c.IsActive, c.Description,
        c.CreatedUtc, c.UpdatedUtc,
    }));
}).RequireAuthorization("Payroll.View");

app.MapPost("/api/payroll/components", async (PayrollComponentRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name required." });
    if (!Enum.TryParse<PayrollComponentType>(req.ComponentType, true, out var compType))
        return Results.BadRequest(new { message = "Invalid componentType." });
    var c = new PayrollComponent
    {
        Name = req.Name.Trim(), ComponentType = compType, IsFixed = req.IsFixed,
        Amount = req.Amount ?? 0, Percentage = req.Percentage ?? 0,
        IsDefault = req.IsDefault, IsActive = req.IsActive, Description = req.Description
    };
    db.PayrollComponents.Add(c);
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { c.Id, c.Name, componentType = c.ComponentType.ToString(), c.IsFixed, c.Amount, c.Percentage, c.IsDefault, c.IsActive, c.Description });
}).RequireAuthorization("Payroll.Manage");

app.MapPut("/api/payroll/components/{id:guid}", async (Guid id, PayrollComponentRequest req, AppDbContext db, CancellationToken ct) =>
{
    var c = await db.PayrollComponents.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (c is null) return Results.NotFound();
    if (!Enum.TryParse<PayrollComponentType>(req.ComponentType, true, out var compType))
        return Results.BadRequest(new { message = "Invalid componentType." });
    c.Name = req.Name.Trim(); c.ComponentType = compType; c.IsFixed = req.IsFixed;
    c.Amount = req.Amount ?? 0; c.Percentage = req.Percentage ?? 0;
    c.IsDefault = req.IsDefault; c.IsActive = req.IsActive; c.Description = req.Description;
    c.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { c.Id, c.Name, componentType = c.ComponentType.ToString(), c.IsFixed, c.Amount, c.Percentage, c.IsDefault, c.IsActive, c.Description });
}).RequireAuthorization("Payroll.Manage");

app.MapDelete("/api/payroll/components/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var c = await db.PayrollComponents.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (c is null) return Results.NotFound();
    db.PayrollComponents.Remove(c);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization("Payroll.Manage");

// ─── Payroll: Employee Salary Config ───────────────────────────────────────────

app.MapGet("/api/payroll/employees", async (AppDbContext db, CancellationToken ct) =>
{
    var employees = await db.Employees
        .AsNoTracking()
        .Where(e => e.IsActive)
        .Include(e => e.Department)
        .OrderBy(e => e.LastName).ThenBy(e => e.FirstName)
        .ToListAsync(ct);
    var configs = await db.EmployeeSalaryConfigs
        .AsNoTracking()
        .Include(c => c.Components).ThenInclude(ec => ec.Component)
        .ToListAsync(ct);
    var configMap = configs.ToDictionary(c => c.EmployeeId);
    return Results.Ok(employees.Select(e =>
    {
        configMap.TryGetValue(e.Id, out var cfg);
        return new
        {
            e.Id, e.FirstName, e.LastName, e.EmployeeNo,
            department = e.Department?.Name,
            salaryConfig = cfg is null ? null : new
            {
                cfg.Id, salaryType = cfg.SalaryType.ToString(), cfg.BaseAmount, cfg.Currency,
                cfg.OvertimeMultiplier, cfg.OvertimeEnabled,
                cfg.PayByWorkedHours,
                cfg.OvertimeTiersJson, cfg.LatenessDeductionEnabled, cfg.LatenessDeductionMode, cfg.LatenessTiersJson,
                cfg.EarlyLeaveDeductionEnabled, cfg.EarlyLeaveDeductionMode, cfg.EarlyLeaveTiersJson,
                cfg.EffectiveFrom,
                components = cfg.Components.Select(ec => new
                {
                    componentId = ec.ComponentId,
                    name = ec.Component.Name,
                    componentType = ec.Component.ComponentType.ToString(),
                    isFixed = ec.Component.IsFixed,
                    amount = ec.OverrideAmount ?? ec.Component.Amount,
                    percentage = ec.OverridePercentage ?? ec.Component.Percentage
                })
            }
        };
    }));
}).RequireAuthorization("Payroll.View");

app.MapPut("/api/payroll/employees/{employeeId:guid}/salary", async (
    Guid employeeId, EmployeeSalaryConfigRequest req, AppDbContext db, CancellationToken ct) =>
{
    var employee = await db.Employees.FirstOrDefaultAsync(e => e.Id == employeeId, ct);
    if (employee is null) return Results.NotFound();
    if (!Enum.TryParse<SalaryType>(req.SalaryType, true, out var salType))
        return Results.BadRequest(new { message = "Invalid salaryType." });

    var cfg = await db.EmployeeSalaryConfigs
        .Include(c => c.Components)
        .FirstOrDefaultAsync(c => c.EmployeeId == employeeId, ct);

    if (cfg is null)
    {
        cfg = new EmployeeSalaryConfig { EmployeeId = employeeId };
        db.EmployeeSalaryConfigs.Add(cfg);
    }
    else
    {
        cfg.UpdatedUtc = DateTime.UtcNow;
        cfg.Components.Clear();
    }

    cfg.SalaryType = salType;
    cfg.BaseAmount = req.BaseAmount;
    cfg.Currency = req.Currency ?? "AZN";
    cfg.OvertimeMultiplier = req.OvertimeMultiplier ?? 1.5m;
    cfg.OvertimeEnabled = req.OvertimeEnabled ?? true;
    cfg.PayByWorkedHours = req.PayByWorkedHours ?? false;
    var jsonOpts = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
    cfg.OvertimeTiersJson = req.OvertimeTiers is { Length: > 0 }
        ? System.Text.Json.JsonSerializer.Serialize(req.OvertimeTiers, jsonOpts)
        : null;
    cfg.LatenessDeductionEnabled = req.LatenessDeductionEnabled ?? false;
    cfg.LatenessDeductionMode = string.Equals(req.LatenessDeductionMode, "Fixed", StringComparison.OrdinalIgnoreCase) ? "Fixed" : "Coefficient";
    cfg.LatenessTiersJson = req.LatenessTiers is { Length: > 0 }
        ? System.Text.Json.JsonSerializer.Serialize(req.LatenessTiers, jsonOpts)
        : null;
    cfg.EarlyLeaveDeductionEnabled = req.EarlyLeaveDeductionEnabled ?? false;
    cfg.EarlyLeaveDeductionMode = string.Equals(req.EarlyLeaveDeductionMode, "Fixed", StringComparison.OrdinalIgnoreCase) ? "Fixed" : "Coefficient";
    cfg.EarlyLeaveTiersJson = req.EarlyLeaveTiers is { Length: > 0 }
        ? System.Text.Json.JsonSerializer.Serialize(req.EarlyLeaveTiers, jsonOpts)
        : null;
    cfg.EffectiveFrom = req.EffectiveFrom;

    if (req.ComponentIds is not null)
    {
        foreach (var cid in req.ComponentIds)
        {
            var comp = await db.PayrollComponents.FirstOrDefaultAsync(c => c.Id == cid, ct);
            if (comp is not null)
                cfg.Components.Add(new EmployeePayrollComponent { ComponentId = cid, SalaryConfigId = cfg.Id });
        }
    }

    await db.SaveChangesAsync(ct);
    return Results.Ok(new { cfg.Id, cfg.EmployeeId, cfg.SalaryType, cfg.BaseAmount, cfg.Currency, cfg.OvertimeMultiplier, cfg.EffectiveFrom });
}).RequireAuthorization("Payroll.Manage");

// ─── Payroll: Periods ───────────────────────────────────────────────────────────

app.MapGet("/api/payroll/periods", async (AppDbContext db, CancellationToken ct) =>
{
    var periods = await db.PayrollPeriods.AsNoTracking()
        .Include(p => p.Entries)
        .OrderByDescending(p => p.StartDate ?? new DateOnly(p.Year, p.Month, 1))
        .ToListAsync(ct);
    return Results.Ok(periods.Select(p => new
    {
        p.Id,
        p.Year, p.Month,
        startDate = p.StartDate ?? new DateOnly(p.Year, p.Month, 1),
        endDate = p.EndDate ?? new DateOnly(p.Year, p.Month, 1).AddMonths(1).AddDays(-1),
        status = p.Status.ToString(),
        p.HoursConfirmedAt,
        p.CalculatedAt, p.ApprovedAt, p.Notes,
        employeeCount = p.Entries.Count,
        totalGross = p.Entries.Sum(e => e.GrossPay),
        totalNet = p.Entries.Sum(e => e.NetPay),
        totalTax = p.Entries.Sum(e => e.TaxAmount)
    }));
}).RequireAuthorization("Payroll.View");

app.MapPost("/api/payroll/periods", async (CreatePayrollPeriodRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (req.EndDate < req.StartDate) return Results.BadRequest(new { message = "EndDate must be >= StartDate." });
    if ((req.EndDate.DayNumber - req.StartDate.DayNumber) > 366) return Results.BadRequest(new { message = "Period too long (max 366 days)." });
    var period = new PayrollPeriod
    {
        StartDate = req.StartDate,
        EndDate = req.EndDate,
        Year = req.StartDate.Year,
        Month = req.StartDate.Month,
        Notes = req.Notes,
    };
    db.PayrollPeriods.Add(period);
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { period.Id, startDate = period.StartDate, endDate = period.EndDate, status = period.Status.ToString() });
}).RequireAuthorization("Payroll.Manage");

app.MapGet("/api/payroll/periods/{id:guid}/entries", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var period = await db.PayrollPeriods.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);
    if (period is null) return Results.NotFound();
    var entries = await db.PayrollEntries.AsNoTracking()
        .Where(e => e.PeriodId == id)
        .Include(e => e.Employee).ThenInclude(e => e.Department)
        .OrderBy(e => e.Employee.LastName)
        .ToListAsync(ct);
    return Results.Ok(new
    {
        period = new
        {
            period.Id,
            period.Year, period.Month,
            startDate = period.StartDate ?? new DateOnly(period.Year, period.Month, 1),
            endDate = period.EndDate ?? new DateOnly(period.Year, period.Month, 1).AddMonths(1).AddDays(-1),
            status = period.Status.ToString(), period.HoursConfirmedAt, period.CalculatedAt, period.ApprovedAt, period.Notes
        },
        entries = entries.Select(e => new
        {
            e.Id, e.EmployeeId,
            employeeName = $"{e.Employee.FirstName} {e.Employee.LastName}",
            employeeNo = e.Employee.EmployeeNo,
            department = e.Employee.Department?.Name,
            e.WorkedDays, e.WorkedHours, e.OvertimeHours, e.LatenessMinutes, e.LatenessDaysCount,
            e.EarlyLeaveMinutes, e.EarlyLeaveDaysCount, e.AbsentDays, e.TotalWorkingDays,
            e.BasePay, e.OvertimePay, e.AllowancesTotal, e.BonusesTotal,
            e.GrossPay, e.DeductionsTotal, e.LatenessDeduction, e.EarlyLeaveDeduction,
            e.TaxRate, e.TaxAmount, e.NetPay,
            status = e.Status.ToString(), e.Notes, e.ComponentsJson
        })
    });
}).RequireAuthorization("Payroll.View");

app.MapPost("/api/payroll/periods/{id:guid}/confirm-hours", async (
    Guid id, AppDbContext db, CancellationToken ct) =>
{
    var period = await db.PayrollPeriods.Include(p => p.Entries).FirstOrDefaultAsync(p => p.Id == id, ct);
    if (period is null) return Results.NotFound();
    if (period.Status == PayrollPeriodStatus.Approved || period.Status == PayrollPeriodStatus.Paid)
        return Results.BadRequest(new { message = "Cannot reconfirm an approved/paid period." });

    var rangeStart = period.StartDate ?? new DateOnly(period.Year, period.Month, 1);
    var rangeEnd = period.EndDate ?? rangeStart.AddMonths(1).AddDays(-1);

    var totals = await AttendanceCalculator.ComputeForRangeAsync(db, rangeStart, rangeEnd, ct);

    db.PayrollEntries.RemoveRange(period.Entries);
    period.Entries.Clear();
    foreach (var t in totals)
    {
        db.PayrollEntries.Add(new PayrollEntry
        {
            PeriodId = id,
            EmployeeId = t.EmployeeId,
            WorkedDays = t.WorkedDays,
            WorkedHours = Math.Round((decimal)t.WorkedHours, 2),
            OvertimeHours = Math.Round((decimal)t.OvertimeHours, 2),
            LatenessMinutes = Math.Round((decimal)t.LatenessMinutes, 2),
            LatenessDaysCount = t.LatenessDaysCount,
            EarlyLeaveMinutes = Math.Round((decimal)t.EarlyLeaveMinutes, 2),
            EarlyLeaveDaysCount = t.EarlyLeaveDaysCount,
            AbsentDays = t.AbsentDays,
            TotalWorkingDays = t.TotalWorkingDays,
            OvertimeBreakdownJson = t.OvertimeBreakdown.Count > 0
                ? System.Text.Json.JsonSerializer.Serialize(t.OvertimeBreakdown)
                : null,
            BasePay = 0, OvertimePay = 0, AllowancesTotal = 0, BonusesTotal = 0,
            GrossPay = 0, DeductionsTotal = 0, TaxRate = 0, TaxAmount = 0, NetPay = 0,
            Status = PayrollEntryStatus.Pending,
        });
    }
    period.HoursConfirmedAt = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { confirmed = true, entriesCount = totals.Count, period.HoursConfirmedAt });
}).RequireAuthorization("Payroll.Manage");

app.MapPost("/api/payroll/periods/{id:guid}/calculate", async (
    Guid id, CalculatePayrollRequest? req, AppDbContext db, CancellationToken ct) =>
{
    var period = await db.PayrollPeriods.Include(p => p.Entries).FirstOrDefaultAsync(p => p.Id == id, ct);
    if (period is null) return Results.NotFound();
    if (period.Status == PayrollPeriodStatus.Approved || period.Status == PayrollPeriodStatus.Paid)
        return Results.BadRequest(new { message = "Cannot recalculate an approved/paid period." });
    if (period.HoursConfirmedAt is null)
        return Results.BadRequest(new { message = "Confirm hours first (POST /confirm-hours)." });

    var taxRate = req?.TaxRate ?? 14m;
    var mode = (req?.Mode ?? "Full").Trim();
    if (mode != "Full" && mode != "OvertimeOnly" && mode != "NoOvertime")
        return Results.BadRequest(new { message = "Mode must be Full, OvertimeOnly, or NoOvertime." });
    var skipOvertime = mode == "NoOvertime";
    var overtimeOnly = mode == "OvertimeOnly";

    // Salary configs + entries — рабочие часы берём из confirmed snapshot (entries).
    var configs = await db.EmployeeSalaryConfigs
        .Include(c => c.Components).ThenInclude(ec => ec.Component)
        .Include(c => c.Employee)
        .ToListAsync(ct);
    var configsByEmp = configs.ToDictionary(c => c.EmployeeId);

    var defaultComponents = await db.PayrollComponents
        .AsNoTracking().Where(c => c.IsDefault && c.IsActive).ToListAsync(ct);

    var existingEntries = period.Entries.ToList();

    foreach (var entry in existingEntries)
    {
        if (!configsByEmp.TryGetValue(entry.EmployeeId, out var cfg))
        {
            // У сотрудника нет salary config — нечем считать pay. Оставляем hours, обнуляем pay.
            entry.BasePay = 0; entry.OvertimePay = 0; entry.AllowancesTotal = 0; entry.BonusesTotal = 0;
            entry.GrossPay = 0; entry.DeductionsTotal = 0; entry.TaxRate = 0; entry.TaxAmount = 0; entry.NetPay = 0;
            entry.ComponentsJson = null;
            continue;
        }

        var workedDays = entry.WorkedDays;
        var totalWorkedHours = (double)entry.WorkedHours;
        var totalOvertimeHours = (double)entry.OvertimeHours;
        var totalLatenessMinutes = (double)entry.LatenessMinutes;
        var totalWorkingDays = entry.TotalWorkingDays;

        // Parse overtime tiers
        List<OvertimeTierDto>? otTiers = null;
        if (cfg.OvertimeTiersJson is not null)
            try { otTiers = System.Text.Json.JsonSerializer.Deserialize<List<OvertimeTierDto>>(cfg.OvertimeTiersJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }); } catch { }

        // Parse lateness tiers
        List<LatenessTierDto>? lateTiers = null;
        if (cfg.LatenessTiersJson is not null)
            try { lateTiers = System.Text.Json.JsonSerializer.Deserialize<List<LatenessTierDto>>(cfg.LatenessTiersJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }); } catch { }

        // Если overtime у сотрудника отключён — часы overtime считаются обычными для оплаты.
        var otForBasePay = cfg.OvertimeEnabled ? totalOvertimeHours : 0d;

        decimal basePay;
        decimal overtimePay;
        decimal hourlyRate;

        switch (cfg.SalaryType)
        {
            case SalaryType.Monthly:
                hourlyRate = totalWorkingDays > 0 ? cfg.BaseAmount / (totalWorkingDays * 8) : 0;
                if (cfg.PayByWorkedHours)
                {
                    var regularHours = Math.Max(0, totalWorkedHours - otForBasePay);
                    basePay = (decimal)regularHours * hourlyRate;
                }
                else
                {
                    basePay = totalWorkingDays > 0 ? cfg.BaseAmount * workedDays / totalWorkingDays : 0;
                }
                break;
            case SalaryType.Hourly:
                hourlyRate = cfg.BaseAmount;
                basePay = (decimal)(totalWorkedHours - otForBasePay) * cfg.BaseAmount;
                break;
            case SalaryType.Daily:
                hourlyRate = cfg.BaseAmount / 8m;
                basePay = workedDays * cfg.BaseAmount;
                break;
            default:
                hourlyRate = 0; basePay = 0;
                break;
        }

        // Overtime pay: tiers применяются per-day (After OT hours = после N часов ДНЕВНОЙ переработки).
        if (cfg.OvertimeEnabled && totalOvertimeHours > 0)
        {
            // Восстанавливаем дневной OT-список из snapshot; если null (старые entries) — fallback на total.
            List<double> dailyOts;
            if (!string.IsNullOrEmpty(entry.OvertimeBreakdownJson))
            {
                try { dailyOts = System.Text.Json.JsonSerializer.Deserialize<List<double>>(entry.OvertimeBreakdownJson) ?? new(); }
                catch { dailyOts = new() { totalOvertimeHours }; }
            }
            else { dailyOts = new() { totalOvertimeHours }; }

            if (otTiers is { Count: > 0 })
            {
                // Per-day «весь день»: для каждого дня берём максимальный тир, чей AfterHours <= dayOt;
                // ВЕСЬ дневной OT умножается на multiplier этого тира.
                var sorted = otTiers.OrderBy(t => t.AfterHours).ToList();
                overtimePay = 0;
                foreach (var dayOt in dailyOts)
                {
                    var applicable = sorted.LastOrDefault(t => t.AfterHours <= dayOt);
                    var mult = applicable?.Multiplier ?? sorted[0].Multiplier;
                    overtimePay += (decimal)dayOt * hourlyRate * mult;
                }
            }
            else
            {
                overtimePay = cfg.SalaryType == SalaryType.Hourly
                    ? (decimal)totalOvertimeHours * cfg.BaseAmount * (cfg.OvertimeMultiplier - 1)
                    : (decimal)totalOvertimeHours * hourlyRate * cfg.OvertimeMultiplier;
            }
        }
        else
        {
            overtimePay = 0;
        }

        // Применяем режим расчёта.
        if (skipOvertime) overtimePay = 0;
        if (overtimeOnly)
        {
            // Только overtime: обнуляем base + lateness deduction, components применим к OT только если в Full-режиме.
            basePay = 0;
        }

        // Lateness deduction (не применяется в OvertimeOnly-режиме).
        decimal latenessDeduction = 0;
        if (!overtimeOnly && cfg.LatenessDeductionEnabled && totalLatenessMinutes > 0)
        {
            // Среднее по дням С опозданием (не по всем рабочим), чтобы 240 мин в 1 день не разбавлялись 26 рабочими.
            var avgPerDay = totalLatenessMinutes / Math.Max(1, entry.LatenessDaysCount);
            decimal? tierValue = null;
            if (lateTiers is { Count: > 0 })
            {
                var applicableTier = lateTiers
                    .Where(t => avgPerDay >= t.AfterMinutes)
                    .OrderByDescending(t => t.AfterMinutes)
                    .FirstOrDefault();
                if (applicableTier is not null) tierValue = applicableTier.DeductionMultiplier;
            }
            else
            {
                // Тиров нет — дефолт × 1 (Coefficient) или 0 ₼ (Fixed, фикс должен задаваться явно).
                tierValue = string.Equals(cfg.LatenessDeductionMode, "Fixed", StringComparison.OrdinalIgnoreCase) ? null : 1m;
            }
            if (tierValue.HasValue)
            {
                if (string.Equals(cfg.LatenessDeductionMode, "Fixed", StringComparison.OrdinalIgnoreCase))
                    latenessDeduction = entry.LatenessDaysCount * tierValue.Value;
                else
                    latenessDeduction = (decimal)(totalLatenessMinutes / 60.0) * hourlyRate * tierValue.Value;
            }
        }

        // Early-leave deduction
        decimal earlyLeaveDeduction = 0;
        var totalEarlyLeaveMinutes = (double)entry.EarlyLeaveMinutes;
        List<LatenessTierDto>? earlyTiers = null;
        if (cfg.EarlyLeaveTiersJson is not null)
            try { earlyTiers = System.Text.Json.JsonSerializer.Deserialize<List<LatenessTierDto>>(cfg.EarlyLeaveTiersJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }); } catch { }
        if (!overtimeOnly && cfg.EarlyLeaveDeductionEnabled && totalEarlyLeaveMinutes > 0)
        {
            var avgPerDay = totalEarlyLeaveMinutes / Math.Max(1, entry.EarlyLeaveDaysCount);
            decimal? tierValue = null;
            if (earlyTiers is { Count: > 0 })
            {
                var applicableTier = earlyTiers
                    .Where(t => avgPerDay >= t.AfterMinutes)
                    .OrderByDescending(t => t.AfterMinutes)
                    .FirstOrDefault();
                if (applicableTier is not null) tierValue = applicableTier.DeductionMultiplier;
            }
            else
            {
                tierValue = string.Equals(cfg.EarlyLeaveDeductionMode, "Fixed", StringComparison.OrdinalIgnoreCase) ? null : 1m;
            }
            if (tierValue.HasValue)
            {
                if (string.Equals(cfg.EarlyLeaveDeductionMode, "Fixed", StringComparison.OrdinalIgnoreCase))
                    earlyLeaveDeduction = entry.EarlyLeaveDaysCount * tierValue.Value;
                else
                    earlyLeaveDeduction = (decimal)(totalEarlyLeaveMinutes / 60.0) * hourlyRate * tierValue.Value;
            }
        }

        // Build effective component list: defaults + employee-specific
        var appliedComponents = new List<(string Name, string Type, decimal Amount)>();
        var allApplicable = defaultComponents.Select(d => (component: d, overrideAmt: (decimal?)null, overridePct: (decimal?)null))
            .Concat(cfg.Components.Select(ec => (component: ec.Component, overrideAmt: ec.OverrideAmount, overridePct: ec.OverridePercentage)))
            .DistinctBy(x => x.component.Id);

        var allowancesTotal = 0m;
        var bonusesTotal = 0m;
        var deductionsTotal = 0m;

        // В OvertimeOnly-режиме компоненты не применяем — это отдельная OT-выплата.
        if (!overtimeOnly) foreach (var (comp, overrideAmt, overridePct) in allApplicable)
        {
            if (!comp.IsActive) continue;
            decimal compAmount;
            if (comp.IsFixed)
                compAmount = overrideAmt ?? comp.Amount;
            else
                compAmount = basePay * (overridePct ?? comp.Percentage) / 100m;

            appliedComponents.Add((comp.Name, comp.ComponentType.ToString(), compAmount));
            switch (comp.ComponentType)
            {
                case PayrollComponentType.Allowance: allowancesTotal += compAmount; break;
                case PayrollComponentType.Bonus: bonusesTotal += compAmount; break;
                case PayrollComponentType.Deduction: deductionsTotal += compAmount; break;
            }
        }

        deductionsTotal += latenessDeduction;
        deductionsTotal += earlyLeaveDeduction;
        var grossPay = basePay + overtimePay + allowancesTotal + bonusesTotal;
        var taxAmount = grossPay * taxRate / 100m;
        var netPay = grossPay - deductionsTotal - taxAmount;

        entry.BasePay = Math.Round(basePay, 2);
        entry.OvertimePay = Math.Round(overtimePay, 2);
        entry.AllowancesTotal = Math.Round(allowancesTotal, 2);
        entry.BonusesTotal = Math.Round(bonusesTotal, 2);
        entry.GrossPay = Math.Round(grossPay, 2);
        entry.DeductionsTotal = Math.Round(deductionsTotal, 2);
        entry.LatenessDeduction = Math.Round(latenessDeduction, 2);
        entry.EarlyLeaveDeduction = Math.Round(earlyLeaveDeduction, 2);
        entry.TaxRate = taxRate;
        entry.TaxAmount = Math.Round(taxAmount, 2);
        entry.NetPay = Math.Round(netPay, 2);
        entry.ComponentsJson = System.Text.Json.JsonSerializer.Serialize(appliedComponents);
    }

    period.Status = PayrollPeriodStatus.Calculated;
    period.CalculatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { message = "Calculation complete.", entriesCount = existingEntries.Count });
}).RequireAuthorization("Payroll.Manage");

app.MapPost("/api/payroll/periods/{id:guid}/approve", async (
    Guid id, AppDbContext db, ClaimsPrincipal user, CancellationToken ct) =>
{
    var period = await db.PayrollPeriods.FirstOrDefaultAsync(p => p.Id == id, ct);
    if (period is null) return Results.NotFound();
    if (period.Status != PayrollPeriodStatus.Calculated)
        return Results.BadRequest(new { message = "Only calculated periods can be approved." });
    var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    Guid.TryParse(userIdStr, out var userId);
    period.Status = PayrollPeriodStatus.Approved;
    period.ApprovedAt = DateTime.UtcNow;
    period.ApprovedByUserId = userId;
    // Approve all pending entries
    var entries = await db.PayrollEntries.Where(e => e.PeriodId == id && e.Status == PayrollEntryStatus.Pending).ToListAsync(ct);
    foreach (var e in entries) e.Status = PayrollEntryStatus.Approved;
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { message = "Period approved." });
}).RequireAuthorization("Payroll.Manage");

app.MapDelete("/api/payroll/periods/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var period = await db.PayrollPeriods.Include(p => p.Entries).FirstOrDefaultAsync(p => p.Id == id, ct);
    if (period is null) return Results.NotFound();
    if (period.Status == PayrollPeriodStatus.Paid)
        return Results.BadRequest(new { message = "Cannot delete a paid period." });
    db.PayrollEntries.RemoveRange(period.Entries);
    db.PayrollPeriods.Remove(period);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization("Payroll.Manage");

app.MapPost("/api/payroll/periods/{id:guid}/mark-paid", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var period = await db.PayrollPeriods.FirstOrDefaultAsync(p => p.Id == id, ct);
    if (period is null) return Results.NotFound();
    if (period.Status != PayrollPeriodStatus.Approved)
        return Results.BadRequest(new { message = "Only approved periods can be marked as paid." });
    period.Status = PayrollPeriodStatus.Paid;
    period.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { message = "Period marked as paid." });
}).RequireAuthorization("Payroll.Manage");

app.MapPut("/api/payroll/periods/{id:guid}/entries/{entryId:guid}/approve", async (
    Guid id, Guid entryId, AppDbContext db, CancellationToken ct) =>
{
    var entry = await db.PayrollEntries.FirstOrDefaultAsync(e => e.PeriodId == id && e.Id == entryId, ct);
    if (entry is null) return Results.NotFound();
    entry.Status = PayrollEntryStatus.Approved;
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { entry.Id, status = entry.Status.ToString() });
}).RequireAuthorization("Payroll.Manage");

app.MapPut("/api/payroll/periods/{id:guid}/entries/{entryId:guid}/reject", async (
    Guid id, Guid entryId, NoteRequest? req, AppDbContext db, CancellationToken ct) =>
{
    var entry = await db.PayrollEntries.FirstOrDefaultAsync(e => e.PeriodId == id && e.Id == entryId, ct);
    if (entry is null) return Results.NotFound();
    entry.Status = PayrollEntryStatus.Rejected;
    entry.Notes = req?.Note;
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { entry.Id, status = entry.Status.ToString() });
}).RequireAuthorization("Payroll.Manage");

// ─── Email Reports ────────────────────────────────────────────────────────────

app.MapPost("/api/reports/attendance/send-email", async (
    SendAttendanceReportRequest request,
    AppDbContext dbContext,
    IEmailService emailService,
    IEmailTemplateService tplService,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.To))
        return Results.BadRequest(new { message = "Recipient email is required." });

    var fromUtc = request.From.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
    var toUtc = request.To2.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
    if (toUtc < fromUtc) toUtc = fromUtc;

    var employees = await dbContext.Employees.AsNoTracking()
        .Include(e => e.Department)
        .Include(e => e.WorkSchedule)
        .Where(e => e.IsActive && e.WorkScheduleId != null)
        .OrderBy(e => e.LastName).ThenBy(e => e.FirstName)
        .ToListAsync(cancellationToken);

    var empNos = employees.Where(e => !string.IsNullOrWhiteSpace(e.EmployeeNo))
        .Select(e => e.EmployeeNo!.Trim()).ToHashSet(StringComparer.OrdinalIgnoreCase);

    var rangeEnd = toUtc.AddDays(1);
    var logs = await dbContext.DeviceAuthLogs.AsNoTracking()
        .Where(r => r.EventTimeUtc >= fromUtc && r.EventTimeUtc < rangeEnd)
        .Select(r => new { r.EmployeeNoString, r.EventTimeUtc })
        .ToListAsync(cancellationToken);

    var corrections = await dbContext.AttendanceCorrections.AsNoTracking()
        .Where(c => c.DateUtc >= fromUtc && c.DateUtc <= toUtc)
        .ToListAsync(cancellationToken);
    var corrByEmpDate = corrections.ToDictionary(c => (c.EmployeeId, c.DateUtc));

    var byEmpNoDay = logs
        .GroupBy(r => (Emp: r.EmployeeNoString.Trim().ToLowerInvariant(), Day: r.EventTimeUtc.Date))
        .ToDictionary(g => g.Key, g => new { First = g.Min(x => x.EventTimeUtc), Last = g.Max(x => x.EventTimeUtc) });

    var tableRows = new System.Text.StringBuilder();
    for (var day = fromUtc; day <= toUtc; day = day.AddDays(1))
    {
        foreach (var e in employees)
        {
            var empKeyLower = (e.EmployeeNo ?? "").Trim().ToLowerInvariant();
            DateTime? first = null; DateTime? last = null;
            if (byEmpNoDay.TryGetValue((empKeyLower, day), out var stat)) { first = stat.First; last = stat.Last; }
            if (corrByEmpDate.TryGetValue((e.Id, day), out var corr))
            {
                if (corr.CheckInUtc.HasValue) first = corr.CheckInUtc.Value;
                if (corr.CheckOutUtc.HasValue) last = corr.CheckOutUtc.Value;
            }
            int? lateMin = null;
            if (e.WorkSchedule?.ShiftStart is TimeSpan shiftStart && first.HasValue)
            {
                var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(first.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
                lateMin = (int)Math.Max(0, Math.Round((local.TimeOfDay - shiftStart).TotalMinutes));
            }
            var hours = first.HasValue && last.HasValue ? (last.Value - first.Value).TotalHours : 0;
            var name = $"{e.FirstName} {e.LastName}".Trim();
            var dept = e.Department?.Name ?? "—";
            var ciStr = first.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(first.Value, DateTimeKind.Utc), TimeZoneInfo.Local).ToString("HH:mm") : "—";
            var coStr = last.HasValue && last != first ? TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(last.Value, DateTimeKind.Utc), TimeZoneInfo.Local).ToString("HH:mm") : "—";
            var lateStr = lateMin is > 0 ? $"+{lateMin}m" : "—";
            var hoursStr = hours > 0 ? hours.ToString("0.0") : "—";
            tableRows.Append($"<tr><td style='padding:5px 10px;border-bottom:1px solid #e2e8f0'>{day:dd.MM.yyyy}</td><td style='padding:5px 10px;border-bottom:1px solid #e2e8f0'>{name}</td><td style='padding:5px 10px;border-bottom:1px solid #e2e8f0'>{dept}</td><td style='padding:5px 10px;border-bottom:1px solid #e2e8f0;text-align:center'>{ciStr}</td><td style='padding:5px 10px;border-bottom:1px solid #e2e8f0;text-align:center'>{coStr}</td><td style='padding:5px 10px;border-bottom:1px solid #e2e8f0;text-align:center'>{hoursStr}</td><td style='padding:5px 10px;border-bottom:1px solid #e2e8f0;text-align:center'>{lateStr}</td></tr>");
        }
    }

    var companyName = (await dbContext.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == "CompanyName", cancellationToken))?.Value ?? "ProjectX";
    var (subject, body) = await tplService.RenderAsync("attendance_report", new()
    {
        ["{{companyName}}"] = companyName,
        ["{{fromDate}}"] = request.From.ToString("dd.MM.yyyy"),
        ["{{toDate}}"] = request.To2.ToString("dd.MM.yyyy"),
        ["{{tableRows}}"] = tableRows.ToString(),
        ["{{generatedAt}}"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm") + " UTC"
    }, cancellationToken);

    await emailService.SendAsync(request.To, subject, body, cancellationToken);
    return Results.Ok(new { message = $"Report sent to {request.To}." });
}).RequireAuthorization("Reports.View");

app.MapPost("/api/payroll/periods/{id:guid}/send-email", async (
    Guid id,
    SendPayrollReportRequest request,
    AppDbContext dbContext,
    IEmailService emailService,
    IEmailTemplateService tplService,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.To))
        return Results.BadRequest(new { message = "Recipient email is required." });

    var period = await dbContext.PayrollPeriods.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    if (period is null) return Results.NotFound();

    var entries = await dbContext.PayrollEntries.AsNoTracking()
        .Where(e => e.PeriodId == id)
        .Include(e => e.Employee).ThenInclude(emp => emp!.Department)
        .OrderBy(e => e.Employee!.LastName)
        .ToListAsync(cancellationToken);

    var companyName = (await dbContext.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == "CompanyName", cancellationToken))?.Value ?? "ProjectX";
    var monthName = new System.Globalization.CultureInfo("en-US").DateTimeFormat.GetMonthName(period.Month);

    var tableRows = string.Join("", entries.Select(e =>
    {
        var emp = e.Employee;
        var name = emp is null ? "—" : $"{emp.FirstName} {emp.LastName}";
        var dept = emp?.Department?.Name ?? "—";
        return $"<tr><td style='padding:6px 10px;border-bottom:1px solid #e2e8f0'>{name}</td><td style='padding:6px 10px;border-bottom:1px solid #e2e8f0'>{dept}</td><td style='padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:center'>{e.WorkedDays}</td><td style='padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:center'>{e.WorkedHours:0.0}</td><td style='padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right'>{e.BasePay:N2}</td><td style='padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right'>{e.GrossPay:N2}</td><td style='padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right'>{e.TaxAmount:N2}</td><td style='padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600'>{e.NetPay:N2}</td></tr>";
    }));

    var (subject, body) = await tplService.RenderAsync("payroll_report", new()
    {
        ["{{companyName}}"] = companyName,
        ["{{month}}"] = monthName,
        ["{{year}}"] = period.Year.ToString(),
        ["{{status}}"] = period.Status.ToString(),
        ["{{employeeCount}}"] = entries.Count.ToString(),
        ["{{totalGross}}"] = entries.Sum(e => e.GrossPay).ToString("N2"),
        ["{{totalTax}}"] = entries.Sum(e => e.TaxAmount).ToString("N2"),
        ["{{totalNet}}"] = entries.Sum(e => e.NetPay).ToString("N2"),
        ["{{tableRows}}"] = tableRows,
        ["{{generatedAt}}"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm") + " UTC"
    }, cancellationToken);

    await emailService.SendAsync(request.To, subject, body, cancellationToken);
    return Results.Ok(new { message = $"Payroll report sent to {request.To}." });
}).RequireAuthorization("Reports.View");

// ─── Vault ────────────────────────────────────────────────────────────────────

var backupDir = Path.Combine(AppContext.BaseDirectory, "backups");
var vaultSettingsFile = Path.Combine(AppContext.BaseDirectory, "vault-settings.json");

app.MapPost("/api/vault/backup", async (IConfiguration config, CancellationToken ct) =>
{
    Directory.CreateDirectory(backupDir);

    var baseConn = config.GetConnectionString("DefaultConnection") ?? "Host=localhost;Port=5433;Database=projectx";
    var username = (!string.IsNullOrWhiteSpace(config["Database:Username"]) ? config["Database:Username"] : null)
                   ?? Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "projectx_user";
    var password = (!string.IsNullOrWhiteSpace(config["Database:Password"]) ? config["Database:Password"] : null)
                   ?? Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "";

    var cb = new NpgsqlConnectionStringBuilder(baseConn) { Username = username, Password = password };
    var host = cb.Host ?? "localhost";
    var port = cb.Port > 0 ? cb.Port : 5433;
    var database = cb.Database ?? "projectx";

    var pgDumpExe = new[]
    {
        @"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
        @"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
        @"C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
        @"C:\Program Files\PostgreSQL\14\bin\pg_dump.exe",
    }.FirstOrDefault(File.Exists) ?? "pg_dump";

    var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
    var filename = $"backup_{timestamp}.sql";
    var filepath = Path.Combine(backupDir, filename);

    var psi = new System.Diagnostics.ProcessStartInfo
    {
        FileName = pgDumpExe,
        Arguments = $"-h \"{host}\" -p {port} -U \"{username}\" -d \"{database}\" -f \"{filepath}\"",
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        UseShellExecute = false,
        CreateNoWindow = true,
    };
    psi.Environment["PGPASSWORD"] = password;

    using var proc = System.Diagnostics.Process.Start(psi);
    if (proc is null) return Results.Problem("Failed to start pg_dump process.");

    var stderr = await proc.StandardError.ReadToEndAsync(ct);
    await proc.WaitForExitAsync(ct);

    if (proc.ExitCode != 0)
    {
        if (File.Exists(filepath)) File.Delete(filepath);
        return Results.Problem($"pg_dump exited with code {proc.ExitCode}: {stderr.Trim()}");
    }

    var fi = new FileInfo(filepath);
    return Results.Ok(new { filename, sizeBytes = fi.Length, createdAt = fi.CreationTimeUtc });
}).RequireAuthorization("Backups.Manage");

app.MapGet("/api/vault/backups", () =>
{
    if (!Directory.Exists(backupDir)) return Results.Ok(Array.Empty<object>());
    var files = new DirectoryInfo(backupDir)
        .GetFiles("backup_*.sql*")
        .OrderByDescending(f => f.CreationTimeUtc)
        .Select(f => new { filename = f.Name, sizeBytes = f.Length, createdAt = f.CreationTimeUtc })
        .ToArray();
    return Results.Ok(files);
}).RequireAuthorization("Backups.Manage");

app.MapDelete("/api/vault/backups/{filename}", (string filename) =>
{
    if (filename.Contains("..") || filename.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
        return Results.BadRequest(new { message = "Invalid filename." });
    var path = Path.Combine(backupDir, filename);
    if (!File.Exists(path)) return Results.NotFound();
    File.Delete(path);
    return Results.NoContent();
}).RequireAuthorization("Backups.Manage");

app.MapGet("/api/vault/backups/{filename}/download", (string filename) =>
{
    if (filename.Contains("..") || filename.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
        return Results.BadRequest(new { message = "Invalid filename." });
    var path = Path.Combine(backupDir, filename);
    if (!File.Exists(path)) return Results.NotFound();
    return Results.File(path, "application/octet-stream", filename);
}).RequireAuthorization("Backups.Manage");

app.MapGet("/api/vault/secondary-db", () =>
{
    if (!File.Exists(vaultSettingsFile)) return Results.Ok(new { connectionString = (string?)null });
    try
    {
        var settings = JsonSerializer.Deserialize<Dictionary<string, string>>(File.ReadAllText(vaultSettingsFile));
        return Results.Ok(new { connectionString = settings?.GetValueOrDefault("SecondaryDb") });
    }
    catch { return Results.Ok(new { connectionString = (string?)null }); }
}).RequireAuthorization("System.Manage");

app.MapPost("/api/vault/secondary-db", async (VaultSecondaryDbRequest req, CancellationToken ct) =>
{
    var settings = new Dictionary<string, string> { ["SecondaryDb"] = req.ConnectionString ?? "" };
    await File.WriteAllTextAsync(vaultSettingsFile, JsonSerializer.Serialize(settings), ct);
    return Results.Ok(new { message = "Saved." });
}).RequireAuthorization("System.Manage");

app.MapPost("/api/vault/secondary-db/test", async (VaultSecondaryDbRequest req, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.ConnectionString))
        return Results.Ok(new { success = false, message = "Connection string is required." });
    try
    {
        using var conn = new NpgsqlConnection(req.ConnectionString);
        await conn.OpenAsync(ct);
        await conn.CloseAsync();
        return Results.Ok(new { success = true, message = "Connected successfully." });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { success = false, message = ex.Message });
    }
}).RequireAuthorization("System.Manage");

// ─── End Vault ────────────────────────────────────────────────────────────────

// ─── Gym Management: Tariffs (subscription plans) ───────────────────────────────

static object GymTariffDto(GymTariff t) => new
{
    t.Id,
    t.Name,
    t.Description,
    kind = t.Kind.ToString(),
    t.Price,
    t.Currency,
    durationType = t.DurationType.ToString(),
    t.VisitLimit,
    t.HasTimeRestriction,
    accessFrom = t.AccessFrom?.ToString(@"hh\:mm"),
    accessTo = t.AccessTo?.ToString(@"hh\:mm"),
    t.DaysOfWeekMask,
    t.AutoRenew,
    t.FreezeAllowed,
    t.FreezeMaxDays,
    t.TransferAllowed,
    t.IsActive,
    t.SortOrder,
    t.CreatedUtc,
    t.UpdatedUtc,
};

static (bool ok, string? error) ApplyGymTariff(GymTariff t, GymTariffRequest req)
{
    if (string.IsNullOrWhiteSpace(req.Name)) return (false, "Name is required.");
    if (req.Price < 0) return (false, "Price cannot be negative.");
    if (!Enum.TryParse<GymTariffKind>(req.Kind, ignoreCase: true, out var kind)) return (false, "Unknown tariff kind.");
    if (!Enum.TryParse<GymTariffDuration>(req.DurationType, ignoreCase: true, out var duration)) return (false, "Unknown duration type.");
    if (req.VisitLimit is < 1) return (false, "Visit limit must be at least 1, or null for unlimited.");
    if (req.FreezeMaxDays < 0) return (false, "Freeze days cannot be negative.");

    TimeSpan? from = null, to = null;
    if (req.HasTimeRestriction)
    {
        if (!TimeSpan.TryParse(req.AccessFrom, out var f) || !TimeSpan.TryParse(req.AccessTo, out var tt))
            return (false, "Access window requires valid From/To times (HH:mm).");
        if (tt <= f) return (false, "Access 'to' time must be after 'from' time.");
        from = f; to = tt;
    }

    t.Name = req.Name.Trim();
    t.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
    t.Kind = kind;
    t.Price = req.Price;
    t.Currency = string.IsNullOrWhiteSpace(req.Currency) ? "AZN" : req.Currency.Trim().ToUpperInvariant();
    t.DurationType = duration;
    t.VisitLimit = req.VisitLimit;
    t.HasTimeRestriction = req.HasTimeRestriction;
    t.AccessFrom = from;
    t.AccessTo = to;
    t.DaysOfWeekMask = req.DaysOfWeekMask is >= 0 and <= 127 ? req.DaysOfWeekMask : 127;
    t.AutoRenew = req.AutoRenew;
    t.FreezeAllowed = req.FreezeAllowed;
    t.FreezeMaxDays = req.FreezeAllowed ? req.FreezeMaxDays : 0;
    t.TransferAllowed = req.TransferAllowed;
    t.IsActive = req.IsActive;
    t.SortOrder = req.SortOrder;
    return (true, null);
}

app.MapGet("/api/gym/tariffs", async (AppDbContext db, CancellationToken ct) =>
{
    var items = await db.GymTariffs.AsNoTracking()
        .OrderBy(x => x.SortOrder).ThenBy(x => x.Name)
        .ToListAsync(ct);
    return Results.Ok(items.Select(GymTariffDto));
}).RequireAuthorization();

app.MapGet("/api/gym/tariffs/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var t = await db.GymTariffs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
    return t is null ? Results.NotFound() : Results.Ok(GymTariffDto(t));
}).RequireAuthorization();

app.MapPost("/api/gym/tariffs", async (GymTariffRequest req, AppDbContext db, CancellationToken ct) =>
{
    var t = new GymTariff();
    var (ok, error) = ApplyGymTariff(t, req);
    if (!ok) return Results.BadRequest(new { message = error });
    db.GymTariffs.Add(t);
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymTariffDto(t));
}).RequireAuthorization();

app.MapPut("/api/gym/tariffs/{id:guid}", async (Guid id, GymTariffRequest req, AppDbContext db, CancellationToken ct) =>
{
    var t = await db.GymTariffs.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (t is null) return Results.NotFound();
    var (ok, error) = ApplyGymTariff(t, req);
    if (!ok) return Results.BadRequest(new { message = error });
    t.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymTariffDto(t));
}).RequireAuthorization();

app.MapDelete("/api/gym/tariffs/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var t = await db.GymTariffs.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (t is null) return Results.NotFound();
    db.GymTariffs.Remove(t);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Gym Management: Customers ──────────────────────────────────────────────────

static object GymCustomerDto(GymCustomer c, Guid? primaryFaceId = null) => new
{
    c.Id,
    c.FirstName,
    c.LastName,
    c.Phone,
    c.Email,
    c.Gender,
    birthDate = c.BirthDate?.ToString("yyyy-MM-dd"),
    c.Notes,
    c.IsActive,
    c.VisitCount,
    primaryFaceId,
    c.CreatedUtc,
    c.UpdatedUtc,
};

static (bool ok, string? error) ApplyGymCustomer(GymCustomer c, GymCustomerRequest req)
{
    if (string.IsNullOrWhiteSpace(req.FirstName)) return (false, "First name is required.");
    DateOnly? birth = null;
    if (!string.IsNullOrWhiteSpace(req.BirthDate))
    {
        if (!DateOnly.TryParse(req.BirthDate, out var b)) return (false, "Invalid birth date.");
        birth = b;
    }
    string? gender = null;
    if (!string.IsNullOrWhiteSpace(req.Gender))
    {
        if (req.Gender is not ("Male" or "Female")) return (false, "Gender must be Male or Female.");
        gender = req.Gender;
    }

    c.FirstName = req.FirstName.Trim();
    c.LastName = string.IsNullOrWhiteSpace(req.LastName) ? null : req.LastName.Trim();
    c.Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim();
    c.Email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim();
    c.Gender = gender;
    c.BirthDate = birth;
    c.Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim();
    c.IsActive = req.IsActive;
    return (true, null);
}

app.MapGet("/api/gym/customers", async (string? search, AppDbContext db, CancellationToken ct) =>
{
    var query = db.GymCustomers.AsNoTracking().AsQueryable();
    if (!string.IsNullOrWhiteSpace(search))
    {
        var s = search.Trim().ToLower();
        query = query.Where(c =>
            c.FirstName.ToLower().Contains(s) ||
            (c.LastName != null && c.LastName.ToLower().Contains(s)) ||
            (c.Phone != null && c.Phone.ToLower().Contains(s)) ||
            (c.Email != null && c.Email.ToLower().Contains(s)));
    }
    var items = await query.OrderBy(c => c.FirstName).ThenBy(c => c.LastName).ToListAsync(ct);

    // Latest face per customer → shown as the avatar in the table.
    var ids = items.Select(c => c.Id).ToList();
    var faceByCustomer = (await db.Faces.AsNoTracking()
            .Where(f => f.GymCustomerId != null && ids.Contains(f.GymCustomerId!.Value))
            .Select(f => new { CustomerId = f.GymCustomerId!.Value, f.Id, f.CreatedUtc })
            .ToListAsync(ct))
        .GroupBy(x => x.CustomerId)
        .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.CreatedUtc).First().Id);

    return Results.Ok(items.Select(c => GymCustomerDto(c, faceByCustomer.TryGetValue(c.Id, out var fid) ? fid : null)));
}).RequireAuthorization();

app.MapGet("/api/gym/customers/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var c = await db.GymCustomers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
    if (c is null) return Results.NotFound();
    var primaryFaceId = await db.Faces.AsNoTracking()
        .Where(f => f.GymCustomerId == id)
        .OrderByDescending(f => f.CreatedUtc)
        .Select(f => (Guid?)f.Id)
        .FirstOrDefaultAsync(ct);
    return Results.Ok(GymCustomerDto(c, primaryFaceId));
}).RequireAuthorization();

app.MapPost("/api/gym/customers", async (GymCustomerRequest req, AppDbContext db, CancellationToken ct) =>
{
    var c = new GymCustomer();
    var (ok, error) = ApplyGymCustomer(c, req);
    if (!ok) return Results.BadRequest(new { message = error });
    db.GymCustomers.Add(c);
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymCustomerDto(c));
}).RequireAuthorization();

app.MapPut("/api/gym/customers/{id:guid}", async (Guid id, GymCustomerRequest req, AppDbContext db, CancellationToken ct) =>
{
    var c = await db.GymCustomers.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (c is null) return Results.NotFound();
    var (ok, error) = ApplyGymCustomer(c, req);
    if (!ok) return Results.BadRequest(new { message = error });
    c.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymCustomerDto(c));
}).RequireAuthorization();

app.MapDelete("/api/gym/customers/{id:guid}", async (Guid id, AppDbContext db, IDevicePersonSyncService sync, CancellationToken ct) =>
{
    var c = await db.GymCustomers.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (c is null) return Results.NotFound();

    // Best-effort: remove the person (and their credentials) from every device before deleting locally.
    var deviceIds = await db.Devices.Select(d => d.Id).ToListAsync(ct);
    foreach (var deviceId in deviceIds)
    {
        try { await sync.DeleteGymCustomerAsync(id, deviceId, ct); } catch { /* per-device failure is non-fatal */ }
    }

    db.GymCustomers.Remove(c);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Gym Management: Memberships (subscriptions issued to customers) ─────────────

static object GymMembershipDto(GymMembership m) => new
{
    m.Id,
    m.CustomerId,
    m.TariffId,
    m.TariffName,
    m.Price,
    m.Currency,
    startDate = m.StartDate.ToString("yyyy-MM-dd"),
    endDate = m.EndDate.ToString("yyyy-MM-dd"),
    m.VisitLimit,
    m.VisitsUsed,
    m.HasTimeRestriction,
    accessFrom = m.AccessFrom?.ToString(@"hh\:mm"),
    accessTo = m.AccessTo?.ToString(@"hh\:mm"),
    m.DaysOfWeekMask,
    m.FreezeAllowed,
    m.FreezeMaxDays,
    m.FrozenDaysUsed,
    freezeRemaining = Math.Max(0, m.FreezeMaxDays - m.FrozenDaysUsed),
    frozenUntil = m.FrozenUntil?.ToString("yyyy-MM-dd"),
    m.TransferAllowed,
    m.AutoRenew,
    status = GymMembershipFactory.EffectiveStatus(m, DateOnly.FromDateTime(DateTime.UtcNow)),
    rawStatus = m.Status.ToString(),
    m.Notes,
    m.CreatedUtc,
};

app.MapGet("/api/gym/customers/{customerId:guid}/memberships", async (Guid customerId, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.GymCustomers.AnyAsync(c => c.Id == customerId, ct)) return Results.NotFound();
    var items = await db.GymMemberships.AsNoTracking()
        .Where(m => m.CustomerId == customerId)
        .OrderByDescending(m => m.CreatedUtc)
        .ToListAsync(ct);
    return Results.Ok(items.Select(GymMembershipDto));
}).RequireAuthorization();

app.MapPost("/api/gym/customers/{customerId:guid}/memberships", async (Guid customerId, IssueMembershipRequest req, AppDbContext db, IDevicePersonSyncService sync, CancellationToken ct) =>
{
    var customer = await db.GymCustomers.FirstOrDefaultAsync(c => c.Id == customerId, ct);
    if (customer is null) return Results.NotFound();
    var tariff = await db.GymTariffs.FirstOrDefaultAsync(x => x.Id == req.TariffId, ct);
    if (tariff is null) return Results.BadRequest(new { message = "Tariff not found." });

    var start = DateOnly.FromDateTime(DateTime.UtcNow);
    if (!string.IsNullOrWhiteSpace(req.StartDate))
    {
        if (!DateOnly.TryParse(req.StartDate, out var s)) return Results.BadRequest(new { message = "Invalid start date." });
        start = s;
    }

    var m = GymMembershipFactory.FromTariff(customerId, tariff, start);
    db.GymMemberships.Add(m);
    // New subscription → fresh visit counter, re-activate the customer.
    customer.VisitCount = 0;
    customer.IsActive = true;
    customer.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);

    // If the customer already has credentials (i.e. an existing/renewing member who may have been
    // blocked at the visit limit), re-push them so the device access period is restored/extended
    // to the NEW membership's end date — and their face/card/fingerprint are re-applied.
    var hasCredentials = await db.Cards.AnyAsync(x => x.GymCustomerId == customerId, ct)
        || await db.Faces.AnyAsync(x => x.GymCustomerId == customerId, ct)
        || await db.Fingerprints.AnyAsync(x => x.GymCustomerId == customerId, ct);
    if (hasCredentials)
    {
        var deviceIds = await db.Devices.Select(d => d.Id).ToListAsync(ct);
        var faceIds = await db.Faces.Where(f => f.GymCustomerId == customerId).Select(f => f.Id).ToListAsync(ct);
        var fingerprintIds = await db.Fingerprints.Where(f => f.GymCustomerId == customerId).Select(f => f.Id).ToListAsync(ct);
        var cardIds = await db.Cards.Where(c => c.GymCustomerId == customerId).Select(c => c.Id).ToListAsync(ct);
        foreach (var deviceId in deviceIds)
        {
            try
            {
                await sync.SyncGymCustomerAsync(customerId, deviceId, ct);
                foreach (var faceId in faceIds) await sync.SyncFaceAsync(faceId, deviceId, ct);
                foreach (var fpId in fingerprintIds) await sync.SyncFingerprintAsync(fpId, deviceId, ct);
                foreach (var cardId in cardIds) await sync.SyncCardAsync(cardId, deviceId, ct);
            }
            catch { /* per-device failure is non-fatal */ }
        }
    }

    return Results.Ok(GymMembershipDto(m));
}).RequireAuthorization();

app.MapPost("/api/gym/memberships/{id:guid}/cancel", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var m = await db.GymMemberships.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (m is null) return Results.NotFound();
    m.Status = GymMembershipStatus.Cancelled;
    m.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymMembershipDto(m));
}).RequireAuthorization();

app.MapPost("/api/gym/memberships/{id:guid}/freeze", async (Guid id, FreezeMembershipRequest req, AppDbContext db, CancellationToken ct) =>
{
    var m = await db.GymMemberships.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (m is null) return Results.NotFound();
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    if (m.Status == GymMembershipStatus.Cancelled) return Results.BadRequest(new { message = "Membership is cancelled." });
    if (!m.FreezeAllowed) return Results.BadRequest(new { message = "Freeze is not allowed for this membership." });
    if (m.FrozenUntil != null && m.FrozenUntil > today) return Results.BadRequest(new { message = "Membership is already frozen." });
    if (req.Days < 1) return Results.BadRequest(new { message = "Days must be at least 1." });
    if (m.FrozenDaysUsed + req.Days > m.FreezeMaxDays)
        return Results.BadRequest(new { message = $"Only {Math.Max(0, m.FreezeMaxDays - m.FrozenDaysUsed)} freeze day(s) remaining." });

    m.EndDate = m.EndDate.AddDays(req.Days);
    m.FrozenUntil = today.AddDays(req.Days);
    m.FrozenDaysUsed += req.Days;
    m.Status = GymMembershipStatus.Frozen;
    m.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymMembershipDto(m));
}).RequireAuthorization();

app.MapPost("/api/gym/memberships/{id:guid}/unfreeze", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var m = await db.GymMemberships.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (m is null) return Results.NotFound();
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    if (m.FrozenUntil == null || m.FrozenUntil <= today) return Results.BadRequest(new { message = "Membership is not frozen." });

    // Give back the unused freeze days (shorten end date + free up the freeze budget).
    var remaining = m.FrozenUntil.Value.DayNumber - today.DayNumber;
    m.EndDate = m.EndDate.AddDays(-remaining);
    m.FrozenDaysUsed = Math.Max(0, m.FrozenDaysUsed - remaining);
    m.FrozenUntil = null;
    m.Status = GymMembershipStatus.Active;
    m.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymMembershipDto(m));
}).RequireAuthorization();

app.MapPost("/api/gym/memberships/{id:guid}/transfer", async (Guid id, TransferMembershipRequest req, AppDbContext db, CancellationToken ct) =>
{
    var m = await db.GymMemberships.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (m is null) return Results.NotFound();
    if (!m.TransferAllowed) return Results.BadRequest(new { message = "Transfer is not allowed for this membership." });
    if (m.Status == GymMembershipStatus.Cancelled) return Results.BadRequest(new { message = "Membership is cancelled." });
    if (req.CustomerId == m.CustomerId) return Results.BadRequest(new { message = "Already belongs to this customer." });
    if (!await db.GymCustomers.AnyAsync(c => c.Id == req.CustomerId, ct)) return Results.BadRequest(new { message = "Target customer not found." });

    m.CustomerId = req.CustomerId;
    m.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymMembershipDto(m));
}).RequireAuthorization();

app.MapPost("/api/gym/memberships/{id:guid}/renew", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var m = await db.GymMemberships.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (m is null) return Results.NotFound();
    var tariff = m.TariffId is null ? null : await db.GymTariffs.FirstOrDefaultAsync(x => x.Id == m.TariffId, ct);
    if (tariff is null) return Results.BadRequest(new { message = "Original tariff no longer exists; issue a new membership instead." });

    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    // New period starts when the current one ends (or today if already expired).
    var start = m.EndDate > today ? m.EndDate : today;
    var renewed = GymMembershipFactory.FromTariff(m.CustomerId, tariff, start);
    db.GymMemberships.Add(renewed);
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymMembershipDto(renewed));
}).RequireAuthorization();

app.MapDelete("/api/gym/memberships/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var m = await db.GymMemberships.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (m is null) return Results.NotFound();
    db.GymMemberships.Remove(m);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Gym Management: Gift certificates ──────────────────────────────────────────

static string GymGiftEffectiveStatus(GymGiftCertificate g, DateOnly today) =>
    g.Status == GymGiftCertificateStatus.Redeemed ? "Redeemed"
    : g.Status == GymGiftCertificateStatus.Cancelled ? "Cancelled"
    : (g.ValidUntil != null && g.ValidUntil < today) ? "Expired"
    : "Issued";

static object GymGiftDto(GymGiftCertificate g) => new
{
    g.Id,
    g.Code,
    g.TariffId,
    g.TariffName,
    g.Price,
    g.Currency,
    g.RecipientName,
    validUntil = g.ValidUntil?.ToString("yyyy-MM-dd"),
    status = GymGiftEffectiveStatus(g, DateOnly.FromDateTime(DateTime.UtcNow)),
    rawStatus = g.Status.ToString(),
    g.RedeemedByCustomerId,
    g.RedeemedMembershipId,
    g.RedeemedUtc,
    g.CreatedUtc,
};

static string GymGenerateGiftCode() =>
    "GC-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant() + "-" + Guid.NewGuid().ToString("N")[..4].ToUpperInvariant();

app.MapGet("/api/gym/gift-certificates", async (AppDbContext db, CancellationToken ct) =>
{
    var items = await db.GymGiftCertificates.AsNoTracking().OrderByDescending(g => g.CreatedUtc).ToListAsync(ct);
    return Results.Ok(items.Select(GymGiftDto));
}).RequireAuthorization();

app.MapPost("/api/gym/gift-certificates", async (IssueGiftCertificateRequest req, AppDbContext db, CancellationToken ct) =>
{
    var tariff = await db.GymTariffs.FirstOrDefaultAsync(x => x.Id == req.TariffId, ct);
    if (tariff is null) return Results.BadRequest(new { message = "Tariff not found." });

    DateOnly? validUntil = null;
    if (!string.IsNullOrWhiteSpace(req.ValidUntil))
    {
        if (!DateOnly.TryParse(req.ValidUntil, out var v)) return Results.BadRequest(new { message = "Invalid valid-until date." });
        validUntil = v;
    }

    string code;
    do { code = GymGenerateGiftCode(); }
    while (await db.GymGiftCertificates.AnyAsync(g => g.Code == code, ct));

    var cert = new GymGiftCertificate
    {
        Code = code,
        TariffId = tariff.Id,
        TariffName = tariff.Name,
        Price = tariff.Price,
        Currency = tariff.Currency,
        RecipientName = string.IsNullOrWhiteSpace(req.RecipientName) ? null : req.RecipientName.Trim(),
        ValidUntil = validUntil,
        Status = GymGiftCertificateStatus.Issued,
    };
    db.GymGiftCertificates.Add(cert);
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymGiftDto(cert));
}).RequireAuthorization();

app.MapPost("/api/gym/gift-certificates/{id:guid}/redeem", async (Guid id, RedeemGiftCertificateRequest req, AppDbContext db, CancellationToken ct) =>
{
    var cert = await db.GymGiftCertificates.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (cert is null) return Results.NotFound();
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    if (cert.Status != GymGiftCertificateStatus.Issued) return Results.BadRequest(new { message = "Certificate is not redeemable." });
    if (cert.ValidUntil != null && cert.ValidUntil < today) return Results.BadRequest(new { message = "Certificate has expired." });

    var tariff = cert.TariffId is null ? null : await db.GymTariffs.FirstOrDefaultAsync(x => x.Id == cert.TariffId, ct);
    if (tariff is null) return Results.BadRequest(new { message = "Linked tariff no longer exists." });
    if (!await db.GymCustomers.AnyAsync(c => c.Id == req.CustomerId, ct)) return Results.BadRequest(new { message = "Customer not found." });

    var start = today;
    if (!string.IsNullOrWhiteSpace(req.StartDate))
    {
        if (!DateOnly.TryParse(req.StartDate, out var s)) return Results.BadRequest(new { message = "Invalid start date." });
        start = s;
    }

    var membership = GymMembershipFactory.FromTariff(req.CustomerId, tariff, start);
    db.GymMemberships.Add(membership);

    cert.Status = GymGiftCertificateStatus.Redeemed;
    cert.RedeemedByCustomerId = req.CustomerId;
    cert.RedeemedMembershipId = membership.Id;
    cert.RedeemedUtc = DateTime.UtcNow;
    cert.UpdatedUtc = DateTime.UtcNow;

    await db.SaveChangesAsync(ct);
    return Results.Ok(GymGiftDto(cert));
}).RequireAuthorization();

app.MapPost("/api/gym/gift-certificates/{id:guid}/cancel", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var cert = await db.GymGiftCertificates.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (cert is null) return Results.NotFound();
    if (cert.Status == GymGiftCertificateStatus.Redeemed) return Results.BadRequest(new { message = "Redeemed certificate cannot be cancelled." });
    cert.Status = GymGiftCertificateStatus.Cancelled;
    cert.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymGiftDto(cert));
}).RequireAuthorization();

app.MapDelete("/api/gym/gift-certificates/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var cert = await db.GymGiftCertificates.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (cert is null) return Results.NotFound();
    db.GymGiftCertificates.Remove(cert);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Gym Management: Customer device access (push as custom1) ────────────────────

app.MapGet("/api/gym/devices", async (AppDbContext db, CancellationToken ct) =>
{
    var devices = await db.Devices.AsNoTracking()
        .OrderBy(d => d.Name)
        .Select(d => new { d.Id, d.Name, d.IpAddress, deviceType = d.DeviceType.ToString() })
        .ToListAsync(ct);
    return Results.Ok(devices);
}).RequireAuthorization();

app.MapPost("/api/gym/customers/{id:guid}/access", async (Guid id, GymAccessRequest req, IDevicePersonSyncService sync, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.GymCustomers.AnyAsync(c => c.Id == id, ct)) return Results.NotFound();
    if (req.DeviceIds is null || req.DeviceIds.Length == 0) return Results.BadRequest(new { message = "No devices selected." });

    // Like the workforce person-push: write the person AND all their credentials
    // (faces / fingerprints / cards) to each device, otherwise biometrics never land on the device.
    var faceIds = await db.Faces.Where(f => f.GymCustomerId == id).Select(f => f.Id).ToListAsync(ct);
    var fingerprintIds = await db.Fingerprints.Where(f => f.GymCustomerId == id).Select(f => f.Id).ToListAsync(ct);
    var cardIds = await db.Cards.Where(c => c.GymCustomerId == id).Select(c => c.Id).ToListAsync(ct);

    var results = new List<object>();
    foreach (var deviceId in req.DeviceIds)
    {
        var personRes = await sync.SyncGymCustomerAsync(id, deviceId, ct);
        var ok = personRes.Success;
        string? error = personRes.Message;

        foreach (var faceId in faceIds)
        {
            var r = await sync.SyncFaceAsync(faceId, deviceId, ct);
            if (!r.Success) { ok = false; error ??= r.Message; }
        }
        foreach (var fpId in fingerprintIds)
        {
            var r = await sync.SyncFingerprintAsync(fpId, deviceId, ct);
            if (!r.Success) { ok = false; error ??= r.Message; }
        }
        foreach (var cardId in cardIds)
        {
            var r = await sync.SyncCardAsync(cardId, deviceId, ct);
            if (!r.Success) { ok = false; error ??= r.Message; }
        }

        results.Add(new { deviceId, success = ok, error });
    }
    return Results.Ok(results);
}).RequireAuthorization();

app.MapPost("/api/gym/customers/{id:guid}/access/revoke", async (Guid id, GymAccessRequest req, IDevicePersonSyncService sync, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.GymCustomers.AnyAsync(c => c.Id == id, ct)) return Results.NotFound();
    if (req.DeviceIds is null || req.DeviceIds.Length == 0) return Results.BadRequest(new { message = "No devices selected." });

    var results = new List<object>();
    foreach (var deviceId in req.DeviceIds)
    {
        var r = await sync.DeleteGymCustomerAsync(id, deviceId, ct);
        results.Add(new { deviceId, success = r.Success, error = r.Message });
    }
    return Results.Ok(results);
}).RequireAuthorization();

// ─── Gym Management: Customer credentials (capture face/card/fingerprint as gymcustomer) ──

app.MapPost("/api/gym/customers/{id:guid}/capture/face", async (Guid id, GymCaptureRequest req, IDeviceFaceCaptureService capture, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.GymCustomers.AnyAsync(c => c.Id == id, ct)) return Results.NotFound();
    var r = await capture.StartCaptureAsync(req.DeviceId, id, "gymcustomer", ct);
    return r.Success ? Results.Ok(new { started = true }) : Results.BadRequest(new { message = r.Message });
}).RequireAuthorization();

app.MapGet("/api/gym/customers/capture/face/progress", async (Guid deviceId, IDeviceFaceCaptureService capture, CancellationToken ct) =>
{
    var p = await capture.GetProgressAsync(deviceId, ct);
    return Results.Ok(new { p.Status, p.Progress, p.Message, p.FaceId });
}).RequireAuthorization();

app.MapPost("/api/gym/customers/{id:guid}/capture/card", async (Guid id, GymCaptureRequest req, IDeviceCardCaptureService capture, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.GymCustomers.AnyAsync(c => c.Id == id, ct)) return Results.NotFound();
    var r = await capture.StartCaptureAsync(req.DeviceId, id, "gymcustomer", ct);
    return r.Success ? Results.Ok(new { started = true }) : Results.BadRequest(new { message = r.Message });
}).RequireAuthorization();

app.MapGet("/api/gym/customers/capture/card/progress", async (Guid deviceId, IDeviceCardCaptureService capture, CancellationToken ct) =>
{
    var p = await capture.GetProgressAsync(deviceId, ct);
    return Results.Ok(new { p.Status, p.Message, p.CardId });
}).RequireAuthorization();

app.MapPost("/api/gym/customers/{id:guid}/capture/fingerprint", async (Guid id, GymCaptureRequest req, IDeviceFingerprintCaptureService capture, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.GymCustomers.AnyAsync(c => c.Id == id, ct)) return Results.NotFound();
    var fingerIndex = Math.Clamp(req.FingerIndex ?? 1, 1, 10);
    var r = await capture.StartCaptureAsync(req.DeviceId, id, "gymcustomer", fingerIndex, ct);
    return r.Success ? Results.Ok(new { started = true }) : Results.BadRequest(new { message = r.Message });
}).RequireAuthorization();

app.MapGet("/api/gym/customers/capture/fingerprint/progress", async (Guid deviceId, IDeviceFingerprintCaptureService capture, CancellationToken ct) =>
{
    var p = await capture.GetProgressAsync(deviceId, ct);
    return Results.Ok(new { p.Status, p.Message, p.FingerprintId });
}).RequireAuthorization();

app.MapGet("/api/gym/customers/{id:guid}/credentials", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.GymCustomers.AnyAsync(c => c.Id == id, ct)) return Results.NotFound();
    var cards = await db.Cards.AsNoTracking().Where(x => x.GymCustomerId == id)
        .Select(x => new { x.Id, x.CardNo }).ToListAsync(ct);
    var faces = await db.Faces.AsNoTracking().Where(x => x.GymCustomerId == id)
        .Select(x => new { x.Id }).ToListAsync(ct);
    var fingerprints = await db.Fingerprints.AsNoTracking().Where(x => x.GymCustomerId == id)
        .Select(x => new { x.Id, x.FingerIndex }).ToListAsync(ct);
    return Results.Ok(new { cards, faces, fingerprints });
}).RequireAuthorization();

// Add a card by number (manual) and optionally sync to devices.
app.MapPost("/api/gym/customers/{id:guid}/cards", async (Guid id, GymAddCardRequest req, AppDbContext db, IDevicePersonSyncService sync, CancellationToken ct) =>
{
    if (!await db.GymCustomers.AnyAsync(c => c.Id == id, ct)) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(req.CardNo)) return Results.BadRequest(new { message = "Card number is required." });
    var cardNo = req.CardNo.Trim();
    if (await db.Cards.AnyAsync(x => x.CardNo == cardNo, ct)) return Results.Conflict(new { message = "Card with this number already exists." });

    var card = new Card { GymCustomerId = id, CardNo = cardNo, CardNumber = string.IsNullOrWhiteSpace(req.CardNumber) ? null : req.CardNumber.Trim() };
    db.Cards.Add(card);
    await db.SaveChangesAsync(ct);

    var warnings = new List<string>();
    foreach (var deviceId in req.DeviceIds ?? [])
    {
        var r = await sync.SyncCardAsync(card.Id, deviceId, ct);
        if (!r.Success) warnings.Add(r.Message ?? "sync failed");
    }
    return Results.Ok(new { card.Id, card.CardNo, syncWarnings = warnings.Count > 0 ? warnings : null });
}).RequireAuthorization();

// Add a face by image upload (multipart) and optionally sync to devices.
app.MapPost("/api/gym/customers/{id:guid}/faces", async (Guid id, HttpRequest request, AppDbContext db, IDevicePersonSyncService sync, IConfiguration configuration, CancellationToken ct) =>
{
    if (!await db.GymCustomers.AnyAsync(c => c.Id == id, ct)) return Results.NotFound();
    if (!request.HasFormContentType) return Results.BadRequest(new { message = "multipart/form-data expected." });
    var form = await request.ReadFormAsync(ct);
    var file = form.Files.GetFile("Image");
    if (file is null || file.Length == 0) return Results.BadRequest(new { message = "Image file is required." });

    var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
    Directory.CreateDirectory(facesPath);
    var fileName = $"{Guid.NewGuid():N}.jpg";
    await using (var stream = File.Create(Path.Combine(facesPath, fileName)))
        await file.CopyToAsync(stream, ct);

    // One face per customer — replace existing.
    var old = await db.Faces.Where(f => f.GymCustomerId == id).ToListAsync(ct);
    if (old.Count > 0)
    {
        db.Faces.RemoveRange(old);
        foreach (var o in old)
        {
            try { var p = Path.Combine(facesPath, o.FilePath.TrimStart('/', '\\')); if (File.Exists(p)) File.Delete(p); } catch { /* ignore */ }
        }
    }

    var face = new Face { GymCustomerId = id, FilePath = fileName, FDID = 1 };
    db.Faces.Add(face);
    await db.SaveChangesAsync(ct);

    var warnings = new List<string>();
    var deviceIds = form["DeviceIds"].Where(s => Guid.TryParse(s, out _)).Select(Guid.Parse).ToArray();
    foreach (var deviceId in deviceIds)
    {
        var r = await sync.SyncFaceAsync(face.Id, deviceId, ct);
        if (!r.Success) warnings.Add(r.Message ?? "sync failed");
    }
    return Results.Ok(new { face.Id, syncWarnings = warnings.Count > 0 ? warnings : null });
}).RequireAuthorization();

app.MapDelete("/api/gym/customers/{id:guid}/cards/{cardId:guid}", async (Guid id, Guid cardId, AppDbContext db, CancellationToken ct) =>
{
    var card = await db.Cards.FirstOrDefaultAsync(x => x.Id == cardId && x.GymCustomerId == id, ct);
    if (card is null) return Results.NotFound();
    db.Cards.Remove(card);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

app.MapDelete("/api/gym/customers/{id:guid}/faces/{faceId:guid}", async (Guid id, Guid faceId, AppDbContext db, IConfiguration configuration, CancellationToken ct) =>
{
    var face = await db.Faces.FirstOrDefaultAsync(x => x.Id == faceId && x.GymCustomerId == id, ct);
    if (face is null) return Results.NotFound();
    db.Faces.Remove(face);
    await db.SaveChangesAsync(ct);
    try
    {
        var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
        var p = Path.Combine(facesPath, face.FilePath.TrimStart('/', '\\'));
        if (File.Exists(p)) File.Delete(p);
    }
    catch { /* ignore */ }
    return Results.NoContent();
}).RequireAuthorization();

app.MapDelete("/api/gym/customers/{id:guid}/fingerprints/{fpId:guid}", async (Guid id, Guid fpId, AppDbContext db, CancellationToken ct) =>
{
    var fp = await db.Fingerprints.FirstOrDefaultAsync(x => x.Id == fpId && x.GymCustomerId == id, ct);
    if (fp is null) return Results.NotFound();
    db.Fingerprints.Remove(fp);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Gym Management: Payments ───────────────────────────────────────────────────

app.MapGet("/api/gym/customers/{id:guid}/payments", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.GymCustomers.AnyAsync(c => c.Id == id, ct)) return Results.NotFound();
    var items = await db.GymPayments.AsNoTracking()
        .Where(p => p.CustomerId == id)
        .OrderByDescending(p => p.PaidUtc)
        .Select(p => new { p.Id, p.MembershipId, p.Amount, p.Currency, method = p.Method.ToString(), p.Note, p.PaidUtc })
        .ToListAsync(ct);
    return Results.Ok(items);
}).RequireAuthorization();

app.MapPost("/api/gym/customers/{id:guid}/payments", async (Guid id, GymPaymentRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.GymCustomers.AnyAsync(c => c.Id == id, ct)) return Results.NotFound();
    if (req.Amount < 0) return Results.BadRequest(new { message = "Amount cannot be negative." });
    if (!Enum.TryParse<GymPaymentMethod>(req.Method, ignoreCase: true, out var method))
        return Results.BadRequest(new { message = "Unknown payment method." });
    if (req.MembershipId is { } mid && !await db.GymMemberships.AnyAsync(m => m.Id == mid && m.CustomerId == id, ct))
        return Results.BadRequest(new { message = "Membership not found for this customer." });

    var payment = new GymPayment
    {
        CustomerId = id,
        MembershipId = req.MembershipId,
        Amount = req.Amount,
        Currency = string.IsNullOrWhiteSpace(req.Currency) ? "AZN" : req.Currency.Trim().ToUpperInvariant(),
        Method = method,
        Note = string.IsNullOrWhiteSpace(req.Note) ? null : req.Note.Trim(),
        PaidUtc = DateTime.UtcNow,
    };
    db.GymPayments.Add(payment);
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { payment.Id, payment.Amount, payment.Currency, method = payment.Method.ToString(), payment.PaidUtc });
}).RequireAuthorization();

// ─── Gym Inventory / Warehouse: shared helpers ──────────────────────────────────

static string GymGenSeq(string prefix) =>
    prefix + "-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

static string? GymUserEmail(ClaimsPrincipal user) =>
    user.FindFirst(ClaimTypes.Email)?.Value
    ?? user.FindFirst("email")?.Value
    ?? user.Identity?.Name;

static void ApplyGymSupplier(GymSupplier s, GymSupplierRequest req)
{
    s.Name = req.Name.Trim();
    s.ContactName = string.IsNullOrWhiteSpace(req.ContactName) ? null : req.ContactName.Trim();
    s.Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim();
    s.Email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim();
    s.Address = string.IsNullOrWhiteSpace(req.Address) ? null : req.Address.Trim();
    s.Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim();
    s.IsActive = req.IsActive;
}

// NOTE: stock quantity is intentionally NOT set here — it is owned by the movements ledger.
static void ApplyGymProduct(GymProduct p, GymProductRequest req)
{
    p.Name = req.Name.Trim();
    p.Sku = string.IsNullOrWhiteSpace(req.Sku) ? null : req.Sku.Trim();
    p.Barcode = string.IsNullOrWhiteSpace(req.Barcode) ? null : req.Barcode.Trim();
    p.Category = string.IsNullOrWhiteSpace(req.Category) ? null : req.Category.Trim();
    p.Unit = string.IsNullOrWhiteSpace(req.Unit) ? "pcs" : req.Unit.Trim();
    p.SalePrice = req.SalePrice;
    p.Cost = req.Cost;
    p.Currency = string.IsNullOrWhiteSpace(req.Currency) ? "AZN" : req.Currency.Trim().ToUpperInvariant();
    p.MinStock = req.MinStock;
    p.SupplierId = req.SupplierId;
    p.IsActive = req.IsActive;
}

static GymStockMovement ApplyGymStock(AppDbContext db, GymProduct product, GymStockMovementType type,
    decimal signedQty, decimal unitCost, string? reason, string? reference, Guid? supplierId, string? userEmail)
{
    product.StockQuantity += signedQty;
    product.UpdatedUtc = DateTime.UtcNow;
    var mv = new GymStockMovement
    {
        ProductId = product.Id,
        Type = type,
        Quantity = signedQty,
        UnitCost = unitCost,
        BalanceAfter = product.StockQuantity,
        Reason = reason,
        Reference = reference,
        SupplierId = supplierId,
        UserEmail = userEmail,
    };
    db.GymStockMovements.Add(mv);
    return mv;
}

// ─── Gym Inventory / Warehouse: Suppliers ───────────────────────────────────────

static object GymSupplierDto(GymSupplier s) => new
{
    s.Id, s.Name, s.ContactName, s.Phone, s.Email, s.Address, s.Notes, s.IsActive,
    s.CreatedUtc, s.UpdatedUtc,
};

app.MapGet("/api/gym/suppliers", async (AppDbContext db, CancellationToken ct) =>
{
    var items = await db.GymSuppliers.AsNoTracking().OrderBy(x => x.Name).ToListAsync(ct);
    return Results.Ok(items.Select(GymSupplierDto));
}).RequireAuthorization();

app.MapPost("/api/gym/suppliers", async (GymSupplierRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    var s = new GymSupplier();
    ApplyGymSupplier(s, req);
    db.GymSuppliers.Add(s);
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymSupplierDto(s));
}).RequireAuthorization();

app.MapPut("/api/gym/suppliers/{id:guid}", async (Guid id, GymSupplierRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    var s = await db.GymSuppliers.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (s is null) return Results.NotFound();
    ApplyGymSupplier(s, req);
    s.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymSupplierDto(s));
}).RequireAuthorization();

app.MapDelete("/api/gym/suppliers/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var s = await db.GymSuppliers.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (s is null) return Results.NotFound();
    db.GymSuppliers.Remove(s);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Gym Inventory / Warehouse: Products (stock balances) ───────────────────────

static object GymProductDto(GymProduct p, string? supplierName = null) => new
{
    p.Id, p.Name, p.Sku, p.Barcode, p.Category, p.Unit,
    p.SalePrice, p.Cost, p.Currency, p.StockQuantity, p.MinStock,
    p.SupplierId, supplierName,
    isLow = p.MinStock > 0 && p.StockQuantity <= p.MinStock,
    p.IsActive, p.CreatedUtc, p.UpdatedUtc,
};

app.MapGet("/api/gym/products", async (string? search, bool? lowStock, AppDbContext db, CancellationToken ct) =>
{
    var query = db.GymProducts.AsNoTracking().AsQueryable();
    if (!string.IsNullOrWhiteSpace(search))
    {
        var s = search.Trim().ToLower();
        query = query.Where(p =>
            p.Name.ToLower().Contains(s) ||
            (p.Sku != null && p.Sku.ToLower().Contains(s)) ||
            (p.Barcode != null && p.Barcode.ToLower().Contains(s)) ||
            (p.Category != null && p.Category.ToLower().Contains(s)));
    }
    if (lowStock == true)
        query = query.Where(p => p.MinStock > 0 && p.StockQuantity <= p.MinStock);

    var items = await query.OrderBy(p => p.Name).ToListAsync(ct);
    var supplierIds = items.Where(p => p.SupplierId != null).Select(p => p.SupplierId!.Value).Distinct().ToList();
    var suppliers = await db.GymSuppliers.AsNoTracking()
        .Where(x => supplierIds.Contains(x.Id))
        .ToDictionaryAsync(x => x.Id, x => x.Name, ct);
    return Results.Ok(items.Select(p => GymProductDto(p,
        p.SupplierId != null && suppliers.TryGetValue(p.SupplierId.Value, out var n) ? n : null)));
}).RequireAuthorization();

app.MapPost("/api/gym/products", async (GymProductRequest req, ClaimsPrincipal user, AppDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    if (req.SalePrice < 0 || req.Cost < 0) return Results.BadRequest(new { message = "Prices cannot be negative." });
    if (req.MinStock < 0) return Results.BadRequest(new { message = "Min stock cannot be negative." });
    if (req.SupplierId is { } sid && !await db.GymSuppliers.AnyAsync(x => x.Id == sid, ct))
        return Results.BadRequest(new { message = "Supplier not found." });
    if (!string.IsNullOrWhiteSpace(req.Sku) && await db.GymProducts.AnyAsync(p => p.Sku == req.Sku!.Trim(), ct))
        return Results.Conflict(new { message = "Product with this SKU already exists." });

    var p = new GymProduct();
    ApplyGymProduct(p, req);
    db.GymProducts.Add(p);

    var opening = req.OpeningStock ?? 0m;
    if (opening > 0)
        ApplyGymStock(db, p, GymStockMovementType.Receipt, opening, p.Cost, "Opening stock", null, p.SupplierId, GymUserEmail(user));

    await db.SaveChangesAsync(ct);
    return Results.Ok(GymProductDto(p));
}).RequireAuthorization();

app.MapPut("/api/gym/products/{id:guid}", async (Guid id, GymProductRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    if (req.SalePrice < 0 || req.Cost < 0) return Results.BadRequest(new { message = "Prices cannot be negative." });
    if (req.MinStock < 0) return Results.BadRequest(new { message = "Min stock cannot be negative." });
    var p = await db.GymProducts.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (p is null) return Results.NotFound();
    if (req.SupplierId is { } sid && !await db.GymSuppliers.AnyAsync(x => x.Id == sid, ct))
        return Results.BadRequest(new { message = "Supplier not found." });
    if (!string.IsNullOrWhiteSpace(req.Sku) && await db.GymProducts.AnyAsync(x => x.Sku == req.Sku!.Trim() && x.Id != id, ct))
        return Results.Conflict(new { message = "Product with this SKU already exists." });

    ApplyGymProduct(p, req); // NOTE: stock quantity is managed by movements, not by edit.
    p.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymProductDto(p));
}).RequireAuthorization();

app.MapDelete("/api/gym/products/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var p = await db.GymProducts.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (p is null) return Results.NotFound();
    if (await db.GymPurchaseOrderItems.AnyAsync(i => i.ProductId == id, ct)
        || await db.GymStocktakeItems.AnyAsync(i => i.ProductId == id, ct))
        return Results.BadRequest(new { message = "Product is referenced by purchases or stocktakes; deactivate it instead." });
    db.GymProducts.Remove(p); // stock movements cascade-delete.
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Gym Inventory: Stock movements (receipt / write-off / ledger) ──────────────

static object GymStockMovementDto(GymStockMovement m, string? productName = null) => new
{
    m.Id, m.ProductId, productName,
    type = m.Type.ToString(),
    m.Quantity, m.UnitCost, m.BalanceAfter, m.Reason, m.Reference,
    m.SupplierId, m.UserEmail, m.CreatedUtc,
};

app.MapGet("/api/gym/stock-movements", async (Guid? productId, string? type, AppDbContext db, CancellationToken ct) =>
{
    var query = db.GymStockMovements.AsNoTracking().AsQueryable();
    if (productId is { } pid) query = query.Where(m => m.ProductId == pid);
    if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<GymStockMovementType>(type, ignoreCase: true, out var t))
        query = query.Where(m => m.Type == t);

    var items = await query.OrderByDescending(m => m.CreatedUtc).Take(500).ToListAsync(ct);
    var productIds = items.Select(m => m.ProductId).Distinct().ToList();
    var names = await db.GymProducts.AsNoTracking()
        .Where(p => productIds.Contains(p.Id))
        .ToDictionaryAsync(p => p.Id, p => p.Name, ct);
    return Results.Ok(items.Select(m => GymStockMovementDto(m, names.TryGetValue(m.ProductId, out var n) ? n : null)));
}).RequireAuthorization();

app.MapPost("/api/gym/stock-movements/receipt", async (GymReceiptRequest req, ClaimsPrincipal user, AppDbContext db, CancellationToken ct) =>
{
    if (req.Quantity <= 0) return Results.BadRequest(new { message = "Quantity must be greater than zero." });
    var p = await db.GymProducts.FirstOrDefaultAsync(x => x.Id == req.ProductId, ct);
    if (p is null) return Results.BadRequest(new { message = "Product not found." });
    if (req.SupplierId is { } sid && !await db.GymSuppliers.AnyAsync(x => x.Id == sid, ct))
        return Results.BadRequest(new { message = "Supplier not found." });

    var unitCost = req.UnitCost ?? p.Cost;
    if (unitCost < 0) return Results.BadRequest(new { message = "Unit cost cannot be negative." });
    if (req.UnitCost is { } uc && uc > 0) p.Cost = uc; // refresh last cost
    var mv = ApplyGymStock(db, p, GymStockMovementType.Receipt, req.Quantity, unitCost,
        string.IsNullOrWhiteSpace(req.Note) ? null : req.Note.Trim(), null, req.SupplierId, GymUserEmail(user));
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymStockMovementDto(mv, p.Name));
}).RequireAuthorization();

app.MapPost("/api/gym/stock-movements/writeoff", async (GymWriteOffRequest req, ClaimsPrincipal user, AppDbContext db, CancellationToken ct) =>
{
    if (req.Quantity <= 0) return Results.BadRequest(new { message = "Quantity must be greater than zero." });
    var p = await db.GymProducts.FirstOrDefaultAsync(x => x.Id == req.ProductId, ct);
    if (p is null) return Results.BadRequest(new { message = "Product not found." });
    if (req.Quantity > p.StockQuantity)
        return Results.BadRequest(new { message = $"Cannot write off more than the current stock ({p.StockQuantity})." });

    var mv = ApplyGymStock(db, p, GymStockMovementType.WriteOff, -req.Quantity, p.Cost,
        string.IsNullOrWhiteSpace(req.Reason) ? null : req.Reason.Trim(), null, null, GymUserEmail(user));
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymStockMovementDto(mv, p.Name));
}).RequireAuthorization();

// ─── Gym Inventory: Purchase orders (Закупки) ───────────────────────────────────

static object GymPurchaseOrderDto(GymPurchaseOrder o, bool withItems = false) => new
{
    o.Id, o.Number, o.SupplierId, o.SupplierName,
    status = o.Status.ToString(),
    expectedDate = o.ExpectedDate?.ToString("yyyy-MM-dd"),
    o.ReceivedUtc, o.Currency, o.Total, o.Notes, o.CreatedUtc,
    itemCount = o.Items?.Count ?? 0,
    items = withItems
        ? o.Items.OrderBy(i => i.ProductName).Select(i => new { i.Id, i.ProductId, i.ProductName, i.Quantity, i.UnitCost }).ToArray()
        : null,
};

app.MapGet("/api/gym/purchase-orders", async (AppDbContext db, CancellationToken ct) =>
{
    var items = await db.GymPurchaseOrders.AsNoTracking()
        .Include(o => o.Items)
        .OrderByDescending(o => o.CreatedUtc)
        .ToListAsync(ct);
    return Results.Ok(items.Select(o => GymPurchaseOrderDto(o)));
}).RequireAuthorization();

app.MapGet("/api/gym/purchase-orders/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var o = await db.GymPurchaseOrders.AsNoTracking()
        .Include(x => x.Items)
        .FirstOrDefaultAsync(x => x.Id == id, ct);
    return o is null ? Results.NotFound() : Results.Ok(GymPurchaseOrderDto(o, withItems: true));
}).RequireAuthorization();

app.MapPost("/api/gym/purchase-orders", async (GymPurchaseOrderRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (req.Items is null || req.Items.Length == 0) return Results.BadRequest(new { message = "At least one item is required." });

    GymSupplier? supplier = null;
    if (req.SupplierId is { } sid)
    {
        supplier = await db.GymSuppliers.FirstOrDefaultAsync(x => x.Id == sid, ct);
        if (supplier is null) return Results.BadRequest(new { message = "Supplier not found." });
    }

    var productIds = req.Items.Select(i => i.ProductId).Distinct().ToList();
    var products = await db.GymProducts.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
    if (products.Count != productIds.Count) return Results.BadRequest(new { message = "One or more products not found." });

    DateOnly? expected = null;
    if (!string.IsNullOrWhiteSpace(req.ExpectedDate))
    {
        if (!DateOnly.TryParse(req.ExpectedDate, out var d)) return Results.BadRequest(new { message = "Invalid expected date." });
        expected = d;
    }

    string number;
    do { number = GymGenSeq("PO"); }
    while (await db.GymPurchaseOrders.AnyAsync(o => o.Number == number, ct));

    var order = new GymPurchaseOrder
    {
        Number = number,
        SupplierId = supplier?.Id,
        SupplierName = supplier?.Name ?? "",
        Status = GymPurchaseOrderStatus.Draft,
        ExpectedDate = expected,
        Currency = "AZN",
        Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim(),
    };
    foreach (var item in req.Items)
    {
        if (item.Quantity <= 0 || item.UnitCost < 0) return Results.BadRequest(new { message = "Item quantity must be > 0 and cost >= 0." });
        var prod = products[item.ProductId];
        order.Items.Add(new GymPurchaseOrderItem
        {
            ProductId = prod.Id, ProductName = prod.Name,
            Quantity = item.Quantity, UnitCost = item.UnitCost,
        });
    }
    order.Total = order.Items.Sum(i => i.Quantity * i.UnitCost);
    db.GymPurchaseOrders.Add(order);
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymPurchaseOrderDto(order, withItems: true));
}).RequireAuthorization();

app.MapPost("/api/gym/purchase-orders/{id:guid}/receive", async (Guid id, ClaimsPrincipal user, AppDbContext db, CancellationToken ct) =>
{
    var order = await db.GymPurchaseOrders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id, ct);
    if (order is null) return Results.NotFound();
    if (order.Status == GymPurchaseOrderStatus.Received) return Results.BadRequest(new { message = "Purchase order is already received." });
    if (order.Status == GymPurchaseOrderStatus.Cancelled) return Results.BadRequest(new { message = "Cancelled purchase order cannot be received." });

    var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
    var products = await db.GymProducts.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
    foreach (var item in order.Items)
    {
        if (!products.TryGetValue(item.ProductId, out var prod)) continue;
        prod.Cost = item.UnitCost; // refresh last cost from the received price
        ApplyGymStock(db, prod, GymStockMovementType.Purchase, item.Quantity, item.UnitCost,
            null, order.Number, order.SupplierId, GymUserEmail(user));
    }
    order.Status = GymPurchaseOrderStatus.Received;
    order.ReceivedUtc = DateTime.UtcNow;
    order.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymPurchaseOrderDto(order, withItems: true));
}).RequireAuthorization();

app.MapPost("/api/gym/purchase-orders/{id:guid}/cancel", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var order = await db.GymPurchaseOrders.FirstOrDefaultAsync(o => o.Id == id, ct);
    if (order is null) return Results.NotFound();
    if (order.Status == GymPurchaseOrderStatus.Received) return Results.BadRequest(new { message = "Received purchase order cannot be cancelled." });
    order.Status = GymPurchaseOrderStatus.Cancelled;
    order.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymPurchaseOrderDto(order));
}).RequireAuthorization();

app.MapDelete("/api/gym/purchase-orders/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var order = await db.GymPurchaseOrders.FirstOrDefaultAsync(o => o.Id == id, ct);
    if (order is null) return Results.NotFound();
    if (order.Status == GymPurchaseOrderStatus.Received) return Results.BadRequest(new { message = "Received purchase order cannot be deleted." });
    db.GymPurchaseOrders.Remove(order);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Gym Inventory: Stocktakes (Инвентаризация) ─────────────────────────────────

static object GymStocktakeDto(GymStocktake s, bool withItems = false) => new
{
    s.Id, s.Number,
    status = s.Status.ToString(),
    s.CompletedUtc, s.Notes, s.CreatedUtc,
    itemCount = s.Items?.Count ?? 0,
    items = withItems
        ? s.Items.OrderBy(i => i.ProductName).Select(i => new
        {
            i.Id, i.ProductId, i.ProductName, i.ExpectedQuantity, i.CountedQuantity,
            difference = i.CountedQuantity - i.ExpectedQuantity,
        }).ToArray()
        : null,
};

app.MapGet("/api/gym/stocktakes", async (AppDbContext db, CancellationToken ct) =>
{
    var items = await db.GymStocktakes.AsNoTracking()
        .Include(s => s.Items)
        .OrderByDescending(s => s.CreatedUtc)
        .ToListAsync(ct);
    return Results.Ok(items.Select(s => GymStocktakeDto(s)));
}).RequireAuthorization();

app.MapGet("/api/gym/stocktakes/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var s = await db.GymStocktakes.AsNoTracking().Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id, ct);
    return s is null ? Results.NotFound() : Results.Ok(GymStocktakeDto(s, withItems: true));
}).RequireAuthorization();

app.MapPost("/api/gym/stocktakes", async (GymStocktakeRequest req, AppDbContext db, CancellationToken ct) =>
{
    string number;
    do { number = GymGenSeq("ST"); }
    while (await db.GymStocktakes.AnyAsync(s => s.Number == number, ct));

    var stocktake = new GymStocktake
    {
        Number = number,
        Status = GymStocktakeStatus.Draft,
        Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim(),
    };
    if (req.SeedAllProducts)
    {
        var products = await db.GymProducts.AsNoTracking().Where(p => p.IsActive).OrderBy(p => p.Name).ToListAsync(ct);
        foreach (var p in products)
            stocktake.Items.Add(new GymStocktakeItem
            {
                ProductId = p.Id, ProductName = p.Name,
                ExpectedQuantity = p.StockQuantity, CountedQuantity = p.StockQuantity,
            });
    }
    db.GymStocktakes.Add(stocktake);
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymStocktakeDto(stocktake, withItems: true));
}).RequireAuthorization();

app.MapPut("/api/gym/stocktakes/{id:guid}/counts", async (Guid id, GymStocktakeCountsRequest req, AppDbContext db, CancellationToken ct) =>
{
    var stocktake = await db.GymStocktakes.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == id, ct);
    if (stocktake is null) return Results.NotFound();
    if (stocktake.Status != GymStocktakeStatus.Draft) return Results.BadRequest(new { message = "Only draft stocktakes can be edited." });

    var byId = stocktake.Items.ToDictionary(i => i.Id);
    foreach (var c in req.Items ?? [])
        if (byId.TryGetValue(c.ItemId, out var item) && c.CountedQuantity >= 0)
            item.CountedQuantity = c.CountedQuantity;
    stocktake.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymStocktakeDto(stocktake, withItems: true));
}).RequireAuthorization();

app.MapPost("/api/gym/stocktakes/{id:guid}/complete", async (Guid id, ClaimsPrincipal user, AppDbContext db, CancellationToken ct) =>
{
    var stocktake = await db.GymStocktakes.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == id, ct);
    if (stocktake is null) return Results.NotFound();
    if (stocktake.Status != GymStocktakeStatus.Draft) return Results.BadRequest(new { message = "Stocktake is not in draft state." });

    var productIds = stocktake.Items.Select(i => i.ProductId).Distinct().ToList();
    var products = await db.GymProducts.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
    foreach (var item in stocktake.Items)
    {
        if (!products.TryGetValue(item.ProductId, out var prod)) continue;
        var delta = item.CountedQuantity - prod.StockQuantity; // reconcile against live stock
        if (delta != 0)
            ApplyGymStock(db, prod, GymStockMovementType.Stocktake, delta, prod.Cost,
                "Stocktake adjustment", stocktake.Number, null, GymUserEmail(user));
    }
    stocktake.Status = GymStocktakeStatus.Completed;
    stocktake.CompletedUtc = DateTime.UtcNow;
    stocktake.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymStocktakeDto(stocktake, withItems: true));
}).RequireAuthorization();

app.MapPost("/api/gym/stocktakes/{id:guid}/cancel", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var stocktake = await db.GymStocktakes.FirstOrDefaultAsync(s => s.Id == id, ct);
    if (stocktake is null) return Results.NotFound();
    if (stocktake.Status == GymStocktakeStatus.Completed) return Results.BadRequest(new { message = "Completed stocktake cannot be cancelled." });
    stocktake.Status = GymStocktakeStatus.Cancelled;
    stocktake.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymStocktakeDto(stocktake));
}).RequireAuthorization();

app.MapDelete("/api/gym/stocktakes/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var stocktake = await db.GymStocktakes.FirstOrDefaultAsync(s => s.Id == id, ct);
    if (stocktake is null) return Results.NotFound();
    if (stocktake.Status == GymStocktakeStatus.Completed) return Results.BadRequest(new { message = "Completed stocktake cannot be deleted." });
    db.GymStocktakes.Remove(stocktake);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Gym Finance: shared helpers ────────────────────────────────────────────────

static DateOnly GymParseDate(string? s, DateOnly fallback) => DateOnly.TryParse(s, out var d) ? d : fallback;

static GymFinanceTransaction ApplyGymFinanceTxn(AppDbContext db, GymFinanceAccount acc, GymFinanceDirection dir,
    decimal amount, Guid? categoryId, DateOnly occurredOn, string? description, string? reference,
    string? counterparty, string? method, bool isTransfer, string? userEmail)
{
    var signed = dir == GymFinanceDirection.Income ? amount : -amount;
    acc.Balance += signed;
    acc.UpdatedUtc = DateTime.UtcNow;
    var txn = new GymFinanceTransaction
    {
        AccountId = acc.Id,
        Direction = dir,
        Amount = amount,
        Currency = acc.Currency,
        CategoryId = categoryId,
        OccurredOn = occurredOn,
        Description = description,
        Reference = reference,
        CounterpartyName = counterparty,
        Method = method,
        IsTransfer = isTransfer,
        BalanceAfter = acc.Balance,
        UserEmail = userEmail,
    };
    db.GymFinanceTransactions.Add(txn);
    return txn;
}

// ─── Gym Finance: Accounts (cash registers + bank accounts) ─────────────────────

static object GymFinanceAccountDto(GymFinanceAccount a) => new
{
    a.Id, a.Name, type = a.Type.ToString(), a.Currency,
    a.OpeningBalance, a.Balance, a.BankName, a.AccountNumber, a.IsActive,
    a.CreatedUtc, a.UpdatedUtc,
};

app.MapGet("/api/gym/finance/accounts", async (string? type, AppDbContext db, CancellationToken ct) =>
{
    var query = db.GymFinanceAccounts.AsNoTracking().AsQueryable();
    if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<GymFinanceAccountType>(type, ignoreCase: true, out var t))
        query = query.Where(a => a.Type == t);
    var items = await query.OrderBy(a => a.Name).ToListAsync(ct);
    return Results.Ok(items.Select(GymFinanceAccountDto));
}).RequireAuthorization();

app.MapPost("/api/gym/finance/accounts", async (GymFinanceAccountRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    if (!Enum.TryParse<GymFinanceAccountType>(req.Type, ignoreCase: true, out var type)) return Results.BadRequest(new { message = "Unknown account type." });
    var a = new GymFinanceAccount
    {
        Name = req.Name.Trim(),
        Type = type,
        Currency = string.IsNullOrWhiteSpace(req.Currency) ? "AZN" : req.Currency.Trim().ToUpperInvariant(),
        OpeningBalance = req.OpeningBalance,
        Balance = req.OpeningBalance,
        BankName = string.IsNullOrWhiteSpace(req.BankName) ? null : req.BankName.Trim(),
        AccountNumber = string.IsNullOrWhiteSpace(req.AccountNumber) ? null : req.AccountNumber.Trim(),
        IsActive = req.IsActive,
    };
    db.GymFinanceAccounts.Add(a);
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymFinanceAccountDto(a));
}).RequireAuthorization();

app.MapPut("/api/gym/finance/accounts/{id:guid}", async (Guid id, GymFinanceAccountRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    if (!Enum.TryParse<GymFinanceAccountType>(req.Type, ignoreCase: true, out var type)) return Results.BadRequest(new { message = "Unknown account type." });
    var a = await db.GymFinanceAccounts.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (a is null) return Results.NotFound();
    // Adjust live balance by the change in opening balance (transaction effects are preserved).
    a.Balance += req.OpeningBalance - a.OpeningBalance;
    a.OpeningBalance = req.OpeningBalance;
    a.Name = req.Name.Trim();
    a.Type = type;
    a.Currency = string.IsNullOrWhiteSpace(req.Currency) ? "AZN" : req.Currency.Trim().ToUpperInvariant();
    a.BankName = string.IsNullOrWhiteSpace(req.BankName) ? null : req.BankName.Trim();
    a.AccountNumber = string.IsNullOrWhiteSpace(req.AccountNumber) ? null : req.AccountNumber.Trim();
    a.IsActive = req.IsActive;
    a.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymFinanceAccountDto(a));
}).RequireAuthorization();

app.MapDelete("/api/gym/finance/accounts/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var a = await db.GymFinanceAccounts.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (a is null) return Results.NotFound();
    if (await db.GymFinanceTransactions.AnyAsync(t => t.AccountId == id, ct))
        return Results.BadRequest(new { message = "Account has transactions; deactivate it instead." });
    db.GymFinanceAccounts.Remove(a);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Gym Finance: Categories ────────────────────────────────────────────────────

static object GymFinanceCategoryDto(GymFinanceCategory c) => new
{
    c.Id, c.Name, direction = c.Direction.ToString(), c.Color, c.IsActive, c.CreatedUtc,
};

app.MapGet("/api/gym/finance/categories", async (string? direction, AppDbContext db, CancellationToken ct) =>
{
    var query = db.GymFinanceCategories.AsNoTracking().AsQueryable();
    if (!string.IsNullOrWhiteSpace(direction) && Enum.TryParse<GymFinanceDirection>(direction, ignoreCase: true, out var d))
        query = query.Where(c => c.Direction == d);
    var items = await query.OrderBy(c => c.Name).ToListAsync(ct);
    return Results.Ok(items.Select(GymFinanceCategoryDto));
}).RequireAuthorization();

app.MapPost("/api/gym/finance/categories", async (GymFinanceCategoryRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    if (!Enum.TryParse<GymFinanceDirection>(req.Direction, ignoreCase: true, out var dir)) return Results.BadRequest(new { message = "Unknown direction." });
    var c = new GymFinanceCategory
    {
        Name = req.Name.Trim(),
        Direction = dir,
        Color = string.IsNullOrWhiteSpace(req.Color) ? "#6366f1" : req.Color.Trim(),
        IsActive = req.IsActive,
    };
    db.GymFinanceCategories.Add(c);
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymFinanceCategoryDto(c));
}).RequireAuthorization();

app.MapPut("/api/gym/finance/categories/{id:guid}", async (Guid id, GymFinanceCategoryRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    if (!Enum.TryParse<GymFinanceDirection>(req.Direction, ignoreCase: true, out var dir)) return Results.BadRequest(new { message = "Unknown direction." });
    var c = await db.GymFinanceCategories.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (c is null) return Results.NotFound();
    c.Name = req.Name.Trim();
    c.Direction = dir;
    c.Color = string.IsNullOrWhiteSpace(req.Color) ? "#6366f1" : req.Color.Trim();
    c.IsActive = req.IsActive;
    c.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymFinanceCategoryDto(c));
}).RequireAuthorization();

app.MapDelete("/api/gym/finance/categories/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var c = await db.GymFinanceCategories.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (c is null) return Results.NotFound();
    db.GymFinanceCategories.Remove(c); // transactions keep history, category link is set to null.
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Gym Finance: Transactions (income / expense) + transfers ───────────────────

static object GymFinanceTxnDto(GymFinanceTransaction t, string? accountName, string? categoryName) => new
{
    t.Id, t.AccountId, accountName,
    direction = t.Direction.ToString(),
    t.Amount, t.Currency, t.CategoryId, categoryName,
    occurredOn = t.OccurredOn.ToString("yyyy-MM-dd"),
    t.Description, t.Reference, t.CounterpartyName, t.Method, t.IsTransfer, t.BalanceAfter,
    t.UserEmail, t.CreatedUtc,
};

app.MapGet("/api/gym/finance/transactions", async (string? direction, Guid? accountId, Guid? categoryId,
    string? from, string? to, bool? includeTransfers, AppDbContext db, CancellationToken ct) =>
{
    var query = db.GymFinanceTransactions.AsNoTracking().AsQueryable();
    if (!string.IsNullOrWhiteSpace(direction) && Enum.TryParse<GymFinanceDirection>(direction, ignoreCase: true, out var dir))
        query = query.Where(t => t.Direction == dir);
    if (accountId is { } aid) query = query.Where(t => t.AccountId == aid);
    if (categoryId is { } cid) query = query.Where(t => t.CategoryId == cid);
    if (includeTransfers != true) query = query.Where(t => !t.IsTransfer);
    if (DateOnly.TryParse(from, out var f)) query = query.Where(t => t.OccurredOn >= f);
    if (DateOnly.TryParse(to, out var tt)) query = query.Where(t => t.OccurredOn <= tt);

    var items = await query.OrderByDescending(t => t.OccurredOn).ThenByDescending(t => t.CreatedUtc).Take(1000).ToListAsync(ct);
    var accIds = items.Select(t => t.AccountId).Distinct().ToList();
    var catIds = items.Where(t => t.CategoryId != null).Select(t => t.CategoryId!.Value).Distinct().ToList();
    var accNames = await db.GymFinanceAccounts.AsNoTracking().Where(a => accIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id, a => a.Name, ct);
    var catNames = await db.GymFinanceCategories.AsNoTracking().Where(c => catIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, c => c.Name, ct);
    return Results.Ok(items.Select(t => GymFinanceTxnDto(t,
        accNames.TryGetValue(t.AccountId, out var an) ? an : null,
        t.CategoryId != null && catNames.TryGetValue(t.CategoryId.Value, out var cn) ? cn : null)));
}).RequireAuthorization();

app.MapPost("/api/gym/finance/transactions", async (GymFinanceTxnRequest req, ClaimsPrincipal user, AppDbContext db, CancellationToken ct) =>
{
    if (!Enum.TryParse<GymFinanceDirection>(req.Direction, ignoreCase: true, out var dir)) return Results.BadRequest(new { message = "Unknown direction." });
    if (req.Amount <= 0) return Results.BadRequest(new { message = "Amount must be greater than zero." });
    var acc = await db.GymFinanceAccounts.FirstOrDefaultAsync(x => x.Id == req.AccountId, ct);
    if (acc is null) return Results.BadRequest(new { message = "Account not found." });
    if (req.CategoryId is { } cid && !await db.GymFinanceCategories.AnyAsync(c => c.Id == cid, ct))
        return Results.BadRequest(new { message = "Category not found." });

    var occurredOn = GymParseDate(req.OccurredOn, DateOnly.FromDateTime(DateTime.UtcNow));
    var txn = ApplyGymFinanceTxn(db, acc, dir, req.Amount, req.CategoryId, occurredOn,
        string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(), null,
        string.IsNullOrWhiteSpace(req.CounterpartyName) ? null : req.CounterpartyName.Trim(),
        string.IsNullOrWhiteSpace(req.Method) ? null : req.Method.Trim(), false, GymUserEmail(user));
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymFinanceTxnDto(txn, acc.Name, null));
}).RequireAuthorization();

app.MapPut("/api/gym/finance/transactions/{id:guid}", async (Guid id, GymFinanceTxnRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (!Enum.TryParse<GymFinanceDirection>(req.Direction, ignoreCase: true, out var dir)) return Results.BadRequest(new { message = "Unknown direction." });
    if (req.Amount <= 0) return Results.BadRequest(new { message = "Amount must be greater than zero." });
    var txn = await db.GymFinanceTransactions.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (txn is null) return Results.NotFound();
    if (txn.IsTransfer) return Results.BadRequest(new { message = "Transfer legs cannot be edited; delete and recreate the transfer." });
    if (req.CategoryId is { } cid && !await db.GymFinanceCategories.AnyAsync(c => c.Id == cid, ct))
        return Results.BadRequest(new { message = "Category not found." });

    var acc = await db.GymFinanceAccounts.FirstOrDefaultAsync(x => x.Id == txn.AccountId, ct);
    if (acc is null) return Results.BadRequest(new { message = "Account not found." });

    // Reverse old effect, apply new effect (account may stay the same).
    var oldSigned = txn.Direction == GymFinanceDirection.Income ? txn.Amount : -txn.Amount;
    acc.Balance -= oldSigned;
    if (req.AccountId != acc.Id)
    {
        var newAcc = await db.GymFinanceAccounts.FirstOrDefaultAsync(x => x.Id == req.AccountId, ct);
        if (newAcc is null) return Results.BadRequest(new { message = "Account not found." });
        acc.UpdatedUtc = DateTime.UtcNow;
        acc = newAcc;
    }
    var newSigned = dir == GymFinanceDirection.Income ? req.Amount : -req.Amount;
    acc.Balance += newSigned;
    acc.UpdatedUtc = DateTime.UtcNow;

    txn.AccountId = acc.Id;
    txn.Direction = dir;
    txn.Amount = req.Amount;
    txn.Currency = acc.Currency;
    txn.CategoryId = req.CategoryId;
    txn.OccurredOn = GymParseDate(req.OccurredOn, txn.OccurredOn);
    txn.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
    txn.CounterpartyName = string.IsNullOrWhiteSpace(req.CounterpartyName) ? null : req.CounterpartyName.Trim();
    txn.Method = string.IsNullOrWhiteSpace(req.Method) ? null : req.Method.Trim();
    txn.BalanceAfter = acc.Balance;
    txn.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymFinanceTxnDto(txn, acc.Name, null));
}).RequireAuthorization();

app.MapDelete("/api/gym/finance/transactions/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var txn = await db.GymFinanceTransactions.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (txn is null) return Results.NotFound();
    var acc = await db.GymFinanceAccounts.FirstOrDefaultAsync(x => x.Id == txn.AccountId, ct);
    if (acc is not null)
    {
        var signed = txn.Direction == GymFinanceDirection.Income ? txn.Amount : -txn.Amount;
        acc.Balance -= signed;
        acc.UpdatedUtc = DateTime.UtcNow;
    }
    db.GymFinanceTransactions.Remove(txn);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

app.MapPost("/api/gym/finance/transfers", async (GymFinanceTransferRequest req, ClaimsPrincipal user, AppDbContext db, CancellationToken ct) =>
{
    if (req.Amount <= 0) return Results.BadRequest(new { message = "Amount must be greater than zero." });
    if (req.FromAccountId == req.ToAccountId) return Results.BadRequest(new { message = "Source and destination must differ." });
    var from = await db.GymFinanceAccounts.FirstOrDefaultAsync(x => x.Id == req.FromAccountId, ct);
    var to = await db.GymFinanceAccounts.FirstOrDefaultAsync(x => x.Id == req.ToAccountId, ct);
    if (from is null || to is null) return Results.BadRequest(new { message = "Account not found." });

    var occurredOn = GymParseDate(req.OccurredOn, DateOnly.FromDateTime(DateTime.UtcNow));
    var reference = GymGenSeq("TRF");
    var note = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
    var email = GymUserEmail(user);
    ApplyGymFinanceTxn(db, from, GymFinanceDirection.Expense, req.Amount, null, occurredOn, note, reference, to.Name, "Transfer", true, email);
    ApplyGymFinanceTxn(db, to, GymFinanceDirection.Income, req.Amount, null, occurredOn, note, reference, from.Name, "Transfer", true, email);
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { reference, from = GymFinanceAccountDto(from), to = GymFinanceAccountDto(to) });
}).RequireAuthorization();

// ─── Gym Finance: Summary (profit) + period reports + analytics ─────────────────

app.MapGet("/api/gym/finance/summary", async (string? from, string? to, AppDbContext db, CancellationToken ct) =>
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var fromD = GymParseDate(from, new DateOnly(today.Year, today.Month, 1));
    var toD = GymParseDate(to, today);

    var txns = await db.GymFinanceTransactions.AsNoTracking()
        .Where(t => !t.IsTransfer && t.OccurredOn >= fromD && t.OccurredOn <= toD)
        .Select(t => new { t.Direction, t.Amount, t.CategoryId })
        .ToListAsync(ct);

    var income = txns.Where(t => t.Direction == GymFinanceDirection.Income).Sum(t => t.Amount);
    var expense = txns.Where(t => t.Direction == GymFinanceDirection.Expense).Sum(t => t.Amount);

    var categories = await db.GymFinanceCategories.AsNoTracking().ToDictionaryAsync(c => c.Id, c => new { c.Name, c.Color }, ct);
    object[] ByCategory(GymFinanceDirection dir) => txns
        .Where(t => t.Direction == dir)
        .GroupBy(t => t.CategoryId)
        .Select(g => new
        {
            categoryId = g.Key,
            name = g.Key != null && categories.TryGetValue(g.Key.Value, out var c) ? c.Name : "—",
            color = g.Key != null && categories.TryGetValue(g.Key.Value, out var c2) ? c2.Color : "#94a3b8",
            amount = g.Sum(x => x.Amount),
        })
        .OrderByDescending(x => x.amount).Cast<object>().ToArray();

    var accounts = await db.GymFinanceAccounts.AsNoTracking().OrderBy(a => a.Name).ToListAsync(ct);

    return Results.Ok(new
    {
        from = fromD.ToString("yyyy-MM-dd"),
        to = toD.ToString("yyyy-MM-dd"),
        income, expense, profit = income - expense,
        incomeByCategory = ByCategory(GymFinanceDirection.Income),
        expenseByCategory = ByCategory(GymFinanceDirection.Expense),
        accounts = accounts.Select(GymFinanceAccountDto),
        totalCashBalance = accounts.Where(a => a.Type == GymFinanceAccountType.Cash).Sum(a => a.Balance),
        totalBankBalance = accounts.Where(a => a.Type == GymFinanceAccountType.Bank).Sum(a => a.Balance),
        totalBalance = accounts.Sum(a => a.Balance),
    });
}).RequireAuthorization();

app.MapGet("/api/gym/finance/reports", async (string? from, string? to, string? groupBy, AppDbContext db, CancellationToken ct) =>
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var fromD = GymParseDate(from, new DateOnly(today.Year, today.Month, 1).AddMonths(-11));
    var toD = GymParseDate(to, today);
    var mode = string.IsNullOrWhiteSpace(groupBy) ? "month" : groupBy.Trim().ToLowerInvariant();

    var txns = await db.GymFinanceTransactions.AsNoTracking()
        .Where(t => !t.IsTransfer && t.OccurredOn >= fromD && t.OccurredOn <= toD)
        .Select(t => new { t.Direction, t.Amount, t.OccurredOn })
        .ToListAsync(ct);

    static string KeyOf(DateOnly d, string mode) => mode switch
    {
        "day" => d.ToString("yyyy-MM-dd"),
        "year" => d.ToString("yyyy"),
        _ => d.ToString("yyyy-MM"),
    };

    var periods = txns
        .GroupBy(t => KeyOf(t.OccurredOn, mode))
        .Select(g => new
        {
            period = g.Key,
            income = g.Where(x => x.Direction == GymFinanceDirection.Income).Sum(x => x.Amount),
            expense = g.Where(x => x.Direction == GymFinanceDirection.Expense).Sum(x => x.Amount),
        })
        .Select(x => new { x.period, x.income, x.expense, profit = x.income - x.expense })
        .OrderBy(x => x.period)
        .ToArray();

    return Results.Ok(new
    {
        from = fromD.ToString("yyyy-MM-dd"),
        to = toD.ToString("yyyy-MM-dd"),
        groupBy = mode,
        periods,
        totals = new
        {
            income = periods.Sum(p => p.income),
            expense = periods.Sum(p => p.expense),
            profit = periods.Sum(p => p.profit),
        },
    });
}).RequireAuthorization();

// ─── Gym Management: Analytics & Reports (cross-module business overview) ─────────

app.MapGet("/api/gym/analytics/overview", async (string? from, string? to, AppDbContext db, CancellationToken ct) =>
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var fromD = GymParseDate(from, new DateOnly(today.Year, today.Month, 1));
    var toD = GymParseDate(to, today);
    var fromUtc = fromD.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
    var toUtcExclusive = toD.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

    // Customers
    var totalCustomers = await db.GymCustomers.CountAsync(ct);
    var activeCustomers = await db.GymCustomers.CountAsync(c => c.IsActive, ct);
    var newCustomers = await db.GymCustomers.CountAsync(c => c.CreatedUtc >= fromUtc && c.CreatedUtc < toUtcExclusive, ct);
    var lifetimeVisits = await db.GymCustomers.SumAsync(c => c.VisitCount, ct);

    // Memberships
    var memberships = await db.GymMemberships.AsNoTracking()
        .Select(m => new { m.Status, m.EndDate, m.VisitLimit, m.VisitsUsed, m.FrozenUntil, m.TariffName })
        .ToListAsync(ct);
    bool IsActiveNow(DateOnly end, GymMembershipStatus st, int? lim, int used, DateOnly? frozen) =>
        st != GymMembershipStatus.Cancelled && end >= today && (lim == null || used < lim)
        && (frozen == null || frozen <= today);
    var activeMemberships = memberships.Count(m => IsActiveNow(m.EndDate, m.Status, m.VisitLimit, m.VisitsUsed, m.FrozenUntil));
    var frozenMemberships = memberships.Count(m => m.FrozenUntil != null && m.FrozenUntil > today && m.Status != GymMembershipStatus.Cancelled);
    var expiringSoon = memberships.Count(m => m.Status != GymMembershipStatus.Cancelled && m.EndDate >= today && m.EndDate <= today.AddDays(7));
    var membershipsByTariff = memberships
        .Where(m => IsActiveNow(m.EndDate, m.Status, m.VisitLimit, m.VisitsUsed, m.FrozenUntil))
        .GroupBy(m => m.TariffName)
        .Select(g => new { name = g.Key, count = g.Count() })
        .OrderByDescending(x => x.count).Take(10).ToArray();

    // Revenue (gym payments in period)
    var payments = await db.GymPayments.AsNoTracking()
        .Where(p => p.PaidUtc >= fromUtc && p.PaidUtc < toUtcExclusive)
        .Select(p => new { p.Amount, p.Method })
        .ToListAsync(ct);
    var revenue = payments.Sum(p => p.Amount);
    var revenueByMethod = payments
        .GroupBy(p => p.Method)
        .Select(g => new { method = g.Key.ToString(), amount = g.Sum(x => x.Amount), count = g.Count() })
        .OrderByDescending(x => x.amount).ToArray();

    // Gift certificates
    var certs = await db.GymGiftCertificates.AsNoTracking().Select(g => new { g.Status, g.Price }).ToListAsync(ct);
    var giftIssued = certs.Count(c => c.Status == GymGiftCertificateStatus.Issued);
    var giftRedeemed = certs.Count(c => c.Status == GymGiftCertificateStatus.Redeemed);

    return Results.Ok(new
    {
        from = fromD.ToString("yyyy-MM-dd"),
        to = toD.ToString("yyyy-MM-dd"),
        customers = new { total = totalCustomers, active = activeCustomers, inactive = totalCustomers - activeCustomers, @new = newCustomers },
        memberships = new { active = activeMemberships, frozen = frozenMemberships, expiringSoon, byTariff = membershipsByTariff },
        revenue = new { total = revenue, paymentsCount = payments.Count, byMethod = revenueByMethod },
        giftCertificates = new { issued = giftIssued, redeemed = giftRedeemed },
        visits = new { lifetimeTotal = lifetimeVisits },
    });
}).RequireAuthorization();

app.MapGet("/api/gym/analytics/revenue", async (string? from, string? to, string? groupBy, AppDbContext db, CancellationToken ct) =>
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var fromD = GymParseDate(from, new DateOnly(today.Year, today.Month, 1).AddMonths(-11));
    var toD = GymParseDate(to, today);
    var fromUtc = fromD.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
    var toUtcExclusive = toD.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
    var mode = string.IsNullOrWhiteSpace(groupBy) ? "month" : groupBy.Trim().ToLowerInvariant();

    var payments = await db.GymPayments.AsNoTracking()
        .Where(p => p.PaidUtc >= fromUtc && p.PaidUtc < toUtcExclusive)
        .Select(p => new { p.Amount, p.PaidUtc })
        .ToListAsync(ct);

    static string KeyOf(DateTime d, string mode) => mode switch
    {
        "day" => d.ToString("yyyy-MM-dd"),
        "year" => d.ToString("yyyy"),
        _ => d.ToString("yyyy-MM"),
    };

    var periods = payments
        .GroupBy(p => KeyOf(p.PaidUtc, mode))
        .Select(g => new { period = g.Key, revenue = g.Sum(x => x.Amount), count = g.Count() })
        .OrderBy(x => x.period).ToArray();

    return Results.Ok(new
    {
        from = fromD.ToString("yyyy-MM-dd"),
        to = toD.ToString("yyyy-MM-dd"),
        groupBy = mode,
        periods,
        total = periods.Sum(p => p.revenue),
    });
}).RequireAuthorization();

// ─── Gym POS / Checkout: sales ──────────────────────────────────────────────────

static object GymSaleDto(GymSale s, bool withItems = false) => new
{
    s.Id, s.Number, s.CustomerId, s.CustomerName,
    s.Subtotal, s.Discount, s.Total, s.Currency,
    paymentMethod = s.PaymentMethod.ToString(),
    s.FinanceAccountId,
    status = s.Status.ToString(),
    s.SoldUtc, s.RefundedUtc, s.Note, s.UserEmail,
    itemCount = s.Items?.Count ?? 0,
    items = withItems
        ? s.Items.Select(i => new { i.Id, i.ProductId, i.ProductName, i.Quantity, i.UnitPrice, i.LineTotal }).ToArray()
        : null,
};

app.MapGet("/api/gym/pos/sales", async (string? from, string? to, Guid? customerId, AppDbContext db, CancellationToken ct) =>
{
    var query = db.GymSales.AsNoTracking().Include(s => s.Items).AsQueryable();
    if (customerId is { } cid) query = query.Where(s => s.CustomerId == cid);
    if (DateOnly.TryParse(from, out var f)) query = query.Where(s => s.SoldUtc >= f.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
    if (DateOnly.TryParse(to, out var tt)) query = query.Where(s => s.SoldUtc < tt.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
    var items = await query.OrderByDescending(s => s.SoldUtc).Take(500).ToListAsync(ct);
    return Results.Ok(items.Select(s => GymSaleDto(s)));
}).RequireAuthorization();

app.MapGet("/api/gym/pos/sales/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var s = await db.GymSales.AsNoTracking().Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id, ct);
    return s is null ? Results.NotFound() : Results.Ok(GymSaleDto(s, withItems: true));
}).RequireAuthorization();

app.MapPost("/api/gym/pos/sales", async (GymSaleRequest req, ClaimsPrincipal user, AppDbContext db, CancellationToken ct) =>
{
    if (req.Items is null || req.Items.Length == 0) return Results.BadRequest(new { message = "Cart is empty." });
    if (!Enum.TryParse<GymPaymentMethod>(req.PaymentMethod, ignoreCase: true, out var method))
        return Results.BadRequest(new { message = "Unknown payment method." });

    var productIds = req.Items.Select(i => i.ProductId).Distinct().ToList();
    var products = await db.GymProducts.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
    if (products.Count != productIds.Count) return Results.BadRequest(new { message = "One or more products not found." });

    foreach (var item in req.Items)
    {
        if (item.Quantity <= 0 || item.UnitPrice < 0) return Results.BadRequest(new { message = "Item quantity must be > 0 and price >= 0." });
        var prod = products[item.ProductId];
        if (item.Quantity > prod.StockQuantity)
            return Results.BadRequest(new { message = $"Not enough stock for \"{prod.Name}\" ({prod.StockQuantity} left)." });
    }

    GymCustomer? customer = null;
    if (req.CustomerId is { } cid)
    {
        customer = await db.GymCustomers.FirstOrDefaultAsync(c => c.Id == cid, ct);
        if (customer is null) return Results.BadRequest(new { message = "Customer not found." });
    }

    GymFinanceAccount? account = null;
    if (req.FinanceAccountId is { } aid)
    {
        account = await db.GymFinanceAccounts.FirstOrDefaultAsync(a => a.Id == aid, ct);
        if (account is null) return Results.BadRequest(new { message = "Finance account not found." });
    }
    if (req.FinanceCategoryId is { } fcid && !await db.GymFinanceCategories.AnyAsync(c => c.Id == fcid, ct))
        return Results.BadRequest(new { message = "Finance category not found." });

    var subtotal = req.Items.Sum(i => i.Quantity * i.UnitPrice);
    var discount = Math.Max(0, req.Discount);
    var total = Math.Max(0, subtotal - discount);
    var currency = account?.Currency ?? products[req.Items[0].ProductId].Currency;
    var email = GymUserEmail(user);

    string number;
    do { number = GymGenSeq("SALE"); }
    while (await db.GymSales.AnyAsync(s => s.Number == number, ct));

    var sale = new GymSale
    {
        Number = number,
        CustomerId = customer?.Id,
        CustomerName = customer is null ? null : string.Join(' ', new[] { customer.FirstName, customer.LastName }.Where(x => !string.IsNullOrWhiteSpace(x))),
        Subtotal = subtotal,
        Discount = discount,
        Total = total,
        Currency = currency,
        PaymentMethod = method,
        FinanceAccountId = account?.Id,
        Status = GymSaleStatus.Completed,
        SoldUtc = DateTime.UtcNow,
        Note = string.IsNullOrWhiteSpace(req.Note) ? null : req.Note.Trim(),
        UserEmail = email,
    };
    foreach (var item in req.Items)
    {
        var prod = products[item.ProductId];
        sale.Items.Add(new GymSaleItem
        {
            ProductId = prod.Id, ProductName = prod.Name,
            Quantity = item.Quantity, UnitPrice = item.UnitPrice, LineTotal = item.Quantity * item.UnitPrice,
        });
        // Decrement stock with a Sale ledger movement.
        ApplyGymStock(db, prod, GymStockMovementType.Sale, -item.Quantity, prod.Cost, null, number, null, email);
    }
    db.GymSales.Add(sale);

    // Book the income into the chosen finance account (skip if no account or zero total).
    if (account is not null && total > 0)
    {
        var txn = ApplyGymFinanceTxn(db, account, GymFinanceDirection.Income, total, req.FinanceCategoryId,
            DateOnly.FromDateTime(DateTime.UtcNow), $"POS {number}", number, sale.CustomerName, method.ToString(), false, email);
        sale.FinanceTransactionId = txn.Id;
    }

    await db.SaveChangesAsync(ct);
    return Results.Ok(GymSaleDto(sale, withItems: true));
}).RequireAuthorization();

app.MapPost("/api/gym/pos/sales/{id:guid}/refund", async (Guid id, ClaimsPrincipal user, AppDbContext db, CancellationToken ct) =>
{
    var sale = await db.GymSales.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == id, ct);
    if (sale is null) return Results.NotFound();
    if (sale.Status == GymSaleStatus.Refunded) return Results.BadRequest(new { message = "Sale is already refunded." });

    var email = GymUserEmail(user);
    var productIds = sale.Items.Where(i => i.ProductId != null).Select(i => i.ProductId!.Value).Distinct().ToList();
    var products = await db.GymProducts.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
    foreach (var item in sale.Items)
    {
        if (item.ProductId is { } pid && products.TryGetValue(pid, out var prod))
            ApplyGymStock(db, prod, GymStockMovementType.Receipt, item.Quantity, prod.Cost, "Refund", sale.Number, null, email);
    }

    // Reverse the income with an offsetting expense on the same account.
    if (sale.FinanceAccountId is { } aid && sale.Total > 0)
    {
        var account = await db.GymFinanceAccounts.FirstOrDefaultAsync(a => a.Id == aid, ct);
        if (account is not null)
            ApplyGymFinanceTxn(db, account, GymFinanceDirection.Expense, sale.Total, null,
                DateOnly.FromDateTime(DateTime.UtcNow), $"Refund {sale.Number}", sale.Number, sale.CustomerName, sale.PaymentMethod.ToString(), false, email);
    }

    sale.Status = GymSaleStatus.Refunded;
    sale.RefundedUtc = DateTime.UtcNow;
    sale.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(GymSaleDto(sale, withItems: true));
}).RequireAuthorization();

// ─── Parking Management module ──────────────────────────────────────────────────
// Иерархия: Зона → Этаж → Ряд → Место. Места типизированы (обычные/VIP/инвалиды/
// электромобили/мотоциклы). Эндпоинт схемы отдаёт всё дерево зоны для визуализации.

static object ParkingZoneDto(ParkingZone z, int floorCount = 0, int spaceCount = 0) => new
{
    z.Id,
    z.Name,
    z.Code,
    z.Description,
    z.IsActive,
    z.SortOrder,
    floorCount,
    spaceCount,
    z.CreatedUtc,
    z.UpdatedUtc,
};

static object ParkingFloorDto(ParkingFloor f, int rowCount = 0, int spaceCount = 0) => new
{
    f.Id,
    f.ZoneId,
    f.Name,
    f.Level,
    f.IsActive,
    f.SortOrder,
    rowCount,
    spaceCount,
    f.CreatedUtc,
    f.UpdatedUtc,
};

static object ParkingRowDto(ParkingRow r, int spaceCount = 0) => new
{
    r.Id,
    r.FloorId,
    r.Name,
    r.SortOrder,
    spaceCount,
    r.CreatedUtc,
    r.UpdatedUtc,
};

static object ParkingSpaceDto(ParkingSpace s) => new
{
    s.Id,
    s.RowId,
    s.Code,
    type = s.Type.ToString(),
    s.IsActive,
    s.SortOrder,
    s.Notes,
    s.CreatedUtc,
    s.UpdatedUtc,
};

// ─── Zones ───
app.MapGet("/api/parking/zones", async (AppDbContext db, CancellationToken ct) =>
{
    var zones = await db.ParkingZones.AsNoTracking().OrderBy(z => z.SortOrder).ThenBy(z => z.Name).ToListAsync(ct);
    var floorCounts = await db.ParkingFloors.AsNoTracking()
        .GroupBy(f => f.ZoneId).Select(g => new { ZoneId = g.Key, Count = g.Count() }).ToListAsync(ct);
    var spaceCounts = await db.ParkingSpaces.AsNoTracking()
        .GroupBy(s => s.Row!.Floor!.ZoneId).Select(g => new { ZoneId = g.Key, Count = g.Count() }).ToListAsync(ct);
    return Results.Ok(zones.Select(z => ParkingZoneDto(
        z,
        floorCounts.FirstOrDefault(c => c.ZoneId == z.Id)?.Count ?? 0,
        spaceCounts.FirstOrDefault(c => c.ZoneId == z.Id)?.Count ?? 0)));
}).RequireAuthorization();

app.MapPost("/api/parking/zones", async (ParkingZoneRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    var z = new ParkingZone
    {
        Name = req.Name.Trim(),
        Code = string.IsNullOrWhiteSpace(req.Code) ? null : req.Code.Trim(),
        Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
        IsActive = req.IsActive,
        SortOrder = req.SortOrder,
    };
    db.ParkingZones.Add(z);
    await db.SaveChangesAsync(ct);
    return Results.Ok(ParkingZoneDto(z));
}).RequireAuthorization();

app.MapPut("/api/parking/zones/{id:guid}", async (Guid id, ParkingZoneRequest req, AppDbContext db, CancellationToken ct) =>
{
    var z = await db.ParkingZones.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (z is null) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    z.Name = req.Name.Trim();
    z.Code = string.IsNullOrWhiteSpace(req.Code) ? null : req.Code.Trim();
    z.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
    z.IsActive = req.IsActive;
    z.SortOrder = req.SortOrder;
    z.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(ParkingZoneDto(z));
}).RequireAuthorization();

app.MapDelete("/api/parking/zones/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var z = await db.ParkingZones.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (z is null) return Results.NotFound();
    db.ParkingZones.Remove(z); // cascade removes floors → rows → spaces
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Floors ───
app.MapGet("/api/parking/zones/{zoneId:guid}/floors", async (Guid zoneId, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.ParkingZones.AnyAsync(z => z.Id == zoneId, ct)) return Results.NotFound();
    var floors = await db.ParkingFloors.AsNoTracking()
        .Where(f => f.ZoneId == zoneId).OrderBy(f => f.SortOrder).ThenBy(f => f.Level).ToListAsync(ct);
    var rowCounts = await db.ParkingRows.AsNoTracking().Where(r => r.Floor!.ZoneId == zoneId)
        .GroupBy(r => r.FloorId).Select(g => new { FloorId = g.Key, Count = g.Count() }).ToListAsync(ct);
    var spaceCounts = await db.ParkingSpaces.AsNoTracking().Where(s => s.Row!.Floor!.ZoneId == zoneId)
        .GroupBy(s => s.Row!.FloorId).Select(g => new { FloorId = g.Key, Count = g.Count() }).ToListAsync(ct);
    return Results.Ok(floors.Select(f => ParkingFloorDto(
        f,
        rowCounts.FirstOrDefault(c => c.FloorId == f.Id)?.Count ?? 0,
        spaceCounts.FirstOrDefault(c => c.FloorId == f.Id)?.Count ?? 0)));
}).RequireAuthorization();

app.MapPost("/api/parking/zones/{zoneId:guid}/floors", async (Guid zoneId, ParkingFloorRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.ParkingZones.AnyAsync(z => z.Id == zoneId, ct)) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    var f = new ParkingFloor
    {
        ZoneId = zoneId,
        Name = req.Name.Trim(),
        Level = req.Level,
        IsActive = req.IsActive,
        SortOrder = req.SortOrder,
    };
    db.ParkingFloors.Add(f);
    await db.SaveChangesAsync(ct);
    return Results.Ok(ParkingFloorDto(f));
}).RequireAuthorization();

app.MapPut("/api/parking/floors/{id:guid}", async (Guid id, ParkingFloorRequest req, AppDbContext db, CancellationToken ct) =>
{
    var f = await db.ParkingFloors.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (f is null) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    f.Name = req.Name.Trim();
    f.Level = req.Level;
    f.IsActive = req.IsActive;
    f.SortOrder = req.SortOrder;
    f.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(ParkingFloorDto(f));
}).RequireAuthorization();

app.MapDelete("/api/parking/floors/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var f = await db.ParkingFloors.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (f is null) return Results.NotFound();
    db.ParkingFloors.Remove(f);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Rows ───
app.MapGet("/api/parking/floors/{floorId:guid}/rows", async (Guid floorId, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.ParkingFloors.AnyAsync(f => f.Id == floorId, ct)) return Results.NotFound();
    var rows = await db.ParkingRows.AsNoTracking()
        .Where(r => r.FloorId == floorId).OrderBy(r => r.SortOrder).ThenBy(r => r.Name).ToListAsync(ct);
    var spaceCounts = await db.ParkingSpaces.AsNoTracking().Where(s => s.Row!.FloorId == floorId)
        .GroupBy(s => s.RowId).Select(g => new { RowId = g.Key, Count = g.Count() }).ToListAsync(ct);
    return Results.Ok(rows.Select(r => ParkingRowDto(r, spaceCounts.FirstOrDefault(c => c.RowId == r.Id)?.Count ?? 0)));
}).RequireAuthorization();

app.MapPost("/api/parking/floors/{floorId:guid}/rows", async (Guid floorId, ParkingRowRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.ParkingFloors.AnyAsync(f => f.Id == floorId, ct)) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    var r = new ParkingRow { FloorId = floorId, Name = req.Name.Trim(), SortOrder = req.SortOrder };
    db.ParkingRows.Add(r);
    await db.SaveChangesAsync(ct);
    return Results.Ok(ParkingRowDto(r));
}).RequireAuthorization();

app.MapPut("/api/parking/rows/{id:guid}", async (Guid id, ParkingRowRequest req, AppDbContext db, CancellationToken ct) =>
{
    var r = await db.ParkingRows.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (r is null) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Name is required." });
    r.Name = req.Name.Trim();
    r.SortOrder = req.SortOrder;
    r.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(ParkingRowDto(r));
}).RequireAuthorization();

app.MapDelete("/api/parking/rows/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var r = await db.ParkingRows.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (r is null) return Results.NotFound();
    db.ParkingRows.Remove(r);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Spaces ───
app.MapGet("/api/parking/rows/{rowId:guid}/spaces", async (Guid rowId, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.ParkingRows.AnyAsync(r => r.Id == rowId, ct)) return Results.NotFound();
    var spaces = await db.ParkingSpaces.AsNoTracking()
        .Where(s => s.RowId == rowId).OrderBy(s => s.SortOrder).ThenBy(s => s.Code).ToListAsync(ct);
    return Results.Ok(spaces.Select(ParkingSpaceDto));
}).RequireAuthorization();

app.MapPost("/api/parking/rows/{rowId:guid}/spaces", async (Guid rowId, ParkingSpaceRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.ParkingRows.AnyAsync(r => r.Id == rowId, ct)) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(req.Code)) return Results.BadRequest(new { message = "Code is required." });
    if (!Enum.TryParse<ParkingSpaceType>(req.Type, ignoreCase: true, out var type)) return Results.BadRequest(new { message = "Unknown space type." });
    var s = new ParkingSpace
    {
        RowId = rowId,
        Code = req.Code.Trim(),
        Type = type,
        IsActive = req.IsActive,
        SortOrder = req.SortOrder,
        Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim(),
    };
    db.ParkingSpaces.Add(s);
    await db.SaveChangesAsync(ct);
    return Results.Ok(ParkingSpaceDto(s));
}).RequireAuthorization();

// Массовая генерация мест в ряду: префикс + диапазон номеров (например A-01 … A-20).
app.MapPost("/api/parking/rows/{rowId:guid}/spaces/bulk", async (Guid rowId, ParkingSpaceBulkRequest req, AppDbContext db, CancellationToken ct) =>
{
    if (!await db.ParkingRows.AnyAsync(r => r.Id == rowId, ct)) return Results.NotFound();
    if (req.Count is < 1 or > 500) return Results.BadRequest(new { message = "Count must be between 1 and 500." });
    if (!Enum.TryParse<ParkingSpaceType>(req.Type, ignoreCase: true, out var type)) return Results.BadRequest(new { message = "Unknown space type." });
    var start = req.StartNumber < 0 ? 0 : req.StartNumber;
    var pad = req.Pad is >= 1 and <= 6 ? req.Pad : 2;
    var prefix = (req.Prefix ?? string.Empty).Trim();
    var existingMax = await db.ParkingSpaces.Where(s => s.RowId == rowId).Select(s => (int?)s.SortOrder).MaxAsync(ct) ?? 0;
    var created = new List<ParkingSpace>(req.Count);
    for (var i = 0; i < req.Count; i++)
    {
        var n = start + i;
        created.Add(new ParkingSpace
        {
            RowId = rowId,
            Code = prefix + n.ToString().PadLeft(pad, '0'),
            Type = type,
            IsActive = true,
            SortOrder = existingMax + i + 1,
        });
    }
    db.ParkingSpaces.AddRange(created);
    await db.SaveChangesAsync(ct);
    return Results.Ok(created.Select(ParkingSpaceDto));
}).RequireAuthorization();

app.MapPut("/api/parking/spaces/{id:guid}", async (Guid id, ParkingSpaceRequest req, AppDbContext db, CancellationToken ct) =>
{
    var s = await db.ParkingSpaces.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (s is null) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(req.Code)) return Results.BadRequest(new { message = "Code is required." });
    if (!Enum.TryParse<ParkingSpaceType>(req.Type, ignoreCase: true, out var type)) return Results.BadRequest(new { message = "Unknown space type." });
    s.Code = req.Code.Trim();
    s.Type = type;
    s.IsActive = req.IsActive;
    s.SortOrder = req.SortOrder;
    s.Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim();
    s.UpdatedUtc = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(ParkingSpaceDto(s));
}).RequireAuthorization();

app.MapDelete("/api/parking/spaces/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
{
    var s = await db.ParkingSpaces.FirstOrDefaultAsync(x => x.Id == id, ct);
    if (s is null) return Results.NotFound();
    db.ParkingSpaces.Remove(s);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

// ─── Scheme / layout: всё дерево одной зоны для визуализации ───
app.MapGet("/api/parking/zones/{zoneId:guid}/scheme", async (Guid zoneId, AppDbContext db, CancellationToken ct) =>
{
    var zone = await db.ParkingZones.AsNoTracking().FirstOrDefaultAsync(z => z.Id == zoneId, ct);
    if (zone is null) return Results.NotFound();

    var floors = await db.ParkingFloors.AsNoTracking()
        .Where(f => f.ZoneId == zoneId).OrderBy(f => f.SortOrder).ThenBy(f => f.Level).ToListAsync(ct);
    var floorIds = floors.Select(f => f.Id).ToList();
    var rows = await db.ParkingRows.AsNoTracking()
        .Where(r => floorIds.Contains(r.FloorId)).OrderBy(r => r.SortOrder).ThenBy(r => r.Name).ToListAsync(ct);
    var rowIds = rows.Select(r => r.Id).ToList();
    var spaces = await db.ParkingSpaces.AsNoTracking()
        .Where(s => rowIds.Contains(s.RowId)).OrderBy(s => s.SortOrder).ThenBy(s => s.Code).ToListAsync(ct);

    return Results.Ok(new
    {
        zone.Id,
        zone.Name,
        zone.Code,
        zone.IsActive,
        floors = floors.Select(f => new
        {
            f.Id,
            f.Name,
            f.Level,
            f.IsActive,
            rows = rows.Where(r => r.FloorId == f.Id).Select(r => new
            {
                r.Id,
                r.Name,
                spaces = spaces.Where(s => s.RowId == r.Id).Select(ParkingSpaceDto),
            }),
        }),
    });
}).RequireAuthorization();

var indexHtmlPath = Path.Combine(app.Environment.WebRootPath ?? string.Empty, "index.html");
if (File.Exists(indexHtmlPath))
{
    app.MapFallbackToFile("index.html");
}

app.Run();

/// <summary>
/// Push a person and all of their credentials (face / fingerprint / card) to a list of devices,
/// emitting SignalR <c>PersonSyncProgress</c> events as we go so the frontend can render a
/// per-device progress bar. Devices that are not currently in the active connection set
/// (<see cref="IDeviceConnectionManager.GetActiveConnectionsAsync"/>) are SKIPPED IMMEDIATELY
/// instead of waiting for HTTP/SDK timeouts — this is the main fix for slow saves.
/// </summary>
static async Task<List<string>> SyncPersonToDevicesWithProgressAsync(
    string syncId,
    Guid personId,
    bool isEmployee,
    IList<Guid> deviceIds,
    IList<Face> faces,
    IList<Fingerprint> fingerprints,
    IList<Card> cards,
    IDictionary<Guid, Device> devices,
    IDevicePersonSyncService syncService,
    IDeviceConnectionManager connectionManager,
    IDeviceActivityBroadcaster broadcaster,
    Microsoft.Extensions.Logging.ILogger logger,
    CancellationToken cancellationToken)
{
    var warnings = new List<string>();
    var total = deviceIds.Count;

    if (total == 0)
    {
        await broadcaster.NotifyPersonSyncProgressAsync(
            syncId, "complete", 0, 0, Guid.Empty, "", "Нет устройств для синхронизации", cancellationToken);
        return warnings;
    }

    // Snapshot the active-connection set ONCE up front. Devices not present here are
    // currently offline (no SDK login + no recent heartbeat from alertStream). Trying to
    // POST to them would block on the IsapiClient 30-second-per-port HttpClient timeout.
    IReadOnlyCollection<DeviceConnection> active;
    try
    {
        active = await connectionManager.GetActiveConnectionsAsync(cancellationToken);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not query active device connections; sync will attempt all devices anyway");
        active = [];
    }

    var onlineIdentifiers = new HashSet<string>(
        active.Select(c => c.DeviceIdentifier),
        StringComparer.OrdinalIgnoreCase);

    var current = 0;
    foreach (var deviceId in deviceIds)
    {
        current++;
        var device = devices.TryGetValue(deviceId, out var d) ? d : null;
        var deviceName = device?.Name ?? deviceId.ToString();
        var deviceIdentifier = device?.DeviceIdentifier ?? "";

        // OFFLINE FAST-PATH: skip the device entirely instead of hanging on a timeout.
        if (string.IsNullOrEmpty(deviceIdentifier) || !onlineIdentifiers.Contains(deviceIdentifier))
        {
            warnings.Add($"Устройство \"{deviceName}\" офлайн — пропущено");
            await broadcaster.NotifyPersonSyncProgressAsync(
                syncId, "skipped", current, total, deviceId, deviceName, "Офлайн — пропущено", cancellationToken);
            continue;
        }

        await broadcaster.NotifyPersonSyncProgressAsync(
            syncId, "syncing", current, total, deviceId, deviceName, "Запись на устройство...", cancellationToken);

        try
        {
            var result = isEmployee
                ? await syncService.SyncEmployeeAsync(personId, deviceId, cancellationToken)
                : await syncService.SyncVisitorAsync(personId, deviceId, cancellationToken);
            if (!result.Success)
            {
                warnings.Add($"Устройство \"{deviceName}\": {result.Message}");
                logger.LogWarning(
                    "Sync person {PersonId} to device {DeviceId} ({DeviceName}): {Message}",
                    personId, deviceId, deviceName, result.Message);
            }

            foreach (var face in faces)
            {
                var fr = await syncService.SyncFaceAsync(face.Id, deviceId, cancellationToken);
                if (!fr.Success) warnings.Add($"Лицо → \"{deviceName}\": {fr.Message}");
            }
            foreach (var fp in fingerprints)
            {
                var fr = await syncService.SyncFingerprintAsync(fp.Id, deviceId, cancellationToken);
                if (!fr.Success) warnings.Add($"Отпечаток → \"{deviceName}\": {fr.Message}");
            }
            foreach (var card in cards)
            {
                var cr = await syncService.SyncCardAsync(card.Id, deviceId, cancellationToken);
                if (!cr.Success) warnings.Add($"Карта → \"{deviceName}\": {cr.Message}");
            }

            await broadcaster.NotifyPersonSyncProgressAsync(
                syncId, "done", current, total, deviceId, deviceName, "Готово", cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            warnings.Add($"Устройство \"{deviceName}\": {ex.Message}");
            logger.LogWarning(ex, "Sync to device {DeviceId} ({DeviceName}) threw", deviceId, deviceName);
            await broadcaster.NotifyPersonSyncProgressAsync(
                syncId, "error", current, total, deviceId, deviceName, ex.Message, cancellationToken);
        }
    }

    await broadcaster.NotifyPersonSyncProgressAsync(
        syncId, "complete", total, total, Guid.Empty, "", null, cancellationToken);

    return warnings;
}

static DeviceResponse MapDeviceResponse(Device device, string status, DateTime? lastSeenUtc, string? statusMessage = null)
{
    return new DeviceResponse(
        device.Id,
        device.DeviceIdentifier,
        device.Name,
        device.IpAddress,
        device.Port,
        device.Location,
        device.DeviceType.ToString(),
        status,
        lastSeenUtc,
        device.Username,
        statusMessage);
}

static string MapConnectivityStatus(DeviceConnectivityStatus status)
{
    return status == DeviceConnectivityStatus.Connected ? "Online" : "Offline";
}

static EmployeeResponse MapEmployeeResponse(Employee e)
{
    var accessNames = e.AccessLevels?.Select(a => a.AccessLevel?.Name).Where(n => n != null).Cast<string>().ToArray() ?? [];
    var dept = e.Department != null ? new DepartmentRef(e.Department.Id, e.Department.Name) : null;
    var primaryFaceId = (e.Faces ?? []).OrderBy(f => f.CreatedUtc).Select(f => (Guid?)f.Id).FirstOrDefault();
    return new EmployeeResponse(
        e.Id, e.FirstName, e.LastName, e.EmployeeNo, e.Gender, e.ValidFromUtc, e.ValidToUtc, e.IsActive, e.OnlyVerify,
        accessNames, dept, e.CompanyId, primaryFaceId, e.Cards?.Count ?? 0, e.Faces?.Count ?? 0, e.Fingerprints?.Count ?? 0, e.Irises?.Count ?? 0, e.WorkScheduleId);
}

static EmployeeDetailResponse MapEmployeeDetailResponse(Employee e)
{
    var dept = e.Department != null ? new DepartmentRef(e.Department.Id, e.Department.Name) : null;
    var accessLevels = (e.AccessLevels ?? []).Where(a => a.AccessLevel != null).Select(a => new AccessLevelRef(a.AccessLevel!.Id, a.AccessLevel.Name)).ToArray();
    var cards = (e.Cards ?? []).Select(c => new CardRef(c.Id, c.CardNo, c.CardNumber, c.CardType)).ToArray();
    var faces = (e.Faces ?? []).Select(f => new FaceRef(f.Id, f.FDID)).ToArray();
    var fingerprints = (e.Fingerprints ?? []).Select(f => new FingerprintRef(f.Id, f.FingerIndex)).ToArray();
    var irises = (e.Irises ?? []).Select(i => new IrisRef(i.Id, i.IrisIndex)).ToArray();
    return new EmployeeDetailResponse(e.Id, e.FirstName, e.LastName, e.EmployeeNo, e.Gender, e.ValidFromUtc, e.ValidToUtc, e.IsActive, e.OnlyVerify, dept, e.CompanyId, accessLevels, cards, faces, fingerprints, irises, e.SelfServiceEnabled, e.SelfServiceEmail, e.WorkScheduleId, e.WorkSchedule?.Name);
}

static VisitorResponse MapVisitorResponse(Visitor v)
{
    var accessNames = v.AccessLevels?.Select(a => a.AccessLevel?.Name).Where(n => n != null).Cast<string>().ToArray() ?? [];
    var dept = v.Department != null ? new DepartmentRef(v.Department.Id, v.Department.Name) : null;
    var primaryFaceId = (v.Faces ?? []).OrderBy(f => f.CreatedUtc).Select(f => (Guid?)f.Id).FirstOrDefault();
    return new VisitorResponse(
        v.Id, v.FirstName, v.LastName, v.DocumentNumber, v.ValidFromUtc, v.ValidToUtc, v.IsActive,
        accessNames, dept, v.CompanyId, primaryFaceId, v.Cards?.Count ?? 0, v.Faces?.Count ?? 0, v.Fingerprints?.Count ?? 0, v.Irises?.Count ?? 0);
}

static VisitorDetailResponse MapVisitorDetailResponse(Visitor v)
{
    var dept = v.Department != null ? new DepartmentRef(v.Department.Id, v.Department.Name) : null;
    var accessLevels = (v.AccessLevels ?? []).Where(a => a.AccessLevel != null).Select(a => new AccessLevelRef(a.AccessLevel!.Id, a.AccessLevel.Name)).ToArray();
    var cards = (v.Cards ?? []).Select(c => new CardRef(c.Id, c.CardNo, c.CardNumber, c.CardType)).ToArray();
    var faces = (v.Faces ?? []).Select(f => new FaceRef(f.Id, f.FDID)).ToArray();
    var fingerprints = (v.Fingerprints ?? []).Select(f => new FingerprintRef(f.Id, f.FingerIndex)).ToArray();
    var irises = (v.Irises ?? []).Select(i => new IrisRef(i.Id, i.IrisIndex)).ToArray();
    return new VisitorDetailResponse(v.Id, v.FirstName, v.LastName, v.DocumentNumber, v.ValidFromUtc, v.ValidToUtc, v.IsActive, dept, v.CompanyId, accessLevels, cards, faces, fingerprints, irises);
}

static async Task<string> GetNextPersonIdAsync(AppDbContext dbContext, CancellationToken cancellationToken)
{
    var empNums = await dbContext.Employees
        .Select(x => x.EmployeeNo)
        .ToListAsync(cancellationToken);
    
    var visNums = await dbContext.Visitors
        .Select(x => x.DocumentNumber)
        .ToListAsync(cancellationToken);

    var max = 0;
    void TryUpdateMax(string? s)
    {
        if (int.TryParse(s?.Trim(), out var val) && val > max) max = val;
    }

    foreach (var e in empNums)
    {
        TryUpdateMax(e);
    }
    foreach (var v in visNums)
    {
        TryUpdateMax(v);
    }

    return (max + 1).ToString();
}

static string TruncateEmployeeNo(string s)
{
    if (string.IsNullOrEmpty(s)) return s;
    return s.Length > 32 ? s[..32] : s;
}

static bool TryParseHHmmLogSync(string s, out int hours, out int minutes)
{
    hours = 0;
    minutes = 0;
    var parts = s.Trim().Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    if (parts.Length != 2) return false;
    if (!int.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out hours)) return false;
    if (!int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out minutes)) return false;
    return hours is >= 0 and <= 23 && minutes is >= 0 and <= 59;
}

static string NormalizeHHmmLogSync(string s)
{
    if (!TryParseHHmmLogSync(s, out var h, out var m)) return "03:00";
    return $"{h:00}:{m:00}";
}

static async Task UpsertLogSyncSettingAsync(AppDbContext db, string key, string? value, CancellationToken cancellationToken)
{
    var entity = await db.SystemSettings.FirstOrDefaultAsync(x => x.Key == key, cancellationToken);
    if (entity is null)
    {
        db.SystemSettings.Add(new SystemSetting
        {
            Id = Guid.NewGuid(),
            Key = key,
            Value = value,
            CreatedUtc = DateTime.UtcNow
        });
    }
    else
    {
        entity.Value = value;
        entity.UpdatedUtc = DateTime.UtcNow;
    }
}

static bool IsLoopbackRequest(HttpContext httpContext)
{
    var remoteIp = httpContext.Connection.RemoteIpAddress;
    return remoteIp is not null && System.Net.IPAddress.IsLoopback(remoteIp);
}

static IResult? ValidateLocalControlRequest(HttpContext httpContext, string? localControlKey)
{
    if (!IsLoopbackRequest(httpContext))
    {
        return Results.Forbid();
    }

    if (!string.IsNullOrWhiteSpace(localControlKey))
    {
        var requestKey = httpContext.Request.Headers["X-Local-Control-Key"].ToString();
        if (!string.Equals(requestKey, localControlKey, StringComparison.Ordinal))
        {
            return Results.Unauthorized();
        }
    }

    return null;
}

public sealed record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? Role);

public sealed record LoginRequest(string Email, string Password);

public sealed record CreateSystemUserRequest(
    string Email,
    string Password,
    string? FirstName,
    string? LastName,
    string[]? Roles);

public sealed record UpdateSystemUserRequest(
    string? Email,
    string? FirstName,
    string? LastName,
    string[]? Roles);

public sealed record AdminChangePasswordRequest(string NewPassword);

public sealed record CreateRoleRequest(string Name);

public sealed record UpdateRolePermissionsRequest(string[]? Permissions);

public sealed record SetupAdminPasswordRequest(string Email, string Password, string ConfirmPassword);

public sealed record ForgotPasswordRequest(string Email);

public sealed record ResetPasswordRequest(string Email, string Token, string Password, string ConfirmPassword);

public sealed record ActivateDeviceRequest(string IpAddress, int Port, string MacAddress, string Password);

public sealed record CreateDeviceRequest(
    string DeviceIdentifier,
    string Name,
    string IpAddress,
    int Port,
    string? Location,
    DeviceType DeviceType,
    string? Username,
    string? Password);

public sealed record UpdateDeviceRequest(
    string DeviceIdentifier,
    string Name,
    string IpAddress,
    int Port,
    string? Location,
    DeviceType DeviceType,
    string? Username,
    string? Password);

public sealed record DeviceResponse(
    Guid Id,
    string DeviceIdentifier,
    string Name,
    string IpAddress,
    int Port,
    string? Location,
    string DeviceType,
    string Status,
    DateTime? LastSeenUtc,
    string? Username,
    string? StatusMessage);

public sealed record DeviceStatusResponse(
    Guid DeviceId,
    string DeviceIdentifier,
    string Status,
    DateTime? LastSeenUtc,
    string? StatusMessage);

public sealed record CreateAccessLevelRequest(string Name, string? Description);
public sealed record UpdateAccessLevelRequest(string Name, string? Description);

public sealed record CreateCompanyRequest(string Name, string? Description);
public sealed record UpdateCompanyRequest(string Name, string? Description);
public sealed record CompanyResponse(Guid Id, string Name, string? Description, DateTime CreatedUtc, DateTime? UpdatedUtc);
public sealed record SystemSettingRequest(string Key, string? Value);
public sealed record SystemSettingResponse(string Key, string? Value);

public sealed record LogSyncSettingsResponse(bool AutoEnabled, string DailyTimeLocal, DateTime? LastRunUtc, int? LastRecordsAdded, string? LastRunKind);
public sealed record LogSyncSettingsRequest(bool AutoEnabled, string DailyTimeLocal);
public sealed record LogSyncManualRequest(string FromDate, string ToDate);

public sealed record CreateDepartmentRequest(string Name, string? Description, Guid? ParentId, Guid? CompanyId);
public sealed record UpdateDepartmentRequest(string Name, string? Description, int? SortOrder, Guid? ParentId, Guid? CompanyId);
public sealed record DepartmentResponse(Guid Id, string Name, string? Description, int SortOrder, Guid? ParentId, Guid? CompanyId, int ChildrenCount, int EmployeesCount, int VisitorsCount);
public sealed record DepartmentTreeItem(Guid Id, string Name, string? Description, int SortOrder, Guid? ParentId, Guid? CompanyId, int EmployeesCount, int VisitorsCount);
public sealed record AddAccessLevelDoorRequest(Guid DeviceId, int DoorIndex);
public sealed record DoorControlRequest(string? Action, int? CallNumber = null, string? CallElevatorType = null);
public sealed record DeviceTimeSyncRequest(string TimeZone);
public sealed record TimeSyncScheduleRequest(bool AutoEnabled, string DailyTimeLocal, string? TimeZone);
public sealed record TimeSyncScheduleResponse(bool AutoEnabled, string DailyTimeLocal, string? TimeZone, DateTime? LastRunUtc, int? LastSuccessCount, int? LastTotal, string? LastRunKind);
public sealed record CreateEmployeeRequest(string FirstName, string LastName, string? Gender, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool? OnlyVerify, Guid[]? AccessLevelIds, Guid? DepartmentId, Guid? CompanyId);
public sealed record UpdateEmployeeRequest(string FirstName, string LastName, string? Gender, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool? IsActive, bool? OnlyVerify, Guid[]? AccessLevelIds, Guid? DepartmentId, Guid? CompanyId, bool? SelfServiceEnabled, string? SelfServiceEmail, Guid? WorkScheduleId);
public sealed record CreateVisitorRequest(string FirstName, string LastName, string? DocumentNumber, DateTime? ValidFromUtc, DateTime? ValidToUtc, Guid[]? AccessLevelIds, Guid? DepartmentId, Guid? CompanyId);
public sealed record UpdateVisitorRequest(string FirstName, string LastName, string? DocumentNumber, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool? IsActive, Guid[]? AccessLevelIds, Guid? DepartmentId, Guid? CompanyId);
public sealed record SyncToDevicesRequest(Guid[]? DeviceIds);

public sealed record CaptureFaceRequest(string? PersonId, string? PersonType);
public sealed record CaptureFingerprintRequest(string? PersonId, string? PersonType, int FingerIndex);

public sealed record ImportFromDevicesRequest(Guid[]? DeviceIds, Guid? CompanyId);
public sealed record DepartmentRef(Guid Id, string Name);
public sealed record EmployeeResponse(Guid Id, string FirstName, string LastName, string? EmployeeNo, string? Gender, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool IsActive, bool OnlyVerify, string[] AccessLevelNames, DepartmentRef? Department, Guid? CompanyId, Guid? PrimaryFaceId, int CardsCount, int FacesCount, int FingerprintsCount, int IrisesCount, Guid? WorkScheduleId = null);
public sealed record EmployeeDetailResponse(Guid Id, string FirstName, string LastName, string? EmployeeNo, string? Gender, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool IsActive, bool OnlyVerify, DepartmentRef? Department, Guid? CompanyId, AccessLevelRef[] AccessLevels, CardRef[] Cards, FaceRef[] Faces, FingerprintRef[] Fingerprints, IrisRef[] Irises, bool SelfServiceEnabled = false, string? SelfServiceEmail = null, Guid? WorkScheduleId = null, string? WorkScheduleName = null);
public sealed record VisitorResponse(Guid Id, string FirstName, string LastName, string? DocumentNumber, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool IsActive, string[] AccessLevelNames, DepartmentRef? Department, Guid? CompanyId, Guid? PrimaryFaceId, int CardsCount, int FacesCount, int FingerprintsCount, int IrisesCount);
public sealed record VisitorDetailResponse(Guid Id, string FirstName, string LastName, string? DocumentNumber, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool IsActive, DepartmentRef? Department, Guid? CompanyId, AccessLevelRef[] AccessLevels, CardRef[] Cards, FaceRef[] Faces, FingerprintRef[] Fingerprints, IrisRef[] Irises);
public sealed record AccessLevelRef(Guid Id, string Name);
public sealed record CardRef(Guid Id, string CardNo, string? CardNumber, string? CardType = null);
public sealed record FaceRef(Guid Id, int FDID);
public sealed record FingerprintRef(Guid Id, int FingerIndex);
public sealed record IrisRef(Guid Id, int IrisIndex);
public sealed record CreateCardRequest(string CardNo, string? CardNumber, Guid? EmployeeId, Guid? VisitorId, Guid[]? DeviceIds);
public sealed record UpdateCardRequest(string? CardNumber);
public sealed record CreateFingerprintRequest(string TemplateData, int FingerIndex, Guid? EmployeeId, Guid? VisitorId, Guid[]? DeviceIds);
public sealed record AccessLevelDoorDto(Guid DeviceId, string DeviceName, int DoorIndex, bool IsElevator);
public sealed record AccessLevelResponse(Guid Id, string Name, string? Description, DateTime CreatedUtc, DateTime? UpdatedUtc, IReadOnlyList<AccessLevelDoorDto> Doors);

public sealed record SystemStatusResponse(
    string ServerStatus,
    string ServiceName,
    string ServiceState,
    string ServiceMessage,
    string DbStatus,
    double? DbLatencyMs,
    string DbMessage,
    DateTime Utc);

public sealed record ServiceControlResponse(
    bool Success,
    string ServiceName,
    string ServiceState,
    string Message);

public sealed record ManagedServiceResponse(
    string Key,
    string ServiceName,
    string DisplayName,
    string? Port,
    bool IsControllable,
    string ServiceState,
    string Message);

// Time Attendance records
public sealed record WorkScheduleShiftDto(Guid? Id, string Name, TimeSpan ShiftStart, TimeSpan ShiftEnd, TimeSpan ValidEntryFrom, TimeSpan ValidEntryTo, decimal RequiredHoursPerDay, int SortOrder);
public sealed record WorkScheduleResponse(Guid Id, string Name, string Type, TimeSpan? ShiftStart, TimeSpan? ShiftEnd, decimal RequiredHoursPerDay, string Color, DateTime CreatedUtc, WorkScheduleShiftDto[]? Shifts = null, bool CountEarlyArrival = true, int OvertimeDailyThresholdMinutes = 0);
public sealed record SchedulePlannerDayRequest(DateOnly Date, Guid? ScheduleId, bool IsDayOff, bool Reset = false);
public sealed record BulkAssignScheduleRequest(Guid[] EmployeeIds, Guid? ScheduleId);
public sealed record BulkSchedulePlannerRequest(Guid[] EmployeeIds, SchedulePlannerDayRequest[] Days, Guid? ReplaceScheduleId = null);
public sealed record CreateWorkScheduleRequest(string Name, string Type, TimeSpan? ShiftStart, TimeSpan? ShiftEnd, decimal? RequiredHoursPerDay, string? Color, WorkScheduleShiftDto[]? Shifts = null, bool? CountEarlyArrival = null, int? OvertimeDailyThresholdMinutes = null);
public sealed record AttendanceRecordResponse(Guid Id, Guid EmployeeId, string EmployeeName, DateTime EventTimeUtc, string EventType, Guid? DeviceId, string Source, DateTime CreatedUtc);
public sealed record AttendanceRequestResponse(Guid Id, Guid EmployeeId, string EmployeeName, string Type, DateTime RequestedTimeUtc, DateTime? RequestedEndTimeUtc, string? Comment, string Status, Guid? ReviewedByUserId, DateTime? ReviewedAtUtc, string? ReviewComment, DateTime CreatedUtc, double? Latitude, double? Longitude, string? GeoZoneName);
public sealed record CreateAttendanceRequestBody(string Type, DateTime RequestedTimeUtc, DateTime? RequestedEndTimeUtc, string? Comment, Guid? EmployeeId, double? Latitude = null, double? Longitude = null);
public sealed record AttendanceCorrectionRequest(Guid EmployeeId, DateTime Date, DateTime? CheckInUtc, DateTime? CheckOutUtc, string? Comment);
public sealed record GeoZoneRequest(string Name, double Latitude, double Longitude, int RadiusMeters, bool IsActive);

public sealed record GymTariffRequest(
    string Name,
    string? Description,
    string Kind,
    decimal Price,
    string? Currency,
    string DurationType,
    int? VisitLimit,
    bool HasTimeRestriction,
    string? AccessFrom,
    string? AccessTo,
    int DaysOfWeekMask,
    bool AutoRenew,
    bool FreezeAllowed,
    int FreezeMaxDays,
    bool TransferAllowed,
    bool IsActive,
    int SortOrder);

public sealed record GymCustomerRequest(
    string FirstName,
    string? LastName,
    string? Phone,
    string? Email,
    string? Gender,
    string? BirthDate,
    string? Notes,
    bool IsActive);

public sealed record IssueMembershipRequest(Guid TariffId, string? StartDate);
public sealed record FreezeMembershipRequest(int Days);
public sealed record TransferMembershipRequest(Guid CustomerId);
public sealed record IssueGiftCertificateRequest(Guid TariffId, string? ValidUntil, string? RecipientName);
public sealed record RedeemGiftCertificateRequest(Guid CustomerId, string? StartDate);
public sealed record GymAccessRequest(Guid[] DeviceIds);
public sealed record GymCaptureRequest(Guid DeviceId, int? FingerIndex);
public sealed record GymAddCardRequest(string CardNo, string? CardNumber, Guid[]? DeviceIds);
public sealed record GymPaymentRequest(Guid? MembershipId, decimal Amount, string? Currency, string Method, string? Note);

// ─── Parking Management ───
public sealed record ParkingZoneRequest(string Name, string? Code, string? Description, bool IsActive, int SortOrder);
public sealed record ParkingFloorRequest(string Name, int Level, bool IsActive, int SortOrder);
public sealed record ParkingRowRequest(string Name, int SortOrder);
public sealed record ParkingSpaceRequest(string Code, string Type, bool IsActive, int SortOrder, string? Notes);
public sealed record ParkingSpaceBulkRequest(string? Prefix, int StartNumber, int Count, int Pad, string Type);

// Gym Inventory / Warehouse
public sealed record GymSupplierRequest(string Name, string? ContactName, string? Phone, string? Email, string? Address, string? Notes, bool IsActive);
public sealed record GymProductRequest(string Name, string? Sku, string? Barcode, string? Category, string? Unit, decimal SalePrice, decimal Cost, string? Currency, decimal MinStock, decimal? OpeningStock, Guid? SupplierId, bool IsActive);
public sealed record GymReceiptRequest(Guid ProductId, decimal Quantity, decimal? UnitCost, Guid? SupplierId, string? Note);
public sealed record GymWriteOffRequest(Guid ProductId, decimal Quantity, string? Reason);
public sealed record GymPurchaseOrderItemRequest(Guid ProductId, decimal Quantity, decimal UnitCost);
public sealed record GymPurchaseOrderRequest(Guid? SupplierId, string? ExpectedDate, string? Notes, GymPurchaseOrderItemRequest[] Items);
public sealed record GymStocktakeRequest(string? Notes, bool SeedAllProducts);
public sealed record GymStocktakeCountItem(Guid ItemId, decimal CountedQuantity);
public sealed record GymStocktakeCountsRequest(GymStocktakeCountItem[] Items);

// Gym Finance
public sealed record GymFinanceAccountRequest(string Name, string Type, string? Currency, decimal OpeningBalance, string? BankName, string? AccountNumber, bool IsActive);
public sealed record GymFinanceCategoryRequest(string Name, string Direction, string? Color, bool IsActive);
public sealed record GymFinanceTxnRequest(string Direction, Guid AccountId, decimal Amount, Guid? CategoryId, string? OccurredOn, string? Description, string? CounterpartyName, string? Method);
public sealed record GymFinanceTransferRequest(Guid FromAccountId, Guid ToAccountId, decimal Amount, string? OccurredOn, string? Description);

// Gym POS / Checkout
public sealed record GymSaleItemRequest(Guid ProductId, decimal Quantity, decimal UnitPrice);
public sealed record GymSaleRequest(Guid? CustomerId, GymSaleItemRequest[] Items, decimal Discount, string PaymentMethod, Guid? FinanceAccountId, Guid? FinanceCategoryId, string? Note);

public sealed record ReviewAttendanceRequestBody(string? Comment);
public sealed record SelfServiceLoginRequest(string Email, string Password);
public sealed record SelfServiceChangePasswordRequest(string CurrentPassword, string NewPassword);
public sealed record SelfServiceLeaveRequest(string LeaveType, bool IsPaid, DateOnly StartDate, DateOnly EndDate, string? Reason);
public sealed record PayrollComponentRequest(string Name, string ComponentType, bool IsFixed, decimal? Amount, decimal? Percentage, bool IsDefault, bool IsActive, string? Description);
public sealed record OvertimeTierDto(double AfterHours, decimal Multiplier);
public sealed record LatenessTierDto(int AfterMinutes, decimal DeductionMultiplier);
public sealed record EmployeeSalaryConfigRequest(
    string SalaryType, decimal BaseAmount, string? Currency,
    decimal? OvertimeMultiplier, bool? OvertimeEnabled, bool? PayByWorkedHours,
    OvertimeTierDto[]? OvertimeTiers,
    bool? LatenessDeductionEnabled, LatenessTierDto[]? LatenessTiers,
    DateOnly EffectiveFrom, Guid[]? ComponentIds,
    string? LatenessDeductionMode = null,
    bool? EarlyLeaveDeductionEnabled = null,
    string? EarlyLeaveDeductionMode = null,
    LatenessTierDto[]? EarlyLeaveTiers = null);
public sealed record CreatePayrollPeriodRequest(DateOnly StartDate, DateOnly EndDate, string? Notes);
public sealed record SendScheduleReportRequest(DateOnly From, DateOnly ToDate, string To);

public sealed record EmpAttendanceTotals(
    Guid EmployeeId,
    int WorkedDays,
    double WorkedHours,
    double OvertimeHours,
    double LatenessMinutes,
    int LatenessDaysCount,
    double EarlyLeaveMinutes,
    int EarlyLeaveDaysCount,
    int AbsentDays,
    int TotalWorkingDays,
    List<double> OvertimeBreakdown);

internal static class AttendanceCalculator
{
    public static async Task<List<EmpAttendanceTotals>> ComputeForRangeAsync(
        AppDbContext db, DateOnly rangeStart, DateOnly rangeEnd, CancellationToken ct)
    {
        var periodStartUtc = rangeStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var periodEndExclusiveUtc = rangeEnd.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var employees = await db.Employees.AsNoTracking()
            .Include(e => e.WorkSchedule).ThenInclude(ws => ws!.Shifts)
            .Include(e => e.DayPatterns.Where(dp => dp.Date >= rangeStart && dp.Date <= rangeEnd))
                .ThenInclude(dp => dp.WorkSchedule).ThenInclude(ws => ws!.Shifts)
            .Where(e => e.IsActive && (e.WorkScheduleId != null || e.DayPatterns.Any(dp => dp.WorkScheduleId != null)))
            .ToListAsync(ct);

        var logs = await db.DeviceAuthLogs.AsNoTracking()
            .Where(l => l.EventTimeUtc >= periodStartUtc && l.EventTimeUtc < periodEndExclusiveUtc)
            .Select(l => new { l.EmployeeNoString, l.EventTimeUtc })
            .ToListAsync(ct);
        var logsByEmpDay = logs
            .GroupBy(r => (Emp: r.EmployeeNoString.Trim().ToLowerInvariant(), Day: r.EventTimeUtc.ToLocalTime().Date))
            .ToDictionary(g => g.Key, g => new { First = g.Min(x => x.EventTimeUtc), Last = g.Max(x => x.EventTimeUtc) });

        var corrections = await db.AttendanceCorrections.AsNoTracking()
            .Where(c => c.DateUtc >= periodStartUtc && c.DateUtc < periodEndExclusiveUtc)
            .ToListAsync(ct);
        var corrByEmpDay = corrections.ToDictionary(c => (c.EmployeeId, Day: c.DateUtc.ToLocalTime().Date));

        var leavesInPeriod = await db.EmployeeLeaves.AsNoTracking()
            .Where(l => l.Status == LeaveStatus.Approved && l.IsPaid &&
                        l.StartDate <= rangeEnd && l.EndDate >= rangeStart)
            .ToListAsync(ct);
        var leavesByEmp = leavesInPeriod.GroupBy(l => l.EmployeeId).ToDictionary(g => g.Key, g => g.ToList());


        var result = new List<EmpAttendanceTotals>(employees.Count);
        foreach (var emp in employees)
        {
            var empKeyLower = (emp.EmployeeNo ?? "").Trim().ToLowerInvariant();
            var patternsByDate = emp.DayPatterns.ToDictionary(dp => dp.Date);
            var workedDays = 0;
            var totalWorkedHours = 0.0;
            var totalOvertimeHours = 0.0;
            var totalLatenessMinutes = 0.0;
            var latenessDaysCount = 0;
            var totalEarlyLeaveMinutes = 0.0;
            var earlyLeaveDaysCount = 0;
            var totalWorkingDays = 0;
            var dailyOtList = new List<double>();

            for (var day = rangeStart; day <= rangeEnd; day = day.AddDays(1))
            {
                patternsByDate.TryGetValue(day, out var dayPat);
                var effSched = (dayPat is not null && !dayPat.IsDayOff) ? (dayPat.WorkSchedule ?? emp.WorkSchedule) : emp.WorkSchedule;
                var isDayOff = (dayPat?.IsDayOff ?? false) || effSched?.Type == ScheduleType.Off;
                if (!isDayOff && effSched is not null) totalWorkingDays++;

                DateTime? first = null;
                DateTime? last = null;
                var dayLocal = day.ToDateTime(TimeOnly.MinValue);
                if (!string.IsNullOrEmpty(empKeyLower) && logsByEmpDay.TryGetValue((empKeyLower, dayLocal), out var stat))
                { first = stat.First; last = stat.Last; }
                if (corrByEmpDay.TryGetValue((emp.Id, dayLocal), out var corr))
                {
                    if (corr.CheckInUtc.HasValue) first = corr.CheckInUtc.Value;
                    if (corr.CheckOutUtc.HasValue) last = corr.CheckOutUtc.Value;
                }

                WorkScheduleShift? matched = null;
                if (effSched?.Type == ScheduleType.Multi && first.HasValue && effSched.Shifts.Any())
                {
                    var checkInLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(first.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
                    var checkInTime = checkInLocal.TimeOfDay;
                    var ordered = effSched.Shifts.OrderBy(s => s.SortOrder).ToList();
                    matched = ordered.FirstOrDefault(s => checkInTime <= s.ValidEntryTo) ?? ordered.LastOrDefault();
                }
                var shiftStart = matched is not null ? (TimeSpan?)matched.ShiftStart : effSched?.ShiftStart;
                var shiftEnd = matched is not null ? (TimeSpan?)matched.ShiftEnd : effSched?.ShiftEnd;
                var normHoursForDay = matched is not null ? (double)matched.RequiredHoursPerDay
                                    : (!isDayOff && effSched is not null ? (double)effSched.RequiredHoursPerDay : 0d);

                var effectiveFirst = first;
                if (first.HasValue && shiftStart is TimeSpan ss && effSched is { CountEarlyArrival: false })
                {
                    var firstLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(first.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
                    if (firstLocal.TimeOfDay < ss)
                    {
                        var clampedLocal = firstLocal.Date + ss;
                        effectiveFirst = TimeZoneInfo.ConvertTimeToUtc(clampedLocal, TimeZoneInfo.Local);
                    }
                }

                var hoursWorked = (effectiveFirst.HasValue && last.HasValue) ? (last.Value - effectiveFirst.Value).TotalHours : 0d;
                if (hoursWorked > 16) hoursWorked = normHoursForDay > 0 ? normHoursForDay : 8;
                if (hoursWorked > 0)
                {
                    workedDays++;
                    totalWorkedHours += hoursWorked;
                    if (normHoursForDay > 0)
                    {
                        var dailyOt = Math.Max(0, hoursWorked - normHoursForDay);
                        // Daily-порог из расписания.
                        if (effSched is { OvertimeDailyThresholdMinutes: > 0 }
                            && dailyOt * 60.0 < effSched.OvertimeDailyThresholdMinutes)
                        {
                            dailyOt = 0;
                        }
                        totalOvertimeHours += dailyOt;
                        if (dailyOt > 0) dailyOtList.Add(dailyOt);
                    }
                    if (shiftStart is TimeSpan ssLate && first.HasValue)
                    {
                        var firstLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(first.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
                        var lateMin = (firstLocal.TimeOfDay - ssLate).TotalMinutes;
                        if (lateMin > 0) { totalLatenessMinutes += lateMin; latenessDaysCount++; }
                    }
                    if (shiftEnd is TimeSpan ssEnd && last.HasValue)
                    {
                        var lastLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(last.Value, DateTimeKind.Utc), TimeZoneInfo.Local);
                        var earlyMin = (ssEnd - lastLocal.TimeOfDay).TotalMinutes;
                        if (earlyMin > 0) { totalEarlyLeaveMinutes += earlyMin; earlyLeaveDaysCount++; }
                    }
                }
            }

            if (leavesByEmp.TryGetValue(emp.Id, out var empLeaves))
            {
                foreach (var lv in empLeaves)
                {
                    for (var d = lv.StartDate; d <= lv.EndDate; d = d.AddDays(1))
                    {
                        if (d < rangeStart || d > rangeEnd) continue;
                        patternsByDate.TryGetValue(d, out var dp);
                        var effSched = (dp is not null && !dp.IsDayOff) ? (dp.WorkSchedule ?? emp.WorkSchedule) : emp.WorkSchedule;
                        var dayOff = (dp?.IsDayOff ?? false) || effSched?.Type == ScheduleType.Off;
                        if (dayOff || effSched is null) continue;
                        var dayLocal = d.ToDateTime(TimeOnly.MinValue);
                        if (logsByEmpDay.ContainsKey((empKeyLower, dayLocal))) continue;
                        workedDays++;
                        var dayNorm = (double)effSched.RequiredHoursPerDay;
                        totalWorkedHours += dayNorm > 0 ? dayNorm : 8;
                    }
                }
            }

            var absentDays = Math.Max(0, totalWorkingDays - workedDays);
            result.Add(new EmpAttendanceTotals(emp.Id, workedDays, totalWorkedHours, totalOvertimeHours, totalLatenessMinutes, latenessDaysCount, totalEarlyLeaveMinutes, earlyLeaveDaysCount, absentDays, totalWorkingDays, dailyOtList));
        }

        return result;
    }
}
public sealed record CalculatePayrollRequest(decimal TaxRate, string? Mode = null);
// Mode: "Full" (default) — base + overtime + components; "OvertimeOnly" — только overtime; "NoOvertime" — без overtime
public sealed record NoteRequest(string? Note);
public sealed record CreateLeaveRequest(Guid EmployeeId, string LeaveType, bool IsPaid, DateOnly StartDate, DateOnly EndDate, string? Reason, string? Notes);
public sealed record UpdateLeaveRequest(string LeaveType, bool IsPaid, DateOnly StartDate, DateOnly EndDate, string? Reason, string? Notes);
public sealed record VaultSecondaryDbRequest(string? ConnectionString);
public sealed record SmtpSettingsRequest(bool Enabled, string? Host, int Port, string? Username, string? Password, string? FromAddress, string? FromName, bool EnableSsl);
public sealed record EmailTemplateUpdateRequest(string Subject, string HtmlBody);
public sealed record EmailTemplatePreviewRequest(string? Subject, string? HtmlBody);
public sealed record SendAttendanceReportRequest(string To, DateOnly From, DateOnly To2);
public sealed record SendPayrollReportRequest(string To);

public sealed class DeviceStatusBroadcaster(IHubContext<DevicesHub> hub, INotificationService notificationService) : IDeviceStatusBroadcaster
{
    public async Task NotifyStatusChangedAsync(Guid deviceId, string deviceIdentifier, string status, DateTime? lastSeenUtc, string? statusMessage = null, CancellationToken cancellationToken = default)
    {
        await hub.Clients.All.SendAsync("DeviceStatusChanged", new DeviceStatusResponse(deviceId, deviceIdentifier, status, lastSeenUtc, statusMessage), cancellationToken);

        if (status == "offline")
            _ = notificationService.CreateAsync(
                NotificationTypes.DeviceOffline,
                "Устройство недоступно",
                $"Устройство «{deviceIdentifier}» потеряло связь.",
                referenceId: deviceId.ToString(),
                ct: cancellationToken);
    }
}

public sealed class DeviceActivityBroadcaster(IHubContext<DevicesHub> hub) : IDeviceActivityBroadcaster
{
    public Task NotifyLiveEventAsync(DeviceEvent deviceEvent, CancellationToken cancellationToken = default) =>
        hub.Clients.All.SendAsync("LiveDeviceEvent", deviceEvent, cancellationToken);

    public Task NotifyPersonSyncProgressAsync(
        string syncId,
        string stage,
        int current,
        int total,
        Guid deviceId,
        string deviceName,
        string? message,
        CancellationToken cancellationToken = default) =>
        hub.Clients.All.SendAsync(
            "PersonSyncProgress",
            new { syncId, stage, current, total, deviceId, deviceName, message },
            cancellationToken);
}

[Microsoft.AspNetCore.Authorization.Authorize]
public sealed class DevicesHub : Hub
{
    private readonly IDeviceDiscoveryService _discovery;

    public DevicesHub(IDeviceDiscoveryService discovery)
    {
        _discovery = discovery;
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    /// <summary>Запуск streaming discovery: устройства отправляются по мере обнаружения через DeviceFound, по завершении — DiscoveryComplete.</summary>
    public async Task StartDiscovery()
    {
        var cancellationToken = Context.ConnectionAborted;
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(60));

        var count = 0;
        await _discovery.DiscoverStreamAsync(async (device, ct) =>
        {
            await Clients.Caller.SendAsync("DeviceFound", device, ct);
            count++;
        }, cts.Token);

        await Clients.Caller.SendAsync("DiscoveryComplete", count, cancellationToken);
    }
}
