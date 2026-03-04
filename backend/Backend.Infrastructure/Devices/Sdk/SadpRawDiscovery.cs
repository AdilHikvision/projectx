using System.Collections.Concurrent;
using System.Net;
using System.Net.NetworkInformation;
using System.Text;
using System.Xml.Linq;
using Microsoft.Extensions.Logging;
using PacketDotNet;
using SharpPcap;
using SharpPcap.LibPcap;

namespace Backend.Infrastructure.Devices.Sdk;

/// <summary>
/// SADP discovery via WinPcap/Npcap — raw Ethernet, как SADP Tool.
/// Требует установленный Npcap (https://npcap.com).
/// </summary>
public static class SadpRawDiscovery
{
    private const string ProbeXml = "<?xml version=\"1.0\" encoding=\"utf-8\"?><Probe><Uuid>13A888A9-F1B1-4020-AE9F-05607682D23B</Uuid><Types>inquiry</Types></Probe>";
    private const int SadpPort = 37020;

    public static async Task<IReadOnlyCollection<SdkDiscoveredDevice>> TryDiscoverAsync(
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        if (!OperatingSystem.IsWindows())
        {
            return [];
        }

        try
        {
            var devices = LibPcapLiveDeviceList.Instance;
            if (devices.Count == 0)
            {
                logger.LogDebug("SADP Raw: no Npcap/WinPcap devices. Install Npcap from https://npcap.com");
                return [];
            }

            var targets = ResolveInterfaceTargets().ToList();
            if (targets.Count == 0)
            {
                return [];
            }

            var discovered = new ConcurrentDictionary<string, SdkDiscoveredDevice>(StringComparer.OrdinalIgnoreCase);
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(35));

            var probeBytes = Encoding.UTF8.GetBytes(ProbeXml);

            var tasks = targets.Select(async target =>
            {
                var (localIp, broadcastIp, mac) = target;
                LibPcapLiveDevice? device = null;
                try
                {
                    device = FindDeviceByAddress(devices, localIp, mac);
                    if (device is null) return;

                    device.Open(DeviceModes.Promiscuous, 1000);

                    var broadcastMac = PhysicalAddress.Parse("FF-FF-FF-FF-FF-FF");
                    var srcMac = mac ?? broadcastMac;

                    var udpPayload = new byte[probeBytes.Length];
                    Array.Copy(probeBytes, udpPayload, probeBytes.Length);

                    var udpPacket = new UdpPacket(0, SadpPort) { PayloadData = udpPayload };
                    var ipPacket = new IPv4Packet(localIp, broadcastIp) { PayloadPacket = udpPacket };
                    var ethPacket = new EthernetPacket(srcMac, broadcastMac, EthernetType.IPv4) { PayloadPacket = ipPacket };

                    ipPacket.UpdateIPChecksum();
                    udpPacket.UpdateUdpChecksum();

                    void SendProbe() { device!.SendPacket(ethPacket); }

                    device.OnPacketArrival += (_, e) =>
                    {
                        if (cts.Token.IsCancellationRequested) return;
                        try
                        {
                            var raw = e.GetPacket();
                            var packet = Packet.ParsePacket(raw.LinkLayerType, raw.Data);
                            if (packet.Extract<UdpPacket>() is not { } udp) return;
                            if (udp.SourcePort != SadpPort && udp.DestinationPort != SadpPort) return;

                            var payload = udp.PayloadData;
                            if (payload is null or { Length: 0 }) return;

                            var xml = Encoding.UTF8.GetString(payload);
                            var remoteIp = packet.Extract<IPv4Packet>()?.SourceAddress?.ToString();
                            var dev = ParseProbeMatch(xml, remoteIp);
                            if (dev is not null)
                            {
                                var key = $"{dev.IpAddress}:{dev.Port}";
                                discovered.TryAdd(key, dev);
                            }
                        }
                        catch { /* ignore */ }
                    };

                    device.StartCapture();
                    for (var i = 0; i < 6 && !cts.Token.IsCancellationRequested; i++)
                    {
                        SendProbe();
                        await Task.Delay(TimeSpan.FromSeconds(4), cts.Token);
                    }
                    device.StopCapture();
                }
                catch (OperationCanceledException) { }
                catch (Exception ex)
                {
                    logger.LogDebug(ex, "SADP Raw: failed for {Ip}", localIp);
                }
                finally
                {
                    device?.Close();
                }
            });

            await Task.WhenAll(tasks);

            return discovered.Values.OrderBy(x => x.IpAddress).ThenBy(x => x.Port).ToArray();
        }
        catch (DllNotFoundException)
        {
            logger.LogDebug("SADP Raw: Npcap not installed. Install from https://npcap.com");
            return [];
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "SADP Raw discovery failed.");
            return [];
        }
    }

    private static LibPcapLiveDevice? FindDeviceByAddress(
        LibPcapLiveDeviceList devices,
        IPAddress localIp,
        PhysicalAddress? mac)
    {
        foreach (LibPcapLiveDevice dev in devices)
        {
            var addr = dev.Addresses?.FirstOrDefault(a =>
                a.Addr?.ipAddress?.AddressFamily == global::System.Net.Sockets.AddressFamily.InterNetwork);
            if (addr?.Addr?.ipAddress?.ToString() == localIp.ToString())
                return dev;
            if (mac is not null && dev.MacAddress?.ToString() == mac.ToString())
                return dev;
        }
        return null;
    }

    private static IEnumerable<(IPAddress LocalIp, IPAddress BroadcastIp, PhysicalAddress? Mac)> ResolveInterfaceTargets()
    {
        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (nic.OperationalStatus != OperationalStatus.Up) continue;

            foreach (var uni in nic.GetIPProperties().UnicastAddresses)
            {
                if (uni.Address.AddressFamily != global::System.Net.Sockets.AddressFamily.InterNetwork || uni.IPv4Mask is null)
                    continue;

                var ip = uni.Address;
                var mask = uni.IPv4Mask;
                var ipUInt = ((uint)ip.GetAddressBytes()[0] << 24) | ((uint)ip.GetAddressBytes()[1] << 16) |
                             ((uint)ip.GetAddressBytes()[2] << 8) | ip.GetAddressBytes()[3];
                var maskUInt = ((uint)mask.GetAddressBytes()[0] << 24) | ((uint)mask.GetAddressBytes()[1] << 16) |
                               ((uint)mask.GetAddressBytes()[2] << 8) | mask.GetAddressBytes()[3];
                var broadcast = ipUInt | ~maskUInt;
                var broadcastIp = new IPAddress([
                    (byte)(broadcast >> 24), (byte)(broadcast >> 16), (byte)(broadcast >> 8), (byte)broadcast
                ]);

                yield return (ip, broadcastIp, nic.GetPhysicalAddress());
            }
        }
    }

    private static SdkDiscoveredDevice? ParseProbeMatch(string xml, string? fallbackIp)
    {
        try
        {
            var doc = XDocument.Parse(xml);
            var root = doc.Root;
            if (root?.Name.LocalName != "ProbeMatch") return null;

            string? Val(string name) =>
                root.Descendants().FirstOrDefault(x => string.Equals(x.Name.LocalName, name, StringComparison.OrdinalIgnoreCase))?.Value?.Trim();

            var ip = Val("IPv4Address") ?? fallbackIp ?? "";
            var cmdPort = int.TryParse(Val("CommandPort"), out var cp) ? cp : 0;
            var httpPort = int.TryParse(Val("HttpPort"), out var hp) ? hp : 0;
            var port = cmdPort > 0 ? cmdPort : (httpPort > 0 ? httpPort : 8000);
            var serial = Val("DeviceSN");
            var mac = Val("MAC");
            var firmware = Val("SoftwareVersion");
            var model = Val("DeviceDescription");
            var deviceType = Val("DeviceType");

            if (string.IsNullOrWhiteSpace(ip)) return null;

            var identifier = string.IsNullOrWhiteSpace(serial) ? $"SADP-{ip.Replace('.', '-')}-{port}" : serial;
            var name = string.IsNullOrWhiteSpace(model) ? $"Hikvision {ip}" : model;
            var macFormatted = !string.IsNullOrWhiteSpace(mac) ? mac.Replace('-', ':') : null;

            return new SdkDiscoveredDevice(identifier, name, ip, port, model, deviceType, macFormatted, firmware);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// SADP activate: отправка probe с Types=activate, MAC и Password на устройство.
    /// </summary>
    public static async Task<bool> TryActivateAsync(
        string ipAddress,
        string macAddress,
        string password,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ipAddress) || string.IsNullOrWhiteSpace(macAddress) || string.IsNullOrWhiteSpace(password))
        {
            return false;
        }

        var mac = macAddress.Replace('-', ':').Trim();
        var uuid = "13A888A9-F1B1-4020-AE9F-05607682D23B";
        var probe = new XElement("Probe",
            new XElement("Uuid", uuid),
            new XElement("MAC", mac),
            new XElement("Types", "activate"),
            new XElement("Password", password));
        var probeXml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + probe.ToString();
        var probeBytes = Encoding.UTF8.GetBytes(probeXml);

        try
        {
            using var udp = new global::System.Net.Sockets.UdpClient();
            udp.EnableBroadcast = true;
            var targetEp = new IPEndPoint(IPAddress.Parse(ipAddress), SadpPort);
            await udp.SendAsync(probeBytes, probeBytes.Length, targetEp);
            await Task.Delay(500, cancellationToken);
            await udp.SendAsync(probeBytes, probeBytes.Length, targetEp);
            logger.LogInformation("SADP activate sent to {Ip} for MAC {Mac}", ipAddress, mac);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "SADP activate failed for {Ip}", ipAddress);
            return false;
        }
    }
}
