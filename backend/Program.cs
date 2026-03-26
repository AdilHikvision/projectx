using System.Globalization;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;
using Backend.Application.Security;
using Backend.Application.Devices;
using Backend.Domain.Entities;
using Backend.Infrastructure;
using Backend.Infrastructure.Devices;
using Backend.Infrastructure.Devices.Sdk;
using Backend.Infrastructure.Identity;
using Backend.Infrastructure.Persistence;
using Backend.Infrastructure.System;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Options;
using Serilog;

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
    loggerConfiguration.ReadFrom.Configuration(context.Configuration).WriteTo.Console();
});

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5154", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5154")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.Services.AddSignalR().AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});
builder.Services.AddSingleton<IDeviceStatusBroadcaster, DeviceStatusBroadcaster>();
builder.Services.AddSingleton<IDeviceActivityBroadcaster, DeviceActivityBroadcaster>();
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
    UserManager<ApplicationUser> userManager,
    IJwtTokenService tokenService,
    ILogger<Program> logger) =>
{
    try
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        var passwordValid = await userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordValid)
        {
            return Results.Unauthorized();
        }

        var roles = await userManager.GetRolesAsync(user);
        var token = tokenService.CreateToken(
            user.Id,
            user.UserName ?? user.Email ?? user.Id.ToString(),
            user.Email ?? string.Empty,
            roles.ToArray());

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
                roles
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
    var hasUsers = await userManager.Users.AnyAsync(cancellationToken);
    if (!hasUsers)
        return Results.Ok(new { required = true, email = "" });
    var adminWithSetup = await userManager.Users
        .Where(u => u.RequiresPasswordSetup)
        .Select(u => new { u.Email })
        .FirstOrDefaultAsync(cancellationToken);
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
    IHostEnvironment env,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Email))
        return Results.BadRequest(new { message = "Email is required." });

    var user = await userManager.FindByEmailAsync(request.Email.Trim());
    if (user is null)
        return Results.Ok(new { message = "If an account exists with this email, a reset link has been sent." });

    var token = await userManager.GeneratePasswordResetTokenAsync(user);
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

app.MapGet("/api/auth/me", (ClaimsPrincipal user) =>
{
    var id = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
    var email = user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email");
    var roles = user.FindAll(ClaimTypes.Role).Select(x => x.Value).ToArray();

    return Results.Ok(new { id, email, roles });
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapGet("/api/devices/{id:guid}/faces/capture/progress", async (
    Guid id,
    IDeviceFaceCaptureService captureService,
    CancellationToken cancellationToken) =>
{
    var progress = await captureService.GetProgressAsync(id, cancellationToken);
    return Results.Ok(new { progress.Status, progress.Progress, progress.Message, progress.FaceId });
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapGet("/api/devices/{id:guid}/cards/capture/progress", async (
    Guid id,
    IDeviceCardCaptureService captureService,
    CancellationToken cancellationToken) =>
{
    var progress = await captureService.GetProgressAsync(id, cancellationToken);
    return Results.Ok(new { progress.Status, progress.Message, progress.CardId });
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapGet("/api/devices/{id:guid}/fingerprints/capture/progress", async (
    Guid id,
    IDeviceFingerprintCaptureService captureService,
    CancellationToken cancellationToken) =>
{
    var progress = await captureService.GetProgressAsync(id, cancellationToken);
    return Results.Ok(new { progress.Status, progress.Message, progress.FingerprintId });
}).RequireAuthorization();

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
        isSupportIrisInfo = payload.GetValueOrDefault("isSupportIrisInfo", false),
        isSupportEventCardLinkageCfg = payload.GetValueOrDefault("isSupportEventCardLinkageCfg", false),
        isSupportCardInfo = payload.GetValueOrDefault("isSupportCardInfo", false),
    };
    return Results.Json(result);
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapDelete("/api/access-levels/{id:guid}/doors/{deviceId:guid}/{doorIndex:int}", async (Guid id, Guid deviceId, int doorIndex, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var link = await dbContext.AccessLevelDoors.FirstOrDefaultAsync(x => x.AccessLevelId == id && x.DeviceId == deviceId && x.DoorIndex == doorIndex, cancellationToken);
    if (link is null)
        return Results.NotFound();
    dbContext.AccessLevelDoors.Remove(link);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapDelete("/api/access-levels/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.AccessLevels.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();

    dbContext.AccessLevels.Remove(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization();

// Companies
app.MapGet("/api/companies", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var list = await dbContext.Companies
        .AsNoTracking()
        .OrderBy(x => x.Name)
        .ToListAsync(cancellationToken);
    return Results.Ok(list.Select(x => new CompanyResponse(x.Id, x.Name, x.Description, x.CreatedUtc, x.UpdatedUtc)));
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapDelete("/api/companies/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Companies.Include(x => x.Departments).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null) return Results.NotFound();
    if (entity.Departments.Count > 0)
        return Results.BadRequest(new { message = "Cannot delete company with departments. Delete or move them first." });

    dbContext.Companies.Remove(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapGet("/api/departments/tree", async (Guid? companyId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.Departments.AsNoTracking().AsQueryable();
    if (companyId.HasValue) query = query.Where(x => x.CompanyId == companyId);

    var list = await query.OrderBy(x => x.SortOrder).ThenBy(x => x.Name).ToListAsync(cancellationToken);
    var empCounts = await dbContext.Employees.Where(e => e.DepartmentId != null).GroupBy(e => e.DepartmentId).Select(g => new { g.Key, C = g.Count() }).ToListAsync(cancellationToken);
    var visCounts = await dbContext.Visitors.Where(v => v.DepartmentId != null).GroupBy(v => v.DepartmentId).Select(g => new { g.Key, C = g.Count() }).ToListAsync(cancellationToken);
    var items = list.Select(d => new DepartmentTreeItem(d.Id, d.Name, d.Description, d.SortOrder, d.ParentId, d.CompanyId, empCounts.FirstOrDefault(c => c.Key == d.Id)?.C ?? 0, visCounts.FirstOrDefault(c => c.Key == d.Id)?.C ?? 0)).ToList();
    return Results.Ok(items);
}).RequireAuthorization();

app.MapGet("/api/departments/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Departments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();
    return Results.Ok(new DepartmentResponse(entity.Id, entity.Name, entity.Description, entity.SortOrder, entity.ParentId, entity.CompanyId, 0, 0, 0));
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapGet("/api/employees/next-personnel-number", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    return Results.Ok(new { nextPersonnelNumber = await GetNextPersonIdAsync(dbContext, cancellationToken) });
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapPut("/api/employees/{id:guid}", async (Guid id, UpdateEmployeeRequest request, AppDbContext dbContext, IDevicePersonSyncService syncService, UserManager<ApplicationUser> userManager, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Employees
        .Include(e => e.AccessLevels)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();

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
                EmployeeId = entity.Id
            };
            var createResult = await userManager.CreateAsync(newUser, tempPassword);
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(newUser, SystemRoles.Employee);
                selfServiceTempPassword = tempPassword;
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
    var syncWarnings = new List<string>();
    var devices = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    // Sync employee + credentials (face, fingerprints, cards) to devices from access levels
    var empFaces = await dbContext.Faces.Where(f => f.EmployeeId == id).ToListAsync(cancellationToken);
    var empFingerprints = await dbContext.Fingerprints.Where(f => f.EmployeeId == id).ToListAsync(cancellationToken);
    var empCards = await dbContext.Cards.Where(c => c.EmployeeId == id).ToListAsync(cancellationToken);
    foreach (var deviceId in deviceIds)
    {
        var result = await syncService.SyncEmployeeAsync(id, deviceId, cancellationToken);
        if (!result.Success && devices.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Устройство \"{dev.Name}\": {result.Message}");
            logger.LogWarning("Синхронизация сотрудника {EmployeeId} на устройство {DeviceId}: {Message}", id, deviceId, result.Message);
        }
        foreach (var face in empFaces)
        {
            var fr = await syncService.SyncFaceAsync(face.Id, deviceId, cancellationToken);
            if (!fr.Success && devices.TryGetValue(deviceId, out var d))
                syncWarnings.Add($"Лицо → \"{d.Name}\": {fr.Message}");
        }
        foreach (var fp in empFingerprints)
        {
            var fr = await syncService.SyncFingerprintAsync(fp.Id, deviceId, cancellationToken);
            if (!fr.Success && devices.TryGetValue(deviceId, out var d))
                syncWarnings.Add($"Отпечаток → \"{d.Name}\": {fr.Message}");
        }
        foreach (var card in empCards)
        {
            var cr = await syncService.SyncCardAsync(card.Id, deviceId, cancellationToken);
            if (!cr.Success && devices.TryGetValue(deviceId, out var d))
                syncWarnings.Add($"Карта → \"{d.Name}\": {cr.Message}");
        }
    }

    var updated = await dbContext.Employees
        .Include(e => e.AccessLevels).ThenInclude(a => a.AccessLevel)
        .Include(e => e.Department)
        .Include(e => e.WorkSchedule)
        .Include(e => e.Cards).Include(e => e.Faces).Include(e => e.Fingerprints).Include(e => e.Irises)
        .FirstAsync(x => x.Id == id, cancellationToken);
    var updatedResp = MapEmployeeDetailResponse(updated);
    return Results.Ok(new { updatedResp.Id, updatedResp.FirstName, updatedResp.LastName, updatedResp.EmployeeNo, updatedResp.Gender, updatedResp.ValidFromUtc, updatedResp.ValidToUtc, updatedResp.IsActive, updatedResp.OnlyVerify, updatedResp.Department, updatedResp.CompanyId, updatedResp.AccessLevels, updatedResp.Cards, updatedResp.Faces, updatedResp.Fingerprints, updatedResp.Irises, updatedResp.SelfServiceEnabled, updatedResp.SelfServiceEmail, updatedResp.WorkScheduleId, updatedResp.WorkScheduleName, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null, selfServiceTempPassword });
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapPost("/api/employees/{id:guid}/sync", async (Guid id, SyncToDevicesRequest request, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var results = new List<object>();
    foreach (var deviceId in request.DeviceIds ?? [])
    {
        var result = await syncService.SyncEmployeeAsync(id, deviceId, cancellationToken);
        results.Add(new { deviceId, success = result.Success, message = result.Message });
    }
    return Results.Ok(results);
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapGet("/api/visitors/next-document-number", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    return Results.Ok(new { nextDocumentNumber = await GetNextPersonIdAsync(dbContext, cancellationToken) });
}).RequireAuthorization();

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
}).RequireAuthorization();

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
    }

    var created = await dbContext.Visitors
        .Include(v => v.AccessLevels).ThenInclude(a => a.AccessLevel)
        .Include(v => v.Department)
        .Include(v => v.Cards).Include(v => v.Faces).Include(v => v.Fingerprints).Include(v => v.Irises)
        .FirstAsync(x => x.Id == entity.Id, cancellationToken);
    var createdResp = MapVisitorDetailResponse(created);
    return Results.Created($"/api/visitors/{entity.Id}", new { createdResp.Id, createdResp.FirstName, createdResp.LastName, createdResp.DocumentNumber, createdResp.ValidFromUtc, createdResp.ValidToUtc, createdResp.IsActive, createdResp.Department, createdResp.CompanyId, createdResp.AccessLevels, createdResp.Cards, createdResp.Faces, createdResp.Fingerprints, createdResp.Irises, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
}).RequireAuthorization();

app.MapPut("/api/visitors/{id:guid}", async (Guid id, UpdateVisitorRequest request, AppDbContext dbContext, IDevicePersonSyncService syncService, ILogger<Program> logger, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.Visitors
        .Include(v => v.AccessLevels)
        .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null)
        return Results.NotFound();

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
    var syncWarnings = new List<string>();
    var devices = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    // Sync visitor + credentials (face, fingerprints, cards) to devices from access levels
    var visFaces = await dbContext.Faces.Where(f => f.VisitorId == id).ToListAsync(cancellationToken);
    var visFingerprints = await dbContext.Fingerprints.Where(f => f.VisitorId == id).ToListAsync(cancellationToken);
    var visCards = await dbContext.Cards.Where(c => c.VisitorId == id).ToListAsync(cancellationToken);
    foreach (var deviceId in deviceIds)
    {
        var result = await syncService.SyncVisitorAsync(id, deviceId, cancellationToken);
        if (!result.Success && devices.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Устройство \"{dev.Name}\": {result.Message}");
            logger.LogWarning("Синхронизация посетителя {VisitorId} на устройство {DeviceId}: {Message}", id, deviceId, result.Message);
        }
        foreach (var face in visFaces)
        {
            var fr = await syncService.SyncFaceAsync(face.Id, deviceId, cancellationToken);
            if (!fr.Success && devices.TryGetValue(deviceId, out var d))
                syncWarnings.Add($"Лицо → \"{d.Name}\": {fr.Message}");
        }
        foreach (var fp in visFingerprints)
        {
            var fr = await syncService.SyncFingerprintAsync(fp.Id, deviceId, cancellationToken);
            if (!fr.Success && devices.TryGetValue(deviceId, out var d))
                syncWarnings.Add($"Отпечаток → \"{d.Name}\": {fr.Message}");
        }
        foreach (var card in visCards)
        {
            var cr = await syncService.SyncCardAsync(card.Id, deviceId, cancellationToken);
            if (!cr.Success && devices.TryGetValue(deviceId, out var d))
                syncWarnings.Add($"Карта → \"{d.Name}\": {cr.Message}");
        }
    }

    var updated = await dbContext.Visitors
        .Include(v => v.AccessLevels).ThenInclude(a => a.AccessLevel)
        .Include(v => v.Department)
        .Include(v => v.Cards).Include(v => v.Faces).Include(v => v.Fingerprints).Include(v => v.Irises)
        .FirstAsync(x => x.Id == id, cancellationToken);
    var updatedResp = MapVisitorDetailResponse(updated);
    return Results.Ok(new { updatedResp.Id, updatedResp.FirstName, updatedResp.LastName, updatedResp.DocumentNumber, updatedResp.ValidFromUtc, updatedResp.ValidToUtc, updatedResp.IsActive, updatedResp.Department, updatedResp.CompanyId, updatedResp.AccessLevels, updatedResp.Cards, updatedResp.Faces, updatedResp.Fingerprints, updatedResp.Irises, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapPost("/api/visitors/{id:guid}/sync", async (Guid id, SyncToDevicesRequest request, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var results = new List<object>();
    foreach (var deviceId in request.DeviceIds ?? [])
    {
        var result = await syncService.SyncVisitorAsync(id, deviceId, cancellationToken);
        results.Add(new { deviceId, success = result.Success, message = result.Message });
    }
    return Results.Ok(results);
}).RequireAuthorization();

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
}).RequireAuthorization();

// Cards
app.MapGet("/api/cards", async (Guid? employeeId, Guid? visitorId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.Cards.AsNoTracking().Include(c => c.Employee).Include(c => c.Visitor).AsQueryable();
    if (employeeId.HasValue) query = query.Where(c => c.EmployeeId == employeeId);
    if (visitorId.HasValue) query = query.Where(c => c.VisitorId == visitorId);
    var list = await query.OrderBy(c => c.CardNo).ToListAsync(cancellationToken);
    return Results.Ok(list.Select(c => new CardRef(c.Id, c.CardNo, c.CardNumber)));
}).RequireAuthorization();

app.MapGet("/api/cards/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var c = await dbContext.Cards.AsNoTracking().Include(x => x.Employee).Include(x => x.Visitor).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (c is null) return Results.NotFound();
    return Results.Ok(new { c.Id, c.CardNo, c.CardNumber, EmployeeId = c.EmployeeId, VisitorId = c.VisitorId, c.CreatedUtc });
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapPut("/api/cards/{id:guid}", async (Guid id, UpdateCardRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var card = await dbContext.Cards.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (card is null) return Results.NotFound();
    if (!string.IsNullOrWhiteSpace(request.CardNumber))
        card.CardNumber = request.CardNumber.Trim();
    card.UpdatedUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { card.Id, card.CardNo, card.CardNumber });
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapPost("/api/cards/{id:guid}/sync", async (Guid id, SyncToDevicesRequest request, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var results = new List<object>();
    foreach (var deviceId in request.DeviceIds ?? [])
    {
        var result = await syncService.SyncCardAsync(id, deviceId, cancellationToken);
        results.Add(new { deviceId, success = result.Success, message = result.Message });
    }
    return Results.Ok(results);
}).RequireAuthorization();

// Faces
app.MapGet("/api/faces", async (Guid? employeeId, Guid? visitorId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.Faces.AsNoTracking().AsQueryable();
    if (employeeId.HasValue) query = query.Where(f => f.EmployeeId == employeeId);
    if (visitorId.HasValue) query = query.Where(f => f.VisitorId == visitorId);
    var list = await query.ToListAsync(cancellationToken);
    return Results.Ok(list.Select(f => new FaceRef(f.Id, f.FDID)));
}).RequireAuthorization();

app.MapGet("/api/faces/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var f = await dbContext.Faces.AsNoTracking().Include(x => x.Employee).Include(x => x.Visitor).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (f is null) return Results.NotFound();
    return Results.Ok(new { f.Id, f.FilePath, f.FDID, EmployeeId = f.EmployeeId, VisitorId = f.VisitorId, f.CreatedUtc });
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapPost("/api/faces/{id:guid}/sync", async (Guid id, SyncToDevicesRequest request, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var results = new List<object>();
    foreach (var deviceId in request.DeviceIds ?? [])
    {
        var result = await syncService.SyncFaceAsync(id, deviceId, cancellationToken);
        results.Add(new { deviceId, success = result.Success, message = result.Message });
    }
    return Results.Ok(results);
}).RequireAuthorization();

// Fingerprints
app.MapGet("/api/fingerprints", async (Guid? employeeId, Guid? visitorId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.Fingerprints.AsNoTracking().AsQueryable();
    if (employeeId.HasValue) query = query.Where(f => f.EmployeeId == employeeId);
    if (visitorId.HasValue) query = query.Where(f => f.VisitorId == visitorId);
    var list = await query.ToListAsync(cancellationToken);
    return Results.Ok(list.Select(f => new FingerprintRef(f.Id, f.FingerIndex)));
}).RequireAuthorization();

app.MapGet("/api/fingerprints/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var f = await dbContext.Fingerprints.AsNoTracking().Include(x => x.Employee).Include(x => x.Visitor).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (f is null) return Results.NotFound();
    return Results.Ok(new { f.Id, f.FingerIndex, EmployeeId = f.EmployeeId, VisitorId = f.VisitorId, f.CreatedUtc });
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapDelete("/api/irises/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var iris = await dbContext.Irises.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (iris is null) return Results.NotFound();
    dbContext.Irises.Remove(iris);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization();

app.MapPost("/api/fingerprints/{id:guid}/sync", async (Guid id, SyncToDevicesRequest request, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var results = new List<object>();
    foreach (var deviceId in request.DeviceIds ?? [])
    {
        var result = await syncService.SyncFingerprintAsync(id, deviceId, cancellationToken);
        results.Add(new { deviceId, success = result.Success, message = result.Message });
    }
    return Results.Ok(results);
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

// ─── Work Schedules ───────────────────────────────────────────────────────────

app.MapGet("/api/work-schedules", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var schedules = await dbContext.WorkSchedules.AsNoTracking()
        .OrderBy(s => s.Name)
        .Select(s => new WorkScheduleResponse(s.Id, s.Name, s.Type.ToString(), s.ShiftStart, s.ShiftEnd, s.RequiredHoursPerDay, s.CreatedUtc))
        .ToListAsync(cancellationToken);
    return Results.Ok(schedules);
}).RequireAuthorization();

app.MapGet("/api/work-schedules/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var s = await dbContext.WorkSchedules.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (s is null) return Results.NotFound();
    return Results.Ok(new WorkScheduleResponse(s.Id, s.Name, s.Type.ToString(), s.ShiftStart, s.ShiftEnd, s.RequiredHoursPerDay, s.CreatedUtc));
}).RequireAuthorization();

app.MapPost("/api/work-schedules", async (CreateWorkScheduleRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    if (!Enum.TryParse<ScheduleType>(request.Type, true, out var scheduleType))
        return Results.BadRequest(new { message = "Неверный тип расписания. Допустимые значения: Standard, Shift, Flexible." });
    var entity = new WorkSchedule
    {
        Name = request.Name.Trim(),
        Type = scheduleType,
        ShiftStart = request.ShiftStart,
        ShiftEnd = request.ShiftEnd,
        RequiredHoursPerDay = request.RequiredHoursPerDay ?? 8m
    };
    dbContext.WorkSchedules.Add(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Created($"/api/work-schedules/{entity.Id}", new WorkScheduleResponse(entity.Id, entity.Name, entity.Type.ToString(), entity.ShiftStart, entity.ShiftEnd, entity.RequiredHoursPerDay, entity.CreatedUtc));
}).RequireAuthorization();

app.MapPut("/api/work-schedules/{id:guid}", async (Guid id, CreateWorkScheduleRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.WorkSchedules.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null) return Results.NotFound();
    if (!Enum.TryParse<ScheduleType>(request.Type, true, out var scheduleType))
        return Results.BadRequest(new { message = "Неверный тип расписания." });
    entity.Name = request.Name.Trim();
    entity.Type = scheduleType;
    entity.ShiftStart = request.ShiftStart;
    entity.ShiftEnd = request.ShiftEnd;
    entity.RequiredHoursPerDay = request.RequiredHoursPerDay ?? 8m;
    entity.UpdatedUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new WorkScheduleResponse(entity.Id, entity.Name, entity.Type.ToString(), entity.ShiftStart, entity.ShiftEnd, entity.RequiredHoursPerDay, entity.CreatedUtc));
}).RequireAuthorization();

app.MapDelete("/api/work-schedules/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.WorkSchedules.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (entity is null) return Results.NotFound();
    dbContext.WorkSchedules.Remove(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

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
}).RequireAuthorization();

// ─── Attendance Requests ───────────────────────────────────────────────────────

app.MapGet("/api/attendance-requests", async (Guid? employeeId, string? status, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.AttendanceRequests.AsNoTracking()
        .Include(r => r.Employee)
        .AsQueryable();
    if (employeeId.HasValue) query = query.Where(r => r.EmployeeId == employeeId.Value);
    if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<AttendanceRequestStatus>(status, true, out var statusEnum))
        query = query.Where(r => r.Status == statusEnum);
    var items = await query.OrderByDescending(r => r.CreatedUtc)
        .Select(r => new AttendanceRequestResponse(r.Id, r.EmployeeId, r.Employee.FirstName + " " + r.Employee.LastName, r.Type.ToString(), r.RequestedTimeUtc, r.RequestedEndTimeUtc, r.Comment, r.Status.ToString(), r.ReviewedByUserId, r.ReviewedAtUtc, r.ReviewComment, r.CreatedUtc))
        .ToListAsync(cancellationToken);
    return Results.Ok(items);
}).RequireAuthorization();

app.MapPost("/api/attendance-requests", async (CreateAttendanceRequestBody request, AppDbContext dbContext, ClaimsPrincipal user, UserManager<ApplicationUser> userManager, CancellationToken cancellationToken) =>
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
    return Results.Created($"/api/attendance-requests/{entity.Id}", new { entity.Id, entity.EmployeeId, entity.Type, entity.RequestedTimeUtc, entity.Status });
}).RequireAuthorization();

app.MapPut("/api/attendance-requests/{id:guid}/approve", async (Guid id, ReviewAttendanceRequestBody? request, AppDbContext dbContext, ClaimsPrincipal user, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.AttendanceRequests.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    if (entity is null) return Results.NotFound();
    if (entity.Status != AttendanceRequestStatus.Pending)
        return Results.BadRequest(new { message = "Заявка уже обработана." });

    Guid? reviewerId = Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var rv) ? rv : null;
    entity.Status = AttendanceRequestStatus.Approved;
    entity.ReviewedByUserId = reviewerId;
    entity.ReviewedAtUtc = DateTime.UtcNow;
    entity.ReviewComment = request?.Comment;
    entity.UpdatedUtc = DateTime.UtcNow;

    var eventType = entity.Type == AttendanceRequestType.CheckOut ? AttendanceEventType.Out : AttendanceEventType.In;
    var alreadyExists = await dbContext.AttendanceRecords.AnyAsync(r => r.EmployeeId == entity.EmployeeId && r.EventTimeUtc == entity.RequestedTimeUtc, cancellationToken);
    if (!alreadyExists)
    {
        dbContext.AttendanceRecords.Add(new AttendanceRecord
        {
            EmployeeId = entity.EmployeeId,
            EventTimeUtc = entity.RequestedTimeUtc,
            EventType = eventType,
            Source = "manual"
        });
    }
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { entity.Id, entity.Status, entity.ReviewedAtUtc });
}).RequireAuthorization();

app.MapPut("/api/attendance-requests/{id:guid}/reject", async (Guid id, ReviewAttendanceRequestBody? request, AppDbContext dbContext, ClaimsPrincipal user, CancellationToken cancellationToken) =>
{
    var entity = await dbContext.AttendanceRequests.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
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
    return Results.Ok(new { entity.Id, entity.Status, entity.ReviewedAtUtc });
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
    return Results.Ok(new { token, employeeId = user.EmployeeId });
});

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
        .Select(r => new AttendanceRequestResponse(r.Id, r.EmployeeId, "", r.Type.ToString(), r.RequestedTimeUtc, r.RequestedEndTimeUtc, r.Comment, r.Status.ToString(), r.ReviewedByUserId, r.ReviewedAtUtc, r.ReviewComment, r.CreatedUtc))
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
        return Results.BadRequest(new { message = "Неверный тип заявки." });

    var entity = new AttendanceRequest
    {
        EmployeeId = appUser.EmployeeId.Value,
        Type = reqType,
        RequestedTimeUtc = request.RequestedTimeUtc.ToUniversalTime(),
        RequestedEndTimeUtc = request.RequestedEndTimeUtc?.ToUniversalTime(),
        Comment = request.Comment,
        Status = AttendanceRequestStatus.Pending
    };
    dbContext.AttendanceRequests.Add(entity);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Created($"/api/self-service/requests/{entity.Id}", new { entity.Id, entity.Type, entity.RequestedTimeUtc, entity.Status });
}).RequireAuthorization();

var indexHtmlPath = Path.Combine(app.Environment.WebRootPath ?? string.Empty, "index.html");
if (File.Exists(indexHtmlPath))
{
    app.MapFallbackToFile("index.html");
}

app.Run();

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
        accessNames, dept, e.CompanyId, primaryFaceId, e.Cards?.Count ?? 0, e.Faces?.Count ?? 0, e.Fingerprints?.Count ?? 0, e.Irises?.Count ?? 0);
}

static EmployeeDetailResponse MapEmployeeDetailResponse(Employee e)
{
    var dept = e.Department != null ? new DepartmentRef(e.Department.Id, e.Department.Name) : null;
    var accessLevels = (e.AccessLevels ?? []).Where(a => a.AccessLevel != null).Select(a => new AccessLevelRef(a.AccessLevel!.Id, a.AccessLevel.Name)).ToArray();
    var cards = (e.Cards ?? []).Select(c => new CardRef(c.Id, c.CardNo, c.CardNumber)).ToArray();
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
    var cards = (v.Cards ?? []).Select(c => new CardRef(c.Id, c.CardNo, c.CardNumber)).ToArray();
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
public sealed record CreateEmployeeRequest(string FirstName, string LastName, string? Gender, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool? OnlyVerify, Guid[]? AccessLevelIds, Guid? DepartmentId, Guid? CompanyId);
public sealed record UpdateEmployeeRequest(string FirstName, string LastName, string? Gender, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool? IsActive, bool? OnlyVerify, Guid[]? AccessLevelIds, Guid? DepartmentId, Guid? CompanyId, bool? SelfServiceEnabled, string? SelfServiceEmail, Guid? WorkScheduleId);
public sealed record CreateVisitorRequest(string FirstName, string LastName, string? DocumentNumber, DateTime? ValidFromUtc, DateTime? ValidToUtc, Guid[]? AccessLevelIds, Guid? DepartmentId, Guid? CompanyId);
public sealed record UpdateVisitorRequest(string FirstName, string LastName, string? DocumentNumber, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool? IsActive, Guid[]? AccessLevelIds, Guid? DepartmentId, Guid? CompanyId);
public sealed record SyncToDevicesRequest(Guid[]? DeviceIds);

public sealed record CaptureFaceRequest(string? PersonId, string? PersonType);
public sealed record CaptureFingerprintRequest(string? PersonId, string? PersonType, int FingerIndex);

public sealed record ImportFromDevicesRequest(Guid[]? DeviceIds, Guid? CompanyId);
public sealed record DepartmentRef(Guid Id, string Name);
public sealed record EmployeeResponse(Guid Id, string FirstName, string LastName, string? EmployeeNo, string? Gender, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool IsActive, bool OnlyVerify, string[] AccessLevelNames, DepartmentRef? Department, Guid? CompanyId, Guid? PrimaryFaceId, int CardsCount, int FacesCount, int FingerprintsCount, int IrisesCount);
public sealed record EmployeeDetailResponse(Guid Id, string FirstName, string LastName, string? EmployeeNo, string? Gender, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool IsActive, bool OnlyVerify, DepartmentRef? Department, Guid? CompanyId, AccessLevelRef[] AccessLevels, CardRef[] Cards, FaceRef[] Faces, FingerprintRef[] Fingerprints, IrisRef[] Irises, bool SelfServiceEnabled = false, string? SelfServiceEmail = null, Guid? WorkScheduleId = null, string? WorkScheduleName = null);
public sealed record VisitorResponse(Guid Id, string FirstName, string LastName, string? DocumentNumber, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool IsActive, string[] AccessLevelNames, DepartmentRef? Department, Guid? CompanyId, Guid? PrimaryFaceId, int CardsCount, int FacesCount, int FingerprintsCount, int IrisesCount);
public sealed record VisitorDetailResponse(Guid Id, string FirstName, string LastName, string? DocumentNumber, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool IsActive, DepartmentRef? Department, Guid? CompanyId, AccessLevelRef[] AccessLevels, CardRef[] Cards, FaceRef[] Faces, FingerprintRef[] Fingerprints, IrisRef[] Irises);
public sealed record AccessLevelRef(Guid Id, string Name);
public sealed record CardRef(Guid Id, string CardNo, string? CardNumber);
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
public sealed record WorkScheduleResponse(Guid Id, string Name, string Type, TimeSpan? ShiftStart, TimeSpan? ShiftEnd, decimal RequiredHoursPerDay, DateTime CreatedUtc);
public sealed record CreateWorkScheduleRequest(string Name, string Type, TimeSpan? ShiftStart, TimeSpan? ShiftEnd, decimal? RequiredHoursPerDay);
public sealed record AttendanceRecordResponse(Guid Id, Guid EmployeeId, string EmployeeName, DateTime EventTimeUtc, string EventType, Guid? DeviceId, string Source, DateTime CreatedUtc);
public sealed record AttendanceRequestResponse(Guid Id, Guid EmployeeId, string EmployeeName, string Type, DateTime RequestedTimeUtc, DateTime? RequestedEndTimeUtc, string? Comment, string Status, Guid? ReviewedByUserId, DateTime? ReviewedAtUtc, string? ReviewComment, DateTime CreatedUtc);
public sealed record CreateAttendanceRequestBody(string Type, DateTime RequestedTimeUtc, DateTime? RequestedEndTimeUtc, string? Comment, Guid? EmployeeId);
public sealed record ReviewAttendanceRequestBody(string? Comment);
public sealed record SelfServiceLoginRequest(string Email, string Password);

public sealed class DeviceStatusBroadcaster(IHubContext<DevicesHub> hub) : IDeviceStatusBroadcaster
{
    public async Task NotifyStatusChangedAsync(Guid deviceId, string deviceIdentifier, string status, DateTime? lastSeenUtc, string? statusMessage = null, CancellationToken cancellationToken = default)
    {
        await hub.Clients.All.SendAsync("DeviceStatusChanged", new DeviceStatusResponse(deviceId, deviceIdentifier, status, lastSeenUtc, statusMessage), cancellationToken);
    }
}

public sealed class DeviceActivityBroadcaster(IHubContext<DevicesHub> hub) : IDeviceActivityBroadcaster
{
    public Task NotifyLiveEventAsync(DeviceEvent deviceEvent, CancellationToken cancellationToken = default) =>
        hub.Clients.All.SendAsync("LiveDeviceEvent", deviceEvent, cancellationToken);
}

public sealed class DevicesHub : Hub
{
    private readonly IDeviceDiscoveryService _discovery;

    public DevicesHub(IDeviceDiscoveryService discovery)
    {
        _discovery = discovery;
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
