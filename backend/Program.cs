using System.Net;
using System.Security.Claims;
using System.Text;
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
builder.Services.AddSignalR();
builder.Services.AddSingleton<IDeviceStatusBroadcaster, DeviceStatusBroadcaster>();
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
        _ => (DoorControlAction?)null
    };
    if (action is null)
        return Results.BadRequest(new { message = "Action must be one of: open, close, alwaysOpen, alwaysClose." });

    var (success, message) = await doorControlService.ControlDoorAsync(deviceId, doorIndex, action.Value, cancellationToken);
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
        x.Doors.Select(d => new AccessLevelDoorDto(d.DeviceId, d.Device?.Name ?? "", d.DoorIndex)).ToList()));
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
    var doors = entity.Doors.Select(d => new AccessLevelDoorDto(d.DeviceId, d.Device?.Name ?? "", d.DoorIndex)).ToList();
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
        doors.Select(d => new AccessLevelDoorDto(d.DeviceId, d.Device?.Name ?? "", d.DoorIndex)).ToList()));
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
        .Include(e => e.Cards)
        .Include(e => e.Faces)
        .Include(e => e.Fingerprints)
        .AsQueryable();
    if (isActive.HasValue)
        query = query.Where(e => e.IsActive == isActive.Value);
    if (!string.IsNullOrWhiteSpace(search))
    {
        var s = search.Trim().ToLower();
        query = query.Where(e =>
            (e.FirstName != null && e.FirstName.ToLower().Contains(s)) ||
            (e.LastName != null && e.LastName.ToLower().Contains(s)) ||
            (e.PersonnelNumber != null && e.PersonnelNumber.ToLower().Contains(s)));
    }
    var list = await query.OrderBy(e => e.LastName).ThenBy(e => e.FirstName).ToListAsync(cancellationToken);
    return Results.Ok(list.Select(MapEmployeeResponse));
}).RequireAuthorization();

app.MapGet("/api/employees/next-personnel-number", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var numbers = await dbContext.Employees
        .Where(x => x.PersonnelNumber != null && x.PersonnelNumber != "")
        .Select(x => x.PersonnelNumber!)
        .ToListAsync(cancellationToken);
    var max = 0;
    foreach (var n in numbers)
    {
        if (int.TryParse(n.Trim(), out var val) && val > max)
            max = val;
    }
    return Results.Ok(new { nextPersonnelNumber = (max + 1).ToString() });
}).RequireAuthorization();

app.MapGet("/api/employees/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var e = await dbContext.Employees
        .AsNoTracking()
        .Include(x => x.AccessLevels)
        .ThenInclude(a => a.AccessLevel)
        .Include(x => x.Cards)
        .Include(x => x.Faces)
        .Include(x => x.Fingerprints)
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

    var personnelNumber = string.IsNullOrWhiteSpace(request.PersonnelNumber) ? null : request.PersonnelNumber.Trim();
    if (personnelNumber == null)
    {
        var numbers = await dbContext.Employees
            .Where(x => x.PersonnelNumber != null && x.PersonnelNumber != "")
            .Select(x => x.PersonnelNumber!)
            .ToListAsync(cancellationToken);
        var max = 0;
        foreach (var n in numbers)
        {
            if (int.TryParse(n.Trim(), out var val) && val > max)
                max = val;
        }
        personnelNumber = (max + 1).ToString();
    }
    else
    {
        var exists = await dbContext.Employees.AnyAsync(x => x.PersonnelNumber == personnelNumber, cancellationToken);
        if (exists)
            return Results.Conflict(new { message = "Сотрудник с таким табельным номером уже существует." });
    }

    var employeeNo = string.IsNullOrWhiteSpace(request.EmployeeNo) ? personnelNumber : request.EmployeeNo.Trim();
    if (employeeNo != null)
    {
        var exists = await dbContext.Employees.AnyAsync(x => x.EmployeeNo == employeeNo, cancellationToken);
        if (exists)
            return Results.Conflict(new { message = "Сотрудник с таким Employee ID уже существует." });
    }

    // По умолчанию: с сегодняшней даты до 31 дек 2037
    var defaultValidFrom = DateTime.UtcNow.Date;
    var defaultValidTo = new DateTime(2037, 12, 31, 23, 59, 59, DateTimeKind.Utc);
    var entity = new Employee
    {
        Id = Guid.NewGuid(),
        FirstName = firstName,
        LastName = lastName,
        PersonnelNumber = personnelNumber,
        EmployeeNo = employeeNo ?? personnelNumber,
        Gender = string.IsNullOrWhiteSpace(request.Gender) ? null : request.Gender.Trim().ToLowerInvariant(),
        ValidFromUtc = request.ValidFromUtc ?? defaultValidFrom,
        ValidToUtc = request.ValidToUtc ?? defaultValidTo,
        IsActive = true,
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
        .Include(e => e.Cards).Include(e => e.Faces).Include(e => e.Fingerprints)
        .FirstAsync(x => x.Id == entity.Id, cancellationToken);
    var createdResp = MapEmployeeDetailResponse(created);
    return Results.Created($"/api/employees/{entity.Id}", new { createdResp.Id, createdResp.FirstName, createdResp.LastName, createdResp.PersonnelNumber, createdResp.EmployeeNo, createdResp.Gender, createdResp.ValidFromUtc, createdResp.ValidToUtc, createdResp.IsActive, createdResp.AccessLevels, createdResp.Cards, createdResp.Faces, createdResp.Fingerprints, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
}).RequireAuthorization();

app.MapPut("/api/employees/{id:guid}", async (Guid id, UpdateEmployeeRequest request, AppDbContext dbContext, IDevicePersonSyncService syncService, ILogger<Program> logger, CancellationToken cancellationToken) =>
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

    var personnelNumber = string.IsNullOrWhiteSpace(request.PersonnelNumber) ? null : request.PersonnelNumber.Trim();
    if (personnelNumber != null)
    {
        var exists = await dbContext.Employees.AnyAsync(x => x.Id != id && x.PersonnelNumber == personnelNumber, cancellationToken);
        if (exists)
            return Results.Conflict(new { message = "Сотрудник с таким табельным номером уже существует." });
    }

    var employeeNo = request.EmployeeNo != null ? (string.IsNullOrWhiteSpace(request.EmployeeNo) ? null : request.EmployeeNo.Trim()) : entity.EmployeeNo;
    if (employeeNo != null)
    {
        var exists = await dbContext.Employees.AnyAsync(x => x.Id != id && x.EmployeeNo == employeeNo, cancellationToken);
        if (exists)
            return Results.Conflict(new { message = "Сотрудник с таким Employee ID уже существует." });
    }

    entity.FirstName = firstName;
    entity.LastName = lastName;
    entity.PersonnelNumber = personnelNumber;
    if (request.EmployeeNo != null) entity.EmployeeNo = employeeNo ?? personnelNumber;
    if (request.Gender != null) entity.Gender = string.IsNullOrWhiteSpace(request.Gender) ? null : request.Gender.Trim().ToLowerInvariant();
    entity.ValidFromUtc = request.ValidFromUtc;
    entity.ValidToUtc = request.ValidToUtc;
    if (request.IsActive.HasValue) entity.IsActive = request.IsActive.Value;
    entity.UpdatedUtc = DateTime.UtcNow;

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
    foreach (var deviceId in deviceIds)
    {
        var result = await syncService.SyncEmployeeAsync(id, deviceId, cancellationToken);
        if (!result.Success && devices.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Устройство \"{dev.Name}\": {result.Message}");
            logger.LogWarning("Синхронизация сотрудника {EmployeeId} на устройство {DeviceId}: {Message}", id, deviceId, result.Message);
        }
    }

    var updated = await dbContext.Employees
        .Include(e => e.AccessLevels).ThenInclude(a => a.AccessLevel)
        .Include(e => e.Cards).Include(e => e.Faces).Include(e => e.Fingerprints)
        .FirstAsync(x => x.Id == id, cancellationToken);
    var updatedResp = MapEmployeeDetailResponse(updated);
    return Results.Ok(new { updatedResp.Id, updatedResp.FirstName, updatedResp.LastName, updatedResp.PersonnelNumber, updatedResp.EmployeeNo, updatedResp.Gender, updatedResp.ValidFromUtc, updatedResp.ValidToUtc, updatedResp.IsActive, updatedResp.AccessLevels, updatedResp.Cards, updatedResp.Faces, updatedResp.Fingerprints, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
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

    var employeeNo = TruncateEmployeeNo(!string.IsNullOrWhiteSpace(entity.EmployeeNo) ? entity.EmployeeNo!.Trim()
        : !string.IsNullOrWhiteSpace(entity.PersonnelNumber) ? entity.PersonnelNumber!.Trim()
        : entity.Id.ToString("N")[..Math.Min(32, 32)]);

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
        .Include(v => v.Cards).Include(v => v.Faces).Include(v => v.Fingerprints)
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
    var numbers = await dbContext.Visitors
        .Where(x => x.DocumentNumber != null && x.DocumentNumber != "")
        .Select(x => x.DocumentNumber!)
        .ToListAsync(cancellationToken);
    var max = 0;
    foreach (var n in numbers)
    {
        if (int.TryParse(n.Trim(), out var val) && val > max)
            max = val;
    }
    return Results.Ok(new { nextDocumentNumber = (max + 1).ToString() });
}).RequireAuthorization();

app.MapGet("/api/visitors/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var v = await dbContext.Visitors
        .AsNoTracking()
        .Include(x => x.AccessLevels).ThenInclude(a => a.AccessLevel)
        .Include(x => x.Cards).Include(x => x.Faces).Include(x => x.Fingerprints)
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
        var numbers = await dbContext.Visitors
            .Where(x => x.DocumentNumber != null && x.DocumentNumber != "")
            .Select(x => x.DocumentNumber!)
            .ToListAsync(cancellationToken);
        var max = 0;
        foreach (var n in numbers)
        {
            if (int.TryParse(n.Trim(), out var val) && val > max)
                max = val;
        }
        documentNumber = (max + 1).ToString();
    }

    var entity = new Visitor
    {
        Id = Guid.NewGuid(),
        FirstName = firstName,
        LastName = lastName,
        DocumentNumber = documentNumber,
        VisitDateUtc = request.VisitDateUtc ?? DateTime.UtcNow,
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
        .Include(v => v.Cards).Include(v => v.Faces).Include(v => v.Fingerprints)
        .FirstAsync(x => x.Id == entity.Id, cancellationToken);
    var createdResp = MapVisitorDetailResponse(created);
    return Results.Created($"/api/visitors/{entity.Id}", new { createdResp.Id, createdResp.FirstName, createdResp.LastName, createdResp.DocumentNumber, createdResp.VisitDateUtc, createdResp.IsActive, createdResp.AccessLevels, createdResp.Cards, createdResp.Faces, createdResp.Fingerprints, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
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
    if (request.VisitDateUtc.HasValue) entity.VisitDateUtc = request.VisitDateUtc.Value;
    if (request.IsActive.HasValue) entity.IsActive = request.IsActive.Value;
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
    foreach (var deviceId in deviceIds)
    {
        var result = await syncService.SyncVisitorAsync(id, deviceId, cancellationToken);
        if (!result.Success && devices.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Устройство \"{dev.Name}\": {result.Message}");
            logger.LogWarning("Синхронизация посетителя {VisitorId} на устройство {DeviceId}: {Message}", id, deviceId, result.Message);
        }
    }

    var updated = await dbContext.Visitors
        .Include(v => v.AccessLevels).ThenInclude(a => a.AccessLevel)
        .Include(v => v.Cards).Include(v => v.Faces).Include(v => v.Fingerprints)
        .FirstAsync(x => x.Id == id, cancellationToken);
    var updatedResp = MapVisitorDetailResponse(updated);
    return Results.Ok(new { updatedResp.Id, updatedResp.FirstName, updatedResp.LastName, updatedResp.DocumentNumber, updatedResp.VisitDateUtc, updatedResp.IsActive, updatedResp.AccessLevels, updatedResp.Cards, updatedResp.Faces, updatedResp.Fingerprints, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
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

    var employeeNo = entity.Id.ToString("N")[..Math.Min(32, 32)];

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
    var result = await importService.ImportFromDevicesAsync(request.DeviceIds, cancellationToken);
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
            x.Message
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

app.MapDelete("/api/cards/{id:guid}", async (Guid id, AppDbContext dbContext, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var card = await dbContext.Cards.Include(c => c.Employee).Include(c => c.Visitor).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (card is null) return Results.NotFound();
    var cardNo = card.CardNo;
    var devices = await dbContext.Devices.Select(d => d.Id).ToListAsync(cancellationToken);
    foreach (var deviceId in devices)
        _ = syncService.DeleteCardFromDeviceAsync(cardNo, deviceId, cancellationToken);
    dbContext.Cards.Remove(card);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
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

    var deviceIds = form["DeviceIds"].SelectMany(x => (x ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries))
        .Select(x => Guid.TryParse(x.Trim(), out var g) ? g : (Guid?)null)
        .Where(g => g.HasValue).Cast<Guid>().ToList();
    var syncWarnings = new List<string>();
    var devices = await dbContext.Devices.AsNoTracking().ToDictionaryAsync(d => d.Id, cancellationToken);
    foreach (var deviceId in deviceIds)
    {
        var result = await syncService.SyncFaceAsync(face.Id, deviceId, cancellationToken);
        if (!result.Success && devices.TryGetValue(deviceId, out var dev))
        {
            syncWarnings.Add($"Устройство \"{dev.Name}\": {result.Message}");
            logger.LogWarning("Sync face {FaceId} to device {DeviceId}: {Message}", face.Id, deviceId, result.Message);
        }
    }

    return Results.Created($"/api/faces/{face.Id}", new { face.Id, face.FilePath, face.FDID, syncWarnings = syncWarnings.Count > 0 ? syncWarnings : null });
}).RequireAuthorization();

app.MapDelete("/api/faces/{id:guid}", async (Guid id, AppDbContext dbContext, IDevicePersonSyncService syncService, IConfiguration configuration, CancellationToken cancellationToken) =>
{
    var face = await dbContext.Faces.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (face is null) return Results.NotFound();
    var devices = await dbContext.Devices.Select(d => d.Id).ToListAsync(cancellationToken);
    foreach (var deviceId in devices)
        _ = syncService.DeleteFaceFromDeviceAsync(id, deviceId, cancellationToken);
    var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
    var fullPath = Path.Combine(facesPath, face.FilePath.TrimStart('/', '\\'));
    if (File.Exists(fullPath)) File.Delete(fullPath);
    dbContext.Faces.Remove(face);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
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

app.MapDelete("/api/fingerprints/{id:guid}", async (Guid id, AppDbContext dbContext, IDevicePersonSyncService syncService, CancellationToken cancellationToken) =>
{
    var fp = await dbContext.Fingerprints.Include(f => f.Employee).Include(f => f.Visitor).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (fp is null) return Results.NotFound();
    var employeeNo = fp.Employee != null
        ? (string.IsNullOrWhiteSpace(fp.Employee.EmployeeNo) ? fp.Employee.PersonnelNumber : fp.Employee.EmployeeNo) ?? fp.Employee.Id.ToString("N")[..32]
        : fp.Visitor!.Id.ToString("N")[..32];
    var devices = await dbContext.Devices.Select(d => d.Id).ToListAsync(cancellationToken);
    foreach (var deviceId in devices)
        _ = syncService.DeleteFingerprintFromDeviceAsync(employeeNo, fp.FingerIndex, deviceId, cancellationToken);
    dbContext.Fingerprints.Remove(fp);
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
    return new EmployeeResponse(
        e.Id, e.FirstName, e.LastName, e.PersonnelNumber, e.EmployeeNo, e.Gender, e.ValidFromUtc, e.ValidToUtc, e.IsActive,
        accessNames, e.Cards?.Count ?? 0, e.Faces?.Count ?? 0, e.Fingerprints?.Count ?? 0);
}

static EmployeeDetailResponse MapEmployeeDetailResponse(Employee e)
{
    var accessLevels = (e.AccessLevels ?? []).Where(a => a.AccessLevel != null).Select(a => new AccessLevelRef(a.AccessLevel!.Id, a.AccessLevel.Name)).ToArray();
    var cards = (e.Cards ?? []).Select(c => new CardRef(c.Id, c.CardNo, c.CardNumber)).ToArray();
    var faces = (e.Faces ?? []).Select(f => new FaceRef(f.Id, f.FDID)).ToArray();
    var fingerprints = (e.Fingerprints ?? []).Select(f => new FingerprintRef(f.Id, f.FingerIndex)).ToArray();
    return new EmployeeDetailResponse(e.Id, e.FirstName, e.LastName, e.PersonnelNumber, e.EmployeeNo, e.Gender, e.ValidFromUtc, e.ValidToUtc, e.IsActive, accessLevels, cards, faces, fingerprints);
}

static VisitorResponse MapVisitorResponse(Visitor v)
{
    var accessNames = v.AccessLevels?.Select(a => a.AccessLevel?.Name).Where(n => n != null).Cast<string>().ToArray() ?? [];
    return new VisitorResponse(
        v.Id, v.FirstName, v.LastName, v.DocumentNumber, v.VisitDateUtc, v.IsActive,
        accessNames, v.Cards?.Count ?? 0, v.Faces?.Count ?? 0, v.Fingerprints?.Count ?? 0);
}

static VisitorDetailResponse MapVisitorDetailResponse(Visitor v)
{
    var accessLevels = (v.AccessLevels ?? []).Where(a => a.AccessLevel != null).Select(a => new AccessLevelRef(a.AccessLevel!.Id, a.AccessLevel.Name)).ToArray();
    var cards = (v.Cards ?? []).Select(c => new CardRef(c.Id, c.CardNo, c.CardNumber)).ToArray();
    var faces = (v.Faces ?? []).Select(f => new FaceRef(f.Id, f.FDID)).ToArray();
    var fingerprints = (v.Fingerprints ?? []).Select(f => new FingerprintRef(f.Id, f.FingerIndex)).ToArray();
    return new VisitorDetailResponse(v.Id, v.FirstName, v.LastName, v.DocumentNumber, v.VisitDateUtc, v.IsActive, accessLevels, cards, faces, fingerprints);
}

static string TruncateEmployeeNo(string s)
{
    if (string.IsNullOrEmpty(s)) return s;
    return s.Length > 32 ? s[..32] : s;
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
public sealed record AddAccessLevelDoorRequest(Guid DeviceId, int DoorIndex);
public sealed record DoorControlRequest(string Action);
public sealed record CreateEmployeeRequest(string FirstName, string LastName, string? PersonnelNumber, string? EmployeeNo, string? Gender, DateTime? ValidFromUtc, DateTime? ValidToUtc, Guid[]? AccessLevelIds);
public sealed record UpdateEmployeeRequest(string FirstName, string LastName, string? PersonnelNumber, string? EmployeeNo, string? Gender, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool? IsActive, Guid[]? AccessLevelIds);
public sealed record CreateVisitorRequest(string FirstName, string LastName, string? DocumentNumber, DateTime? VisitDateUtc, Guid[]? AccessLevelIds);
public sealed record UpdateVisitorRequest(string FirstName, string LastName, string? DocumentNumber, DateTime? VisitDateUtc, bool? IsActive, Guid[]? AccessLevelIds);
public sealed record SyncToDevicesRequest(Guid[]? DeviceIds);

public sealed record ImportFromDevicesRequest(Guid[]? DeviceIds);
public sealed record EmployeeResponse(Guid Id, string FirstName, string LastName, string? PersonnelNumber, string? EmployeeNo, string? Gender, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool IsActive, string[] AccessLevelNames, int CardsCount, int FacesCount, int FingerprintsCount);
public sealed record EmployeeDetailResponse(Guid Id, string FirstName, string LastName, string? PersonnelNumber, string? EmployeeNo, string? Gender, DateTime? ValidFromUtc, DateTime? ValidToUtc, bool IsActive, AccessLevelRef[] AccessLevels, CardRef[] Cards, FaceRef[] Faces, FingerprintRef[] Fingerprints);
public sealed record VisitorResponse(Guid Id, string FirstName, string LastName, string? DocumentNumber, DateTime VisitDateUtc, bool IsActive, string[] AccessLevelNames, int CardsCount, int FacesCount, int FingerprintsCount);
public sealed record VisitorDetailResponse(Guid Id, string FirstName, string LastName, string? DocumentNumber, DateTime VisitDateUtc, bool IsActive, AccessLevelRef[] AccessLevels, CardRef[] Cards, FaceRef[] Faces, FingerprintRef[] Fingerprints);
public sealed record AccessLevelRef(Guid Id, string Name);
public sealed record CardRef(Guid Id, string CardNo, string? CardNumber);
public sealed record FaceRef(Guid Id, int FDID);
public sealed record FingerprintRef(Guid Id, int FingerIndex);
public sealed record CreateCardRequest(string CardNo, string? CardNumber, Guid? EmployeeId, Guid? VisitorId, Guid[]? DeviceIds);
public sealed record UpdateCardRequest(string? CardNumber);
public sealed record CreateFingerprintRequest(string TemplateData, int FingerIndex, Guid? EmployeeId, Guid? VisitorId, Guid[]? DeviceIds);
public sealed record AccessLevelDoorDto(Guid DeviceId, string DeviceName, int DoorIndex);
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

public sealed class DeviceStatusBroadcaster(IHubContext<DevicesHub> hub) : IDeviceStatusBroadcaster
{
    public async Task NotifyStatusChangedAsync(Guid deviceId, string deviceIdentifier, string status, DateTime? lastSeenUtc, string? statusMessage = null, CancellationToken cancellationToken = default)
    {
        await hub.Clients.All.SendAsync("DeviceStatusChanged", new DeviceStatusResponse(deviceId, deviceIdentifier, status, lastSeenUtc, statusMessage), cancellationToken);
    }
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
