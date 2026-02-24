using Backend.Application.Devices;
using Backend.Application.Security;
using Backend.Infrastructure.Devices.Services;
using Backend.Infrastructure.Devices.Sdk;
using Backend.Infrastructure.Identity;
using Backend.Infrastructure.Initialization;
using Backend.Infrastructure.Persistence;
using Backend.Infrastructure.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
        services.Configure<SeedAdminOptions>(configuration.GetSection("SeedAdmin"));

        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionBuilder.ConnectionString));

        services
            .AddIdentityCore<ApplicationUser>()
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>();

        services.AddSingleton<IHikvisionSdkClient, MockHikvisionSdkClient>();
        services.AddSingleton<IDeviceConnectionManager, DeviceConnectionManager>();
        services.AddSingleton<IDeviceDiscoveryService, DeviceDiscoveryService>();
        services.AddSingleton<EventListenerService>();
        services.AddSingleton<IEventListenerService>(provider => provider.GetRequiredService<EventListenerService>());
        services.AddHostedService(provider => provider.GetRequiredService<EventListenerService>());

        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IDatabaseInitializer, DatabaseInitializer>();

        return services;
    }
}
