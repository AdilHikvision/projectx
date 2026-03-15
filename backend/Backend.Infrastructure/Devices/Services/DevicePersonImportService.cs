using System.Net;
using System.Text.Json;
using Backend.Application.Devices;
using Backend.Domain.Entities;
using Backend.Infrastructure.Devices;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>Импорт пользователей с устройств Hikvision через ISAPI UserInfo Search.</summary>
public sealed class DevicePersonImportService(
    AppDbContext dbContext,
    IConfiguration configuration,
    ILogger<DevicePersonImportService> logger) : IDevicePersonImportService
{
    public async Task<IReadOnlyCollection<ImportedUser>> FetchUsersFromDeviceAsync(Guid deviceId, CancellationToken cancellationToken = default)
    {
        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
            return [];

        var client = CreateClient(device);
        var all = new List<ImportedUser>();
        var searchPosition = 0;
        const int maxResults = 100;

        while (true)
        {
            var searchBody = JsonSerializer.Serialize(new
            {
                UserInfoSearchCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = searchPosition,
                    maxResults
                }
            });

            var (success, content, error) = await client.PostJsonAsync(
                "ISAPI/AccessControl/UserInfo/Search?format=json",
                searchBody,
                cancellationToken);

            if (!success || string.IsNullOrWhiteSpace(content))
            {
                logger.LogWarning("UserInfo Search failed for {Device}: {Error}", device.Name, error);
                break;
            }

            var users = ParseUserInfoSearchResponse(content, deviceId, device.Name);
            if (users.Count == 0)
                break;

            all.AddRange(users);
            if (users.Count < maxResults)
                break;

            searchPosition += users.Count;
            if (searchPosition >= 1000)
                break;
        }

        return all;
    }

    public async Task<PersonImportResult> ImportFromDevicesAsync(IReadOnlyCollection<Guid> deviceIds, Guid? companyId = null, CancellationToken cancellationToken = default)
    {
        if (deviceIds.Count == 0)
            return new PersonImportResult(0, 0, 0, []);

        var items = new List<PersonImportItem>();
        var seenEmployeeNo = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var imported = 0;
        var skipped = 0;
        var errors = 0;

        foreach (var deviceId in deviceIds)
        {
            var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
            if (device is null)
            {
                items.Add(new PersonImportItem("", "", deviceId, "?", false, "Устройство не найдено"));
                errors++;
                continue;
            }

            var users = await FetchUsersFromDeviceAsync(deviceId, cancellationToken);
            foreach (var user in users)
            {
                if (string.IsNullOrWhiteSpace(user.EmployeeNo) || string.IsNullOrWhiteSpace(user.Name))
                {
                    items.Add(new PersonImportItem(user.EmployeeNo ?? "", user.Name ?? "", deviceId, device.Name, false, "Пустой employeeNo или name"));
                    errors++;
                    continue;
                }

                var empNo = user.EmployeeNo.Trim();
                if (empNo.Length > 32) empNo = empNo[..32];

                if (seenEmployeeNo.Contains(empNo))
                {
                    items.Add(new PersonImportItem(empNo, user.Name, deviceId, device.Name, false, "Дубликат (уже импортирован)"));
                    skipped++;
                    continue;
                }

                var parts = user.Name.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                var firstName = user.GivenName ?? (parts.Length > 0 ? parts[0] : user.Name);
                var lastName = user.FamilyName ?? (parts.Length > 1 ? parts[1] : (parts.Length == 1 ? parts[0] : ""));

                if (string.IsNullOrWhiteSpace(firstName)) firstName = user.Name;
                if (string.IsNullOrWhiteSpace(lastName)) lastName = user.Name;

                // Ограничение длины полей БД (FirstName/LastName max 150, Gender max 16)
                if (firstName.Length > 150) firstName = firstName[..150];
                if (lastName.Length > 150) lastName = lastName[..150];
                var gender = user.Gender?.Length > 16 ? user.Gender[..16] : user.Gender;

                // userType: "normal", "visitor", "blackList" (строка)
                var isVisitor = string.Equals(user.UserType, "visitor", StringComparison.OrdinalIgnoreCase)
                    || user.Type == 2;

                try
                {
                    if (isVisitor)
                    {
                        var existsVisitor = await dbContext.Visitors.AnyAsync(v =>
                            v.DocumentNumber == empNo, cancellationToken);
                        var existsEmployee = await dbContext.Employees.AnyAsync(e =>
                            e.EmployeeNo == empNo, cancellationToken);
                        if (existsVisitor || existsEmployee)
                        {
                            items.Add(new PersonImportItem(empNo, user.Name, deviceId, device.Name, false, "Посетитель уже существует в БД"));
                            skipped++;
                            continue;
                        }

                        var visitor = new Visitor
                        {
                            Id = Guid.NewGuid(),
                            FirstName = firstName.Trim(),
                            LastName = lastName.Trim(),
                            DocumentNumber = empNo,
                            VisitDateUtc = DateTime.UtcNow,
                            IsActive = user.Type != 3 && !string.Equals(user.UserType, "blackList", StringComparison.OrdinalIgnoreCase),
                            CreatedUtc = DateTime.UtcNow
                        };

                        dbContext.Visitors.Add(visitor);
                        try
                        {
                            await dbContext.SaveChangesAsync(cancellationToken);
                        }
                        catch
                        {
                            dbContext.Entry(visitor).State = EntityState.Detached;
                            throw;
                        }
                    }
                    else
                    {
                        var existsEmployee = await dbContext.Employees.AnyAsync(e =>
                            e.EmployeeNo == empNo, cancellationToken);
                        var existsVisitor = await dbContext.Visitors.AnyAsync(v =>
                            v.DocumentNumber == empNo, cancellationToken);
                        if (existsEmployee || existsVisitor)
                        {
                            items.Add(new PersonImportItem(empNo, user.Name, deviceId, device.Name, false, "Сотрудник уже существует в БД"));
                            skipped++;
                            continue;
                        }

                        var employee = new Employee
                        {
                            Id = Guid.NewGuid(),
                            FirstName = firstName.Trim(),
                            LastName = lastName.Trim(),
                            EmployeeNo = empNo,
                            Gender = gender,
                            IsActive = user.Type != 3 && !string.Equals(user.UserType, "blackList", StringComparison.OrdinalIgnoreCase),
                            OnlyVerify = user.OnlyVerify,
                            CompanyId = companyId,
                            CreatedUtc = DateTime.UtcNow
                        };

                        if (!string.IsNullOrWhiteSpace(user.ValidBeginTime) && DateTime.TryParse(user.ValidBeginTime, null, global::System.Globalization.DateTimeStyles.RoundtripKind, out var vFrom))
                            employee.ValidFromUtc = vFrom.Kind == DateTimeKind.Utc ? vFrom : DateTime.SpecifyKind(vFrom, DateTimeKind.Utc);
                        if (!string.IsNullOrWhiteSpace(user.ValidEndTime) && DateTime.TryParse(user.ValidEndTime, null, global::System.Globalization.DateTimeStyles.RoundtripKind, out var vTo))
                            employee.ValidToUtc = vTo.Kind == DateTimeKind.Utc ? vTo : DateTime.SpecifyKind(vTo, DateTimeKind.Utc);

                        dbContext.Employees.Add(employee);
                        try
                        {
                            await dbContext.SaveChangesAsync(cancellationToken);
                        }
                        catch
                        {
                            dbContext.Entry(employee).State = EntityState.Detached;
                            throw;
                        }
                    }

                    seenEmployeeNo.Add(empNo);
                    items.Add(new PersonImportItem(empNo, user.Name, deviceId, device.Name, true, null));
                    imported++;
                }
                catch (Exception ex)
                {
                    var msg = ex.InnerException?.Message ?? ex.Message;
                    logger.LogWarning(ex, "Import failed for {EmployeeNo} from {Device}: {Error}", empNo, device.Name, msg);
                    items.Add(new PersonImportItem(empNo, user.Name, deviceId, device.Name, false, msg));
                    errors++;
                }
            }
        }

        return new PersonImportResult(imported, skipped, errors, items);
    }

    private static List<ImportedUser> ParseUserInfoSearchResponse(string json, Guid deviceId, string deviceName)
    {
        var result = new List<ImportedUser>();
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            JsonElement userList = default;
            var found = false;
            if (root.TryGetProperty("UserInfoSearch", out var search))
            {
                if (search.TryGetProperty("UserInfo", out var ui)) { userList = ui; found = true; }
                else if (search.TryGetProperty("UserInfoList", out var uil)) { userList = uil; found = true; }
            }
            else if (root.TryGetProperty("UserInfoSearchResult", out var searchResult))
            {
                if (searchResult.TryGetProperty("UserInfo", out var ui)) { userList = ui; found = true; }
                else if (searchResult.TryGetProperty("UserInfoList", out var uil)) { userList = uil; found = true; }
            }
            else if (root.TryGetProperty("UserInfo", out var directUi))
            {
                userList = directUi;
                found = true;
            }

            if (!found)
                return result;

            var el = userList;
            if (el.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in el.EnumerateArray())
                {
                    var u = ParseUserInfoElement(item, deviceId, deviceName);
                    if (u != null) result.Add(u);
                }
            }
            else if (el.ValueKind == JsonValueKind.Object)
            {
                var u = ParseUserInfoElement(el, deviceId, deviceName);
                if (u != null) result.Add(u);
            }
        }
        catch
        {
            // ignore parse errors
        }

        return result;
    }

    private static ImportedUser? ParseUserInfoElement(JsonElement el, Guid deviceId, string deviceName)
    {
        if (!el.TryGetProperty("employeeNo", out var empNoEl))
            return null;

        var employeeNo = empNoEl.GetString()?.Trim() ?? "";
        if (string.IsNullOrEmpty(employeeNo))
            return null;

        var name = el.TryGetProperty("name", out var nameEl) ? nameEl.GetString() ?? "" : "";
        var givenName = el.TryGetProperty("givenName", out var gn) ? gn.GetString() : null;
        var familyName = el.TryGetProperty("familyName", out var fn) ? fn.GetString() : null;
        var type = el.TryGetProperty("type", out var typeEl) && typeEl.TryGetInt32(out var t) ? t : 1;
        var userType = el.TryGetProperty("userType", out var utEl) ? utEl.GetString() : null;
        var gender = el.TryGetProperty("gender", out var g) ? g.GetString() : null;

        string? validBegin = null, validEnd = null;
        if (el.TryGetProperty("Valid", out var validEl))
        {
            if (validEl.TryGetProperty("beginTime", out var bt)) validBegin = bt.GetString();
            if (validEl.TryGetProperty("endTime", out var et)) validEnd = et.GetString();
        }

        if (string.IsNullOrWhiteSpace(name) && (givenName != null || familyName != null))
            name = $"{givenName ?? ""} {familyName ?? ""}".Trim();

        if (string.IsNullOrWhiteSpace(name))
            name = employeeNo;

        var onlyVerify = el.TryGetProperty("onlyVerify", out var ovEl) && ovEl.ValueKind == JsonValueKind.True;
        return new ImportedUser(employeeNo, name, givenName, familyName, type, userType, gender, validBegin, validEnd, onlyVerify, deviceId, deviceName);
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
            TimeSpan.FromSeconds(20));
    }
}
