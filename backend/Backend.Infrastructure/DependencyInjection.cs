using Backend.Application.Devices;
using Backend.Application.Security;
using Backend.Infrastructure.Devices.Services;
using Backend.Infrastructure.Devices.Sdk;
using Backend.Infrastructure.Identity;
using Backend.Infrastructure.Initialization;
using Backend.Infrastructure.Persistence;
using Backend.Infrastructure.Security;
using Backend.Infrastructure.System;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Backend.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var baseConnectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required.");
        var username = !string.IsNullOrWhiteSpace(configuration["Database:Username"])
            ? configuration["Database:Username"]
            : Environment.GetEnvironmentVariable("POSTGRES_USER");
        var password = !string.IsNullOrWhiteSpace(configuration["Database:Password"])
            ? configuration["Database:Password"]
            : Environment.GetEnvironmentVariable("POSTGRES_PASSWORD");
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException("Database credentials must be provided via Database section or environment variables.");
        }

        var connectionBuilder = new NpgsqlConnectionStringBuilder(baseConnectionString)
        {
            Username = username,
            Password = password
        };

        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.Configure<SystemMonitorOptions>(configuration.GetSection(SystemMonitorOptions.SectionName));
        services.Configure<SystemOptions>(configuration.GetSection(SystemOptions.SectionName));
        services.Configure<SadpOptions>(configuration.GetSection(SadpOptions.SectionName));

        services.AddDbContext<AppDbContext>(options => options
            .UseNpgsql(connectionBuilder.ConnectionString)
            .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

        services
            .AddIdentityCore<ApplicationUser>()
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>();

        services.AddSingleton<SadpDiscoveryService>();
        services.AddSingleton<HikvisionSdkClient>();
        services.AddSingleton<IHikvisionSdkClient>(provider => provider.GetRequiredService<HikvisionSdkClient>());
        services.AddSingleton<IDeviceConnectionManager, DeviceConnectionManager>();
        services.AddSingleton<IDeviceDiscoveryService, DeviceDiscoveryService>();
        services.AddSingleton<EventListenerService>();
        services.AddSingleton<IEventListenerService>(provider => provider.GetRequiredService<EventListenerService>());
        services.AddHostedService(provider => provider.GetRequiredService<EventListenerService>());
        services.AddSingleton<DeviceArpStatusService>();
        services.AddSingleton<IDeviceArpStatusService>(provider => provider.GetRequiredService<DeviceArpStatusService>());
        services.AddHostedService(provider => provider.GetRequiredService<DeviceArpStatusService>());

        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IDatabaseInitializer, DatabaseInitializer>();
        services.AddScoped<ISystemStatusService, SystemStatusService>();
        services.AddScoped<IDeviceDoorService, DeviceDoorService>();
        services.AddScoped<IDeviceDoorControlService, DeviceDoorControlService>();
        services.AddScoped<IDevicePersonSyncService, DevicePersonSyncService>();
        services.AddScoped<IDevicePersonImportService, DevicePersonImportService>();
        services.AddScoped<IDeviceFaceCaptureService, DeviceFaceCaptureService>();
        services.AddSingleton<IServiceControlManager>(provider =>
        {
            var monitorOptions = provider.GetRequiredService<IOptions<SystemMonitorOptions>>();
            return OperatingSystem.IsWindows()
                ? new WindowsServiceControlManager(monitorOptions)
                : new UnsupportedServiceControlManager(monitorOptions);
        });

        return services;
    }
}
