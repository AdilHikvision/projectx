namespace Backend.Domain.Entities;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedUtc { get; set; }
}

public enum DeviceType
{
    AccessController = 1,
    Intercom = 2,
    AttendanceTerminal = 3
}

public sealed class DeviceStatus : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public ICollection<Device> Devices { get; set; } = new List<Device>();
}

public sealed class Device : BaseEntity
{
    public string DeviceIdentifier { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public int Port { get; set; } = 8000;
    public string? Location { get; set; }
    public DeviceType DeviceType { get; set; } = DeviceType.AccessController;
    public DateTime? LastSeenUtc { get; set; }

    public Guid DeviceStatusId { get; set; }
    public DeviceStatus? DeviceStatus { get; set; }
}

public sealed class AccessLevel : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<EmployeeAccessLevel> EmployeeAccessLevels { get; set; } = new List<EmployeeAccessLevel>();
    public ICollection<VisitorAccessLevel> VisitorAccessLevels { get; set; } = new List<VisitorAccessLevel>();
}

public sealed class Employee : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PersonnelNumber { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<EmployeeAccessLevel> AccessLevels { get; set; } = new List<EmployeeAccessLevel>();
}

public sealed class Visitor : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? DocumentNumber { get; set; }
    public DateTime VisitDateUtc { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public ICollection<VisitorAccessLevel> AccessLevels { get; set; } = new List<VisitorAccessLevel>();
}

public sealed class EmployeeAccessLevel
{
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public Guid AccessLevelId { get; set; }
    public AccessLevel? AccessLevel { get; set; }

    public DateTime GrantedFromUtc { get; set; } = DateTime.UtcNow;
    public DateTime? GrantedToUtc { get; set; }
}

public sealed class VisitorAccessLevel
{
    public Guid VisitorId { get; set; }
    public Visitor? Visitor { get; set; }

    public Guid AccessLevelId { get; set; }
    public AccessLevel? AccessLevel { get; set; }

    public DateTime GrantedFromUtc { get; set; } = DateTime.UtcNow;
    public DateTime? GrantedToUtc { get; set; }
}
