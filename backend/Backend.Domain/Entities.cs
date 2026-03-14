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

    /// <summary>Логин для подключения к устройству. null — использовать глобальный конфиг.</summary>
    public string? Username { get; set; }
    /// <summary>Пароль для подключения к устройству. null — использовать глобальный конфиг.</summary>
    public string? Password { get; set; }

    public Guid DeviceStatusId { get; set; }
    public DeviceStatus? DeviceStatus { get; set; }
    public ICollection<AccessLevelDoor> AccessLevelDoors { get; set; } = new List<AccessLevelDoor>();
}

/// <summary>Компания или холдинг.</summary>
public sealed class Company : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<Department> Departments { get; set; } = new List<Department>();
}

/// <summary>Системные настройки (режим работы, и т.д.).</summary>
public sealed class SystemSetting : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }
}

/// <summary>Отдел компании (древовидная структура).</summary>
public sealed class Department : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }

    public Guid? CompanyId { get; set; }
    public Company? Company { get; set; }

    public Guid? ParentId { get; set; }
    public Department? Parent { get; set; }
    public ICollection<Department> Children { get; set; } = new List<Department>();

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<Visitor> Visitors { get; set; } = new List<Visitor>();
}

public sealed class AccessLevel : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<EmployeeAccessLevel> EmployeeAccessLevels { get; set; } = new List<EmployeeAccessLevel>();
    public ICollection<VisitorAccessLevel> VisitorAccessLevels { get; set; } = new List<VisitorAccessLevel>();
    public ICollection<AccessLevelDoor> Doors { get; set; } = new List<AccessLevelDoor>();
}

/// <summary>Привязка уровня доступа к двери устройства (DeviceId + DoorIndex, 0-based).</summary>
public sealed class AccessLevelDoor
{
    public Guid AccessLevelId { get; set; }
    public AccessLevel? AccessLevel { get; set; }

    public Guid DeviceId { get; set; }
    public Device? Device { get; set; }

    /// <summary>Номер двери на устройстве (0-based, dwDoorNo в Hikvision SDK).</summary>
    public int DoorIndex { get; set; }
}

public sealed class Employee : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    /// <summary>Идентификатор для устройств Hikvision (employeeNo, до 32 байт). Генерируется системой автоматически из Id.</summary>
    public string? EmployeeNo { get; set; }
    /// <summary>Пол: male, female, unknown.</summary>
    public string? Gender { get; set; }
    /// <summary>Начало периода действия (для ISAPI Valid).</summary>
    public DateTime? ValidFromUtc { get; set; }
    /// <summary>Конец периода действия (для ISAPI Valid).</summary>
    public DateTime? ValidToUtc { get; set; }
    public bool IsActive { get; set; } = true;
    /// <summary>Только учёт рабочего времени: true — время учитывается, дверь не открывается (ISAPI onlyVerify).</summary>
    public bool OnlyVerify { get; set; }

    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public ICollection<EmployeeAccessLevel> AccessLevels { get; set; } = new List<EmployeeAccessLevel>();
    public ICollection<Card> Cards { get; set; } = new List<Card>();
    public ICollection<Face> Faces { get; set; } = new List<Face>();
    public ICollection<Fingerprint> Fingerprints { get; set; } = new List<Fingerprint>();
}

public sealed class Visitor : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? DocumentNumber { get; set; }
    public DateTime? VisitDateUtc { get; set; }
    public DateTime? ValidFromUtc { get; set; }
    public DateTime? ValidToUtc { get; set; }
    public bool IsActive { get; set; } = true;

    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public ICollection<VisitorAccessLevel> AccessLevels { get; set; } = new List<VisitorAccessLevel>();
    public ICollection<Card> Cards { get; set; } = new List<Card>();
    public ICollection<Face> Faces { get; set; } = new List<Face>();
    public ICollection<Fingerprint> Fingerprints { get; set; } = new List<Fingerprint>();
}

/// <summary>Карта доступа, привязанная к сотруднику или посетителю.</summary>
public sealed class Card : BaseEntity
{
    public Guid? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public Guid? VisitorId { get; set; }
    public Visitor? Visitor { get; set; }

    /// <summary>Номер карты (уникальный в системе).</summary>
    public string CardNo { get; set; } = string.Empty;
    /// <summary>Сырой номер карты (Wiegand и т.п.), опционально.</summary>
    public string? CardNumber { get; set; }
}

/// <summary>Лицо для распознавания, привязанное к сотруднику или посетителю.</summary>
public sealed class Face : BaseEntity
{
    public Guid? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public Guid? VisitorId { get; set; }
    public Visitor? Visitor { get; set; }

    /// <summary>Относительный путь к файлу изображения.</summary>
    public string FilePath { get; set; } = string.Empty;
    /// <summary>FDID: 1 — видимый свет, 2 — инфракрасный.</summary>
    public int FDID { get; set; } = 1;
}

/// <summary>Отпечаток пальца, привязанный к сотруднику или посетителю.</summary>
public sealed class Fingerprint : BaseEntity
{
    public Guid? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public Guid? VisitorId { get; set; }
    public Visitor? Visitor { get; set; }

    /// <summary>Шаблон отпечатка (бинарные данные).</summary>
    public byte[] TemplateData { get; set; } = Array.Empty<byte>();
    /// <summary>Индекс пальца (1–10).</summary>
    public int FingerIndex { get; set; } = 1;
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
