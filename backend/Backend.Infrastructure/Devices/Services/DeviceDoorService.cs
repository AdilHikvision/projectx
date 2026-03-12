using System.Net;
using System.Xml.Linq;
using Backend.Application.Devices;
using Backend.Domain.Entities;
using Backend.Infrastructure.Devices.Sdk;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>Получает список дверей с устройств Hikvision: Value Series — GateStatus; Pro Series — AcsWorkStatus; при 404 — SDK ACS_ABILITY; иначе fallback 1 дверь.</summary>
public sealed class DeviceDoorService(
    AppDbContext dbContext,
    IConfiguration configuration,
    IHikvisionSdkClient? sdkClient,
    ILogger<DeviceDoorService> logger) : IDeviceDoorService
{
    private const int LogContentMaxLength = 800;

    public async Task<IReadOnlyCollection<DeviceDoor>> GetDoorsAsync(Guid? deviceId, CancellationToken cancellationToken = default)
    {
        var devices = await dbContext.Devices
            .AsNoTracking()
            .Where(d => deviceId == null || d.Id == deviceId)
            .OrderBy(d => d.Name)
            .ToListAsync(cancellationToken);

        var result = new List<DeviceDoor>();
        var username = configuration["Hikvision:Username"] ?? "admin";
        var password = (configuration["Hikvision:Password"] ?? "12345").Trim();
        if (string.IsNullOrEmpty(password)) password = "12345";

        foreach (var device in devices)
        {
            var cred = new NetworkCredential(
                string.IsNullOrWhiteSpace(device.Username) ? username : device.Username,
                string.IsNullOrWhiteSpace(device.Password) ? password : device.Password);

            var (doors, offlineReason) = await TryGetDoorsViaIsapiAsync(device, cred, cancellationToken);

            if (doors.Count > 0)
            {
                result.AddRange(doors);
            }
            else
            {
                var errorMsg = offlineReason ?? "Устройство недоступно";
                logger.LogWarning("Doors for {Device} ({Ip}:{Port}): {Reason}. Двери не показываем (офлайн).", device.Name, device.IpAddress, device.Port, errorMsg);
            }
        }

        return result;
    }

    private async Task<int?> TryGetDoorCountViaSdkAsync(Device device, NetworkCredential cred, CancellationToken cancellationToken)
    {
        if (sdkClient is null) return null;
        var username = cred.UserName ?? "admin";
        var password = cred.Password ?? "";
        if (string.IsNullOrEmpty(password)) return null;
        return await sdkClient.TryGetDoorCountViaSdkAsync(
            device.DeviceIdentifier,
            device.IpAddress,
            device.Port,
            username,
            password,
            cancellationToken);
    }

    private async Task<(List<DeviceDoor> Doors, string? OfflineReason)> TryGetDoorsViaIsapiAsync(Device device, NetworkCredential cred, CancellationToken cancellationToken)
    {
        var ports = IsapiPortHelper.GetPortsToTry(device.Port);
        string? lastReason = null;

        foreach (var port in ports)
        {
            var (doors, reason) = await TryGateStatusOnPortAsync(device, port, cred, cancellationToken);
            if (doors.Count > 0)
                return (doors, null);
            lastReason = reason;
            if (port != ports[^1])
                logger.LogDebug("GateStatus on port {Port} for {Device}: {Reason}, пробуем следующий порт", port, device.Name, reason ?? "no data");
        }

        return ([], lastReason);
    }

    private async Task<(List<DeviceDoor> Doors, string? OfflineReason)> TryGateStatusOnPortAsync(Device device, int port, NetworkCredential cred, CancellationToken cancellationToken)
    {
        var result = new List<DeviceDoor>();
        var scheme = port == 443 ? "https" : "http";
        // ISAPI на 80/443; порт 8000 — SDK, не HTTP. GateStatus — стандартный путь для статуса дверей.
        var uri = new Uri($"{scheme}://{device.IpAddress}:{port}/ISAPI/AccessControl/GateStatus");

        logger.LogDebug("GateStatus запрос: {Device} ({Ip}:{Port})", device.Name, device.IpAddress, port);

        using var handler = new HttpClientHandler
        {
            Credentials = cred,
            PreAuthenticate = false,
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
        };
        if (scheme == "https")
        {
            handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
        }

        using var client = new HttpClient(handler, disposeHandler: true)
        {
            Timeout = TimeSpan.FromSeconds(8)
        };

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(6));

            using var request = new HttpRequestMessage(HttpMethod.Get, uri);
            request.Headers.ConnectionClose = true; // Hikvision: избегаем reuse соединения — устройство может закрывать его
            request.Headers.Accept.ParseAdd("application/xml");
            request.Headers.Accept.ParseAdd("application/json");
            using var response = await client.SendAsync(request, cts.Token);

            logger.LogInformation("GateStatus {Device} порт {Port}: HTTP {StatusCode}", device.Name, port, (int)response.StatusCode);

            if (response.StatusCode == HttpStatusCode.Unauthorized)
            {
                logger.LogWarning("GateStatus {Device}: 401 Unauthorized — неверный логин или пароль", device.Name);
                return ([], "Неверный логин или пароль");
            }
            if (response.StatusCode == HttpStatusCode.Forbidden)
            {
                logger.LogWarning("GateStatus {Device}: 403 Forbidden", device.Name);
                return ([], "Доступ запрещён");
            }
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                // GateStatus не реализован (Pro Series: DS-K1T670MX и др.). Пробуем AcsWorkStatus (Pro Series API).
                var (proDoors, proReason) = await TryAcsWorkStatusOnPortAsync(device, port, cred, client, cancellationToken);
                if (proDoors.Count > 0)
                {
                    logger.LogInformation("GateStatus {Device}: 404 — Pro Series AcsWorkStatus: {Count} дверей", device.Name, proDoors.Count);
                    return (proDoors, null);
                }
                if (proReason != null)
                    logger.LogDebug("AcsWorkStatus {Device}: {Reason}", device.Name, proReason);

                // Pro Series API тоже недоступен. Пробуем SDK ACS_ABILITY.
                var doorCount = await TryGetDoorCountViaSdkAsync(device, cred, cancellationToken);
                var count = doorCount ?? 1;
                var doors = Enumerable.Range(0, count)
                    .Select(i => new DeviceDoor(device.Id, device.Name, i, null, "—"))
                    .ToList();
                logger.LogInformation("GateStatus {Device}: 404 — ISAPI не поддерживается, SDK вернул {Count} дверей", device.Name, doorCount.HasValue ? doorCount.Value.ToString() : "fallback 1");
                return (doors, null);
            }
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("GateStatus {Device} порт {Port}: {StatusCode}", device.Name, port, response.StatusCode);
                return ([], $"Ошибка HTTP {(int)response.StatusCode}");
            }

            var content = await response.Content.ReadAsStringAsync(cts.Token);
            var logPreview = content.Length > LogContentMaxLength ? content[..LogContentMaxLength] + "..." : content;
            logger.LogInformation("GateStatus {Device} raw ответ (первые {Len} символов): {Content}", device.Name, Math.Min(content.Length, LogContentMaxLength), logPreview.Replace("\r", "").Replace("\n", " "));

            if (string.IsNullOrWhiteSpace(content))
            {
                logger.LogWarning("GateStatus {Device}: пустой ответ", device.Name);
                return ([], "Пустой ответ");
            }

            result = ParseGateStatusXml(content, device);
            if (result.Count > 0)
            {
                logger.LogInformation("GateStatus {Device} порт {Port}: XML парсинг — {Count} дверей", device.Name, port, result.Count);
                return (result, null);
            }

            result = ParseGateStatusJson(content, device);
            if (result.Count > 0)
            {
                logger.LogInformation("GateStatus {Device} порт {Port}: JSON парсинг — {Count} дверей", device.Name, port, result.Count);
                return (result, null);
            }

            logger.LogWarning("GateStatus {Device}: ответ 200 но не удалось распарсить двери. Структура ответа может отличаться.", device.Name);
            return ([], "Не удалось распарсить ответ устройства");
        }
        catch (OperationCanceledException)
        {
            logger.LogWarning("GateStatus {Device} порт {Port}: таймаут", device.Name, port);
            return ([], "Таймаут. Устройство недоступно");
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "GateStatus {Device} порт {Port}: ошибка сети", device.Name, port);
            return ([], ex.InnerException?.Message ?? "Устройство недоступно");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "GateStatus {Device} порт {Port}: ошибка", device.Name, port);
            return ([], ex.Message);
        }
    }

    /// <summary>Pro Series: GET /ISAPI/AccessControl/AcsWorkStatus?format=json — doorStatus, doorLockStatus массивы.</summary>
    private async Task<(List<DeviceDoor> Doors, string? OfflineReason)> TryAcsWorkStatusOnPortAsync(
        Device device,
        int port,
        NetworkCredential cred,
        HttpClient client,
        CancellationToken cancellationToken)
    {
        var scheme = port == 443 ? "https" : "http";
        var uri = new Uri($"{scheme}://{device.IpAddress}:{port}/ISAPI/AccessControl/AcsWorkStatus?format=json");

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(6));

            using var request = new HttpRequestMessage(HttpMethod.Get, uri);
            request.Headers.ConnectionClose = true;
            request.Headers.Accept.ParseAdd("application/json");
            using var response = await client.SendAsync(request, cts.Token);

            if (response.StatusCode == HttpStatusCode.NotFound)
                return ([], "AcsWorkStatus 404");
            if (response.StatusCode == HttpStatusCode.Unauthorized)
                return ([], "Неверный логин или пароль");
            if (!response.IsSuccessStatusCode)
                return ([], $"AcsWorkStatus HTTP {(int)response.StatusCode}");

            var content = await response.Content.ReadAsStringAsync(cts.Token);
            var doors = ParseAcsWorkStatusJson(content, device);
            if (doors.Count > 0)
                return (doors, null);

            return ([], "AcsWorkStatus: не удалось распарсить");
        }
        catch (OperationCanceledException)
        {
            return ([], "Таймаут");
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "AcsWorkStatus failed for {Device}", device.Name);
            return ([], ex.Message);
        }
    }

    /// <summary>Парсит AcsWorkStatus JSON (Pro Series): AcsWorkStatus.doorStatus или doorLockStatus.</summary>
    private List<DeviceDoor> ParseAcsWorkStatusJson(string content, Device device)
    {
        var result = new List<DeviceDoor>();
        try
        {
            var trimmed = content.Trim();
            if (!trimmed.StartsWith('{')) return result;

            using var doc = global::System.Text.Json.JsonDocument.Parse(content);
            var root = doc.RootElement;

            if (!root.TryGetProperty("AcsWorkStatus", out var acs))
                return result;

            // doorStatus: 1=sleep, 2=remainOpen, 3=remainClosed, 4=normal
            // doorLockStatus: 0=closed, 1=open, 2=short circuit, 3=open circuit, 4=error
            bool useDoorStatus;
            global::System.Text.Json.JsonElement statusArr;
            if (acs.TryGetProperty("doorStatus", out var ds) && ds.ValueKind == global::System.Text.Json.JsonValueKind.Array)
            {
                statusArr = ds;
                useDoorStatus = true;
            }
            else if (acs.TryGetProperty("doorLockStatus", out var dl) && dl.ValueKind == global::System.Text.Json.JsonValueKind.Array)
            {
                statusArr = dl;
                useDoorStatus = false;
            }
            else
            {
                return result;
            }

            var hasDoorNames = acs.TryGetProperty("doorNameList", out var doorNameList) && doorNameList.ValueKind == global::System.Text.Json.JsonValueKind.Array;

            var idx = 0;
            foreach (var item in statusArr.EnumerateArray())
            {
                var statusCode = item.ValueKind == global::System.Text.Json.JsonValueKind.Number && item.TryGetInt32(out var n) ? n : -1;
                var statusStr = useDoorStatus ? MapAcsDoorStatus(statusCode) : MapAcsDoorLockStatus(statusCode);
                var doorName = hasDoorNames && idx < doorNameList.GetArrayLength()
                    ? doorNameList[idx].GetString()
                    : null;
                result.Add(new DeviceDoor(device.Id, device.Name, idx, doorName, statusStr));
                idx++;
            }
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "ParseAcsWorkStatusJson failed for {Device}", device.Name);
        }

        return result;
    }

    private static string MapAcsDoorStatus(int code)
    {
        return code switch
        {
            1 => "sleep",
            2 => "remainOpen",
            3 => "remainClosed",
            4 => "normal",
            _ => code >= 0 ? $"code{code}" : "—"
        };
    }

    private static string MapAcsDoorLockStatus(int code)
    {
        return code switch
        {
            0 => "closed",
            1 => "open",
            2 => "shortCircuit",
            3 => "openCircuit",
            4 => "error",
            _ => code >= 0 ? $"code{code}" : "—"
        };
    }

    private List<DeviceDoor> ParseGateStatusXml(string content, Device device)
    {
        var result = new List<DeviceDoor>();
        try
        {
            var doc = XDocument.Parse(content);
            var root = doc.Root;
            // Собираем только элементы дверей, исключая корневой контейнер GateStatus (иначе дубликат)
            var gateElements = doc.Descendants()
                .Where(x => (string.Equals(x.Name.LocalName, "gateStatus", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(x.Name.LocalName, "gate", StringComparison.OrdinalIgnoreCase))
                    && x != root)
                .ToList();

            foreach (var gate in gateElements)
            {
                var noEl = gate.Descendants().FirstOrDefault(x =>
                    string.Equals(x.Name.LocalName, "gateNo", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(x.Name.LocalName, "gateIndex", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(x.Name.LocalName, "no", StringComparison.OrdinalIgnoreCase));
                var statusEl = gate.Descendants().FirstOrDefault(x =>
                    string.Equals(x.Name.LocalName, "status", StringComparison.OrdinalIgnoreCase));
                var nameEl = gate.Descendants().FirstOrDefault(x =>
                    string.Equals(x.Name.LocalName, "gateName", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(x.Name.LocalName, "name", StringComparison.OrdinalIgnoreCase));

                if (noEl == null && gateElements.Count == 1)
                {
                    gateElements = gate.Descendants()
                        .Where(x => string.Equals(x.Name.LocalName, "gateStatus", StringComparison.OrdinalIgnoreCase)
                            || string.Equals(x.Name.LocalName, "gate", StringComparison.OrdinalIgnoreCase))
                        .ToList();
                    if (gateElements.Count == 0) break;
                    continue;
                }

                var noStr = noEl?.Value?.Trim();
                if (!int.TryParse(noStr, out var doorNo)) continue;

                var doorIndex = doorNo > 0 ? doorNo - 1 : 0;
                var doorName = nameEl?.Value?.Trim();
                var status = statusEl?.Value?.Trim();

                result.Add(new DeviceDoor(
                    device.Id,
                    device.Name,
                    doorIndex,
                    string.IsNullOrWhiteSpace(doorName) ? null : doorName,
                    string.IsNullOrWhiteSpace(status) ? null : status));
            }

            if (result.Count == 0)
            {
                var statusList = doc.Descendants()
                    .FirstOrDefault(x => string.Equals(x.Name.LocalName, "gateStatusList", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(x.Name.LocalName, "statusList", StringComparison.OrdinalIgnoreCase));
                if (statusList != null)
                {
                    var children = statusList.Elements().ToList();
                    for (var i = 0; i < children.Count; i++)
                    {
                        var status = children[i].Descendants()
                            .FirstOrDefault(x => string.Equals(x.Name.LocalName, "status", StringComparison.OrdinalIgnoreCase))?.Value?.Trim();
                        result.Add(new DeviceDoor(device.Id, device.Name, i, null, status));
                    }
                }
            }

            if (result.Count == 0 && root != null)
            {
                var statusEl = root.Descendants().FirstOrDefault(x => string.Equals(x.Name.LocalName, "status", StringComparison.OrdinalIgnoreCase));
                var noEl = root.Descendants().FirstOrDefault(x =>
                    string.Equals(x.Name.LocalName, "gateNo", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(x.Name.LocalName, "gateIndex", StringComparison.OrdinalIgnoreCase));
                if (statusEl != null || noEl != null)
                {
                    var doorNo = noEl != null && int.TryParse(noEl.Value?.Trim(), out var n) ? n : 1;
                    var doorIndex = doorNo > 0 ? doorNo - 1 : 0;
                    result.Add(new DeviceDoor(device.Id, device.Name, doorIndex, null, statusEl?.Value?.Trim()));
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "ParseGateStatusXml failed for {Device}", device.Name);
        }

        return result;
    }

    private List<DeviceDoor> ParseGateStatusJson(string content, Device device)
    {
        var result = new List<DeviceDoor>();
        try
        {
            var trimmed = content.Trim();
            if (!trimmed.StartsWith('{') && !trimmed.StartsWith('[')) return result;

            using var doc = global::System.Text.Json.JsonDocument.Parse(content);
            var root = doc.RootElement;

            if (root.ValueKind == global::System.Text.Json.JsonValueKind.Array)
            {
                var idx = 0;
                foreach (var item in root.EnumerateArray())
                {
                    var status = item.TryGetProperty("status", out var s) ? s.GetString() : null;
                    var name = item.TryGetProperty("gateName", out var n) ? n.GetString() : item.TryGetProperty("name", out var n2) ? n2.GetString() : null;
                    var no = item.TryGetProperty("gateNo", out var g) ? g.GetInt32() : item.TryGetProperty("gateIndex", out var g2) ? g2.GetInt32() : idx;
                    var doorIndex = no > 0 ? no - 1 : idx;
                    result.Add(new DeviceDoor(device.Id, device.Name, doorIndex, name, status));
                    idx++;
                }
            }
            else if (root.TryGetProperty("GateStatus", out var gs))
            {
                if (gs.TryGetProperty("gateStatus", out var list) && list.ValueKind == global::System.Text.Json.JsonValueKind.Array)
                {
                    var idx = 0;
                    foreach (var item in list.EnumerateArray())
                    {
                        var status = item.TryGetProperty("status", out var s) ? s.GetString() : null;
                        var name = item.TryGetProperty("gateName", out var n) ? n.GetString() : null;
                        var no = item.TryGetProperty("gateNo", out var g) ? g.GetInt32() : idx;
                        var doorIndex = no > 0 ? no - 1 : idx;
                        result.Add(new DeviceDoor(device.Id, device.Name, doorIndex, name, status));
                        idx++;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "ParseGateStatusJson failed for {Device}", device.Name);
        }

        return result;
    }
}
