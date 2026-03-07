using System.Collections.Concurrent;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
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
    private static readonly IPAddress MulticastAddr = IPAddress.Parse("239.255.255.250");

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

    /// <summary>
    /// Возвращает MAC-адрес для IP, если интерфейс найден (в т.ч. с OperationalStatus != Up).
    /// </summary>
    private static PhysicalAddress? TryGetMacForIp(IPAddress targetIp)
    {
        var targetStr = targetIp.ToString();
        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            foreach (var uni in nic.GetIPProperties().UnicastAddresses)
            {
                if (uni.Address.AddressFamily != global::System.Net.Sockets.AddressFamily.InterNetwork)
                    continue;
                if (uni.Address.ToString() == targetStr)
                {
                    var mac = nic.GetPhysicalAddress();
                    return mac is not null && mac.GetAddressBytes().Length == 6 ? mac : null;
                }
            }
        }
        return null;
    }

    /// <summary>
    /// Возвращает только интерфейсы, находящиеся в той же подсети, что и устройство.
    /// Если ActivateBindIp задан — используем ТОЛЬКО его (устройство может быть на другом физическом адаптере).
    /// </summary>
    private static IEnumerable<(IPAddress LocalIp, IPAddress BroadcastIp, PhysicalAddress? Mac)> ResolveInterfaceTargetsForActivation(IPAddress deviceIp, string? activateBindIp)
    {
        var deviceUInt = ToUInt32(deviceIp);
        const uint mask24 = 0xFFFFFF00u;
        var deviceNetwork24 = deviceUInt & mask24;

        if (!string.IsNullOrWhiteSpace(activateBindIp) && IPAddress.TryParse(activateBindIp.Trim(), out var bindIp))
        {
            if ((ToUInt32(bindIp) & mask24) == deviceNetwork24)
            {
                var mac = TryGetMacForIp(bindIp);
                var broadcast = ToUInt32(bindIp) | ~mask24;
                var broadcastIp = new IPAddress([
                    (byte)(broadcast >> 24), (byte)(broadcast >> 16), (byte)(broadcast >> 8), (byte)broadcast
                ]);
                yield return (bindIp, broadcastIp, mac);
                yield break;
            }
        }

        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (nic.OperationalStatus != OperationalStatus.Up) continue;

            foreach (var uni in nic.GetIPProperties().UnicastAddresses)
            {
                if (uni.Address.AddressFamily != global::System.Net.Sockets.AddressFamily.InterNetwork || uni.IPv4Mask is null)
                    continue;

                var ip = uni.Address;
                var mask = uni.IPv4Mask;
                var maskUInt = ToUInt32(mask);
                var localNetwork = ToUInt32(ip) & maskUInt;
                var deviceNetwork = deviceUInt & maskUInt;
                if (localNetwork != deviceNetwork) continue;

                var ipUInt = ToUInt32(ip);
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

    /// <summary>
    /// Проверяет, находится ли устройство в одной подсети с ПК.
    /// </summary>
    /// <param name="deviceIp">IP устройства.</param>
    /// <param name="localSubnetInfo">Информация о подсетях ПК (для сообщения об ошибке).</param>
    /// <param name="activateBindIp">Опциональный IP интерфейса (например 192.0.0.1), если backend не видит этот адаптер автоматически.</param>
    /// <returns>true, если устройство в той же подсети, что и хотя бы один интерфейс ПК или activateBindIp.</returns>
    public static bool IsDeviceInSameSubnet(IPAddress deviceIp, out string? localSubnetInfo, string? activateBindIp = null)
    {
        var localSubnets = new List<string>();
        var deviceUInt = ToUInt32(deviceIp);

        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (nic.OperationalStatus != OperationalStatus.Up) continue;

            foreach (var uni in nic.GetIPProperties().UnicastAddresses)
            {
                if (uni.Address.AddressFamily != global::System.Net.Sockets.AddressFamily.InterNetwork || uni.IPv4Mask is null)
                    continue;

                var localIp = uni.Address;
                var mask = uni.IPv4Mask;
                var maskUInt = ToUInt32(mask);
                var localNetwork = ToUInt32(localIp) & maskUInt;
                var deviceNetwork = deviceUInt & maskUInt;

                var prefixLen = CountMaskBits(mask);
                var subnetStr = $"{localIp}/{prefixLen}";
                if (!localSubnets.Contains(subnetStr))
                    localSubnets.Add(subnetStr);

                if (localNetwork == deviceNetwork)
                {
                    localSubnetInfo = string.Join(", ", localSubnets);
                    return true;
                }
            }
        }

        // ActivateBindIp: если адаптер не виден (Docker, WSL, или OperationalStatus != Up), проверяем вручную
        if (!string.IsNullOrWhiteSpace(activateBindIp) && IPAddress.TryParse(activateBindIp.Trim(), out var bindIp))
        {
            const uint mask24 = 0xFFFFFF00u;
            var bindNetwork = ToUInt32(bindIp) & mask24;
            var devNetwork = deviceUInt & mask24;
            if (bindNetwork == devNetwork)
            {
                var subnetStr = $"{bindIp}/24";
                if (!localSubnets.Contains(subnetStr))
                    localSubnets.Add(subnetStr);
                localSubnetInfo = string.Join(", ", localSubnets);
                return true;
            }
        }

        localSubnetInfo = localSubnets.Count > 0 ? string.Join(", ", localSubnets) : "нет активных интерфейсов";
        return false;
    }

    private static int CountMaskBits(IPAddress mask)
    {
        var bits = 0;
        foreach (var b in mask.GetAddressBytes())
        {
            var v = b;
            while (v != 0) { bits += v & 1; v >>= 1; }
        }
        return bits;
    }

    /// <summary>
    /// SADP activate: getencryptstring → шифрование пароля → activate.
    /// Активация возможна только если устройство в той же подсети, что и ПК.
    /// </summary>
    /// <returns>(Success, Message) — при несовпадении подсетей Success=false, Message содержит предупреждение.</returns>
    public static async Task<(bool Success, string? Message)> TryActivateAsync(
        string ipAddress,
        string macAddress,
        string password,
        ILogger logger,
        CancellationToken cancellationToken = default,
        SadpOptions? options = null)
    {
        if (string.IsNullOrWhiteSpace(ipAddress) || string.IsNullOrWhiteSpace(macAddress) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning("SADP activate: missing params (IP={Ip}, MAC={Mac}, PasswordLen={Len})", ipAddress ?? "null", macAddress ?? "null", password?.Length ?? 0);
            return (false, "IP, MAC и пароль обязательны.");
        }

        var deviceIp = IPAddress.Parse(ipAddress);

        if (!IsDeviceInSameSubnet(deviceIp, out var localSubnetInfo, options?.ActivateBindIp))
        {
            var msg = $"Устройство {ipAddress} не в вашей подсети. Ваши подсети: {localSubnetInfo}. Активация возможна только в той же подсети.";
            logger.LogWarning("SADP activate: {Msg}", msg);
            return (false, msg);
        }

        logger.LogInformation("SADP activate: ========== START ========== IP={Ip} MAC={Mac} (в той же подсети)", ipAddress, macAddress);

        var macNorm = macAddress.Replace('-', ':').Trim().ToUpperInvariant();
        var macHyphens = macNorm.Replace(":", "-");
        var uuid = "13A888A9-F1B1-4020-AE9F-05607682D23B";
        var deviceMac = PhysicalAddress.Parse(macHyphens);

        // --- STEP 1: getencryptstring ---
        logger.LogInformation("SADP activate: step 1 — getencryptstring | MAC={Mac} | отправка XML с Types=getencryptstring", macHyphens);
        var getEncryptStrXml = CreateProbeXml(uuid, macHyphens, "getencryptstring");
        logger.LogInformation("SADP activate: step 1 — XML отправлен: {Xml}", getEncryptStrXml);
        var encryptString = await RequestWithRawResponseAsync(getEncryptStrXml, deviceIp, deviceMac, "EncryptString", logger, cancellationToken, options, useSubnetFilter: true);

        var passwordToSend = password;
        if (!string.IsNullOrWhiteSpace(encryptString))
        {
            var preview = encryptString.Length > 80 ? encryptString[..80] + "..." : encryptString;
            logger.LogInformation("SADP activate: step 1 — устройство вернуло EncryptString (len={Len}): {Preview}", encryptString.Length, preview);
            logger.LogInformation("SADP activate: step 2 — шифрование пароля | EncryptString есть, проверка ActivateRsaPrivateKeyPath");
            var rsaPem = options?.ActivateRsaPrivateKeyPath is { } path && File.Exists(path)
                ? await File.ReadAllTextAsync(path, cancellationToken)
                : null;
            if (!string.IsNullOrWhiteSpace(rsaPem))
            {
                logger.LogInformation("SADP activate: step 2 — RSA ключ найден ({Path}), шифрую пароль RSA+AES", options?.ActivateRsaPrivateKeyPath);
                var encrypted = SadpActivationCrypto.EncryptPassword(encryptString, password, rsaPem);
                if (!string.IsNullOrWhiteSpace(encrypted))
                {
                    passwordToSend = encrypted;
                    logger.LogInformation("SADP activate: step 2 — пароль зашифрован RSA+AES (len={Len})", encrypted.Length);
                }
                else
                {
                    logger.LogWarning("SADP activate: step 2 — шифрование не удалось, использую plain password");
                }
            }
            else
            {
                logger.LogInformation("SADP activate: step 2 — ActivateRsaPrivateKeyPath не задан или файл не найден, использую plain password");
            }
        }
        else
        {
            logger.LogInformation("SADP activate: step 2 — EncryptString не получен (таймаут/нет ответа), использую plain password fallback");
        }

        // --- STEP 3: activate / activate_v31 ---
        var typesToTry = new[] { "activate", "activate_v31" };
        foreach (var activateType in typesToTry)
        {
            logger.LogInformation("SADP activate: step 3 — отправка activate | Types={Type} | MAC={Mac}", activateType, macHyphens);
            var activateXml = CreateActivateXml(uuid, macHyphens, activateType, passwordToSend);
            var xmlForLog = activateXml.Contains("<Password>") ? Regex.Replace(activateXml, @"<Password>[^<]*</Password>", "<Password>***</Password>") : activateXml;
            logger.LogInformation("SADP activate: step 3 — XML отправлен (Password скрыт): {Xml}", xmlForLog);
            var response = await RequestWithRawResponseAsync(activateXml, deviceIp, deviceMac, "Result", logger, cancellationToken, options, useSubnetFilter: true);

            if (!string.IsNullOrWhiteSpace(response))
            {
                logger.LogInformation("SADP activate: step 3 — ответ устройства ({Type}): {Response}", activateType, response);
                if (response.Contains("Succ!", StringComparison.OrdinalIgnoreCase) || 
                    response.Contains("Has activated!", StringComparison.OrdinalIgnoreCase))
                {
                    logger.LogInformation("SADP activate: SUCCESS — {Result}", response.Trim());
                    return (true, null);
                }
                
                if (response.Contains("Password error", StringComparison.OrdinalIgnoreCase) || 
                    response.Contains("failed", StringComparison.OrdinalIgnoreCase))
                {
                    logger.LogWarning("SADP activate: step 3 — ошибка ({Type}): {Response}. Пробую следующий тип.", activateType, response);
                }
                else if (response.Contains("Device deny", StringComparison.OrdinalIgnoreCase))
                {
                    logger.LogWarning("SADP activate: устройство отклонило запрос (Device deny). Возможна блокировка или неверное состояние.");
                    return (false, "Устройство отклонило запрос (возможна блокировка или неверное состояние).");
                }
            }
            else
            {
                logger.LogWarning("SADP activate: step 3 — нет ответа для {Type} (таймаут)", activateType);
            }
        }

        logger.LogWarning("SADP activate: ========== FAIL ========== таймаут или ошибка устройства после попыток activate и activate_v31");
        return (false, "Активация не удалась (таймаут или ошибка устройства).");
    }

    private static string CreateProbeXml(string uuid, string mac, string types)
    {
        var probe = new XElement("Probe",
            new XElement("Uuid", uuid),
            new XElement("MAC", mac),
            new XElement("Types", types));
        return "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + probe.ToString();
    }

    private static string CreateActivateXml(string uuid, string mac, string type, string password)
    {
        var probe = new XElement("Probe",
            new XElement("Uuid", uuid),
            new XElement("MAC", mac),
            new XElement("Types", type),
            new XElement("Password", password));
        return "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + probe.ToString();
    }

    /// <summary>
    /// Универсальный запрос-ответ: отправляет через RAW+UDP и ловит ответ через RAW+UDP.
    /// Позволяет работать через подсети L2.
    /// </summary>
    /// <param name="useSubnetFilter">Если true — использовать только интерфейсы в той же подсети, что и устройство (для активации).</param>
    private static async Task<string?> RequestWithRawResponseAsync(
        string xml,
        IPAddress deviceIp,
        PhysicalAddress deviceMac,
        string expectedNode,
        ILogger logger,
        CancellationToken ct,
        SadpOptions? options,
        bool useSubnetFilter = false)
    {
        var payloadContent = Encoding.UTF8.GetBytes(xml);
        var resultTcs = new TaskCompletionSource<string?>(TaskCreationOptions.RunContinuationsAsynchronously);
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        linkedCts.CancelAfter(TimeSpan.FromSeconds(10));

        var interfaces = useSubnetFilter
            ? ResolveInterfaceTargetsForActivation(deviceIp, options?.ActivateBindIp).ToList()
            : ResolveInterfaceTargets().ToList();
        if (interfaces.Count == 0 && useSubnetFilter)
        {
            logger.LogWarning("SADP activate: 0 interfaces in same subnet, falling back to all interfaces");
            interfaces = ResolveInterfaceTargets().ToList();
        }
        var pcapDevices = OperatingSystem.IsWindows() ? LibPcapLiveDeviceList.Instance : null;
        var ifaceInfo = string.Join(", ", interfaces.Select(t => $"{t.Item1}{(t.Item3 != null ? " (pcap)" : " (udp)")}"));
        logger.LogInformation("SADP RequestWithRawResponse: {Ifaces} interfaces [{Info}], pcap={PcapCount}", interfaces.Count, ifaceInfo, pcapDevices?.Count ?? 0);

        // 1. Подготовка UDP слушателей на порту 37020 (устройство отвечает на этот порт)
        var udpClients = new List<(UdpClient Udp, IPAddress BroadcastIp)>();
        var receiveTasks = new List<Task>();

        foreach (var (localIp, broadcastIp, _) in interfaces)
        {
            try
            {
                var udp = new UdpClient(AddressFamily.InterNetwork);
                udp.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
                udp.EnableBroadcast = true;
                try { udp.Client.Bind(new IPEndPoint(localIp, SadpPort)); }
                catch { udp.Client.Bind(new IPEndPoint(localIp, 0)); }
                udp.JoinMulticastGroup(MulticastAddr, localIp);
                udpClients.Add((udp, broadcastIp));

                receiveTasks.Add(Task.Run(async () =>
                {
                    try
                    {
                        while (!linkedCts.Token.IsCancellationRequested)
                        {
                            var r = await udp.ReceiveAsync(linkedCts.Token);
                            var respXml = Encoding.UTF8.GetString(r.Buffer);
                            if (respXml.Contains("<ProbeMatch", StringComparison.OrdinalIgnoreCase))
                                logger.LogDebug("SADP recv UDP: {Preview}", respXml.Length > 200 ? respXml[..200] + "..." : respXml);
                            var val = ExtractNodeValue(respXml, expectedNode, deviceMac);
                            if (val is not null) resultTcs.TrySetResult(val);
                        }
                    }
                    catch { /* next */ }
                }));
            }
            catch { /* skip iface */ }
        }

        // 2. Подготовка RAW слушателей (Npcap)
        var activePcapDevices = new List<LibPcapLiveDevice>();
        if (pcapDevices is not null && pcapDevices.Count > 0)
        {
            foreach (var (localIp, _, mac) in interfaces)
            {
                if (mac is null) continue;
                var dev = FindDeviceByAddress(pcapDevices, localIp, mac);
                if (dev is null) continue;

                try
                {
                    dev.Open(DeviceModes.Promiscuous, 100);
                    dev.OnPacketArrival += (_, e) =>
                    {
                        if (linkedCts.Token.IsCancellationRequested) return;
                        try
                        {
                            var raw = e.GetPacket();
                            var packet = Packet.ParsePacket(raw.LinkLayerType, raw.Data);
                            var udp = packet.Extract<UdpPacket>();
                            if (udp is null || (udp.SourcePort != SadpPort && udp.SourcePort != 8000 && udp.DestinationPort != SadpPort && udp.DestinationPort != 8000)) return;

                            var payload = udp.PayloadData;
                            if (payload is null or { Length: 0 }) return;

                            var respXml = Encoding.UTF8.GetString(payload);
                            if (respXml.Contains("<ProbeMatch", StringComparison.OrdinalIgnoreCase))
                                logger.LogDebug("SADP recv PCAP: {Preview}", respXml.Length > 200 ? respXml[..200] + "..." : respXml);
                            var val = ExtractNodeValue(respXml, expectedNode, deviceMac);
                            if (val is not null) 
                            {
                                logger.LogDebug("SADP: response caught via RAW PCAP on {Iface}", localIp);
                                resultTcs.TrySetResult(val);
                            }
                        }
                        catch { /* ignore parse errors */ }
                    };
                    dev.StartCapture();
                    activePcapDevices.Add(dev);
                }
                catch { /* skip */ }
            }
        }

        // 3. Отправка пакетов (RAW + UDP)
        var sendLoop = Task.Run(async () =>
        {
            for (var i = 0; i < 4 && !linkedCts.Token.IsCancellationRequested; i++)
            {
                // Отправка через RAW (как Discovery — unicast на устройство + broadcast в подсеть)
                var broadcastMac = PhysicalAddress.Parse("FF-FF-FF-FF-FF-FF");
                foreach (var dev in activePcapDevices)
                {
                    try
                    {
                        var localIp = dev.Addresses.FirstOrDefault(a => a.Addr?.ipAddress?.AddressFamily == AddressFamily.InterNetwork)?.Addr?.ipAddress;
                        if (localIp is null) continue;

                        var broadcastIp = interfaces.FirstOrDefault(t => t.Item1.Equals(localIp)).Item2 ?? IPAddress.Broadcast;

                        // Unicast на устройство (37020 и 8000)
                        var udp = new UdpPacket(37020, 37020) { PayloadData = payloadContent };
                        var ip = new IPv4Packet(localIp, deviceIp) { PayloadPacket = udp };
                        var eth = new EthernetPacket(dev.MacAddress, deviceMac, EthernetType.IPv4) { PayloadPacket = ip };
                        ip.UpdateIPChecksum();
                        udp.UpdateUdpChecksum();
                        dev.SendPacket(eth);

                        var udp8000 = new UdpPacket(37020, 8000) { PayloadData = payloadContent };
                        var ip8000 = new IPv4Packet(localIp, deviceIp) { PayloadPacket = udp8000 };
                        var eth8000 = new EthernetPacket(dev.MacAddress, deviceMac, EthernetType.IPv4) { PayloadPacket = ip8000 };
                        ip8000.UpdateIPChecksum();
                        udp8000.UpdateUdpChecksum();
                        dev.SendPacket(eth8000);

                        // Broadcast в подсеть (как Discovery — устройства слушают broadcast)
                        var udpB = new UdpPacket(37020, 37020) { PayloadData = payloadContent };
                        var ipB = new IPv4Packet(localIp, broadcastIp) { PayloadPacket = udpB };
                        var ethB = new EthernetPacket(dev.MacAddress, broadcastMac, EthernetType.IPv4) { PayloadPacket = ipB };
                        ipB.UpdateIPChecksum();
                        udpB.UpdateUdpChecksum();
                        dev.SendPacket(ethB);
                    }
                    catch { }
                }

                // Отправка через UDP (subnet broadcast как в Discovery — 192.168.88.255 важнее 255.255.255.255)
                foreach (var (udp, broadcastIp) in udpClients)
                {
                    try
                    {
                        await udp.SendAsync(payloadContent, new IPEndPoint(MulticastAddr, SadpPort));
                        await udp.SendAsync(payloadContent, new IPEndPoint(broadcastIp, SadpPort));
                        await udp.SendAsync(payloadContent, new IPEndPoint(IPAddress.Broadcast, SadpPort));
                        await udp.SendAsync(payloadContent, new IPEndPoint(deviceIp, SadpPort));
                        await udp.SendAsync(payloadContent, new IPEndPoint(deviceIp, 8000));
                    }
                    catch { }
                }

                await Task.Delay(200, linkedCts.Token);
            }
        });

        // 4. Ожидание ответа
        try
        {
            var timeoutTask = Task.Delay(8500, linkedCts.Token);
            var completed = await Task.WhenAny(resultTcs.Task, timeoutTask);
            if (completed == resultTcs.Task)
            {
                return await resultTcs.Task;
            }
        }
        catch (OperationCanceledException) { }
        finally
        {
            linkedCts.Cancel();
            foreach (var dev in activePcapDevices) { try { dev.StopCapture(); dev.Close(); } catch { } }
            foreach (var (udp, _) in udpClients) { try { udp.Dispose(); } catch { } }
        }

        return null;
    }

    private static string? ExtractNodeValue(string xml, string nodeName, PhysicalAddress targetMac)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(xml) || !xml.Contains("<ProbeMatch")) return null;
            var doc = XDocument.Parse(xml);
            var root = doc.Root;
            if (root is null) return null;

            var mac = root.Descendants().FirstOrDefault(x => string.Equals(x.Name.LocalName, "MAC", StringComparison.OrdinalIgnoreCase))?.Value?.Trim()?.Replace(":", "-").ToUpperInvariant();
            if (!string.IsNullOrEmpty(mac))
            {
                var targetMacStr = targetMac.ToString().Replace(":", "-").ToUpperInvariant();
                if (mac != targetMacStr) return null;
            }

            var node = root.Descendants().FirstOrDefault(x => string.Equals(x.Name.LocalName, nodeName, StringComparison.OrdinalIgnoreCase));
            if (node is not null) return node.Value.Trim();

            // Специальный случай для Result — ищем в тексте ответа
            if (nodeName == "Result")
            {
                var text = root.Value ?? "";
                if (text.Contains("Succ!")) return "Succ!";
                if (text.Contains("Has activated!")) return "Has activated!";
                if (text.Contains("failed")) return "failed";
                if (text.Contains("Password error")) return "Password error!";
                if (text.Contains("Risk password")) return "Risk password!";
            }
            
            return null;
        }
        catch { return null; }
    }

    private static uint ToUInt32(IPAddress address)
    {
        var bytes = address.GetAddressBytes();
        return ((uint)bytes[0] << 24) | ((uint)bytes[1] << 16) | ((uint)bytes[2] << 8) | bytes[3];
    }

    private static IPAddress FromUInt32(uint value)
    {
        return new IPAddress([(byte)(value >> 24), (byte)(value >> 16), (byte)(value >> 8), (byte)value]);
    }
}
