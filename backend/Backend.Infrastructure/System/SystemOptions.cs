namespace Backend.Infrastructure.System;

/// <summary>Глобальные настройки приложения (часовой пояс и т.д.).</summary>
public sealed class SystemOptions
{
    public const string SectionName = "System";

    /// <summary>Идентификатор часового пояса (IANA, напр. Europe/Moscow, или UTC). Используется для Valid beginTime/endTime при синхронизации на устройства Hikvision.</summary>
    public string TimezoneId { get; set; } = "UTC";
}
