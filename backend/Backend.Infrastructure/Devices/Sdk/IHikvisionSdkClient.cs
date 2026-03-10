namespace Backend.Infrastructure.Devices.Sdk;

public sealed record SdkDiscoveredDevice(
    string DeviceIdentifier,
    string Name,
    string IpAddress,
    int Port,
    string? Model,
    string? DeviceType,
    string? MacAddress,
    string? FirmwareVersion,
    bool? IsActivated);

public sealed record SdkDeviceEvent(
    string DeviceIdentifier,
    string EventCode,
    DateTime OccurredUtc,
    string Payload);

/// <summary>Результат опроса устройств: события + идентификаторы недоступных устройств.</summary>
public sealed record PullEventsResult(
    IReadOnlyCollection<SdkDeviceEvent> Events,
    IReadOnlyCollection<string> UnreachableDeviceIds);

public interface IHikvisionSdkClient
{
    Task<IReadOnlyCollection<SdkDiscoveredDevice>> ScanLanAsync(CancellationToken cancellationToken = default, IProgress<SdkDiscoveredDevice>? progress = null);
    Task ConnectAsync(string deviceIdentifier, string ipAddress, int port, string? username = null, string? password = null, CancellationToken cancellationToken = default);
    Task DisconnectAsync(string deviceIdentifier, CancellationToken cancellationToken = default);
    Task<PullEventsResult> PullEventsAsync(IReadOnlyCollection<string> deviceIdentifiers, CancellationToken cancellationToken = default);
    /// <summary>Activate inactive device via HCNetSDK NET_DVR_ActivateDevice (direct TCP). Returns (Success, Message).</summary>
    Task<(bool Success, string? Message)> TryActivateViaSdkAsync(string ipAddress, int port, string password, CancellationToken cancellationToken = default);
    /// <summary>Получить количество дверей через SDK (NET_DVR_GetDeviceAbility ACS_ABILITY). При ошибке или недоступности SDK — null.</summary>
    Task<int?> TryGetDoorCountViaSdkAsync(string deviceIdentifier, string ipAddress, int port, string username, string password, CancellationToken cancellationToken = default);
}
