namespace Backend.Infrastructure.Devices.Sdk;

/// <summary>
/// Конфигурация SADP discovery (аналог HCSadpSDK.xml).
/// </summary>
public sealed class SadpOptions
{
    public const string SectionName = "Sadp";

    /// <summary>Включить multicast-каналы (239.255.255.250, 239.255.255.251).</summary>
    public bool MulticastEnabled { get; set; } = true;

    /// <summary>Включить PCAP (WinPcap/Npcap) для raw Ethernet broadcast.</summary>
    public bool PcapEnabled { get; set; } = true;

    /// <summary>Таймаут операции поиска (секунды).</summary>
    public int TimeoutSeconds { get; set; } = 10;

    /// <summary>Интервал проверки IP (для фонового мониторинга, не используется в разовом Discover).</summary>
    public int CheckIpIntervalSeconds { get; set; } = 5;

    /// <summary>Путь к wpcap.dll (по умолчанию — системный Npcap).</summary>
    public string? PcapPath { get; set; }

    /// <summary>
    /// IP интерфейса для активации (если backend в Docker/WSL — укажите IP хоста в подсети устройства).
    /// Пример: устройство 192.0.0.64 → укажите 192.0.0.1 или IP вашего ПК в этой подсети.
    /// </summary>
    public string? ActivateBindIp { get; set; }

    /// <summary>
    /// Путь к PEM-файлу с RSA-приватным ключом для шифрования пароля при активации.
    /// Ключ извлекается из Sadp.dll (GetRsaPublicKey1024 / RsaDecryptByPrivateKey).
    /// Если не задан — используется plain password (fallback для старых устройств).
    /// </summary>
    public string? ActivateRsaPrivateKeyPath { get; set; }
}
