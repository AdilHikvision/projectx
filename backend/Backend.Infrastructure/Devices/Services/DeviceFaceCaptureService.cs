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

/// <summary>Захват лица с устройства Hikvision через ISAPI CaptureFaceData.</summary>
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
            employeeNo = TruncateEmployeeNo(!string.IsNullOrWhiteSpace(emp.EmployeeNo) ? emp.EmployeeNo.Trim() : emp.Id.ToString("N")[..32]);
            var syncRes = await syncService.SyncEmployeeAsync(personId, deviceId, cancellationToken);
            if (!syncRes.Success) return syncRes;
        }
        else
        {
            var vis = await dbContext.Visitors.AsNoTracking().FirstOrDefaultAsync(v => v.Id == personId, cancellationToken);
            if (vis is null) return new DeviceSyncResult(false, "Посетитель не найден.");
            employeeNo = TruncateEmployeeNo(!string.IsNullOrWhiteSpace(vis.DocumentNumber) ? vis.DocumentNumber.Trim() : vis.Id.ToString("N")[..32]);
            var syncRes = await syncService.SyncVisitorAsync(personId, deviceId, cancellationToken);
            if (!syncRes.Success) return syncRes;
        }

        var client = CreateClient(device);
        // Устройство ожидает XML (format=json даёт badXmlFormat)
        var escaped = employeeNo.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;").Replace("'", "&apos;");
        var xmlBody = $"""<?xml version="1.0" encoding="UTF-8"?><CaptureFaceData version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><employeeNo>{escaped}</employeeNo><FDID>1</FDID></CaptureFaceData>""";
        var (success, _, error) = await client.PostAsync(
            "ISAPI/AccessControl/CaptureFaceData?format=xml",
            xmlBody,
            "application/xml; charset=UTF-8",
            cancellationToken);

        if (!success)
        {
            logger.LogWarning("CaptureFaceData failed for {Device}: {Error}", device.Name, error);
            return new DeviceSyncResult(false, error ?? "Ошибка запуска захвата.");
        }

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
        var (success, content, error) = await client.GetAsync("ISAPI/AccessControl/CaptureFaceData/Progress?format=json", cancellationToken);

        if (!success)
        {
            return new FaceCaptureProgressResult("capturing", null, null, null);
        }

        try
        {
            using var doc = JsonDocument.Parse(content ?? "{}");
            var root = doc.RootElement;
            var status = "capturing";
            int? progress = null;
            string? message = null;
            byte[]? imageData = null;
            bool? isCurRequestOver = null;

            // Документация: captureProgress (0=не собрано, 100=собрано), isCurRequestOver (true при 0 = провал)
            static bool TryGetInt(JsonElement el, string[] names, out int value)
            {
                foreach (var n in names)
                    if (el.TryGetProperty(n, out var p) && p.TryGetInt32(out value)) return true;
                value = 0;
                return false;
            }
            static bool TryGetBool(JsonElement el, string[] names, out bool value)
            {
                value = false;
                foreach (var n in names)
                {
                    if (el.TryGetProperty(n, out var p) && (p.ValueKind == JsonValueKind.True || p.ValueKind == JsonValueKind.False))
                    {
                        value = p.GetBoolean();
                        return true;
                    }
                }
                return false;
            }

            foreach (var prop in new[] { "CaptureFaceDataProgress", "captureFaceDataProgress" })
            {
                if (root.TryGetProperty(prop, out var progEl))
                {
                    if (progEl.TryGetProperty("status", out var s)) status = s.GetString() ?? status;
                    if (progEl.TryGetProperty("Status", out var s2)) status = s2.GetString() ?? status;
                    if (TryGetInt(progEl, new[] { "captureProgress", "CaptureProgress", "progress", "Progress" }, out var pv)) progress = pv;
                    if (progEl.TryGetProperty("message", out var m)) message = m.GetString();
                    if (progEl.TryGetProperty("Message", out var m2)) message = m2.GetString();
                    if (TryGetBool(progEl, new[] { "isCurRequestOver", "IsCurRequestOver" }, out var iso)) isCurRequestOver = iso;
                    if (progEl.TryGetProperty("faceData", out var fd) || progEl.TryGetProperty("FaceData", out fd))
                    {
                        var b64 = fd.GetString();
                        if (!string.IsNullOrWhiteSpace(b64))
                            imageData = Convert.FromBase64String(b64);
                    }
                    break;
                }
            }

            // Документация: captureProgress=0 и isCurRequestOver=true → захват провалился
            if (progress == 0 && isCurRequestOver == true)
            {
                Sessions.TryRemove(deviceId, out _);
                return new FaceCaptureProgressResult("failed", null, message ?? "Захват лица не удался.", null);
            }

            // captureProgress=100 → лицо собрано
            if (progress == 100)
            {
                status = "completed";
            }

            if (status.Equals("completed", StringComparison.OrdinalIgnoreCase))
            {
                Sessions.TryRemove(deviceId, out _);
                if (imageData != null && imageData.Length > 0)
                {
                    var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
                    Directory.CreateDirectory(facesPath);
                    var fileName = $"{Guid.NewGuid():N}.jpg";
                    var filePath = Path.Combine(facesPath, fileName);
                    await File.WriteAllBytesAsync(filePath, imageData, cancellationToken);

                    var face = new Face
                    {
                        Id = Guid.NewGuid(),
                        EmployeeId = session.PersonType == "employee" ? session.PersonId : null,
                        VisitorId = session.PersonType == "visitor" ? session.PersonId : null,
                        FilePath = fileName,
                        FDID = 1,
                        CreatedUtc = DateTime.UtcNow
                    };
                    dbContext.Faces.Add(face);
                    await dbContext.SaveChangesAsync(cancellationToken);

                    return new FaceCaptureProgressResult("completed", 100, "Лицо успешно захвачено.", face.Id);
                }
                return new FaceCaptureProgressResult("completed", 100, "Лицо захвачено на устройстве. Изображение не получено — добавьте лицо с компьютера или веб-камеры.", null);
            }

            if (status.Equals("failed", StringComparison.OrdinalIgnoreCase))
            {
                Sessions.TryRemove(deviceId, out _);
                return new FaceCaptureProgressResult("failed", null, message ?? "Захват не удался.", null);
            }

            return new FaceCaptureProgressResult(status, progress, message, null);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Parse CaptureFaceData Progress");
        }

        return new FaceCaptureProgressResult("capturing", null, null, null);
    }

    private static string TruncateEmployeeNo(string s)
    {
        if (string.IsNullOrEmpty(s)) return s;
        return s.Length > 32 ? s[..32] : s;
    }

    private IsapiClient CreateClient(Device device)
    {
        var username = configuration["Hikvision:Username"] ?? "admin";
        var password = (configuration["Hikvision:Password"] ?? "").Trim();
        if (string.IsNullOrEmpty(password)) password = "12345";
        return new IsapiClient(
            device.IpAddress,
            device.Port,
            string.IsNullOrWhiteSpace(device.Username) ? username : device.Username,
            string.IsNullOrWhiteSpace(device.Password) ? password : device.Password,
            TimeSpan.FromSeconds(20));
    }
}
