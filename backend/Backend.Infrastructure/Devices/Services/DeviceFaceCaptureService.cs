using System.Collections.Concurrent;
using System.Text.Json;
using Backend.Application.Devices;
using Backend.Domain.Entities;
using Backend.Infrastructure.Devices;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

public sealed class DeviceFaceCaptureService(
    AppDbContext dbContext,
    IDevicePersonSyncService syncService,
    IConfiguration configuration,
    ILogger<DeviceFaceCaptureService> logger) : IDeviceFaceCaptureService
{
    private static readonly ConcurrentDictionary<Guid, CaptureSession> Sessions = new();

    private sealed class CaptureSession
    {
        public required string EmployeeNo { get; init; }
        public required Guid PersonId { get; init; }
        public required string PersonType { get; init; }
        public DateTime StartedUtc { get; init; } = DateTime.UtcNow;
    }

    public async Task<DeviceSyncResult> StartCaptureAsync(Guid deviceId, Guid personId, string personType, CancellationToken cancellationToken = default)
    {
        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
            return new DeviceSyncResult(false, "Устройство не найдено.");

        string employeeNo;
        if (personType == "employee")
        {
            var emp = await dbContext.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == personId, cancellationToken);
            if (emp is null) return new DeviceSyncResult(false, "Сотрудник не найден.");
            employeeNo = Truncate(!string.IsNullOrWhiteSpace(emp.EmployeeNo) ? emp.EmployeeNo.Trim() : emp.Id.ToString("N")[..32]);
            var syncRes = await syncService.SyncEmployeeAsync(personId, deviceId, cancellationToken);
            if (!syncRes.Success) return syncRes;
        }
        else
        {
            var vis = await dbContext.Visitors.AsNoTracking().FirstOrDefaultAsync(v => v.Id == personId, cancellationToken);
            if (vis is null) return new DeviceSyncResult(false, "Посетитель не найден.");
            employeeNo = Truncate(!string.IsNullOrWhiteSpace(vis.DocumentNumber) ? vis.DocumentNumber.Trim() : vis.Id.ToString("N")[..32]);
            var syncRes = await syncService.SyncVisitorAsync(personId, deviceId, cancellationToken);
            if (!syncRes.Success) return syncRes;
        }

        var client = CreateClient(device);
        logger.LogInformation("[CaptureFace] Start: Device={Device} ({Ip}:{Port}), EmployeeNo={EmployeeNo}, PersonType={PersonType}", device.Name, device.IpAddress, device.Port, employeeNo, personType);

        await EnsureFaceLibraryExistsAsync(client, device, cancellationToken);

        // Cancel any previous capture first to avoid "Device Busy"
        await CancelCaptureAsync(client, cancellationToken);

        var (success, content, error) = await StartCaptureFaceAsync(client, employeeNo, cancellationToken);

        // If "Device Busy" — cancel and retry once
        if (!success && error != null && error.Contains("deviceBusy", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogInformation("[CaptureFace] Device busy, cancelling and retrying...");
            await CancelCaptureAsync(client, cancellationToken);
            await Task.Delay(1500, cancellationToken);
            (success, content, error) = await StartCaptureFaceAsync(client, employeeNo, cancellationToken);
        }

        logger.LogInformation("[CaptureFace] POST result: success={S} error={E} len={L}",
            success, error ?? "-", content?.Length ?? 0);

        if (!success)
        {
            logger.LogWarning("[CaptureFace] FAILED: {Error}", error);
            return new DeviceSyncResult(false, error ?? "Не удалось запустить захват лица.");
        }

        if (ParseStatusCodeError(content) is { } errMsg)
            return new DeviceSyncResult(false, errMsg);

        logger.LogInformation("[CaptureFace] CaptureFaceData OK for {Device}. Response: {Content}", device.Name, (content?.Length ?? 0) > 200 ? content![..200] + "..." : content ?? "(empty)");

        Sessions[deviceId] = new CaptureSession { EmployeeNo = employeeNo, PersonId = personId, PersonType = personType };
        return new DeviceSyncResult(true, null);
    }

    public async Task<FaceCaptureProgressResult> GetProgressAsync(Guid deviceId, CancellationToken cancellationToken = default)
    {
        if (!Sessions.TryGetValue(deviceId, out var session))
            return new FaceCaptureProgressResult("idle", null, "Сессия захвата не найдена. Запустите захват.", null);

        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
        {
            Sessions.TryRemove(deviceId, out _);
            return new FaceCaptureProgressResult("failed", null, "Устройство не найдено.", null);
        }

        if ((DateTime.UtcNow - session.StartedUtc).TotalSeconds > 120)
        {
            Sessions.TryRemove(deviceId, out _);
            return new FaceCaptureProgressResult("failed", null, "Таймаут захвата.", null);
        }

        var client = CreateClient(device);

        // Try JSON first, then XML (without ?format=json)
        string? content = null;
        var (success, c, _) = await client.GetAsync(
            "ISAPI/AccessControl/CaptureFaceData/Progress?format=json", cancellationToken);
        if (success && !string.IsNullOrWhiteSpace(c)) content = c;

        if (string.IsNullOrWhiteSpace(content))
        {
            (success, c, _) = await client.GetAsync(
                "ISAPI/AccessControl/CaptureFaceData/Progress", cancellationToken);
            if (success && !string.IsNullOrWhiteSpace(c)) content = c;
        }

        if (!success || string.IsNullOrWhiteSpace(content))
            return new FaceCaptureProgressResult("capturing", null, null, null);

        logger.LogDebug("[CaptureFace] Progress raw (first 500): {Raw}",
            content!.Length > 500 ? content[..500] : content);

        try
        {
            int? progress = null;
            bool? isOver = null;
            string? faceB64 = null;
            string? message = null;

            if (content.TrimStart().StartsWith('<'))
            {
                // XML response from device
                var xml = new global::System.Xml.XmlDocument();
                xml.LoadXml(content);
                var ns = new global::System.Xml.XmlNamespaceManager(xml.NameTable);
                ns.AddNamespace("h", "http://www.isapi.org/ver20/XMLSchema");

                string? XPath(string path) =>
                    xml.SelectSingleNode(path, ns)?.InnerText ??
                    xml.SelectSingleNode(path.Replace("h:", ""), ns)?.InnerText;

                var progStr = XPath("//h:captureProgress") ?? XPath("//h:CaptureProgress");
                if (int.TryParse(progStr, out var pv)) progress = pv;

                var overStr = XPath("//h:isCurRequestOver") ?? XPath("//h:IsCurRequestOver");
                if (bool.TryParse(overStr, out var ov)) isOver = ov;

                faceB64 = XPath("//h:faceData") ?? XPath("//h:FaceData")
                    ?? XPath("//h:faceURL") ?? XPath("//h:FaceURL")
                    ?? XPath("//h:faceDataUrl") ?? XPath("//h:FaceDataUrl");
                message = XPath("//h:message") ?? XPath("//h:Message");
            }
            else
            {
                // JSON
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;
                foreach (var prop in new[] { "CaptureFaceDataProgress", "captureFaceDataProgress" })
                {
                    if (!root.TryGetProperty(prop, out var el)) continue;
                    progress = TryInt(el, "captureProgress", "CaptureProgress");
                    isOver = TryBool(el, "isCurRequestOver", "IsCurRequestOver");
                    faceB64 = TryStr(el, "faceData", "FaceData");
                    message = TryStr(el, "message", "Message");
                    break;
                }
            }

            if (progress == 0 && isOver == true)
            {
                Sessions.TryRemove(deviceId, out _);
                return new FaceCaptureProgressResult("failed", null, message ?? "Захват лица не удался.", null);
            }

            if (progress == 100 || !string.IsNullOrWhiteSpace(faceB64))
            {
                Sessions.TryRemove(deviceId, out _);
                byte[]? imageData = null;
                if (!string.IsNullOrWhiteSpace(faceB64))
                {
                    if (faceB64.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                    {
                        // URL may have @WEB... suffix — strip it
                        var downloadUrl = faceB64.Contains('@') ? faceB64[..faceB64.LastIndexOf('@')] : faceB64;
                        logger.LogInformation("[CaptureFace] Downloading face image from: {Url}", downloadUrl);
                        try
                        {
                            var (dlOk, dlData, dlErr) = await client.GetBytesFromUrlAsync(downloadUrl, cancellationToken);
                            if (dlOk && dlData is { Length: > 0 })
                            {
                                imageData = dlData;
                            }
                            else
                            {
                                logger.LogWarning("[CaptureFace] Digest download failed ({Err}), trying without auth", dlErr);
                                using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
                                imageData = await http.GetByteArrayAsync(downloadUrl, cancellationToken);
                            }
                        }
                        catch (Exception ex) { logger.LogWarning(ex, "Failed to download face from {Url}", downloadUrl); }
                    }
                    else
                    {
                        try { imageData = Convert.FromBase64String(faceB64); } catch { }
                    }
                }

                if (imageData is { Length: > 0 })
                {
                    var facesPath = configuration["Storage:FacesPath"]
                        ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
                    Directory.CreateDirectory(facesPath);
                    var fileName = $"{Guid.NewGuid():N}.jpg";
                    await File.WriteAllBytesAsync(Path.Combine(facesPath, fileName), imageData, cancellationToken);

                    // Remove old faces for this person (keep only one)
                    var oldFaces = session.PersonType == "employee"
                        ? await dbContext.Faces.Where(f => f.EmployeeId == session.PersonId).ToListAsync(cancellationToken)
                        : await dbContext.Faces.Where(f => f.VisitorId == session.PersonId).ToListAsync(cancellationToken);
                    if (oldFaces.Count > 0)
                    {
                        dbContext.Faces.RemoveRange(oldFaces);
                        // Delete old image files
                        foreach (var old in oldFaces)
                        {
                            try
                            {
                                var oldPath = Path.Combine(facesPath, old.FilePath.TrimStart('/', '\\'));
                                if (File.Exists(oldPath)) File.Delete(oldPath);
                            }
                            catch { }
                        }
                    }

                    var face = new Face
                    {
                        Id = Guid.NewGuid(),
                        EmployeeId = session.PersonType == "employee" ? session.PersonId : null,
                        VisitorId = session.PersonType == "visitor" ? session.PersonId : null,
                        FilePath = fileName, FDID = 1, CreatedUtc = DateTime.UtcNow
                    };
                    dbContext.Faces.Add(face);
                    await dbContext.SaveChangesAsync(cancellationToken);

                    return new FaceCaptureProgressResult("completed", 100,
                        "Лицо захвачено. Сохраните профиль для синхронизации с устройствами.",
                        face.Id);
                }
                return new FaceCaptureProgressResult("completed", 100,
                    "Лицо захвачено на устройстве. Изображение не получено — добавьте лицо с компьютера.", null);
            }

            return new FaceCaptureProgressResult("capturing", progress, message, null);
        }
        catch (Exception ex) { logger.LogDebug(ex, "Parse CaptureFaceData Progress"); }

        return new FaceCaptureProgressResult("capturing", null, null, null);
    }

    private static string? ParseStatusCodeError(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            using var doc = JsonDocument.Parse(json);
            var r = doc.RootElement;
            if (TryStatusCode(r, out var code, out var msg) && code != 0)
                return $"Ошибка устройства {code}: {msg ?? "см. документацию"}";
            if (r.TryGetProperty("CaptureFaceData", out var inner) && TryStatusCode(inner, out code, out msg) && code != 0)
                return $"Ошибка устройства {code}: {msg ?? "см. документацию"}";
        }
        catch { }
        return null;
    }

    private static bool TryStatusCode(JsonElement el, out int code, out string? msg)
    {
        code = 0; msg = null;
        if (el.TryGetProperty("statusCode", out var c) && c.TryGetInt32(out code))
        {
            msg = el.TryGetProperty("statusString", out var s) ? s.GetString() : null;
            return true;
        }
        return false;
    }

    private async Task EnsureFaceLibraryExistsAsync(IsapiClient client, Device device, CancellationToken ct)
    {
        var (ok, content, _) = await client.GetAsync("ISAPI/Intelligent/FDLib?format=json", ct);
        if (ok && !string.IsNullOrWhiteSpace(content))
        {
            try
            {
                using var doc = JsonDocument.Parse(content);
                if (doc.RootElement.TryGetProperty("FDLib", out _) ||
                    (doc.RootElement.TryGetProperty("FDLibList", out var list) && list.GetArrayLength() > 0) ||
                    doc.RootElement.TryGetProperty("FDID", out _))
                    return;
            }
            catch { }
        }
        var body = JsonSerializer.Serialize(new { FDLib = new { FDID = 1, faceLibType = "blackFD", name = "default" } });
        var (_, _, err) = await client.PostJsonAsync("ISAPI/Intelligent/FDLib?format=json", body, ct);
        if (err != null)
            logger.LogDebug("FDLib create (optional) failed for {Device}: {Error}", device.Name, err);
    }

    private static int? TryInt(JsonElement el, params string[] names)
    {
        foreach (var n in names)
            if (el.TryGetProperty(n, out var p) && p.TryGetInt32(out var v)) return v;
        return null;
    }
    private static bool? TryBool(JsonElement el, params string[] names)
    {
        foreach (var n in names)
            if (el.TryGetProperty(n, out var p) && (p.ValueKind is JsonValueKind.True or JsonValueKind.False)) return p.GetBoolean();
        return null;
    }
    private static string? TryStr(JsonElement el, params string[] names)
    {
        foreach (var n in names)
            if (el.TryGetProperty(n, out var p)) return p.GetString();
        return null;
    }

    private static string Truncate(string s) => s.Length > 32 ? s[..32] : s;

    private async Task CancelCaptureAsync(IsapiClient client, CancellationToken ct)
    {
        try
        {
            // DELETE cancels in-progress face capture
            var (ok, _, err) = await client.DeleteAsync("ISAPI/AccessControl/CaptureFaceData", null, null, ct);
            logger.LogDebug("[CaptureFace] Cancel: ok={Ok} err={Err}", ok, err ?? "-");

            if (!ok)
            {
                // Some firmware accepts PUT with empty body to cancel
                await client.PutAsync("ISAPI/AccessControl/CaptureFaceData/Cancel",
                    @"<?xml version=""1.0"" encoding=""UTF-8""?><CancelCaptureCmd version=""2.0"" xmlns=""http://www.isapi.org/ver20/XMLSchema""/>",
                    "application/xml", ct);
            }
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "[CaptureFace] Cancel exception (non-fatal)");
        }
    }

    private async Task<(bool Success, string? Content, string? Error)> StartCaptureFaceAsync(
        IsapiClient client, string employeeNo, CancellationToken ct)
    {
        // DS-K1T342MFX rejects JSON with badXmlFormat — try JSON then XML
        var jsonBody = JsonSerializer.Serialize(new { CaptureFaceData = new { employeeNo, FDID = 1 } });
        var (success, content, error) = await client.PostJsonAsync(
            "ISAPI/AccessControl/CaptureFaceData?format=json", jsonBody, ct);
        logger.LogInformation("[CaptureFace] JSON attempt: success={S} error={E}", success, error ?? "-");

        if (!success)
        {
            var esc = global::System.Security.SecurityElement.Escape(employeeNo);
            var xmlBody = $@"<?xml version=""1.0"" encoding=""UTF-8""?><CaptureFaceDataCond version=""2.0"" xmlns=""http://www.isapi.org/ver20/XMLSchema""><employeeNo>{esc}</employeeNo><FDID>1</FDID></CaptureFaceDataCond>";
            (success, content, error) = await client.PostAsync(
                "ISAPI/AccessControl/CaptureFaceData", xmlBody, "application/xml", ct);
            logger.LogInformation("[CaptureFace] XML attempt: success={S} error={E}", success, error ?? "-");
        }

        return (success, content, error);
    }

    private IsapiClient CreateClient(Device device)
    {
        var username = configuration["Hikvision:Username"] ?? "admin";
        var password = (configuration["Hikvision:Password"] ?? "").Trim();
        if (string.IsNullOrEmpty(password)) password = "12345";
        return new IsapiClient(
            device.IpAddress, device.Port,
            string.IsNullOrWhiteSpace(device.Username) ? username : device.Username,
            string.IsNullOrWhiteSpace(device.Password) ? password : device.Password,
            TimeSpan.FromSeconds(20));
    }
}
