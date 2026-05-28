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
    AttendanceTerminal = 3,
    /// <summary>Контроллер лифта (этажи ISAPI = doorID, вызов — RemoteControl).</summary>
    ElevatorController = 4,
    /// <summary>Энроллер-станция (DS-K1F…): захват лиц/карт/отпечатков по ISAPI Enroller; без онлайн UserInfo как у дверного терминала.</summary>
    EnrollerStation = 5
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
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<Visitor> Visitors { get; set; } = new List<Visitor>();
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

    public Guid? CompanyId { get; set; }
    public Company? Company { get; set; }

    /// <summary>Расписание работы сотрудника.</summary>
    public Guid? WorkScheduleId { get; set; }
    public WorkSchedule? WorkSchedule { get; set; }

    /// <summary>Включён ли портал самообслуживания для сотрудника.</summary>
    public bool SelfServiceEnabled { get; set; }
    /// <summary>Email для входа в портал самообслуживания.</summary>
    public string? SelfServiceEmail { get; set; }

    public ICollection<EmployeeAccessLevel> AccessLevels { get; set; } = new List<EmployeeAccessLevel>();
    public ICollection<Card> Cards { get; set; } = new List<Card>();
    public ICollection<Face> Faces { get; set; } = new List<Face>();
    public ICollection<Fingerprint> Fingerprints { get; set; } = new List<Fingerprint>();
    public ICollection<Iris> Irises { get; set; } = new List<Iris>();
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
    public ICollection<AttendanceRequest> AttendanceRequests { get; set; } = new List<AttendanceRequest>();
    public ICollection<EmployeeDayPattern> DayPatterns { get; set; } = new List<EmployeeDayPattern>();
    public ICollection<EmployeeLeave> Leaves { get; set; } = new List<EmployeeLeave>();
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

    public Guid? CompanyId { get; set; }
    public Company? Company { get; set; }

    public ICollection<VisitorAccessLevel> AccessLevels { get; set; } = new List<VisitorAccessLevel>();
    public ICollection<Card> Cards { get; set; } = new List<Card>();
    public ICollection<Face> Faces { get; set; } = new List<Face>();
    public ICollection<Fingerprint> Fingerprints { get; set; } = new List<Fingerprint>();
    public ICollection<Iris> Irises { get; set; } = new List<Iris>();
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
    /// <summary>Тип карты для ISAPI: normalCard, qrCode и т.д. Null = normalCard.</summary>
    public string? CardType { get; set; }
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

/// <summary>Шаблон радужной оболочки, привязанный к сотруднику или посетителю.</summary>
public sealed class Iris : BaseEntity
{
    public Guid? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public Guid? VisitorId { get; set; }
    public Visitor? Visitor { get; set; }

    public byte[] TemplateData { get; set; } = Array.Empty<byte>();
    /// <summary>Идентификатор глаза на устройстве (irisID из ISAPI).</summary>
    public int IrisIndex { get; set; } = 1;
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

// ─── Time Attendance ───────────────────────────────────────────────────────────

public enum ScheduleType { Standard, Shift, Flexible }

/// <summary>Расписание работы: стандартное (9–18), сменное или гибкое.</summary>
public sealed class WorkSchedule : BaseEntity
{
    public string Name { get; set; } = "";
    public ScheduleType Type { get; set; } = ScheduleType.Standard;
    /// <summary>Начало смены (для Standard и Shift).</summary>
    public TimeSpan? ShiftStart { get; set; }
    /// <summary>Конец смены (для Standard и Shift).</summary>
    public TimeSpan? ShiftEnd { get; set; }
    /// <summary>Норма часов в день (для Flexible).</summary>
    public decimal RequiredHoursPerDay { get; set; } = 8;
    /// <summary>Hex-цвет для отображения в планнере, например #6366f1.</summary>
    public string Color { get; set; } = "#6366f1";
    public ICollection<Employee> Employees { get; set; } = [];
}

/// <summary>
/// Назначение рабочего графика сотруднику на конкретную дату.
/// Уникален по (EmployeeId, Date).
/// </summary>
public sealed class EmployeeDayPattern : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    /// <summary>Конкретная дата назначения (UTC, время = 00:00:00).</summary>
    public DateOnly Date { get; set; }
    /// <summary>Назначенный график (если null — выходной или не назначен).</summary>
    public Guid? WorkScheduleId { get; set; }
    public WorkSchedule? WorkSchedule { get; set; }
    public bool IsDayOff { get; set; }
}

public enum LeaveType { Vacation, DayOff }
public enum LeaveStatus { Pending, Approved, Rejected, Cancelled }

public sealed class EmployeeLeave : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public LeaveType LeaveType { get; set; }
    public bool IsPaid { get; set; } = true;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string? Reason { get; set; }
    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;
    public string? Notes { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

/// <summary>
/// Сырой лог успешной аутентификации с устройства. Не привязан FK к Employee — храним
/// то, что прислало устройство (employeeNoString + name), независимо от регистрации в
/// нашей таблице сотрудников. Daily-отчёт уже на чтении джоинит с Employees по
/// EmployeeNoString и фильтрует по WorkSchedule.
/// </summary>
public sealed class DeviceAuthLog : BaseEntity
{
    public Guid? DeviceId { get; set; }
    public Device? Device { get; set; }
    public string EmployeeNoString { get; set; } = "";
    public string? Name { get; set; }
    public DateTime EventTimeUtc { get; set; }
    public int Major { get; set; }
    public int Minor { get; set; }
}

/// <summary>
/// Ручная корректировка check-in/check-out за конкретный день для конкретного сотрудника.
/// Перекрывает значения, посчитанные из device_auth_logs. Уникальна по (EmployeeId, Date).
/// </summary>
public sealed class AttendanceCorrection : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    /// <summary>UTC midnight выбранного дня.</summary>
    public DateTime DateUtc { get; set; }
    public DateTime? CheckInUtc { get; set; }
    public DateTime? CheckOutUtc { get; set; }
    public string? Comment { get; set; }
    public Guid? CorrectedByUserId { get; set; }
}

public enum AttendanceEventType { In, Out }

/// <summary>Фактическая запись прихода/ухода с устройства или добавленная вручную.</summary>
public sealed class AttendanceRecord : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public DateTime EventTimeUtc { get; set; }
    public AttendanceEventType EventType { get; set; }
    public Guid? DeviceId { get; set; }
    /// <summary>"device" — с устройства, "manual" — вручную после одобрения заявки.</summary>
    public string Source { get; set; } = "device";
}

public enum AttendanceRequestType { CheckIn, CheckOut, Absence, Vacation, Overtime, Correction }

/// <summary>
/// Гео-зона для регистрации входа/выхода. Если координаты сотрудника попадают в радиус
/// любой активной зоны при отправке Check-in/Check-out request — заявка авто-аппрувится.
/// Иначе уходит в Pending на решение админа.
/// </summary>
public sealed class GeoZone : BaseEntity
{
    public string Name { get; set; } = "";
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int RadiusMeters { get; set; } = 100;
    public bool IsActive { get; set; } = true;
}
public enum AttendanceRequestStatus { Pending, Approved, Rejected }

/// <summary>Заявка сотрудника: приход/уход/отсутствие/отпуск/переработка.</summary>
public sealed class AttendanceRequest : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public AttendanceRequestType Type { get; set; }
    public DateTime RequestedTimeUtc { get; set; }
    public DateTime? RequestedEndTimeUtc { get; set; }
    public string? Comment { get; set; }
    public AttendanceRequestStatus Status { get; set; } = AttendanceRequestStatus.Pending;
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAtUtc { get; set; }
    public string? ReviewComment { get; set; }
    /// <summary>Координаты, отправленные сотрудником из браузера (опционально).</summary>
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    /// <summary>Имя GeoZone, в которую попали координаты (если попали).</summary>
    public string? GeoZoneName { get; set; }
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

// ─── Payroll ───────────────────────────────────────────────────────────────────

public enum PayrollComponentType { Allowance, Bonus, Deduction }
public enum SalaryType { Monthly, Hourly, Daily }
public enum PayrollPeriodStatus { Draft, Calculated, Approved, Paid }
public enum PayrollEntryStatus { Pending, Approved, Rejected }

/// <summary>Шаблон компонента начисления/удержания (применяется ко всем или конкретным сотрудникам).</summary>
public sealed class PayrollComponent : BaseEntity
{
    public string Name { get; set; } = "";
    public PayrollComponentType ComponentType { get; set; }
    /// <summary>true — фиксированная сумма, false — процент от базовой зарплаты.</summary>
    public bool IsFixed { get; set; } = true;
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
    /// <summary>Применять автоматически ко всем сотрудникам при расчёте.</summary>
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }
    public ICollection<EmployeePayrollComponent> EmployeeComponents { get; set; } = [];
}

/// <summary>Конфигурация зарплаты конкретного сотрудника.</summary>
public sealed class EmployeeSalaryConfig : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public SalaryType SalaryType { get; set; } = SalaryType.Monthly;
    /// <summary>Базовый оклад (в месяц или в час, в зависимости от SalaryType).</summary>
    public decimal BaseAmount { get; set; }
    public string Currency { get; set; } = "AZN";
    public decimal OvertimeMultiplier { get; set; } = 1.5m;
    /// <summary>Если false — оверайт не начисляется вообще.</summary>
    public bool OvertimeEnabled { get; set; } = true;
    /// <summary>JSON: [{afterHours:0,multiplier:1.5},{afterHours:20,multiplier:2.0}] — тиры сверхурочных. Если null — используется OvertimeMultiplier.</summary>
    public string? OvertimeTiersJson { get; set; }
    /// <summary>Для Monthly: считать базу по отработанным часам, а не по дням.</summary>
    public bool PayByWorkedHours { get; set; } = false;
    /// <summary>Включить вычет за опоздания.</summary>
    public bool LatenessDeductionEnabled { get; set; } = false;
    /// <summary>JSON: [{afterMinutes:5,deductionMultiplier:1.0},{afterMinutes:30,deductionMultiplier:2.0}]</summary>
    public string? LatenessTiersJson { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public ICollection<EmployeePayrollComponent> Components { get; set; } = [];
}

/// <summary>Компонент зарплаты, индивидуально назначенный сотруднику (возможен override суммы).</summary>
public sealed class EmployeePayrollComponent
{
    public Guid SalaryConfigId { get; set; }
    public EmployeeSalaryConfig SalaryConfig { get; set; } = null!;
    public Guid ComponentId { get; set; }
    public PayrollComponent Component { get; set; } = null!;
    public decimal? OverrideAmount { get; set; }
    public decimal? OverridePercentage { get; set; }
}

/// <summary>Расчётный период (один календарный месяц).</summary>
public sealed class PayrollPeriod : BaseEntity
{
    public int Year { get; set; }
    public int Month { get; set; }
    public PayrollPeriodStatus Status { get; set; } = PayrollPeriodStatus.Draft;
    public DateTime? CalculatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public string? Notes { get; set; }
    public ICollection<PayrollEntry> Entries { get; set; } = [];
}

/// <summary>Строка расчёта зарплаты для одного сотрудника за период.</summary>
public sealed class PayrollEntry : BaseEntity
{
    public Guid PeriodId { get; set; }
    public PayrollPeriod Period { get; set; } = null!;
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public int WorkedDays { get; set; }
    public decimal WorkedHours { get; set; }
    public decimal OvertimeHours { get; set; }
    public int AbsentDays { get; set; }
    public decimal BasePay { get; set; }
    public decimal OvertimePay { get; set; }
    public decimal AllowancesTotal { get; set; }
    public decimal BonusesTotal { get; set; }
    public decimal GrossPay { get; set; }
    public decimal DeductionsTotal { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal NetPay { get; set; }
    public PayrollEntryStatus Status { get; set; } = PayrollEntryStatus.Pending;
    public string? Notes { get; set; }
    /// <summary>JSON-снимок применённых компонентов на момент расчёта.</summary>
    public string? ComponentsJson { get; set; }
}

// ─── Notifications ─────────────────────────────────────────────────────────────

public static class NotificationTypes
{
    public const string DeviceOffline = "DeviceOffline";
    public const string DeviceOnline = "DeviceOnline";
    public const string ApprovalRequest = "ApprovalRequest";
    public const string ApprovalApproved = "ApprovalApproved";
    public const string ApprovalRejected = "ApprovalRejected";
    public const string DailyReport = "DailyReport";
}

/// <summary>Уведомление для пользователя. UserId = null означает broadcast всем.</summary>
public sealed class Notification : BaseEntity
{
    public Guid? UserId { get; set; }
    public string Type { get; set; } = "";
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public bool IsRead { get; set; }
    public string? ReferenceId { get; set; }
}

/// <summary>Запись о прочтении broadcast-уведомления конкретным пользователем.</summary>
public sealed class NotificationRead
{
    public Guid NotificationId { get; set; }
    public Guid UserId { get; set; }
    public DateTime ReadAtUtc { get; set; } = DateTime.UtcNow;
}
