namespace Backend.Application.Devices;

public enum DeviceConnectivityStatus
{
    Disconnected = 0,
    Connected = 1
}

public enum DeviceEventType
{
    Unknown = 0,
    DoorOpened = 1,
    AccessGranted = 2,
    AccessDenied = 3,
    Heartbeat = 4
}

public sealed record DiscoveredDevice(
    string DeviceIdentifier,
    string Name,
    string IpAddress,
    int Port,
    string? Model,
    string? DeviceType,
    string? MacAddress,
    string? FirmwareVersion,
    bool? IsActivated);

public sealed record DeviceConnection(
    string DeviceIdentifier,
    string IpAddress,
    int Port,
    DeviceConnectivityStatus Status,
    DateTime ConnectedUtc,
    DateTime? LastSeenUtc);

public sealed record DeviceRealtimeStatus(
    string DeviceIdentifier,
    DeviceConnectivityStatus Status,
    DateTime? LastSeenUtc,
    string? StatusMessage = null);

public sealed record DeviceEvent(
    string DeviceIdentifier,
    DeviceEventType EventType,
    DateTime OccurredUtc,
    string Payload);

public interface IDeviceDiscoveryService
{
    Task<IReadOnlyCollection<DiscoveredDevice>> DiscoverAsync(CancellationToken cancellationToken = default);
    /// <summary>Streaming discovery: вызывает onDevice для каждого найденного устройства по мере поиска.</summary>
    Task DiscoverStreamAsync(Func<DiscoveredDevice, CancellationToken, Task> onDevice, CancellationToken cancellationToken = default);
}

public interface IDeviceConnectionManager
{
    Task<DeviceConnection> ConnectAsync(string deviceIdentifier, string ipAddress, int port, string? username = null, string? password = null, CancellationToken cancellationToken = default);
    Task DisconnectAsync(string deviceIdentifier, CancellationToken cancellationToken = default);
    Task<DeviceRealtimeStatus> GetStatusAsync(string deviceIdentifier, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<DeviceRealtimeStatus>> GetStatusesAsync(CancellationToken cancellationToken = default);
    Task TouchHeartbeatAsync(string deviceIdentifier, DateTime occurredUtc, CancellationToken cancellationToken = default);
    Task MarkStaleConnectionsOfflineAsync(TimeSpan staleAfter, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<DeviceConnection>> GetActiveConnectionsAsync(CancellationToken cancellationToken = default);
}

public interface IEventListenerService
{
    Task<IReadOnlyCollection<DeviceEvent>> ReadRecentEventsAsync(int take = 100, CancellationToken cancellationToken = default);
}

public interface IDeviceStatusBroadcaster
{
    Task NotifyStatusChangedAsync(Guid deviceId, string deviceIdentifier, string status, DateTime? lastSeenUtc, string? statusMessage = null, CancellationToken cancellationToken = default);
}

public interface IDeviceArpStatusService
{
    Task<DeviceRealtimeStatus?> GetStatusAsync(string deviceIdentifier, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<DeviceRealtimeStatus>> GetStatusesAsync(CancellationToken cancellationToken = default);
}

public sealed record DeviceDoor(Guid DeviceId, string DeviceName, int DoorIndex, string? DoorName, string? Status);

public interface IDeviceDoorService
{
    Task<IReadOnlyCollection<DeviceDoor>> GetDoorsAsync(Guid? deviceId, CancellationToken cancellationToken = default);
}

/// <summary>Режим управления дверью: открыть, закрыть, всегда открыта, всегда закрыта.</summary>
public enum DoorControlAction
{
    Open,
    Close,
    AlwaysOpen,
    AlwaysClose
}

public interface IDeviceDoorControlService
{
    /// <summary>Выполняет действие над дверью (открыть/закрыть/всегда открыта/всегда закрыта).</summary>
    Task<(bool Success, string? Message)> ControlDoorAsync(Guid deviceId, int doorIndex, DoorControlAction action, CancellationToken cancellationToken = default);
}

/// <summary>Результат синхронизации Person/Card/Face/Fingerprint на устройство.</summary>
public sealed record DeviceSyncResult(bool Success, string? Message);

public interface IDevicePersonSyncService
{
    /// <summary>Синхронизирует сотрудника на устройство (UserInfo Record).</summary>
    Task<DeviceSyncResult> SyncEmployeeAsync(Guid employeeId, Guid deviceId, CancellationToken cancellationToken = default);
    /// <summary>Синхронизирует посетителя на устройство (UserInfo Record).</summary>
    Task<DeviceSyncResult> SyncVisitorAsync(Guid visitorId, Guid deviceId, CancellationToken cancellationToken = default);
    /// <summary>Синхронизирует карту на устройство (CardInfo Record).</summary>
    Task<DeviceSyncResult> SyncCardAsync(Guid cardId, Guid deviceId, CancellationToken cancellationToken = default);
    /// <summary>Синхронизирует лицо на устройство (FDLib pictureUpload).</summary>
    Task<DeviceSyncResult> SyncFaceAsync(Guid faceId, Guid deviceId, CancellationToken cancellationToken = default);
    /// <summary>Синхронизирует отпечаток на устройство (FingerPrintDownload).</summary>
    Task<DeviceSyncResult> SyncFingerprintAsync(Guid fingerprintId, Guid deviceId, CancellationToken cancellationToken = default);
    /// <summary>Удаляет карту с устройства.</summary>
    Task<DeviceSyncResult> DeleteCardFromDeviceAsync(string cardNo, Guid deviceId, CancellationToken cancellationToken = default);
    /// <summary>Удаляет лицо с устройства.</summary>
    Task<DeviceSyncResult> DeleteFaceFromDeviceAsync(Guid faceId, Guid deviceId, CancellationToken cancellationToken = default);
    /// <summary>Удаляет отпечаток с устройства.</summary>
    Task<DeviceSyncResult> DeleteFingerprintFromDeviceAsync(string employeeNo, int fingerIndex, Guid deviceId, CancellationToken cancellationToken = default);
    /// <summary>Удаляет пользователя (Person) с устройства по employeeNo.</summary>
    Task<DeviceSyncResult> DeletePersonFromDeviceAsync(string employeeNo, Guid deviceId, CancellationToken cancellationToken = default);
}

/// <summary>Пользователь, полученный с устройства Hikvision (UserInfo Search).</summary>
public sealed record ImportedUser(
    string EmployeeNo,
    string Name,
    string? GivenName,
    string? FamilyName,
    int Type,
    string? UserType,
    string? Gender,
    string? ValidBeginTime,
    string? ValidEndTime,
    Guid SourceDeviceId,
    string SourceDeviceName);

/// <summary>Результат импорта пользователей с устройств.</summary>
public sealed record PersonImportResult(
    int ImportedCount,
    int SkippedCount,
    int ErrorCount,
    IReadOnlyCollection<PersonImportItem> Items);

public sealed record PersonImportItem(
    string EmployeeNo,
    string Name,
    Guid DeviceId,
    string DeviceName,
    bool Success,
    string? Message);

public interface IDevicePersonImportService
{
    /// <summary>Получает список пользователей с устройства через ISAPI UserInfo Search.</summary>
    Task<IReadOnlyCollection<ImportedUser>> FetchUsersFromDeviceAsync(Guid deviceId, CancellationToken cancellationToken = default);
    /// <summary>Импортирует пользователей с выбранных устройств в БД (создаёт Employee или Visitor).</summary>
    Task<PersonImportResult> ImportFromDevicesAsync(IReadOnlyCollection<Guid> deviceIds, CancellationToken cancellationToken = default);
}
