using System.Net;
using System.Text;
using System.Text.Json;
using Backend.Application.Devices;
using Backend.Domain.Entities;
using Backend.Infrastructure.Devices;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>Синхронизация Person, Card, Face, Fingerprint на устройства Hikvision через ISAPI.</summary>
public sealed class DevicePersonSyncService(
    AppDbContext dbContext,
    IConfiguration configuration,
    ILogger<DevicePersonSyncService> logger) : IDevicePersonSyncService
{
    private static string GetEmployeeNo(Employee e) =>
        !string.IsNullOrWhiteSpace(e.EmployeeNo) ? e.EmployeeNo.Trim()
        : !string.IsNullOrWhiteSpace(e.PersonnelNumber) ? e.PersonnelNumber.Trim()
        : e.Id.ToString("N")[..Math.Min(32, 32)];

    private static string GetEmployeeNo(Visitor v) => v.Id.ToString("N")[..Math.Min(32, 32)];

    private static string TruncateEmployeeNo(string s)
    {
        if (string.IsNullOrEmpty(s)) return s;
        return s.Length > 32 ? s[..32] : s;
    }

    public async Task<DeviceSyncResult> SyncEmployeeAsync(Guid employeeId, Guid deviceId, CancellationToken cancellationToken = default)
    {
        var employee = await dbContext.Employees
            .Include(e => e.AccessLevels)
            .ThenInclude(a => a.AccessLevel)
            .ThenInclude(al => al!.Doors)
            .FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken);
        if (employee is null)
            return new DeviceSyncResult(false, "Сотрудник не найден.");

        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
            return new DeviceSyncResult(false, "Устройство не найдено.");

        var employeeNo = TruncateEmployeeNo(GetEmployeeNo(employee));
        var name = $"{employee.FirstName} {employee.LastName}".Trim();
        var doorRight = GetDoorRightForDevice(employee.AccessLevels.Select(a => a.AccessLevel).Where(al => al != null)!, deviceId);

        return await SyncUserInfoAsync(device, employeeNo, name, employee.IsActive ? 1 : 2, doorRight,
            gender: employee.Gender,
            validFromUtc: employee.ValidFromUtc,
            validToUtc: employee.ValidToUtc,
            cancellationToken: cancellationToken);
    }

    public async Task<DeviceSyncResult> SyncVisitorAsync(Guid visitorId, Guid deviceId, CancellationToken cancellationToken = default)
    {
        var visitor = await dbContext.Visitors
            .Include(v => v.AccessLevels)
            .ThenInclude(a => a.AccessLevel)
            .ThenInclude(al => al!.Doors)
            .FirstOrDefaultAsync(v => v.Id == visitorId, cancellationToken);
        if (visitor is null)
            return new DeviceSyncResult(false, "Посетитель не найден.");

        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
            return new DeviceSyncResult(false, "Устройство не найдено.");

        var employeeNo = GetEmployeeNo(visitor);
        var name = $"{visitor.FirstName} {visitor.LastName}".Trim();
        var doorRight = GetDoorRightForDevice(visitor.AccessLevels.Select(a => a.AccessLevel).Where(al => al != null)!, deviceId);

        return await SyncUserInfoAsync(device, employeeNo, name, visitor.IsActive ? 1 : 2, doorRight, cancellationToken: cancellationToken);
    }

    public async Task<DeviceSyncResult> SyncCardAsync(Guid cardId, Guid deviceId, CancellationToken cancellationToken = default)
    {
        var card = await dbContext.Cards
            .Include(c => c.Employee)
            .Include(c => c.Visitor)
            .FirstOrDefaultAsync(c => c.Id == cardId, cancellationToken);
        if (card is null)
            return new DeviceSyncResult(false, "Карта не найдена.");

        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
            return new DeviceSyncResult(false, "Устройство не найдено.");

        var employeeNo = card.Employee != null
            ? TruncateEmployeeNo(GetEmployeeNo(card.Employee))
            : GetEmployeeNo(card.Visitor!);

        var syncPerson = card.Employee != null
            ? await SyncEmployeeAsync(card.EmployeeId!.Value, deviceId, cancellationToken)
            : await SyncVisitorAsync(card.VisitorId!.Value, deviceId, cancellationToken);
        if (!syncPerson.Success)
            return syncPerson;

        var body = JsonSerializer.Serialize(new
        {
            CardInfo = new
            {
                cardNo = card.CardNo,
                cardNumber = string.IsNullOrWhiteSpace(card.CardNumber) ? card.CardNo : card.CardNumber,
                employeeNo
            }
        });

        var client = CreateClient(device);
        var (success, _, error) = await client.PostJsonAsync(
            "ISAPI/AccessControl/CardInfo/Record?format=json",
            body,
            cancellationToken);

        if (!success)
        {
            logger.LogWarning("SyncCard {CardNo} to {Device}: {Error}", card.CardNo, device.Name, error);
            return new DeviceSyncResult(false, error ?? "Ошибка синхронизации карты.");
        }
        return new DeviceSyncResult(true, null);
    }

    public async Task<DeviceSyncResult> SyncFaceAsync(Guid faceId, Guid deviceId, CancellationToken cancellationToken = default)
    {
        var face = await dbContext.Faces
            .Include(f => f.Employee)
            .Include(f => f.Visitor)
            .FirstOrDefaultAsync(f => f.Id == faceId, cancellationToken);
        if (face is null)
            return new DeviceSyncResult(false, "Лицо не найдено.");

        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
            return new DeviceSyncResult(false, "Устройство не найдено.");

        var employeeNo = face.Employee != null
            ? TruncateEmployeeNo(GetEmployeeNo(face.Employee))
            : GetEmployeeNo(face.Visitor!);

        var syncPerson = face.Employee != null
            ? await SyncEmployeeAsync(face.EmployeeId!.Value, deviceId, cancellationToken)
            : await SyncVisitorAsync(face.VisitorId!.Value, deviceId, cancellationToken);
        if (!syncPerson.Success)
            return syncPerson;

        var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
        var fullPath = Path.Combine(facesPath, face.FilePath.TrimStart('/', '\\'));
        if (!File.Exists(fullPath))
        {
            logger.LogWarning("Face image not found: {Path}", fullPath);
            return new DeviceSyncResult(false, "Файл изображения не найден.");
        }

        var escapedNo = employeeNo.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;");
        var pictureUploadData = $"""<?xml version="1.0" encoding="UTF-8"?><PictureUploadData version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><employeeNo>{escapedNo}</employeeNo><FDID>{face.FDID}</FDID><faceLibType>1</faceLibType></PictureUploadData>""";

        using var fileStream = File.OpenRead(fullPath);
        var faceContent = new StreamContent(fileStream);
        faceContent.Headers.ContentType = new global::System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
        var parts = new Dictionary<string, (HttpContent Content, string? FileName)>
        {
            ["PictureUploadData"] = (new StringContent(pictureUploadData, Encoding.UTF8, "application/xml"), null),
            ["face_picture"] = (faceContent, "face_picture.jpg")
        };

        var client = CreateClient(device);
        var (success, _, error) = await client.PostMultipartAsync(
            "ISAPI/Intelligent/FDLib/pictureUpload",
            parts,
            cancellationToken);

        if (!success)
        {
            logger.LogWarning("SyncFace {FaceId} to {Device}: {Error}", faceId, device.Name, error);
            return new DeviceSyncResult(false, error ?? "Ошибка синхронизации лица.");
        }
        return new DeviceSyncResult(true, null);
    }

    public async Task<DeviceSyncResult> SyncFingerprintAsync(Guid fingerprintId, Guid deviceId, CancellationToken cancellationToken = default)
    {
        var fp = await dbContext.Fingerprints
            .Include(f => f.Employee)
            .Include(f => f.Visitor)
            .FirstOrDefaultAsync(f => f.Id == fingerprintId, cancellationToken);
        if (fp is null)
            return new DeviceSyncResult(false, "Отпечаток не найден.");

        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
            return new DeviceSyncResult(false, "Устройство не найдено.");

        var employeeNo = fp.Employee != null
            ? TruncateEmployeeNo(GetEmployeeNo(fp.Employee))
            : GetEmployeeNo(fp.Visitor!);

        var syncPerson = fp.Employee != null
            ? await SyncEmployeeAsync(fp.EmployeeId!.Value, deviceId, cancellationToken)
            : await SyncVisitorAsync(fp.VisitorId!.Value, deviceId, cancellationToken);
        if (!syncPerson.Success)
            return syncPerson;

        var body = JsonSerializer.Serialize(new
        {
            FingerPrint = new
            {
                employeeNo,
                fingerPrintIndex = fp.FingerIndex,
                fingerPrintData = Convert.ToBase64String(fp.TemplateData)
            }
        });

        var client = CreateClient(device);
        var (success, _, error) = await client.PostJsonAsync(
            "ISAPI/AccessControl/FingerPrintDownload?format=json",
            body,
            cancellationToken);

        if (!success)
        {
            logger.LogWarning("SyncFingerprint {FpId} to {Device}: {Error}", fingerprintId, device.Name, error);
            return new DeviceSyncResult(false, error ?? "Ошибка синхронизации отпечатка.");
        }
        return new DeviceSyncResult(true, null);
    }

    public async Task<DeviceSyncResult> DeleteCardFromDeviceAsync(string cardNo, Guid deviceId, CancellationToken cancellationToken = default)
    {
        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
            return new DeviceSyncResult(false, "Устройство не найдено.");

        var body = JsonSerializer.Serialize(new { CardInfo = new { cardNo } });
        var client = CreateClient(device);
        var (success, _, error) = await client.PutJsonAsync(
            "ISAPI/AccessControl/CardInfo/Delete?format=json",
            body,
            cancellationToken);
        return success ? new DeviceSyncResult(true, null) : new DeviceSyncResult(false, error);
    }

    public async Task<DeviceSyncResult> DeleteFaceFromDeviceAsync(Guid faceId, Guid deviceId, CancellationToken cancellationToken = default)
    {
        var face = await dbContext.Faces
            .Include(f => f.Employee)
            .Include(f => f.Visitor)
            .FirstOrDefaultAsync(f => f.Id == faceId, cancellationToken);
        if (face is null)
            return new DeviceSyncResult(false, "Лицо не найдено.");

        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
            return new DeviceSyncResult(false, "Устройство не найдено.");

        var employeeNo = face.Employee != null
            ? TruncateEmployeeNo(GetEmployeeNo(face.Employee))
            : GetEmployeeNo(face.Visitor!);
        var fdId = face.FDID;
        var faceLibType = 1;

        var client = CreateClient(device);
        var (success, _, error) = await client.PutJsonAsync(
            $"ISAPI/Intelligent/FDLib/FDSearch/Delete?format=json&FDID={fdId}&faceLibType={faceLibType}&employeeNo={Uri.EscapeDataString(employeeNo)}",
            "{}",
            cancellationToken);
        return success ? new DeviceSyncResult(true, null) : new DeviceSyncResult(false, error);
    }

    public async Task<DeviceSyncResult> DeleteFingerprintFromDeviceAsync(string employeeNo, int fingerIndex, Guid deviceId, CancellationToken cancellationToken = default)
    {
        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
            return new DeviceSyncResult(false, "Устройство не найдено.");

        var body = JsonSerializer.Serialize(new
        {
            FingerPrint = new { employeeNo, fingerPrintIndex = fingerIndex }
        });
        var client = CreateClient(device);
        var (success, _, error) = await client.PutJsonAsync(
            "ISAPI/AccessControl/FingerPrint/Delete?format=json",
            body,
            cancellationToken);
        return success ? new DeviceSyncResult(true, null) : new DeviceSyncResult(false, error);
    }

    public async Task<DeviceSyncResult> DeletePersonFromDeviceAsync(string employeeNo, Guid deviceId, CancellationToken cancellationToken = default)
    {
        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
            return new DeviceSyncResult(false, "Устройство не найдено.");

        var client = CreateClient(device);
        var escapedNo = Uri.EscapeDataString(employeeNo);

        // Часть устройств Hikvision ожидает HTTP DELETE (methodNotAllowed при PUT)
        var (success, _, error) = await client.DeleteAsync(
            $"ISAPI/AccessControl/UserInfoDetail/Delete?format=json&employeeNo={escapedNo}",
            cancellationToken: cancellationToken);
        if (success)
            return new DeviceSyncResult(true, null);

        // Некоторые устройства принимают employeeNo в query string с пустым телом (PUT)
        (success, _, error) = await client.PutAsync(
            $"ISAPI/AccessControl/UserInfoDetail/Delete?format=json&employeeNo={escapedNo}",
            "{}",
            "application/json",
            cancellationToken);
        if (success)
            return new DeviceSyncResult(true, null);

        var path = "ISAPI/AccessControl/UserInfoDetail/Delete?format=json";

        // Пробуем разные форматы JSON — устройства Hikvision различаются по ожидаемой структуре
        var formats = new[]
        {
            // 1. EmployeeNoList с массивом (PascalCase)
            JsonSerializer.Serialize(new { UserInfoDetail = new { EmployeeNoList = new { EmployeeNo = new[] { employeeNo } } } }, new JsonSerializerOptions { PropertyNamingPolicy = null }),
            // 2. EmployeeNoList с одним значением (PascalCase)
            JsonSerializer.Serialize(new { UserInfoDetail = new { EmployeeNoList = new { EmployeeNo = employeeNo } } }, new JsonSerializerOptions { PropertyNamingPolicy = null }),
            // 3. camelCase
            JsonSerializer.Serialize(new { userInfoDetail = new { employeeNoList = new { employeeNo = new[] { employeeNo } } } }),
            // 4. Прямой employeeNo в UserInfoDetail
            JsonSerializer.Serialize(new { UserInfoDetail = new { employeeNo } }, new JsonSerializerOptions { PropertyNamingPolicy = null }),
        };

        string? lastError = error;
        foreach (var body in formats)
        {
            // DELETE с телом (устройство вернуло methodNotAllowed для PUT)
            (success, _, error) = await client.DeleteAsync(path, body, "application/json", cancellationToken);
            if (success)
                return new DeviceSyncResult(true, null);
            lastError = error;
            (success, _, error) = await client.PutAsync(path, body, "application/json", cancellationToken);
            if (success)
                return new DeviceSyncResult(true, null);
            lastError = error;
            (success, _, error) = await client.PostAsync(path, body, "application/json", cancellationToken);
            if (success)
                return new DeviceSyncResult(true, null);
            lastError = error;
        }

        // Fallback: XML
        var escaped = employeeNo.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;").Replace("'", "&apos;");
        var xmlBody = $@"<?xml version=""1.0"" encoding=""UTF-8""?>
<UserInfoDetail xmlns=""http://www.hikvision.com/ver20/XMLSchema"">
  <EmployeeNoList>
    <EmployeeNo>{escaped}</EmployeeNo>
  </EmployeeNoList>
</UserInfoDetail>";
        (success, _, error) = await client.DeleteAsync(
            "ISAPI/AccessControl/UserInfoDetail/Delete",
            xmlBody,
            "application/xml",
            cancellationToken);
        if (success)
            return new DeviceSyncResult(true, null);

        var (xmlSuccess, _, xmlError) = await client.PutAsync(
            "ISAPI/AccessControl/UserInfoDetail/Delete",
            xmlBody,
            "application/xml",
            cancellationToken);
        if (xmlSuccess)
            return new DeviceSyncResult(true, null);

        (xmlSuccess, _, xmlError) = await client.PostAsync(
            "ISAPI/AccessControl/UserInfoDetail/Delete",
            xmlBody,
            "application/xml",
            cancellationToken);

        return xmlSuccess ? new DeviceSyncResult(true, null) : new DeviceSyncResult(false, lastError ?? xmlError);
    }

    private static int[] GetDoorRightForDevice(IEnumerable<AccessLevel?> accessLevels, Guid deviceId)
    {
        var doorIndices = new HashSet<int>();
        foreach (var al in accessLevels.Where(al => al != null))
        {
            foreach (var door in al!.Doors.Where(d => d.DeviceId == deviceId))
                doorIndices.Add(door.DoorIndex);
        }
        return doorIndices.OrderBy(x => x).ToArray();
    }

    private async Task<DeviceSyncResult> SyncUserInfoAsync(
        Device device,
        string employeeNo,
        string name,
        int userType,
        int[] doorRight,
        string? gender = null,
        DateTime? validFromUtc = null,
        DateTime? validToUtc = null,
        CancellationToken cancellationToken = default)
    {
        var parts = name.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var givenName = parts.Length > 0 ? parts[0] : name;
        var familyName = parts.Length > 1 ? parts[1] : (parts.Length == 1 ? parts[0] : "");

        // doorNo: 1-based для ISAPI. Если дверей нет — используем дверь 1 (обязательно для многих устройств).
        var doorNoList = doorRight.Length > 0
            ? doorRight.Select(i => i + 1).ToList()
            : [1];

        var genderValue = string.IsNullOrWhiteSpace(gender) ? "unknown" : gender.Trim().ToLowerInvariant();
        if (genderValue is not ("male" or "female"))
            genderValue = "unknown";

        // Формат без Z — устройства Hikvision (Value/Pro/Controllers) ожидают "yyyy-MM-ddTHH:mm:ss"
        var beginTime = validFromUtc?.ToString("yyyy-MM-ddTHH:mm:ss") ?? "1970-01-01T00:00:00";
        var endTime = validToUtc?.ToString("yyyy-MM-ddTHH:mm:ss") ?? "2099-12-31T23:59:59";

        // doorRight — строка "1" или "1,2,3" (формат, ожидаемый Face Recognition Terminals и Controllers)
        var doorRightStr = string.Join(",", doorNoList);

        // RightPlan — обязателен для многих устройств (MessageParametersLack без него)
        var rightPlan = doorNoList.Select(d => new { doorNo = d, planTemplateNo = "1" }).ToArray();

        var userInfo = new
        {
            employeeNo,
            name,
            type = userType,
            userType = "normal",
            givenName,
            familyName,
            gender = genderValue,
            doorRight = doorRightStr,
            RightPlan = rightPlan,
            localUIRight = false,
            maxOpenDoorTime = 0,
            userVerifyMode = "",
            Valid = new { enable = true, beginTime, endTime, timeType = "local" }
        };

        var body = JsonSerializer.Serialize(new { UserInfo = userInfo });

        var client = CreateClient(device);
        var (success, _, error) = await client.PostJsonAsync(
            "ISAPI/AccessControl/UserInfo/Record?format=json",
            body,
            cancellationToken);

        if (!success)
        {
            logger.LogWarning("SyncUserInfo {EmployeeNo} to {Device} ({Ip}:{Port}): {Error}", employeeNo, device.Name, device.IpAddress, device.Port, error);
            return new DeviceSyncResult(false, error ?? "Ошибка синхронизации пользователя.");
        }
        return new DeviceSyncResult(true, null);
    }

    private IsapiClient CreateClient(Device device)
    {
        var username = configuration["Hikvision:Username"] ?? "admin";
        var password = (configuration["Hikvision:Password"] ?? "").Trim();
        if (string.IsNullOrEmpty(password)) password = "12345";
        var cred = new NetworkCredential(
            string.IsNullOrWhiteSpace(device.Username) ? username : device.Username,
            string.IsNullOrWhiteSpace(device.Password) ? password : device.Password);
        return new IsapiClient(
            device.IpAddress,
            device.Port,
            cred.UserName ?? "admin",
            cred.Password ?? "",
            TimeSpan.FromSeconds(15));
    }
}
