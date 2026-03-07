using System.Net;
using System.Runtime.InteropServices;

namespace Backend.Infrastructure.Devices;

/// <summary>
/// ARP-based reachability check. Uses Win32 SendARP (iphlpapi.dll).
/// Работает только на Windows, в одной подсети.
/// </summary>
public static class ArpReachabilityHelper
{
    [DllImport("iphlpapi.dll", ExactSpelling = true)]
    private static extern int SendARP(uint destIp, uint srcIp, byte[] macAddr, ref int macAddrLen);

    /// <summary>
    /// Проверяет доступность хоста по ARP. Возвращает true, если получен ARP-ответ.
    /// </summary>
    public static bool IsReachable(string ipAddress)
    {
        if (!OperatingSystem.IsWindows())
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(ipAddress) || !IPAddress.TryParse(ipAddress.Trim(), out var ip))
        {
            return false;
        }

        if (ip.AddressFamily != global::System.Net.Sockets.AddressFamily.InterNetwork)
        {
            return false;
        }

        var bytes = ip.GetAddressBytes();
        if (bytes.Length != 4) return false;
        var destIp = (uint)(bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24));

        var macAddr = new byte[6];
        var macLen = macAddr.Length;
        var result = SendARP(destIp, 0, macAddr, ref macLen);

        return result == 0 && macLen > 0;
    }
}
