using System.Collections.Concurrent;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;
using System.Xml.Linq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Backend.Infrastructure.Devices.Sdk;

/// <summary>
/// SADP (Search Active Device Protocol) — полная реализация по реверс-инжинирингу Sadp.dll.
/// Использует 4 параллельных канала обнаружения как в оригинальной утилите Hikvision.
/// </summary>
public sealed class SadpDiscoveryService
{
    private readonly ILogger<SadpDiscoveryService> _logger;
    private readonly SadpOptions _options;

    // Hikvision multicast (SSDP-подобный)
    private static readonly IPAddress MulticastHikvision = IPAddress.Parse("239.255.255.250");
    private const int PortHikvision = 37020;

    // Dahua multicast (альтернативный)
    private static readonly IPAddress MulticastDahua = IPAddress.Parse("239.255.255.251");
    private const int PortDahua = 37810;

    public SadpDiscoveryService(ILogger<SadpDiscoveryService> logger, IOptions<SadpOptions> options)
    {
        _logger = logger;
        _options = options.Value;
    }

    /// <summary>
    /// Запуск поиска устройств по всем 4 каналам параллельно.
    /// </summary>
    /// <param name="progress">При обнаружении нового устройства — Report для streaming.</param>
    public async Task<IReadOnlyCollection<SdkDiscoveredDevice>> DiscoverAsync(
        CancellationToken cancellationToken = default,
        IProgress<SdkDiscoveredDevice>? progress = null)
    {
        var timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(timeout);

        var discovered = new ConcurrentDictionary<string, SdkDiscoveredDevice>(StringComparer.OrdinalIgnoreCase);
        var probeUuid = Guid.NewGuid().ToString("N").ToUpperInvariant();
        var probeBytes = CreateProbeBytes(probeUuid, null, "inquiry");
        var probeV32Bytes = CreateProbeBytes(probeUuid, null, "inquiry_v32");

        var tasks = new List<Task>();

        // 1. Multicast Hikvision (239.255.255.250:37020)
        if (_options.MulticastEnabled)
        {
            tasks.Add(RunMulticastChannelAsync("Multicast", MulticastHikvision, PortHikvision, probeBytes, probeV32Bytes, discovered, progress, cts.Token));
        }

        // 2. Multicast Local / Dahua (239.255.255.251:37810)
        if (_options.MulticastEnabled)
        {
            tasks.Add(RunMulticastChannelAsync("MulticastLocal", MulticastDahua, PortDahua, probeBytes, probeV32Bytes, discovered, progress, cts.Token));
        }

        // 3. UDP Subnet — broadcast по каждой подсети
        tasks.Add(RunUdpSubnetChannelAsync(probeBytes, probeV32Bytes, discovered, progress, cts.Token));

        // 4. PCAP — пассивный перехват (WinPcap/Npcap)
        if (_options.PcapEnabled && OperatingSystem.IsWindows())
        {
            tasks.Add(RunPcapChannelAsync(discovered, progress, cts.Token));
        }

        try
        {
            await Task.WhenAll(tasks);
        }
        catch (OperationCanceledException)
        {
            // Timeout — нормально
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SADP discovery: один или несколько каналов завершились с ошибкой.");
        }

        var result = discovered.Values
            .OrderBy(x => x.IpAddress)
            .ThenBy(x => x.Port)
            .ToArray();

        _logger.LogInformation(
            "SADP discovery completed: {Count} device(s) found (multicast={Multicast}, pcap={Pcap}, timeout={Timeout}s)",
            result.Length, _options.MulticastEnabled, _options.PcapEnabled, _options.TimeoutSeconds);

        return result;
    }

    private static byte[] CreateProbeBytes(string uuid, string? mac, string types)
    {
        var probe = new XElement("Probe",
            new XElement("Uuid", uuid),
            mac != null ? new XElement("MAC", mac) : null,
            new XElement("Types", types));
        var xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + probe.ToString();
        return Encoding.UTF8.GetBytes(xml);
    }

    /// <summary>
    /// Канал 1 и 2: Multicast — рассылка Probe на multicast-адрес и приём ответов.
    /// </summary>
    private async Task RunMulticastChannelAsync(
        string channelName,
        IPAddress multicastAddr,
        int port,
        byte[] probeBytes,
        byte[] probeV32Bytes,
        ConcurrentDictionary<string, SdkDiscoveredDevice> discovered,
        IProgress<SdkDiscoveredDevice>? progress,
        CancellationToken cancellationToken)
    {
        var broadcastTargets = ResolveBroadcastTargets().ToArray();
        if (broadcastTargets.Length == 0)
        {
            _logger.LogDebug("SADP {Channel}: no network interfaces.", channelName);
            return;
        }

        var tasks = broadcastTargets.Select(async target =>
        {
            var (localIp, _) = target;
            try
            {
                using var udp = new UdpClient(AddressFamily.InterNetwork);
                udp.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
                udp.Client.Bind(new IPEndPoint(localIp, port));
                udp.EnableBroadcast = true;
                udp.JoinMulticastGroup(multicastAddr, localIp);

                var multicastEp = new IPEndPoint(multicastAddr, port);

                var sendProbes = async () =>
                {
                    for (var i = 0; i < 8 && !cancellationToken.IsCancellationRequested; i++)
                    {
                        await udp.SendAsync(probeBytes, multicastEp);
                        await udp.SendAsync(probeV32Bytes, multicastEp);
                        await Task.Delay(TimeSpan.FromSeconds(3), cancellationToken);
                    }
                };

                var receiveLoop = async () =>
                {
                    while (!cancellationToken.IsCancellationRequested)
                    {
                        try
                        {
                            var result = await udp.ReceiveAsync(cancellationToken);
                            var xml = Encoding.UTF8.GetString(result.Buffer);
                            var device = ParseProbeMatch(xml, result.RemoteEndPoint.Address.ToString());
                            if (device is not null)
                            {
                                var key = $"{device.IpAddress}:{device.Port}";
                                if (discovered.TryAdd(key, device))
                                    progress?.Report(device);
                            }
                        }
                        catch (OperationCanceledException)
                        {
                            break;
                        }
                    }
                };

                await Task.WhenAll(sendProbes(), receiveLoop());
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "SADP {Channel} failed for {Ip}", channelName, localIp);
            }
        });

        await Task.WhenAll(tasks);
    }

    /// <summary>
    /// Канал 3: UDP Subnet — broadcast Probe в каждую подсеть.
    /// </summary>
    private async Task RunUdpSubnetChannelAsync(
        byte[] probeBytes,
        byte[] probeV32Bytes,
        ConcurrentDictionary<string, SdkDiscoveredDevice> discovered,
        IProgress<SdkDiscoveredDevice>? progress,
        CancellationToken cancellationToken)
    {
        var broadcastTargets = ResolveBroadcastTargets().ToArray();
        if (broadcastTargets.Length == 0)
        {
            return;
        }

        var tasks = broadcastTargets.Select(async target =>
        {
            var (localIp, broadcastIp) = target;
            try
            {
                using var udp = new UdpClient(AddressFamily.InterNetwork);
                udp.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
                udp.Client.Bind(new IPEndPoint(localIp, PortHikvision));
                udp.EnableBroadcast = true;
                udp.JoinMulticastGroup(MulticastHikvision, localIp);

                var multicastEp = new IPEndPoint(MulticastHikvision, PortHikvision);
                var broadcastEp = new IPEndPoint(broadcastIp, PortHikvision);

                var sendProbes = async () =>
                {
                    for (var i = 0; i < 8 && !cancellationToken.IsCancellationRequested; i++)
                    {
                        await udp.SendAsync(probeBytes, multicastEp);
                        await udp.SendAsync(probeBytes, broadcastEp);
                        await udp.SendAsync(probeV32Bytes, multicastEp);
                        await udp.SendAsync(probeV32Bytes, broadcastEp);
                        await Task.Delay(TimeSpan.FromSeconds(3), cancellationToken);
                    }
                };

                var receiveLoop = async () =>
                {
                    while (!cancellationToken.IsCancellationRequested)
                    {
                        try
                        {
                            var result = await udp.ReceiveAsync(cancellationToken);
                            var xml = Encoding.UTF8.GetString(result.Buffer);
                            var device = ParseProbeMatch(xml, result.RemoteEndPoint.Address.ToString());
                            if (device is not null)
                            {
                                var key = $"{device.IpAddress}:{device.Port}";
                                if (discovered.TryAdd(key, device))
                                    progress?.Report(device);
                            }
                        }
                        catch (OperationCanceledException)
                        {
                            break;
                        }
                    }
                };

                await Task.WhenAll(sendProbes(), receiveLoop());
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "SADP UDP Subnet failed for {Local} -> {Broadcast}", localIp, broadcastIp);
            }
        });

        await Task.WhenAll(tasks);
    }

    /// <summary>
    /// Канал 4: PCAP — raw Ethernet broadcast через Npcap/WinPcap.
    /// </summary>
    private async Task RunPcapChannelAsync(
        ConcurrentDictionary<string, SdkDiscoveredDevice> discovered,
        IProgress<SdkDiscoveredDevice>? progress,
        CancellationToken cancellationToken)
    {
        var pcapDevices = await SadpRawDiscovery.TryDiscoverAsync(_logger, cancellationToken);
        foreach (var d in pcapDevices)
        {
            var key = $"{d.IpAddress}:{d.Port}";
            if (discovered.TryAdd(key, d))
                progress?.Report(d);
        }
    }

    private static IEnumerable<(IPAddress LocalIp, IPAddress BroadcastIp)> ResolveBroadcastTargets()
    {
        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (nic.OperationalStatus != OperationalStatus.Up) continue;

            foreach (var uni in nic.GetIPProperties().UnicastAddresses)
            {
                if (uni.Address.AddressFamily != AddressFamily.InterNetwork || uni.IPv4Mask is null) continue;

                var ip = uni.Address;
                var mask = uni.IPv4Mask;
                var ipUInt = ToUInt32(ip);
                var maskUInt = ToUInt32(mask);
                var broadcast = ipUInt | ~maskUInt;
                var broadcastIp = FromUInt32(broadcast);

                yield return (ip, broadcastIp);
            }
        }
    }

    private static uint ToUInt32(IPAddress address)
    {
        var bytes = address.GetAddressBytes();
        return ((uint)bytes[0] << 24) | ((uint)bytes[1] << 16) | ((uint)bytes[2] << 8) | bytes[3];
    }

    private static IPAddress FromUInt32(uint value)
    {
        return new IPAddress([
            (byte)(value >> 24), (byte)(value >> 16), (byte)(value >> 8), (byte)value
        ]);
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
            var activatedRaw = Val("Activated");

            if (string.IsNullOrWhiteSpace(ip)) return null;

            var identifier = string.IsNullOrWhiteSpace(serial) ? $"SADP-{ip.Replace('.', '-')}-{port}" : serial;
            var name = string.IsNullOrWhiteSpace(model) ? $"Hikvision {ip}" : model;
            var macFormatted = !string.IsNullOrWhiteSpace(mac) ? mac.Replace('-', ':') : null;
            bool? isActivated = ParseActivated(activatedRaw);

            return new SdkDiscoveredDevice(identifier, name, ip, port, model, deviceType, macFormatted, firmware, isActivated);
        }
        catch
        {
            return null;
        }
    }

    private static bool? ParseActivated(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var v = raw.Trim().ToLowerInvariant();
        if (v is "true" or "1" or "yes") return true;
        if (v is "false" or "0" or "no") return false;
        return null;
    }
}
