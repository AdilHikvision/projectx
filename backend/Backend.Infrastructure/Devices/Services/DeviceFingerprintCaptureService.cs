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

/// <summary>Захват отпечатка с устройства Hikvision (CaptureFingerData).</summary>
public sealed class DeviceFingerprintCaptureService(
    AppDbContext dbContext,
    IDevicePersonSyncService syncService,
    IConfiguration configuration,
    ILogger<DeviceFingerprintCaptureService> logger) : IDeviceFingerprintCaptureService
{
    private static readonly ConcurrentDictionary<Guid, FingerprintCaptureSession> Sessions = new();

    private sealed class FingerprintCaptureSession
    {
        public required string EmployeeNo { get; init; }
        public required Guid PersonId { get; init; }
        public required string PersonType { get; init; }
        public required int FingerIndex { get; init; }
        public DateTime StartedUtc { get; init; } = DateTime.UtcNow;
    }

    public async Task<DeviceSyncResult> StartCaptureAsync(Guid deviceId, Guid personId, string personType, int fingerIndex, CancellationToken cancellationToken = default)
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
            logger.LogInformation("[CaptureFinger] employeeNo={EmployeeNo} (from Employee.EmployeeNo or Id), same as on device after sync", employeeNo);
        }
        else
        {
            var vis = await dbContext.Visitors.AsNoTracking().FirstOrDefaultAsync(v => v.Id == personId, cancellationToken);
            if (vis is null) return new DeviceSyncResult(false, "Посетитель не найден.");
            employeeNo = TruncateEmployeeNo(!string.IsNullOrWhiteSpace(vis.DocumentNumber) ? vis.DocumentNumber.Trim() : vis.Id.ToString("N")[..32]);
            var syncRes = await syncService.SyncVisitorAsync(personId, deviceId, cancellationToken);
            if (!syncRes.Success) return syncRes;
            logger.LogInformation("[CaptureFinger] employeeNo={EmployeeNo} (from Visitor.DocumentNumber or Id), same as on device after sync", employeeNo);
        }

        var client = CreateClient(device);
        var fingerPrintIndex = Math.Clamp(fingerIndex, 1, 10);

        logger.LogInformation("[CaptureFinger] Start device={Device} ({Ip}:{Port}) employeeNo={EmployeeNo} fingerIndex={Index}", device.Name, device.IpAddress, device.Port, employeeNo, fingerPrintIndex);

        // Документация 9.12.2.1: перед вызовом проверить GET FingerPrintCfg/capabilities.
        var (capOk, _, _) = await client.GetAsync("ISAPI/AccessControl/FingerPrintCfg/capabilities?format=json", cancellationToken);
        if (!capOk)
            return new DeviceSyncResult(false, "Устройство не поддерживает управление отпечатками (FingerPrintCfg/capabilities недоступен).");

        // Получить с устройства структуру CardReaderCfg — в ответе могут быть точные имена полей (enableCardReader и т.д.).
        var (cardReaderOk, cardReaderContent, _) = await client.GetAsync("ISAPI/AccessControl/CardReaderCfg/1?format=json", cancellationToken);
        if (cardReaderOk && !string.IsNullOrWhiteSpace(cardReaderContent))
            logger.LogInformation("[CaptureFinger] CardReaderCfg/1 response (first 600 chars): {Snippet}", cardReaderContent.Length > 600 ? cardReaderContent[..600] + "..." : cardReaderContent);

        // В открытых источниках точное тело для FingerPrintDownload не документировано. Устройство требует FingerPrintCfg и enableCardReader. Пробуем варианты.
        var opts = new JsonSerializerOptions { PropertyNamingPolicy = null, WriteIndented = false };
        var bodies = new[]
        {
            JsonSerializer.Serialize(new { FingerPrintCfg = new { EmployeeNo = employeeNo, FingerPrintIndex = fingerPrintIndex, FingerPrintData = "", EnableCardReader = new { CardReaderID = 1 } } }, opts),
            JsonSerializer.Serialize(new { FingerPrintCfg = new { employeeNo, fingerPrintIndex, fingerPrintData = "", enableCardReader = new { cardReaderID = 1 } } }, opts),
            JsonSerializer.Serialize(new { FingerPrintCfg = new { EmployeeNo = employeeNo, FingerPrintIndex = fingerPrintIndex, FingerPrintData = "", EnableCardReader = true } }, opts),
            JsonSerializer.Serialize(new { FingerPrintCfg = new { employeeNo, fingerPrintIndex, fingerPrintData = "", enableCardReader = true } }, opts),
            JsonSerializer.Serialize(new { FingerPrintCfg = new { EmployeeNo = employeeNo, FingerPrintIndex = fingerPrintIndex, FingerPrintData = "", EnableCardReader = 1 } }, opts),
        };
        bool success = false;
        string? content = null;
        string? error = null;
        var paths = new[] { "ISAPI/AccessControl/FingerPrintCfg/Download?format=json", "ISAPI/AccessControl/FingerPrintDownload?format=json" };
        foreach (var path in paths)
        {
            foreach (var body in bodies)
            {
                (success, content, error) = await client.PostJsonAsync(path, body, cancellationToken);
                logger.LogInformation("[CaptureFinger] POST {Path} bodyLen={Len} success={Success}", path, body.Length, success);
                if (success) break;
            }
            if (success) break;
        }

        logger.LogInformation("[CaptureFinger] POST final success={Success} error={Error} contentLen={Len}", success, error ?? "-", content?.Length ?? 0);
        if (!success && !string.IsNullOrEmpty(error)) logger.LogWarning("[CaptureFinger] Response error: {Error}", error);
        if (success && !string.IsNullOrEmpty(content)) logger.LogInformation("[CaptureFinger] Response body (first 400 chars): {Snippet}", content != null && content.Length > 400 ? content[..400] + "..." : content ?? "");

        if (!success)
        {
            logger.LogWarning("[CaptureFinger] FAILED for {Device} employeeNo={EmployeeNo}: {Error}", device.Name, employeeNo, error);
            var userMessage = (error != null && (error.Contains("notSupport", StringComparison.OrdinalIgnoreCase) || error.Contains("not support")))
                ? "Устройство не поддерживает захват отпечатка с устройства. Добавьте отпечаток вручную (шаблон в base64)."
                : (error ?? "Не удалось запустить захват отпечатка. Проверьте, что устройство поддерживает добавление отпечатков (FingerPrintCfg/capabilities).");
            return new DeviceSyncResult(false, userMessage);
        }

        Sessions[deviceId] = new FingerprintCaptureSession { EmployeeNo = employeeNo, PersonId = personId, PersonType = personType, FingerIndex = fingerPrintIndex };
        return new DeviceSyncResult(true, null);
    }

    public async Task<FingerprintCaptureProgressResult> GetProgressAsync(Guid deviceId, CancellationToken cancellationToken = default)
    {
        if (!Sessions.TryGetValue(deviceId, out var session))
            return new FingerprintCaptureProgressResult("idle", "Сессия захвата не найдена. Запустите захват.", null);

        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
        {
            Sessions.TryRemove(deviceId, out _);
            return new FingerprintCaptureProgressResult("failed", "Устройство не найдено.", null);
        }

        if ((DateTime.UtcNow - session.StartedUtc).TotalSeconds > 120)
        {
            Sessions.TryRemove(deviceId, out _);
            return new FingerprintCaptureProgressResult("failed", "Таймаут захвата.", null);
        }

        // Документация Pro Series 9.12.2.4: прогресс добавления отпечатка — GET FingerPrintProgress.
        var client = CreateClient(device);
        var (success, content, error) = await client.GetAsync("ISAPI/AccessControl/FingerPrintProgress?format=json", cancellationToken);

        if (!success)
            return new FingerprintCaptureProgressResult("capturing", null, null);

        try
        {
            using var doc = JsonDocument.Parse(content ?? "{}");
            var root = doc.RootElement;
            string? fingerPrintDataB64 = null;
            string status = "capturing";
            bool? isCurRequestOver = null;
            int captureProgress = -1;

            foreach (var prop in new[] { "FingerPrintProgress", "fingerPrintProgress", "CaptureFingerDataProgress", "captureFingerDataProgress" })
            {
                if (root.TryGetProperty(prop, out var progEl))
                {
                    if (progEl.TryGetProperty("fingerPrintData", out var fd)) fingerPrintDataB64 = fd.GetString();
                    if (string.IsNullOrWhiteSpace(fingerPrintDataB64) && progEl.TryGetProperty("FingerPrintData", out var fd2)) fingerPrintDataB64 = fd2.GetString();
                    if (progEl.TryGetProperty("status", out var s)) status = s.GetString() ?? status;
                    if (progEl.TryGetProperty("Status", out var s2)) status = s2.GetString() ?? status;
                    if (progEl.TryGetProperty("captureProgress", out var cp) && cp.TryGetInt32(out var cpVal)) captureProgress = cpVal;
                    if (progEl.TryGetProperty("CaptureProgress", out var cp2) && cp2.TryGetInt32(out var cpVal2)) captureProgress = cpVal2;
                    if (progEl.TryGetProperty("isCurRequestOver", out var iso) && (iso.ValueKind == JsonValueKind.True || iso.ValueKind == JsonValueKind.False)) isCurRequestOver = iso.GetBoolean();
                    if (!isCurRequestOver.HasValue && progEl.TryGetProperty("IsCurRequestOver", out var iso2) && (iso2.ValueKind == JsonValueKind.True || iso2.ValueKind == JsonValueKind.False)) isCurRequestOver = iso2.GetBoolean();
                    break;
                }
            }

            if (isCurRequestOver == true && string.IsNullOrWhiteSpace(fingerPrintDataB64))
            {
                Sessions.TryRemove(deviceId, out _);
                return new FingerprintCaptureProgressResult("failed", "Захват отпечатка не удался. Приложите палец к считывателю и повторите.", null);
            }

            if (!string.IsNullOrWhiteSpace(fingerPrintDataB64))
            {
                byte[] templateData;
                try
                {
                    templateData = Convert.FromBase64String(fingerPrintDataB64.Trim());
                }
                catch
                {
                    Sessions.TryRemove(deviceId, out _);
                    return new FingerprintCaptureProgressResult("failed", "Неверный формат данных отпечатка.", null);
                }

                if (templateData.Length == 0)
                {
                    Sessions.TryRemove(deviceId, out _);
                    return new FingerprintCaptureProgressResult("failed", "Пустой шаблон отпечатка.", null);
                }

                var fp = new Fingerprint
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = session.PersonType == "employee" ? session.PersonId : null,
                    VisitorId = session.PersonType == "visitor" ? session.PersonId : null,
                    TemplateData = templateData,
                    FingerIndex = session.FingerIndex,
                    CreatedUtc = DateTime.UtcNow
                };
                dbContext.Fingerprints.Add(fp);
                await dbContext.SaveChangesAsync(cancellationToken);

                var syncRes = await syncService.SyncFingerprintAsync(fp.Id, deviceId, cancellationToken);
                if (!syncRes.Success)
                    logger.LogWarning("Sync fingerprint {FpId} to device after capture: {Message}", fp.Id, syncRes.Message);

                Sessions.TryRemove(deviceId, out _);
                return new FingerprintCaptureProgressResult("completed", "Отпечаток успешно захвачен и добавлен.", fp.Id);
            }

            return new FingerprintCaptureProgressResult(status, null, null);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Parse CaptureFingerData Progress");
        }

        return new FingerprintCaptureProgressResult("capturing", null, null);
    }

    private static string TruncateEmployeeNo(string s) => string.IsNullOrEmpty(s) ? s : (s.Length > 32 ? s[..32] : s);

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
