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

        foreach (var user in all)
        {
            await FetchCardsForUserAsync(client, user, cancellationToken);
            await FetchFingerprintsForUserAsync(client, user, cancellationToken);
            await FetchFacesForUserAsync(client, user, cancellationToken);
            await FetchIrisesForUserAsync(client, user, cancellationToken);
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

                        await SaveBiometricDataAsync(user, employeeId: null, visitorId: visitor.Id, cancellationToken);
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

                        await SaveBiometricDataAsync(user, employeeId: employee.Id, visitorId: null, cancellationToken);
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

    private async Task SaveBiometricDataAsync(ImportedUser user, Guid? employeeId, Guid? visitorId, CancellationToken ct)
    {
        foreach (var card in user.Cards)
        {
            if (await dbContext.Cards.AnyAsync(c => c.CardNo == card.CardNo, ct))
                continue;

            dbContext.Cards.Add(new Card
            {
                Id = Guid.NewGuid(),
                EmployeeId = employeeId,
                VisitorId = visitorId,
                CardNo = card.CardNo,
                CreatedUtc = DateTime.UtcNow
            });
        }

        foreach (var fp in user.Fingerprints)
        {
            dbContext.Fingerprints.Add(new Fingerprint
            {
                Id = Guid.NewGuid(),
                EmployeeId = employeeId,
                VisitorId = visitorId,
                TemplateData = fp.TemplateData,
                FingerIndex = fp.FingerPrintID,
                CreatedUtc = DateTime.UtcNow
            });
        }

        foreach (var face in user.Faces)
        {
            var facesDir = Path.Combine(AppContext.BaseDirectory, "faces");
            Directory.CreateDirectory(facesDir);
            var fileName = $"{Guid.NewGuid():N}.jpg";
            var filePath = Path.Combine(facesDir, fileName);
            await File.WriteAllBytesAsync(filePath, face.ImageData, ct);

            dbContext.Faces.Add(new Face
            {
                Id = Guid.NewGuid(),
                EmployeeId = employeeId,
                VisitorId = visitorId,
                FilePath = Path.Combine("faces", fileName),
                FDID = face.FDID,
                CreatedUtc = DateTime.UtcNow
            });
        }

        if (user.Cards.Count > 0 || user.Fingerprints.Count > 0 || user.Faces.Count > 0)
        {
            await dbContext.SaveChangesAsync(ct);
            logger.LogInformation(
                "Imported biometrics for {EmployeeNo}: {Cards} cards, {FP} fingerprints, {Faces} faces, {Iris} irises",
                user.EmployeeNo, user.Cards.Count, user.Fingerprints.Count, user.Faces.Count, user.Irises.Count);
        }
    }

    private async Task FetchCardsForUserAsync(IsapiClient client, ImportedUser user, CancellationToken ct)
    {
        try
        {
            var body = JsonSerializer.Serialize(new
            {
                CardInfoSearchCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = 0,
                    maxResults = 50,
                    EmployeeNoList = new[] { new { employeeNo = user.EmployeeNo } }
                }
            });

            var (ok, content, _) = await client.PostJsonAsync("ISAPI/AccessControl/CardInfo/Search?format=json", body, ct);
            if (!ok || string.IsNullOrWhiteSpace(content)) return;

            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            JsonElement cardList = default;
            var found = false;
            if (root.TryGetProperty("CardInfoSearch", out var cis) && cis.TryGetProperty("CardInfo", out var ci)) { cardList = ci; found = true; }
            else if (root.TryGetProperty("CardInfoSearchResult", out var cisr) && cisr.TryGetProperty("CardInfo", out var ci2)) { cardList = ci2; found = true; }
            if (!found) return;

            if (cardList.ValueKind == JsonValueKind.Array)
            {
                foreach (var card in cardList.EnumerateArray())
                {
                    var cardNo = card.TryGetProperty("cardNo", out var cn) ? cn.GetString()?.Trim() : null;
                    if (string.IsNullOrWhiteSpace(cardNo)) continue;
                    var cardType = card.TryGetProperty("cardType", out var ct2) ? ct2.GetString() : null;
                    user.Cards.Add(new ImportedCard(cardNo, cardType));
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "CardInfo/Search failed for {EmployeeNo}", user.EmployeeNo);
        }
    }

    private async Task FetchFingerprintsForUserAsync(IsapiClient client, ImportedUser user, CancellationToken ct)
    {
        try
        {
            var body = JsonSerializer.Serialize(new
            {
                FingerPrintCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    employeeNo = user.EmployeeNo
                }
            });

            var (ok, content, _) = await client.PostJsonAsync("ISAPI/AccessControl/FingerPrintUpload?format=json", body, ct);
            if (!ok || string.IsNullOrWhiteSpace(content)) return;

            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            JsonElement fpList = default;
            var found = false;
            foreach (var propName in new[] { "FingerPrintList", "FingerPrintCfg" })
            {
                if (root.TryGetProperty(propName, out fpList)) { found = true; break; }
            }

            if (!found && root.TryGetProperty("FingerPrintInfo", out var fpi))
            {
                if (fpi.TryGetProperty("FingerPrintList", out fpList)) found = true;
                else if (fpi.TryGetProperty("FingerPrintCfg", out fpList)) found = true;
            }

            if (!found) return;

            var items = fpList.ValueKind == JsonValueKind.Array ? fpList.EnumerateArray().ToList() : [fpList];
            foreach (var fp in items)
            {
                var fpId = fp.TryGetProperty("fingerPrintID", out var idEl) && idEl.TryGetInt32(out var id) ? id : 0;
                if (fpId <= 0) continue;
                var dataB64 = fp.TryGetProperty("fingerData", out var d) ? d.GetString() : null;
                if (string.IsNullOrWhiteSpace(dataB64)) continue;
                try
                {
                    user.Fingerprints.Add(new ImportedFingerprint(fpId, Convert.FromBase64String(dataB64)));
                }
                catch { /* invalid base64 */ }
            }
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "FingerPrint fetch failed for {EmployeeNo}", user.EmployeeNo);
        }
    }

    private async Task FetchFacesForUserAsync(IsapiClient client, ImportedUser user, CancellationToken ct)
    {
        try
        {
            var body = JsonSerializer.Serialize(new
            {
                searchResultPosition = 0,
                maxResults = 10,
                faceLibType = "blackFD",
                FDID = "1",
                FPID = user.EmployeeNo
            });

            var (ok, content, _) = await client.PostJsonAsync("ISAPI/Intelligent/FDLib/FDSearch?format=json", body, ct);
            if (!ok || string.IsNullOrWhiteSpace(content)) return;

            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            JsonElement matchList = default;
            var found = false;
            if (root.TryGetProperty("MatchList", out matchList)) found = true;
            else if (root.TryGetProperty("matchList", out matchList)) found = true;

            if (!found) return;

            var items = matchList.ValueKind == JsonValueKind.Array ? matchList.EnumerateArray().ToList() : [matchList];
            foreach (var match in items)
            {
                var faceUrl = match.TryGetProperty("faceURL", out var u) ? u.GetString() : null;
                if (string.IsNullOrWhiteSpace(faceUrl)) continue;

                try
                {
                    var (imgOk, imgData, _) = await client.GetBytesAsync(faceUrl, ct);
                    if (imgOk && imgData is { Length: > 0 })
                    {
                        var fdid = match.TryGetProperty("FDID", out var fdEl) && fdEl.TryGetInt32(out var fd) ? fd : 1;
                        user.Faces.Add(new ImportedFace(imgData, fdid));
                    }
                }
                catch { /* face download failed */ }
            }
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "FDLib/FDSearch failed for {EmployeeNo}", user.EmployeeNo);
        }
    }

    private async Task FetchIrisesForUserAsync(IsapiClient client, ImportedUser user, CancellationToken ct)
    {
        try
        {
            var body = JsonSerializer.Serialize(new
            {
                IrisInfoSearchCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    employeeNo = user.EmployeeNo
                }
            });

            var (ok, content, _) = await client.PostJsonAsync("ISAPI/AccessControl/IrisInfo/Search?format=json", body, ct);
            if (!ok || string.IsNullOrWhiteSpace(content)) return;

            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            JsonElement irisList = default;
            var found = false;
            if (root.TryGetProperty("IrisInfoList", out irisList)) found = true;
            else if (root.TryGetProperty("IrisInfoSearch", out var iis) && iis.TryGetProperty("IrisInfo", out irisList)) found = true;

            if (!found) return;

            var items = irisList.ValueKind == JsonValueKind.Array ? irisList.EnumerateArray().ToList() : [irisList];
            foreach (var iris in items)
            {
                var irisId = iris.TryGetProperty("irisID", out var idEl) && idEl.TryGetInt32(out var id) ? id : 0;
                if (irisId <= 0) continue;
                var dataB64 = iris.TryGetProperty("irisData", out var d) ? d.GetString() : null;
                if (string.IsNullOrWhiteSpace(dataB64)) continue;
                try
                {
                    user.Irises.Add(new ImportedIris(irisId, Convert.FromBase64String(dataB64)));
                }
                catch { /* invalid base64 */ }
            }
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "IrisInfo/Search failed for {EmployeeNo}", user.EmployeeNo);
        }
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
