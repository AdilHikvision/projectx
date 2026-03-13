using Backend.Domain.Entities;
using Backend.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Persistence;

public static class SeedIds
{
    public static readonly Guid DeviceStatusOnline = Guid.Parse("6B848B1C-D122-41C7-BDF9-2EA4E0054A01");
    public static readonly Guid DeviceStatusOffline = Guid.Parse("847FF661-F4A6-4844-B50A-D1731E28A602");
    public static readonly Guid DeviceStatusUnknown = Guid.Parse("A46A8AC3-95DD-4A0D-A8D6-1DFEC5B40603");
}

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Device> Devices => Set<Device>();
    public DbSet<DeviceStatus> DeviceStatuses => Set<DeviceStatus>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Visitor> Visitors => Set<Visitor>();
    public DbSet<AccessLevel> AccessLevels => Set<AccessLevel>();
    public DbSet<AccessLevelDoor> AccessLevelDoors => Set<AccessLevelDoor>();
    public DbSet<EmployeeAccessLevel> EmployeeAccessLevels => Set<EmployeeAccessLevel>();
    public DbSet<VisitorAccessLevel> VisitorAccessLevels => Set<VisitorAccessLevel>();
    public DbSet<Card> Cards => Set<Card>();
    public DbSet<Face> Faces => Set<Face>();
    public DbSet<Fingerprint> Fingerprints => Set<Fingerprint>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Device>(entity =>
        {
            entity.ToTable("devices");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.DeviceIdentifier).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.IpAddress).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Location).HasMaxLength(255);
            entity.Property(x => x.DeviceType).HasConversion<int>().IsRequired();
            entity.Property(x => x.LastSeenUtc);
            entity.Property(x => x.Username).HasMaxLength(64);
            entity.Property(x => x.Password).HasMaxLength(120);
            entity.HasIndex(x => x.DeviceIdentifier).IsUnique();
            entity.HasOne(x => x.DeviceStatus).WithMany(x => x.Devices).HasForeignKey(x => x.DeviceStatusId);
        });

        builder.Entity<Department>(entity =>
        {
            entity.ToTable("departments");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.HasOne(x => x.Parent).WithMany(x => x.Children).HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<DeviceStatus>(entity =>
        {
            entity.ToTable("device_statuses");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).HasMaxLength(64).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.HasIndex(x => x.Code).IsUnique();

            entity.HasData(
                new DeviceStatus { Id = SeedIds.DeviceStatusOnline, Code = "online", Name = "Online", CreatedUtc = DateTime.UnixEpoch },
                new DeviceStatus { Id = SeedIds.DeviceStatusOffline, Code = "offline", Name = "Offline", CreatedUtc = DateTime.UnixEpoch },
                new DeviceStatus { Id = SeedIds.DeviceStatusUnknown, Code = "unknown", Name = "Unknown", CreatedUtc = DateTime.UnixEpoch });
        });

        builder.Entity<Employee>(entity =>
        {
            entity.ToTable("employees");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FirstName).HasMaxLength(150).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(150).IsRequired();
            entity.Property(x => x.EmployeeNo).HasMaxLength(32);
            entity.Property(x => x.Gender).HasMaxLength(16);
            entity.HasIndex(x => x.EmployeeNo).IsUnique().HasFilter("EmployeeNo IS NOT NULL");
            entity.HasOne(x => x.Department).WithMany(x => x.Employees).HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Visitor>(entity =>
        {
            entity.ToTable("visitors");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FirstName).HasMaxLength(150).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(150).IsRequired();
            entity.Property(x => x.DocumentNumber).HasMaxLength(120);
            entity.HasIndex(x => x.DocumentNumber);
            entity.HasOne(x => x.Department).WithMany(x => x.Visitors).HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<AccessLevel>(entity =>
        {
            entity.ToTable("access_levels");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        builder.Entity<AccessLevelDoor>(entity =>
        {
            entity.ToTable("access_level_doors");
            entity.HasKey(x => new { x.AccessLevelId, x.DeviceId, x.DoorIndex });
            entity.HasOne(x => x.AccessLevel).WithMany(x => x.Doors).HasForeignKey(x => x.AccessLevelId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Device).WithMany(x => x.AccessLevelDoors).HasForeignKey(x => x.DeviceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(x => new { x.DeviceId, x.DoorIndex });
        });

        builder.Entity<EmployeeAccessLevel>(entity =>
        {
            entity.ToTable("employee_access_levels");
            entity.HasKey(x => new { x.EmployeeId, x.AccessLevelId });
            entity.HasOne(x => x.Employee).WithMany(x => x.AccessLevels).HasForeignKey(x => x.EmployeeId);
            entity.HasOne(x => x.AccessLevel).WithMany(x => x.EmployeeAccessLevels).HasForeignKey(x => x.AccessLevelId);
        });

        builder.Entity<VisitorAccessLevel>(entity =>
        {
            entity.ToTable("visitor_access_levels");
            entity.HasKey(x => new { x.VisitorId, x.AccessLevelId });
            entity.HasOne(x => x.Visitor).WithMany(x => x.AccessLevels).HasForeignKey(x => x.VisitorId);
            entity.HasOne(x => x.AccessLevel).WithMany(x => x.VisitorAccessLevels).HasForeignKey(x => x.AccessLevelId);
        });

        builder.Entity<Card>(entity =>
        {
            entity.ToTable("cards");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CardNo).HasMaxLength(64).IsRequired();
            entity.Property(x => x.CardNumber).HasMaxLength(120);
            entity.HasOne(x => x.Employee).WithMany(x => x.Cards).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Visitor).WithMany(x => x.Cards).HasForeignKey(x => x.VisitorId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(x => x.CardNo).IsUnique();
            entity.HasCheckConstraint("CK_Cards_Owner", "(EmployeeId IS NOT NULL AND VisitorId IS NULL) OR (EmployeeId IS NULL AND VisitorId IS NOT NULL)");
        });

        builder.Entity<Face>(entity =>
        {
            entity.ToTable("faces");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FilePath).HasMaxLength(500).IsRequired();
            entity.HasOne(x => x.Employee).WithMany(x => x.Faces).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Visitor).WithMany(x => x.Faces).HasForeignKey(x => x.VisitorId).OnDelete(DeleteBehavior.Cascade);
            entity.HasCheckConstraint("CK_Faces_Owner", "(EmployeeId IS NOT NULL AND VisitorId IS NULL) OR (EmployeeId IS NULL AND VisitorId IS NOT NULL)");
        });

        builder.Entity<Fingerprint>(entity =>
        {
            entity.ToTable("fingerprints");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TemplateData).IsRequired();
            entity.HasOne(x => x.Employee).WithMany(x => x.Fingerprints).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Visitor).WithMany(x => x.Fingerprints).HasForeignKey(x => x.VisitorId).OnDelete(DeleteBehavior.Cascade);
            entity.HasCheckConstraint("CK_Fingerprints_Owner", "(EmployeeId IS NOT NULL AND VisitorId IS NULL) OR (EmployeeId IS NULL AND VisitorId IS NOT NULL)");
        });
    }
}
