using System.Collections.Concurrent;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Reflection;
using System.Xml.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Sdk;

public sealed record HikvisionSdkHealth(
    bool Initialized,
    string Platform,
    int ConnectedDevices,
    string? LastErrorCode,
    string? LastErrorMessage,
    string? LastErrorHint,
    IReadOnlyCollection<string> LibrarySearchPaths);

public sealed class HikvisionSdkClient : IHikvisionSdkClient, IDisposable
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<HikvisionSdkClient> _logger;
    private readonly string _username;
    private readonly string _password;
    private readonly ConcurrentDictionary<string, SdkSession> _sessions = new();
    private readonly object _sdkInitLock = new();
    private readonly object _nativeCfgLock = new();
    private readonly object _dllResolverLock = new();
    private readonly List<string> _librarySearchPaths = [];
    private bool _sdkInitialized;
    private bool _nativeConfigured;
    private bool _dllResolverConfigured;
    private bool _disposed;

    public HikvisionSdkClient(IConfiguration configuration, ILogger<HikvisionSdkClient> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _username = configuration["Hikvision:Username"]
            ?? Environment.GetEnvironmentVariable("HIKVISION_SDK_USERNAME")
            ?? "admin";
        _password = configuration["Hikvision:Password"]
            ?? Environment.GetEnvironmentVariable("HIKVISION_SDK_PASSWORD")
            ?? "12345";
    }

    public Task<IReadOnlyCollection<SdkDiscoveredDevice>> ScanLanAsync(CancellationToken cancellationToken = default)
    {
        return ScanLanViaIsapiAsync(cancellationToken);
    }

    public Task ConnectAsync(string deviceIdentifier, string ipAddress, int port, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        EnsureSdkReady();

        if (_sessions.TryGetValue(deviceIdentifier, out var existing))
        {
            if (!string.Equals(existing.IpAddress, ipAddress, StringComparison.OrdinalIgnoreCase) || existing.Port != port)
            {
                DisconnectInternal(existing);
            }
            else
            {
                return Task.CompletedTask;
            }
        }

        var userId = Login(ipAddress, port, out _);
        _sessions[deviceIdentifier] = new SdkSession(deviceIdentifier, ipAddress, port, userId);
        _logger.LogInformation("Hikvision login OK for {DeviceIdentifier} ({Ip}:{Port}), userId={UserId}", deviceIdentifier, ipAddress, port, userId);
        return Task.CompletedTask;
    }

    public Task DisconnectAsync(string deviceIdentifier, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (_sessions.TryRemove(deviceIdentifier, out var session))
        {
            DisconnectInternal(session);
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyCollection<SdkDeviceEvent>> PullEventsAsync(IReadOnlyCollection<string> deviceIdentifiers, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        EnsureSdkReady();

        var fromUtc = DateTime.UtcNow.AddSeconds(-10);
        var toUtc = DateTime.UtcNow;
        var output = new List<SdkDeviceEvent>();

        foreach (var deviceIdentifier in deviceIdentifiers)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (!_sessions.TryGetValue(deviceIdentifier, out var session))
            {
                continue;
            }

            try
            {
                var events = PullAcsEvents(session, fromUtc, toUtc, cancellationToken);
                if (events.Count == 0)
                {
                    output.Add(new SdkDeviceEvent(
                        deviceIdentifier,
                        "HEARTBEAT",
                        DateTime.UtcNow,
                        """{"source":"hikvision-sdk","status":"connected"}"""));
                }
                else
                {
                    output.AddRange(events);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "PullEvents failed for {DeviceIdentifier}", deviceIdentifier);
            }
        }

        return Task.FromResult<IReadOnlyCollection<SdkDeviceEvent>>(output);
    }

    public HikvisionSdkHealth GetHealth()
    {
        uint errorCode;
        try
        {
            errorCode = Native.NET_DVR_GetLastError();
        }
        catch
        {
            errorCode = 0;
        }

        var error = DescribeError(errorCode);

        return new HikvisionSdkHealth(
            _sdkInitialized,
            RuntimeInformation.OSDescription,
            _sessions.Count,
            errorCode == 0 ? null : errorCode.ToString(),
            errorCode == 0 ? null : error.Message,
            errorCode == 0 ? null : error.Hint,
            _librarySearchPaths.ToArray());
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        foreach (var pair in _sessions.ToArray())
        {
            DisconnectInternal(pair.Value);
        }
        _sessions.Clear();

        if (_sdkInitialized)
        {
            Native.NET_DVR_Cleanup();
            _sdkInitialized = false;
        }

        _disposed = true;
    }

    private Task<IReadOnlyCollection<SdkDiscoveredDevice>> ScanLanViaSadpOrFallbackAsync(CancellationToken cancellationToken)
    {
        var discovered = TryScanViaSadp(cancellationToken);
        return Task.FromResult(discovered);
    }

    private async Task<IReadOnlyCollection<SdkDiscoveredDevice>> ScanLanViaIsapiAsync(CancellationToken cancellationToken)
    {
        var hosts = ResolveLocalSubnetHosts(maxHostsPerSubnet: 256).ToArray();
        if (hosts.Length == 0)
        {
            _logger.LogWarning("ISAPI discovery skipped: no eligible local IPv4 subnets were found.");
            return [];
        }

        var ports = ResolveDiscoveryPorts();
        var discovered = new ConcurrentDictionary<string, SdkDiscoveredDevice>(StringComparer.OrdinalIgnoreCase);

        var digestCredential = new NetworkCredential(_username, _password);
        using var httpClient = CreateIsapiHttpClient(digestCredential, useHttps: false);
        using var httpsClient = CreateIsapiHttpClient(digestCredential, useHttps: true);
        using var throttler = new SemaphoreSlim(64);

        var tasks = hosts
            .SelectMany(ip => ports.Select(port => ProbeIsapiAsync(ip, port, httpClient, httpsClient, discovered, throttler, cancellationToken)))
            .ToArray();

        await Task.WhenAll(tasks);
        return discovered.Values.OrderBy(x => x.IpAddress).ThenBy(x => x.Port).ToArray();
    }

    private async Task ProbeIsapiAsync(
        string ipAddress,
        int port,
        HttpClient httpClient,
        HttpClient httpsClient,
        ConcurrentDictionary<string, SdkDiscoveredDevice> discovered,
        SemaphoreSlim throttler,
        CancellationToken cancellationToken)
    {
        await throttler.WaitAsync(cancellationToken);
        try
        {
            var primaryScheme = port == 443 ? "https" : "http";
            var primaryClient = port == 443 ? httpsClient : httpClient;
            var candidate = await TryReadIsapiDeviceInfoAsync(ipAddress, port, primaryScheme, primaryClient, cancellationToken);
            if (candidate is null && port != 443)
            {
                // Some devices expose ISAPI over HTTPS on non-standard ports.
                candidate = await TryReadIsapiDeviceInfoAsync(ipAddress, port, "https", httpsClient, cancellationToken);
            }

            if (candidate is null)
            {
                return;
            }

            discovered.TryAdd($"{candidate.IpAddress}:{candidate.Port}", candidate);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            // Probe timeout for a single host/port should not fail the whole discovery.
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "ISAPI probe failed for {Ip}:{Port}.", ipAddress, port);
        }
        finally
        {
            throttler.Release();
        }
    }

    private async Task<SdkDiscoveredDevice?> TryReadIsapiDeviceInfoAsync(
        string ipAddress,
        int port,
        string scheme,
        HttpClient client,
        CancellationToken cancellationToken)
    {
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(TimeSpan.FromMilliseconds(1500));

        var uri = new Uri($"{scheme}://{ipAddress}:{port}/ISAPI/System/deviceInfo");
        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        using var response = await client.SendAsync(request, timeoutCts.Token);
        if (response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden)
        {
            return null;
        }

        if (response.StatusCode == HttpStatusCode.Unauthorized)
        {
            // Endpoint exists, but credentials are invalid.
            var fallbackId = $"ISAPI-{ipAddress.Replace('.', '-')}-{port}";
            return new SdkDiscoveredDevice(fallbackId, $"Hikvision {ipAddress}", ipAddress, port, "Unauthorized");
        }

        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var content = await response.Content.ReadAsStringAsync(timeoutCts.Token);
        return BuildDeviceFromIsapiXml(content, ipAddress, port);
    }

    private static HttpClient CreateIsapiHttpClient(NetworkCredential credential, bool useHttps)
    {
        var handler = new HttpClientHandler
        {
            Credentials = credential,
            PreAuthenticate = false,
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
        };

        if (useHttps)
        {
            handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
        }

        return new HttpClient(handler, disposeHandler: true)
        {
            Timeout = Timeout.InfiniteTimeSpan
        };
    }

    private static SdkDiscoveredDevice BuildDeviceFromIsapiXml(string xml, string ipAddress, int port)
    {
        var document = XDocument.Parse(xml);
        var root = document.Root;

        string? Value(string localName) =>
            root?.Descendants().FirstOrDefault(x => string.Equals(x.Name.LocalName, localName, StringComparison.OrdinalIgnoreCase))?.Value?.Trim();

        var serial = Value("serialNumber");
        var model = Value("model");
        var deviceName = Value("deviceName");
        var identifier = string.IsNullOrWhiteSpace(serial) ? $"ISAPI-{ipAddress.Replace('.', '-')}-{port}" : serial;
        var name = string.IsNullOrWhiteSpace(deviceName) ? $"Hikvision {ipAddress}" : deviceName;

        return new SdkDiscoveredDevice(identifier, name, ipAddress, port, model);
    }

    private int[] ResolveDiscoveryPorts()
    {
        var raw = _configuration["Hikvision:DiscoveryPorts"]
            ?? Environment.GetEnvironmentVariable("HIKVISION_DISCOVERY_PORTS")
            ?? "80,443,8000";

        var parsed = raw
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(x => int.TryParse(x, out var port) ? port : -1)
            .Where(x => x is > 0 and <= 65535)
            .Distinct()
            .ToArray();

        return parsed.Length == 0 ? [80, 443, 8000] : parsed;
    }

    private static IEnumerable<string> ResolveLocalSubnetHosts(int maxHostsPerSubnet)
    {
        var output = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (nic.OperationalStatus != OperationalStatus.Up)
            {
                continue;
            }

            var ipProps = nic.GetIPProperties();
            foreach (var uni in ipProps.UnicastAddresses)
            {
                if (uni.Address.AddressFamily != AddressFamily.InterNetwork || uni.IPv4Mask is null)
                {
                    continue;
                }

                var ip = uni.Address;
                var mask = uni.IPv4Mask;
                var prefixLength = CountMaskBits(mask);
                if (prefixLength is < 16 or > 30)
                {
                    continue;
                }

                var ipUInt = ToUInt32(ip);
                var maskUInt = ToUInt32(mask);
                var network = ipUInt & maskUInt;
                var broadcast = network | ~maskUInt;
                var firstHost = network + 1;
                var lastHost = broadcast - 1;
                var emitted = 0;

                for (var current = firstHost; current <= lastHost; current++)
                {
                    if (current == ipUInt)
                    {
                        continue;
                    }

                    output.Add(FromUInt32(current).ToString());
                    emitted++;
                    if (emitted >= maxHostsPerSubnet)
                    {
                        break;
                    }
                }
            }
        }

        return output;
    }

    private static int CountMaskBits(IPAddress mask)
    {
        var bits = 0;
        foreach (var b in mask.GetAddressBytes())
        {
            var value = b;
            while (value != 0)
            {
                bits += value & 1;
                value >>= 1;
            }
        }

        return bits;
    }

    private static uint ToUInt32(IPAddress address)
    {
        var bytes = address.GetAddressBytes();
        return ((uint)bytes[0] << 24) | ((uint)bytes[1] << 16) | ((uint)bytes[2] << 8) | bytes[3];
    }

    private static IPAddress FromUInt32(uint value)
    {
        return new IPAddress(
        [
            (byte)(value >> 24),
            (byte)(value >> 16),
            (byte)(value >> 8),
            (byte)value
        ]);
    }

    private IReadOnlyCollection<SdkDiscoveredDevice> TryScanViaSadp(CancellationToken cancellationToken)
    {
        var userIds = _sessions.Values
            .Select(x => x.UserId)
            .Where(x => x >= 0)
            .Distinct()
            .ToList();

        int? bootstrapUserId = null;
        if (userIds.Count == 0)
        {
            bootstrapUserId = TryCreateSadpBootstrapSession();
            if (bootstrapUserId is null)
            {
                _logger.LogWarning("SADP discovery skipped: no active SDK sessions and no valid SadpSeedHost configuration.");
                return [];
            }

            userIds.Add(bootstrapUserId.Value);
        }

        try
        {
            var discovered = new Dictionary<string, SdkDiscoveredDevice>(StringComparer.OrdinalIgnoreCase);
            foreach (var userId in userIds)
            {
                cancellationToken.ThrowIfCancellationRequested();
                try
                {
                    var sadpList = Native.CreateSadpInfoListBuffer();
                    var ok = Native.NET_DVR_GetSadpInfoList(userId, ref sadpList);
                    if (!ok)
                    {
                        continue;
                    }

                    var limit = Math.Min((int)sadpList.wSadpNum, sadpList.struSadpInfo.Length);
                    for (var i = 0; i < limit; i++)
                    {
                        var sadp = sadpList.struSadpInfo[i];
                        var ip = (sadp.struIP.sIpV4 ?? string.Empty).Trim('\0', ' ');
                        if (string.IsNullOrWhiteSpace(ip))
                        {
                            continue;
                        }

                        var serial = (sadp.chSerialNo ?? string.Empty).Trim('\0', ' ');
                        var identifier = string.IsNullOrWhiteSpace(serial) ? $"SADP-{ip.Replace('.', '-')}" : serial;
                        var model = sadp.wFactoryType.ToString();
                        var key = $"{ip}:{sadp.wPort}";
                        if (!discovered.ContainsKey(key))
                        {
                            discovered[key] = new SdkDiscoveredDevice(
                                identifier,
                                $"Hikvision {ip}",
                                ip,
                                sadp.wPort,
                                model);
                        }
                    }
                }
                catch (EntryPointNotFoundException ex)
                {
                    _logger.LogWarning(ex, "NET_DVR_GetSadpInfoList is not available in this SDK build.");
                    return [];
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "SADP discovery call failed for userId {UserId}", userId);
                }
            }

            return discovered.Values.OrderBy(x => x.IpAddress).ThenBy(x => x.Port).ToArray();
        }
        finally
        {
            if (bootstrapUserId is not null)
            {
                Native.NET_DVR_Logout_V30(bootstrapUserId.Value);
            }
        }
    }

    private int? TryCreateSadpBootstrapSession()
    {
        var seedHost = _configuration["Hikvision:SadpSeedHost"]
            ?? Environment.GetEnvironmentVariable("HIKVISION_SADP_SEED_HOST");
        if (string.IsNullOrWhiteSpace(seedHost))
        {
            return null;
        }

        var seedPortText = _configuration["Hikvision:SadpSeedPort"]
            ?? Environment.GetEnvironmentVariable("HIKVISION_SADP_SEED_PORT");
        var seedPort = 8000;
        if (!string.IsNullOrWhiteSpace(seedPortText) && int.TryParse(seedPortText, out var parsed) && parsed > 0)
        {
            seedPort = parsed;
        }

        try
        {
            var userId = Login(seedHost.Trim(), seedPort, out _);
            _logger.LogInformation("SADP bootstrap session opened via {Host}:{Port}.", seedHost, seedPort);
            return userId;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to open SADP bootstrap session via {Host}:{Port}.", seedHost, seedPort);
            return null;
        }
    }

    private int Login(string ipAddress, int port, out Native.NET_DVR_DEVICEINFO_V40 deviceInfo)
    {
        var loginInfo = new Native.NET_DVR_USER_LOGIN_INFO
        {
            sDeviceAddress = ipAddress,
            wPort = (ushort)port,
            sUserName = _username,
            sPassword = _password,
            bUseAsynLogin = false,
            byLoginMode = 0,
            byHttps = 0,
            byRes3 = new byte[119]
        };

        deviceInfo = new Native.NET_DVR_DEVICEINFO_V40
        {
            struDeviceV30 = new Native.NET_DVR_DEVICEINFO_V30
            {
                sSerialNumber = new byte[Native.SERIALNO_LEN]
            },
            byRes2 = new byte[243]
        };

        var userId = Native.NET_DVR_Login_V40(ref loginInfo, ref deviceInfo);
        if (userId < 0)
        {
            var error = Native.NET_DVR_GetLastError();
            throw new InvalidOperationException($"NET_DVR_Login_V40 failed for {ipAddress}:{port}, error={error} ({DescribeError(error)}).");
        }

        return userId;
    }

    private List<SdkDeviceEvent> PullAcsEvents(SdkSession session, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken)
    {
        var condition = new Native.NET_DVR_ACS_EVENT_COND
        {
            dwSize = (uint)Marshal.SizeOf<Native.NET_DVR_ACS_EVENT_COND>(),
            dwMajor = 0,
            dwMinor = 0,
            struStartTime = Native.NET_DVR_TIME.FromDateTime(fromUtc),
            struEndTime = Native.NET_DVR_TIME.FromDateTime(toUtc),
            byCardNo = new byte[Native.ACS_CARD_NO_LEN],
            byName = new byte[Native.NAME_LEN],
            byRes2 = new byte[2],
            byEmployeeNo = new byte[Native.NET_SDK_EMPLOYEE_NO_LEN],
            byRes = new byte[140],
            wInductiveEventType = 0xFFFF,
            szMonitorID = string.Empty
        };

        var condPtr = Marshal.AllocHGlobal(Marshal.SizeOf<Native.NET_DVR_ACS_EVENT_COND>());
        try
        {
            Marshal.StructureToPtr(condition, condPtr, false);
            var handle = Native.NET_DVR_StartRemoteConfig(
                session.UserId,
                Native.NET_DVR_GET_ACS_EVENT,
                condPtr,
                Marshal.SizeOf<Native.NET_DVR_ACS_EVENT_COND>(),
                null,
                IntPtr.Zero);

            if (handle < 0)
            {
                return [];
            }

            try
            {
                return ReadAcsEvents(handle, session.DeviceIdentifier, cancellationToken);
            }
            finally
            {
                Native.NET_DVR_StopRemoteConfig(handle);
            }
        }
        finally
        {
            Marshal.FreeHGlobal(condPtr);
        }
    }

    private static List<SdkDeviceEvent> ReadAcsEvents(int handle, string deviceIdentifier, CancellationToken cancellationToken)
    {
        var events = new List<SdkDeviceEvent>();
        var cfg = new Native.NET_DVR_ACS_EVENT_CFG
        {
            dwSize = (uint)Marshal.SizeOf<Native.NET_DVR_ACS_EVENT_CFG>(),
            sNetUser = new byte[Native.MAX_NAMELEN],
            struRemoteHostAddr = new Native.NET_DVR_IPADDR { byIPv6 = new byte[128] },
            struAcsEventInfo = new Native.NET_DVR_ACS_EVENT_DETAIL
            {
                byCardNo = new byte[Native.ACS_CARD_NO_LEN],
                byMACAddr = new byte[Native.MACADDR_LEN],
                byRe2 = new byte[2],
                byEmployeeNo = new byte[Native.NET_SDK_EMPLOYEE_NO_LEN],
                byRes = new byte[64]
            },
            byRes = new byte[61]
        };

        var idleWaits = 0;
        while (idleWaits < 6)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var status = Native.NET_DVR_GetNextRemoteConfig(handle, ref cfg, Marshal.SizeOf<Native.NET_DVR_ACS_EVENT_CFG>());
            switch (status)
            {
                case Native.NET_SDK_GET_NEXT_STATUS_SUCCESS:
                    idleWaits = 0;
                    var occurred = cfg.struTime.ToDateTimeUtc();
                    var eventCode = $"ACS_{cfg.dwMajor:X}_{cfg.dwMinor:X}";
                    var payload = BuildPayload(cfg);
                    events.Add(new SdkDeviceEvent(deviceIdentifier, eventCode, occurred, payload));
                    break;
                case Native.NET_SDK_GET_NEXT_STATUS_NEED_WAIT:
                    idleWaits++;
                    Thread.Sleep(80);
                    break;
                case Native.NET_SDK_GET_NEXT_STATUS_FINISH:
                case Native.NET_SDK_GET_NEXT_STATUS_FAILED:
                default:
                    idleWaits = 10;
                    break;
            }
        }

        return events;
    }

    private static string BuildPayload(Native.NET_DVR_ACS_EVENT_CFG cfg)
    {
        var cardNo = SafeAscii(cfg.struAcsEventInfo.byCardNo);
        var employeeNo = SafeAscii(cfg.struAcsEventInfo.byEmployeeNo);
        return $$"""{"major":{{cfg.dwMajor}},"minor":{{cfg.dwMinor}},"cardNo":"{{cardNo}}","employeeNo":"{{employeeNo}}"}""";
    }

    private static string SafeAscii(byte[]? bytes)
    {
        if (bytes is null || bytes.Length == 0)
        {
            return string.Empty;
        }

        var end = Array.IndexOf(bytes, (byte)0);
        if (end < 0)
        {
            end = bytes.Length;
        }

        return Encoding.ASCII.GetString(bytes, 0, end).Trim();
    }

    private void EnsureSdkReady()
    {
        ThrowIfDisposed();
        ConfigureNativeLoading();

        if (_sdkInitialized)
        {
            return;
        }

        lock (_sdkInitLock)
        {
            if (_sdkInitialized)
            {
                return;
            }

            if (!Native.NET_DVR_Init())
            {
                var error = Native.NET_DVR_GetLastError();
                throw new InvalidOperationException($"NET_DVR_Init failed, error={error} ({DescribeError(error)}).");
            }

            Native.NET_DVR_SetConnectTime(5000, 2);
            Native.NET_DVR_SetReconnect(10000, true);
            Native.NET_DVR_SetLogToFile(2, "./SdkLog/", true);

            _sdkInitialized = true;
            _logger.LogInformation("Hikvision SDK initialized.");
        }
    }

    private void ConfigureNativeLoading()
    {
        if (_nativeConfigured)
        {
            return;
        }

        lock (_nativeCfgLock)
        {
            if (_nativeConfigured)
            {
                return;
            }

            var candidates = ResolveSdkDirectories();
            _librarySearchPaths.Clear();
            _librarySearchPaths.AddRange(candidates);
            EnsureDllResolverConfigured(candidates);

            if (candidates.Count > 0)
            {
                var envName = OperatingSystem.IsWindows() ? "PATH" : "LD_LIBRARY_PATH";
                var current = Environment.GetEnvironmentVariable(envName) ?? string.Empty;
                var prepended = string.Join(Path.PathSeparator, candidates);
                var merged = string.IsNullOrWhiteSpace(current) ? prepended : $"{prepended}{Path.PathSeparator}{current}";
                Environment.SetEnvironmentVariable(envName, merged);
            }

            foreach (var dir in candidates)
            {
                TryPreloadLibraries(dir);
                var comDir = Path.Combine(dir, "HCNetSDKCom");
                if (Directory.Exists(comDir))
                {
                    TryPreloadLibraries(comDir);
                }
            }

            _nativeConfigured = true;
        }
    }

    private void EnsureDllResolverConfigured(IReadOnlyCollection<string> candidates)
    {
        if (_dllResolverConfigured)
        {
            return;
        }

        lock (_dllResolverLock)
        {
            if (_dllResolverConfigured)
            {
                return;
            }

            NativeLibrary.SetDllImportResolver(typeof(HikvisionSdkClient).Assembly, (libraryName, assembly, searchPath) =>
            {
                var normalized = Path.GetFileNameWithoutExtension(libraryName);
                if (!string.Equals(normalized, "hcnetsdk", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(normalized, "HPNetSDK", StringComparison.OrdinalIgnoreCase))
                {
                    return IntPtr.Zero;
                }

                var names = OperatingSystem.IsWindows()
                    ? new[] { libraryName, "HCNetSDK.dll", "HPNetSDK.dll", "hcnetsdk.dll" }
                    : new[] { "libhcnetsdk.so", "libHPNetSDK.so" };

                foreach (var dir in candidates)
                {
                    foreach (var name in names)
                    {
                        var path = Path.Combine(dir, name);
                        if (!File.Exists(path))
                        {
                            continue;
                        }

                        if (NativeLibrary.TryLoad(path, out var handle))
                        {
                            return handle;
                        }
                    }
                }

                foreach (var name in names)
                {
                    if (NativeLibrary.TryLoad(name, assembly, searchPath, out var handle))
                    {
                        return handle;
                    }
                }

                return IntPtr.Zero;
            });

            _dllResolverConfigured = true;
        }
    }

    private static void TryPreloadLibraries(string directory)
    {
        if (!Directory.Exists(directory))
        {
            return;
        }

        var names = OperatingSystem.IsWindows()
            ? new[] { "HCNetSDK.dll", "HCCore.dll", "hpr.dll" }
            : new[] { "libhcnetsdk.so", "libHCCore.so", "libhpr.so" };

        foreach (var name in names)
        {
            var path = Path.Combine(directory, name);
            if (!File.Exists(path))
            {
                continue;
            }

            NativeLibrary.TryLoad(path, out _);
        }
    }

    private List<string> ResolveSdkDirectories()
    {
        var result = new List<string>();
        var custom = _configuration["Hikvision:SdkPath"] ?? Environment.GetEnvironmentVariable("HIKVISION_SDK_PATH");
        if (!string.IsNullOrWhiteSpace(custom))
        {
            result.Add(custom);
        }

        var cwd = Directory.GetCurrentDirectory();
        var baseDir = AppContext.BaseDirectory;
        result.Add(baseDir);
        result.Add(Path.Combine(baseDir, "HCNetSDKCom"));
        if (OperatingSystem.IsWindows())
        {
            result.Add(Path.GetFullPath(Path.Combine(cwd, "winSDK", "lib")));
            result.Add(Path.GetFullPath(Path.Combine(cwd, "winSDK", "lib", "HPNetSDK")));
            result.Add(Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "winSDK", "lib")));
            result.Add(Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "winSDK", "lib", "HPNetSDK")));
        }
        else
        {
            result.Add(Path.GetFullPath(Path.Combine(cwd, "linuxSDK", "lib")));
            result.Add(Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "linuxSDK", "lib")));
        }

        return result
            .Where(Directory.Exists)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static SdkErrorDescription DescribeError(uint errorCode)
    {
        return errorCode switch
        {
            0 => new("No error.", "Action is not required."),
            1 => new("Username or password is invalid.", "Verify Hikvision credentials in configuration and device account policy."),
            2 => new("Insufficient SDK or device capability.", "Ensure the device firmware and SDK build support the requested function."),
            3 => new("SDK is not initialized.", "Call NET_DVR_Init before any SDK operations."),
            4 => new("SDK internal memory allocation failed.", "Check host memory pressure and restart backend process."),
            5 => new("SDK cannot load core dynamic library.", "Validate HCNetSDK runtime dependencies and native library path."),
            6 => new("SDK version does not match runtime dependencies.", "Use a consistent SDK package and avoid mixing DLL/SO versions."),
            7 => new("Network timeout while communicating with device.", "Check connectivity, route, firewall, and device responsiveness."),
            8 => new("Receive data timeout from device.", "Check network stability and increase SDK timeouts if needed."),
            9 => new("Failed to receive data from device.", "Check transport connectivity and intermediate network devices."),
            10 => new("Failed to send data to device.", "Check outbound firewall rules and device network availability."),
            11 => new("Network send failed due to lower-level socket issue.", "Inspect NIC state, MTU settings, and TCP stack health."),
            12 => new("Device returns unsupported operation.", "Check if requested feature is available on this model/firmware."),
            17 => new("Parameter error in SDK call.", "Validate all SDK struct fields, sizes, and pointer buffers."),
            23 => new("Permission denied by device.", "Use an account with required privileges for this operation."),
            29 => new("Device is unreachable.", "Check IP address, port, NAT, and whether service is running on device."),
            34 => new("Device channel does not exist or is invalid.", "Verify channel/door/input identifiers for this model."),
            47 => new("SDK function invocation failed.", "Inspect the specific SDK call context and last error details."),
            53 => new("Device already has active connection limit reached.", "Close stale sessions or increase allowed concurrent logins."),
            72 => new("Socket closed unexpectedly.", "Check network interruptions and idle timeout settings."),
            73 => new("Socket connect failed.", "Verify target address, port, firewall, and service availability."),
            76 => new("Login failed due to authentication or session policy.", "Validate credentials and check account lock/session restrictions."),
            84 => new("XML parse error in SDK operation.", "Verify payload format, encoding, and supported schema."),
            91 => new("SDK operation is busy or rate-limited.", "Retry with backoff and reduce parallel requests."),
            107 => new("Operation is not supported by this device.", "Adjust feature set by device type and firmware capabilities."),
            113 => new("SDK dependency component failed to initialize.", "Check HCNetSDKCom folder presence and dependency compatibility."),
            136 => new("Device reports operation conflict.", "Retry operation and ensure no concurrent conflicting commands."),
            153 => new("User account is locked on device.", "Unlock account on device or wait until lock timeout expires."),
            _ => new("Unknown SDK error.", "Check Hikvision HCNetSDK error list for this SDK build and enable verbose logs.")
        };
    }

    private static void DisconnectInternal(SdkSession session)
    {
        if (session.UserId >= 0)
        {
            Native.NET_DVR_Logout_V30(session.UserId);
        }
    }

    private void ThrowIfDisposed()
    {
        if (_disposed)
        {
            throw new ObjectDisposedException(nameof(HikvisionSdkClient));
        }
    }

    private sealed record SdkSession(string DeviceIdentifier, string IpAddress, int Port, int UserId);
    private sealed record SdkErrorDescription(string Message, string Hint);

    private static class Native
    {
        public const int NET_DVR_GET_ACS_EVENT = 2514;
        public const int NET_DVR_DEV_ADDRESS_MAX_LEN = 129;
        public const int NET_DVR_LOGIN_USERNAME_MAX_LEN = 64;
        public const int NET_DVR_LOGIN_PASSWD_MAX_LEN = 64;
        public const int SERIALNO_LEN = 48;
        public const int SOFTWARE_VERSION_LEN = 48;
        public const int MAX_SADP_NUM = 256;
        public const int ACS_CARD_NO_LEN = 32;
        public const int MACADDR_LEN = 6;
        public const int MAX_NAMELEN = 16;
        public const int NAME_LEN = 32;
        public const int NET_SDK_EMPLOYEE_NO_LEN = 32;

        public const int NET_SDK_GET_NEXT_STATUS_SUCCESS = 1000;
        public const int NET_SDK_GET_NEXT_STATUS_NEED_WAIT = 1001;
        public const int NET_SDK_GET_NEXT_STATUS_FINISH = 1002;
        public const int NET_SDK_GET_NEXT_STATUS_FAILED = 1003;

        private const string SdkLib = "hcnetsdk";

        [DllImport(SdkLib)]
        public static extern bool NET_DVR_Init();

        [DllImport(SdkLib)]
        public static extern bool NET_DVR_Cleanup();

        [DllImport(SdkLib)]
        public static extern uint NET_DVR_GetLastError();

        [DllImport(SdkLib)]
        public static extern bool NET_DVR_SetLogToFile(int nLogLevel, string strLogDir, bool bAutoDel);

        [DllImport(SdkLib)]
        public static extern bool NET_DVR_SetConnectTime(uint dwWaitTime, uint dwTryTimes);

        [DllImport(SdkLib)]
        public static extern bool NET_DVR_SetReconnect(uint dwInterval, bool bEnableRecon);

        [DllImport(SdkLib)]
        public static extern int NET_DVR_Login_V40(ref NET_DVR_USER_LOGIN_INFO pLoginInfo, ref NET_DVR_DEVICEINFO_V40 lpDeviceInfo);

        [DllImport(SdkLib)]
        public static extern bool NET_DVR_Logout_V30(int lUserID);

        [DllImport(SdkLib)]
        public static extern bool NET_DVR_GetSadpInfoList(int lUserID, ref NET_DVR_SADPINFO_LIST lpSadpInfoList);

        public delegate void RemoteConfigCallback(uint dwType, IntPtr lpBuffer, uint dwBufLen, IntPtr pUserData);

        [DllImport(SdkLib)]
        public static extern int NET_DVR_StartRemoteConfig(
            int lUserID,
            int dwCommand,
            IntPtr lpInBuffer,
            int dwInBufferLen,
            RemoteConfigCallback? cbStateCallback,
            IntPtr pUserData);

        [DllImport(SdkLib)]
        public static extern int NET_DVR_GetNextRemoteConfig(int lHandle, ref NET_DVR_ACS_EVENT_CFG lpOutBuff, int dwOutBuffSize);

        [DllImport(SdkLib)]
        public static extern bool NET_DVR_StopRemoteConfig(int lHandle);

        [StructLayout(LayoutKind.Sequential)]
        public struct NET_DVR_TIME
        {
            public int dwYear;
            public int dwMonth;
            public int dwDay;
            public int dwHour;
            public int dwMinute;
            public int dwSecond;

            public static NET_DVR_TIME FromDateTime(DateTime utc)
            {
                var value = utc.Kind == DateTimeKind.Utc ? utc : utc.ToUniversalTime();
                return new NET_DVR_TIME
                {
                    dwYear = value.Year,
                    dwMonth = value.Month,
                    dwDay = value.Day,
                    dwHour = value.Hour,
                    dwMinute = value.Minute,
                    dwSecond = value.Second
                };
            }

            public DateTime ToDateTimeUtc()
            {
                try
                {
                    return new DateTime(dwYear, Math.Max(dwMonth, 1), Math.Max(dwDay, 1), dwHour, dwMinute, dwSecond, DateTimeKind.Utc);
                }
                catch
                {
                    return DateTime.UtcNow;
                }
            }
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct NET_DVR_USER_LOGIN_INFO
        {
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = NET_DVR_DEV_ADDRESS_MAX_LEN)]
            public string sDeviceAddress;
            public byte byUseTransport;
            public ushort wPort;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = NET_DVR_LOGIN_USERNAME_MAX_LEN)]
            public string sUserName;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = NET_DVR_LOGIN_PASSWD_MAX_LEN)]
            public string sPassword;
            public IntPtr cbLoginResult;
            public IntPtr pUser;
            [MarshalAs(UnmanagedType.I1)]
            public bool bUseAsynLogin;
            public byte byProxyType;
            public byte byUseUTCTime;
            public byte byLoginMode;
            public byte byHttps;
            public int iProxyID;
            public byte byVerifyMode;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 119)]
            public byte[] byRes3;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct NET_DVR_DEVICEINFO_V30
        {
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = SERIALNO_LEN)]
            public byte[] sSerialNumber;
            public byte byAlarmInPortNum;
            public byte byAlarmOutPortNum;
            public byte byDiskNum;
            public byte byDVRType;
            public byte byChanNum;
            public byte byStartChan;
            public byte byAudioChanNum;
            public byte byIPChanNum;
            public byte byZeroChanNum;
            public byte byMainProto;
            public byte bySubProto;
            public byte bySupport;
            public byte bySupport1;
            public byte bySupport2;
            public ushort wDevType;
            public byte bySupport3;
            public byte byMultiStreamProto;
            public byte byStartDChan;
            public byte byStartDTalkChan;
            public byte byHighDChanNum;
            public byte bySupport4;
            public byte byLanguageType;
            public byte byVoiceInChanNum;
            public byte byStartVoiceInChanNo;
            public byte bySupport5;
            public byte bySupport6;
            public byte byMirrorChanNum;
            public ushort wStartMirrorChanNo;
            public byte bySupport7;
            public byte byRes2;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct NET_DVR_DEVICEINFO_V40
        {
            public NET_DVR_DEVICEINFO_V30 struDeviceV30;
            public byte bySupportLock;
            public byte byRetryLoginTime;
            public byte byPasswordLevel;
            public byte byProxyType;
            public uint dwSurplusLockTime;
            public byte byCharEncodeType;
            public byte bySupportDev5;
            public byte bySupport;
            public byte byLoginMode;
            public uint dwOEMCode;
            public int iResidualValidity;
            public byte byResidualValidity;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 243)]
            public byte[] byRes2;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
        public struct NET_DVR_ACS_EVENT_COND
        {
            public uint dwSize;
            public uint dwMajor;
            public uint dwMinor;
            public NET_DVR_TIME struStartTime;
            public NET_DVR_TIME struEndTime;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = ACS_CARD_NO_LEN)]
            public byte[] byCardNo;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = NAME_LEN)]
            public byte[] byName;
            public uint dwBeginSerialNo;
            public byte byPicEnable;
            public byte byTimeType;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 2)]
            public byte[] byRes2;
            public uint dwEndSerialNo;
            public uint dwIOTChannelNo;
            public ushort wInductiveEventType;
            public byte bySearchType;
            public byte byRes1;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)]
            public string szMonitorID;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = NET_SDK_EMPLOYEE_NO_LEN)]
            public byte[] byEmployeeNo;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 140)]
            public byte[] byRes;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
        public struct NET_DVR_IPADDR
        {
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 16)]
            public string sIpV4;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 128)]
            public byte[] byIPv6;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
        public struct NET_DVR_SADPINFO
        {
            public NET_DVR_IPADDR struIP;
            public ushort wPort;
            public ushort wFactoryType;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = SOFTWARE_VERSION_LEN)]
            public string chSoftwareVersion;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 16)]
            public string chSerialNo;
            public ushort wEncCnt;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = MACADDR_LEN)]
            public byte[] byMACAddr;
            public NET_DVR_IPADDR struSubDVRIPMask;
            public NET_DVR_IPADDR struGatewayIpAddr;
            public NET_DVR_IPADDR struDnsServer1IpAddr;
            public NET_DVR_IPADDR struDnsServer2IpAddr;
            public byte byDns;
            public byte byDhcp;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 158)]
            public byte[] byRes;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct NET_DVR_SADPINFO_LIST
        {
            public uint dwSize;
            public ushort wSadpNum;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 6)]
            public byte[] byRes;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = MAX_SADP_NUM)]
            public NET_DVR_SADPINFO[] struSadpInfo;
        }

        public static NET_DVR_SADPINFO_LIST CreateSadpInfoListBuffer()
        {
            var list = new NET_DVR_SADPINFO_LIST
            {
                dwSize = (uint)Marshal.SizeOf<NET_DVR_SADPINFO_LIST>(),
                byRes = new byte[6],
                struSadpInfo = new NET_DVR_SADPINFO[MAX_SADP_NUM]
            };

            for (var i = 0; i < list.struSadpInfo.Length; i++)
            {
                list.struSadpInfo[i] = new NET_DVR_SADPINFO
                {
                    byMACAddr = new byte[MACADDR_LEN],
                    byRes = new byte[158],
                    struIP = new NET_DVR_IPADDR { byIPv6 = new byte[128] },
                    struSubDVRIPMask = new NET_DVR_IPADDR { byIPv6 = new byte[128] },
                    struGatewayIpAddr = new NET_DVR_IPADDR { byIPv6 = new byte[128] },
                    struDnsServer1IpAddr = new NET_DVR_IPADDR { byIPv6 = new byte[128] },
                    struDnsServer2IpAddr = new NET_DVR_IPADDR { byIPv6 = new byte[128] }
                };
            }

            return list;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct NET_DVR_ACS_EVENT_DETAIL
        {
            public uint dwSize;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = ACS_CARD_NO_LEN)]
            public byte[] byCardNo;
            public byte byCardType;
            public byte byWhiteListNo;
            public byte byReportChannel;
            public byte byCardReaderKind;
            public uint dwCardReaderNo;
            public uint dwDoorNo;
            public uint dwVerifyNo;
            public uint dwAlarmInNo;
            public uint dwAlarmOutNo;
            public uint dwCaseSensorNo;
            public uint dwRs485No;
            public uint dwMultiCardGroupNo;
            public ushort wAccessChannel;
            public byte byDeviceNo;
            public byte byDistractControlNo;
            public uint dwEmployeeNo;
            public ushort wLocalControllerID;
            public byte byInternetAccess;
            public byte byType;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = MACADDR_LEN)]
            public byte[] byMACAddr;
            public byte bySwipeCardType;
            public byte byRes2;
            public uint dwSerialNo;
            public byte byChannelControllerID;
            public byte byChannelControllerLampID;
            public byte byChannelControllerIRAdaptorID;
            public byte byChannelControllerIREmitterID;
            public uint dwRecordChannelNum;
            public IntPtr pRecordChannelData;
            public byte byUserType;
            public byte byCurrentVerifyMode;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 2)]
            public byte[] byRe2;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = NET_SDK_EMPLOYEE_NO_LEN)]
            public byte[] byEmployeeNo;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 64)]
            public byte[] byRes;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct NET_DVR_ACS_EVENT_CFG
        {
            public uint dwSize;
            public uint dwMajor;
            public uint dwMinor;
            public NET_DVR_TIME struTime;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = MAX_NAMELEN)]
            public byte[] sNetUser;
            public NET_DVR_IPADDR struRemoteHostAddr;
            public NET_DVR_ACS_EVENT_DETAIL struAcsEventInfo;
            public uint dwPicDataLen;
            public IntPtr pPicData;
            public ushort wInductiveEventType;
            public byte byTimeType;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 61)]
            public byte[] byRes;
        }
    }
}
