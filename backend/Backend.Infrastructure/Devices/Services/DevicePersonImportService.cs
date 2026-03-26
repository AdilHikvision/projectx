using System.Globalization;
using System.IO;
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

            LogImportIsapiResponse(
                device.Name,
                "(список)",
                $"POST UserInfo/Search pos={searchPosition}",
                success,
                error,
                content);

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
                        var visitorExisting = await dbContext.Visitors
                            .FirstOrDefaultAsync(v => v.DocumentNumber == empNo, cancellationToken);
                        var employeeExisting = await dbContext.Employees
                            .FirstOrDefaultAsync(e => e.EmployeeNo == empNo, cancellationToken);

                        if (visitorExisting is not null)
                        {
                            ApplyImportedUserToVisitor(visitorExisting, user, firstName, lastName);
                            await dbContext.SaveChangesAsync(cancellationToken);
                            var clientV = CreateClient(device);
                            var credV = await ImportCredentialsFromDeviceAsync(
                                clientV, device, empNo, employeeId: null, visitorId: visitorExisting.Id, user.UserInfoSnapshotJson, cancellationToken, replaceExistingBiometrics: true);
                            items.Add(new PersonImportItem(empNo, user.Name, deviceId, device.Name, true, "Обновлено с устройства", credV.Cards, credV.Faces, credV.Fingerprints, credV.Irises));
                            seenEmployeeNo.Add(empNo);
                            imported++;
                            continue;
                        }

                        if (employeeExisting is not null)
                        {
                            ApplyImportedUserToEmployee(employeeExisting, user, firstName, lastName, gender, companyId);
                            await dbContext.SaveChangesAsync(cancellationToken);
                            var clientV = CreateClient(device);
                            var credV = await ImportCredentialsFromDeviceAsync(
                                clientV, device, empNo, employeeId: employeeExisting.Id, visitorId: null, user.UserInfoSnapshotJson, cancellationToken, replaceExistingBiometrics: true);
                            items.Add(new PersonImportItem(empNo, user.Name, deviceId, device.Name, true, "Обновлено с устройства (как сотрудник)", credV.Cards, credV.Faces, credV.Fingerprints, credV.Irises));
                            seenEmployeeNo.Add(empNo);
                            imported++;
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

                        var clientV2 = CreateClient(device);
                        var credV2 = await ImportCredentialsFromDeviceAsync(
                            clientV2, device, empNo, employeeId: null, visitorId: visitor.Id, user.UserInfoSnapshotJson, cancellationToken);
                        items.Add(new PersonImportItem(empNo, user.Name, deviceId, device.Name, true, null, credV2.Cards, credV2.Faces, credV2.Fingerprints, credV2.Irises));
                        seenEmployeeNo.Add(empNo);
                        imported++;
                        continue;
                    }

                    {
                        var employeeExisting = await dbContext.Employees
                            .FirstOrDefaultAsync(e => e.EmployeeNo == empNo, cancellationToken);
                        var visitorExisting = await dbContext.Visitors
                            .FirstOrDefaultAsync(v => v.DocumentNumber == empNo, cancellationToken);

                        if (employeeExisting is not null)
                        {
                            ApplyImportedUserToEmployee(employeeExisting, user, firstName, lastName, gender, companyId);
                            await dbContext.SaveChangesAsync(cancellationToken);
                            var clientE = CreateClient(device);
                            var credE = await ImportCredentialsFromDeviceAsync(
                                clientE, device, empNo, employeeId: employeeExisting.Id, visitorId: null, user.UserInfoSnapshotJson, cancellationToken, replaceExistingBiometrics: true);
                            items.Add(new PersonImportItem(empNo, user.Name, deviceId, device.Name, true, "Обновлено с устройства", credE.Cards, credE.Faces, credE.Fingerprints, credE.Irises));
                            seenEmployeeNo.Add(empNo);
                            imported++;
                            continue;
                        }

                        if (visitorExisting is not null)
                        {
                            ApplyImportedUserToVisitor(visitorExisting, user, firstName, lastName);
                            await dbContext.SaveChangesAsync(cancellationToken);
                            var clientE = CreateClient(device);
                            var credE = await ImportCredentialsFromDeviceAsync(
                                clientE, device, empNo, employeeId: null, visitorId: visitorExisting.Id, user.UserInfoSnapshotJson, cancellationToken, replaceExistingBiometrics: true);
                            items.Add(new PersonImportItem(empNo, user.Name, deviceId, device.Name, true, "Обновлено с устройства (как посетитель)", credE.Cards, credE.Faces, credE.Fingerprints, credE.Irises));
                            seenEmployeeNo.Add(empNo);
                            imported++;
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

                        if (!string.IsNullOrWhiteSpace(user.ValidBeginTime) && DateTime.TryParse(user.ValidBeginTime, null, DateTimeStyles.RoundtripKind, out var vFrom))
                            employee.ValidFromUtc = vFrom.Kind == DateTimeKind.Utc ? vFrom : DateTime.SpecifyKind(vFrom, DateTimeKind.Utc);
                        if (!string.IsNullOrWhiteSpace(user.ValidEndTime) && DateTime.TryParse(user.ValidEndTime, null, DateTimeStyles.RoundtripKind, out var vTo))
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

                        var clientE2 = CreateClient(device);
                        var credE2 = await ImportCredentialsFromDeviceAsync(
                            clientE2, device, empNo, employeeId: employee.Id, visitorId: null, user.UserInfoSnapshotJson, cancellationToken);
                        items.Add(new PersonImportItem(empNo, user.Name, deviceId, device.Name, true, null, credE2.Cards, credE2.Faces, credE2.Fingerprints, credE2.Irises));
                        seenEmployeeNo.Add(empNo);
                        imported++;
                    }
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

    private static void ApplyImportedUserToEmployee(Employee e, ImportedUser user, string firstName, string lastName, string? gender, Guid? companyId)
    {
        e.FirstName = firstName.Trim();
        e.LastName = lastName.Trim();
        e.Gender = gender;
        e.IsActive = user.Type != 3 && !string.Equals(user.UserType, "blackList", StringComparison.OrdinalIgnoreCase);
        e.OnlyVerify = user.OnlyVerify;
        if (companyId.HasValue)
            e.CompanyId = companyId;
        if (!string.IsNullOrWhiteSpace(user.ValidBeginTime) && DateTime.TryParse(user.ValidBeginTime, null, DateTimeStyles.RoundtripKind, out var vFrom))
            e.ValidFromUtc = vFrom.Kind == DateTimeKind.Utc ? vFrom : DateTime.SpecifyKind(vFrom, DateTimeKind.Utc);
        if (!string.IsNullOrWhiteSpace(user.ValidEndTime) && DateTime.TryParse(user.ValidEndTime, null, DateTimeStyles.RoundtripKind, out var vTo))
            e.ValidToUtc = vTo.Kind == DateTimeKind.Utc ? vTo : DateTime.SpecifyKind(vTo, DateTimeKind.Utc);
    }

    private static void ApplyImportedUserToVisitor(Visitor v, ImportedUser user, string firstName, string lastName)
    {
        v.FirstName = firstName.Trim();
        v.LastName = lastName.Trim();
        v.IsActive = user.Type != 3 && !string.Equals(user.UserType, "blackList", StringComparison.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(user.ValidBeginTime) && DateTime.TryParse(user.ValidBeginTime, null, DateTimeStyles.RoundtripKind, out var vFrom))
            v.ValidFromUtc = vFrom.Kind == DateTimeKind.Utc ? vFrom : DateTime.SpecifyKind(vFrom, DateTimeKind.Utc);
        if (!string.IsNullOrWhiteSpace(user.ValidEndTime) && DateTime.TryParse(user.ValidEndTime, null, DateTimeStyles.RoundtripKind, out var vTo))
            v.ValidToUtc = vTo.Kind == DateTimeKind.Utc ? vTo : DateTime.SpecifyKind(vTo, DateTimeKind.Utc);
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
        return new ImportedUser(employeeNo, name, givenName, familyName, type, userType, gender, validBegin, validEnd, onlyVerify, deviceId, deviceName, el.GetRawText());
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

        foreach (var ir in user.Irises)
        {
            dbContext.Irises.Add(new Iris
            {
                Id = Guid.NewGuid(),
                EmployeeId = employeeId,
                VisitorId = visitorId,
                TemplateData = ir.TemplateData,
                IrisIndex = ir.IrisID,
                CreatedUtc = DateTime.UtcNow
            });
        }

        if (user.Cards.Count > 0 || user.Fingerprints.Count > 0 || user.Faces.Count > 0 || user.Irises.Count > 0)
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

    private const int ImportLogMaxResponseChars = 6000;

    private static string TruncateForImportLog(string? s, int maxChars = ImportLogMaxResponseChars)
    {
        if (s is null) return "(null)";
        if (s.Length == 0) return "(empty)";
        if (s.Length <= maxChars) return s;
        return s[..maxChars] + $" … [обрезано, всего {s.Length} символов]";
    }

    /// <summary>Сырой ответ устройства в лог при импорте (обрезка длинных JSON с base64).</summary>
    private void LogImportIsapiResponse(
        string deviceName,
        string employeeNo,
        string operation,
        bool httpOk,
        string? httpError,
        string? body)
    {
        logger.LogInformation(
            "[Import ISAPI] {Device} empNo={EmployeeNo} {Operation} httpOk={HttpOk} httpErr={HttpErr} response={Response}",
            deviceName,
            string.IsNullOrEmpty(employeeNo) ? "—" : employeeNo,
            operation,
            httpOk,
            httpError ?? "—",
            TruncateForImportLog(body));
    }

    private async Task RemoveExistingFacesAndFingerprintsAsync(Guid? employeeId, Guid? visitorId, CancellationToken cancellationToken)
    {
        var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
        var faceQuery = employeeId.HasValue
            ? dbContext.Faces.Where(f => f.EmployeeId == employeeId)
            : dbContext.Faces.Where(f => f.VisitorId == visitorId);
        var faces = await faceQuery.ToListAsync(cancellationToken);
        foreach (var f in faces)
        {
            try
            {
                var full = Path.Combine(facesPath, f.FilePath);
                if (File.Exists(full))
                    File.Delete(full);
            }
            catch
            {
                // ignore IO errors
            }

            dbContext.Faces.Remove(f);
        }

        var fpQuery = employeeId.HasValue
            ? dbContext.Fingerprints.Where(x => x.EmployeeId == employeeId)
            : dbContext.Fingerprints.Where(x => x.VisitorId == visitorId);
        var fps = await fpQuery.ToListAsync(cancellationToken);
        dbContext.Fingerprints.RemoveRange(fps);

        var irisQuery = employeeId.HasValue
            ? dbContext.Irises.Where(x => x.EmployeeId == employeeId)
            : dbContext.Irises.Where(x => x.VisitorId == visitorId);
        var irises = await irisQuery.ToListAsync(cancellationToken);
        dbContext.Irises.RemoveRange(irises);

        if (faces.Count > 0 || fps.Count > 0 || irises.Count > 0)
            await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<(int Cards, int Faces, int Fingerprints, int Irises)> ImportCredentialsFromDeviceAsync(
        IsapiClient client,
        Device device,
        string employeeNo,
        Guid? employeeId,
        Guid? visitorId,
        string? userInfoSnapshotJson,
        CancellationToken cancellationToken,
        bool replaceExistingBiometrics = false)
    {
        if (employeeId is null && visitorId is null) return (0, 0, 0, 0);
        if (employeeId is not null && visitorId is not null) return (0, 0, 0, 0);

        try
        {
            if (replaceExistingBiometrics)
                await RemoveExistingFacesAndFingerprintsAsync(employeeId, visitorId, cancellationToken);

            JsonElement userInfo = default;
            var hasUserInfo = false;

            if (!string.IsNullOrWhiteSpace(userInfoSnapshotJson))
            {
                try
                {
                    using var snapDoc = JsonDocument.Parse(userInfoSnapshotJson);
                    userInfo = snapDoc.RootElement.Clone();
                    hasUserInfo = true;
                }
                catch
                {
                    // snapshot из списка не распарсился — ниже запросим детальный UserInfo
                }
            }

            if (!hasUserInfo)
            {
                var detailJson = await FetchUserInfoJsonByEmployeeNoWithFallbacksAsync(client, device.Name, employeeNo, cancellationToken);
                hasUserInfo = !string.IsNullOrEmpty(detailJson) && TryGetFirstUserInfoJsonElement(detailJson!, out userInfo);
            }

            var cardNos = new List<string>();
            if (hasUserInfo)
                CollectCardNosFromUserInfo(userInfo, cardNos);

            if (cardNos.Count == 0)
            {
                foreach (var cn in await FetchCardNosFromCardInfoSearchWithFallbacksAsync(client, device.Name, employeeNo, cancellationToken))
                {
                    if (!cardNos.Contains(cn, StringComparer.OrdinalIgnoreCase))
                        cardNos.Add(cn);
                }
            }

            var distinctCards = cardNos
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .Select(c => c.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var cardsAdded = 0;
            foreach (var norm in distinctCards)
            {
                var no = norm.Length > 64 ? norm[..64] : norm;
                if (await dbContext.Cards.AsNoTracking().AnyAsync(c => c.CardNo == no, cancellationToken))
                    continue;
                dbContext.Cards.Add(new Card
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = employeeId,
                    VisitorId = visitorId,
                    CardNo = no,
                    CardNumber = no,
                    CreatedUtc = DateTime.UtcNow
                });
                cardsAdded++;
            }

            if (cardsAdded > 0)
                await dbContext.SaveChangesAsync(cancellationToken);

            var facesAdded = 0;
            if (hasUserInfo)
                facesAdded = await TrySaveFaceFromUserInfoAsync(client, device, userInfo, employeeId, visitorId, cancellationToken);
            if (facesAdded == 0)
                facesAdded = await TryImportFaceFromFdLibAsync(client, device, employeeNo, employeeId, visitorId, cancellationToken);

            var fpList = new List<(int FingerIndex, byte[] Data)>();
            if (hasUserInfo)
                CollectFingerprintsFromUserInfoFpInfo(userInfo, fpList);

            if (fpList.Count == 0)
            {
                var nFp = await GetFingerPrintCountAsync(client, device.Name, employeeNo, cancellationToken);
                var fpHint = hasUserInfo ? TryGetNumOfFpHint(userInfo) : 0;
                if (nFp == 0 && fpHint > 0)
                    nFp = fpHint;

                if (nFp > 0)
                    fpList.AddRange(await FetchFingerprintsFromFingerPrintUploadAsync(client, device.Name, employeeNo, cancellationToken));
                else
                {
                    // Док.: Count по employeeNo; часть прошивок возвращает 0 при наличии пальцев — пробуем поиск шаблонов.
                    var probe = await FetchFingerprintsFromFingerPrintUploadAsync(client, device.Name, employeeNo, cancellationToken);
                    if (probe.Count > 0)
                        fpList.AddRange(probe);
                }
            }

            fpList = fpList
                .GroupBy(x => x.FingerIndex)
                .Select(g => g.OrderByDescending(x => x.Data.Length).First())
                .ToList();

            var fpsAdded = 0;
            foreach (var (fingerIdx, data) in fpList)
            {
                if (data.Length == 0) continue;
                var idx = fingerIdx is >= 1 and <= 10 ? fingerIdx : 1;
                var exists = employeeId.HasValue
                    ? await dbContext.Fingerprints.AsNoTracking().AnyAsync(f => f.EmployeeId == employeeId && f.FingerIndex == idx, cancellationToken)
                    : await dbContext.Fingerprints.AsNoTracking().AnyAsync(f => f.VisitorId == visitorId && f.FingerIndex == idx, cancellationToken);
                if (exists) continue;

                dbContext.Fingerprints.Add(new Fingerprint
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = employeeId,
                    VisitorId = visitorId,
                    FingerIndex = idx,
                    TemplateData = data,
                    CreatedUtc = DateTime.UtcNow
                });
                fpsAdded++;
            }

            if (fpsAdded > 0)
                await dbContext.SaveChangesAsync(cancellationToken);

            var irisRows = await FetchIrisesFromIrisInfoSearchAsync(client, device.Name, employeeNo, cancellationToken);
            irisRows = irisRows
                .GroupBy(x => x.IrisId)
                .Select(g => g.OrderByDescending(x => x.Data.Length).First())
                .ToList();

            var irisesAdded = 0;
            foreach (var (irisIdx, data) in irisRows)
            {
                if (data.Length == 0) continue;
                var idx = irisIdx > 0 ? irisIdx : 1;
                var exists = employeeId.HasValue
                    ? await dbContext.Irises.AsNoTracking().AnyAsync(i => i.EmployeeId == employeeId && i.IrisIndex == idx, cancellationToken)
                    : await dbContext.Irises.AsNoTracking().AnyAsync(i => i.VisitorId == visitorId && i.IrisIndex == idx, cancellationToken);
                if (exists) continue;

                dbContext.Irises.Add(new Iris
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = employeeId,
                    VisitorId = visitorId,
                    IrisIndex = idx,
                    TemplateData = data,
                    CreatedUtc = DateTime.UtcNow
                });
                irisesAdded++;
            }

            if (irisesAdded > 0)
                await dbContext.SaveChangesAsync(cancellationToken);

            return (cardsAdded, facesAdded, fpsAdded, irisesAdded);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Импорт учётных данных не выполнен для {EmployeeNo} ({Device})", employeeNo, device.Name);
            return (0, 0, 0, 0);
        }
    }

    private async Task<List<(int IrisId, byte[] Data)>> FetchIrisesFromIrisInfoSearchAsync(
        IsapiClient client,
        string deviceName,
        string employeeNo,
        CancellationToken ct)
    {
        var result = new List<(int IrisId, byte[] Data)>();
        try
        {
            var body = JsonSerializer.Serialize(new
            {
                IrisInfoSearchCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    employeeNo
                }
            });

            var (ok, content, err) = await client.PostJsonAsync("ISAPI/AccessControl/IrisInfo/Search?format=json", body, ct);
            LogImportIsapiResponse(deviceName, employeeNo, "POST IrisInfo/Search", ok, err, content);
            if (!ok || string.IsNullOrWhiteSpace(content)) return result;

            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            JsonElement irisList = default;
            var found = false;
            if (root.TryGetProperty("IrisInfoList", out irisList)) found = true;
            else if (root.TryGetProperty("IrisInfoSearch", out var iis) && iis.TryGetProperty("IrisInfo", out irisList)) found = true;

            if (!found) return result;

            var items = irisList.ValueKind == JsonValueKind.Array ? irisList.EnumerateArray().ToList() : [irisList];
            foreach (var iris in items)
            {
                var irisId = iris.TryGetProperty("irisID", out var idEl) && idEl.TryGetInt32(out var id) ? id : 0;
                if (irisId <= 0) continue;
                var dataB64 = iris.TryGetProperty("irisData", out var d) ? d.GetString() : null;
                if (string.IsNullOrWhiteSpace(dataB64)) continue;
                try
                {
                    result.Add((irisId, Convert.FromBase64String(dataB64)));
                }
                catch
                {
                    /* invalid base64 */
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "IrisInfo/Search failed for {EmployeeNo}", employeeNo);
        }

        return result;
    }

    /// <summary>Ultra/Pro: условие поиска по списку employeeNo — форматы <c>EmployeeNoList</c> на прошивках различаются.</summary>
    private async Task<string?> FetchUserInfoJsonByEmployeeNoWithFallbacksAsync(IsapiClient client, string deviceName, string employeeNo, CancellationToken ct)
    {
        var bodies = new[]
        {
            JsonSerializer.Serialize(new
            {
                UserInfoSearchCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = 0,
                    maxResults = 1,
                    EmployeeNoList = new { EmployeeNo = new[] { employeeNo } }
                }
            }),
            JsonSerializer.Serialize(new
            {
                UserInfoSearchCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = 0,
                    maxResults = 1,
                    EmployeeNoList = new[] { new { employeeNo } }
                }
            }),
            JsonSerializer.Serialize(new
            {
                UserInfoSearchCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = 0,
                    maxResults = 1,
                    employeeNo
                }
            }),
        };

        for (var i = 0; i < bodies.Length; i++)
        {
            var body = bodies[i];
            var (ok, content, err) = await client.PostJsonAsync("ISAPI/AccessControl/UserInfo/Search?format=json", body, ct);
            LogImportIsapiResponse(deviceName, employeeNo, $"POST UserInfo/Search (деталь, вариант {i + 1}/{bodies.Length})", ok, err, content);
            if (!ok || string.IsNullOrWhiteSpace(content)) continue;
            if (TryGetFirstUserInfoJsonElement(content, out _))
                return content;
        }

        return null;
    }

    private static bool TryGetFirstUserInfoJsonElement(string json, out JsonElement userInfo)
    {
        userInfo = default;
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

            if (!found) return false;

            if (userList.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in userList.EnumerateArray())
                {
                    userInfo = item;
                    return true;
                }
                return false;
            }

            if (userList.ValueKind == JsonValueKind.Object)
            {
                userInfo = userList;
                return true;
            }
        }
        catch
        {
            // ignore
        }

        return false;
    }

    private static void CollectCardNosFromUserInfo(JsonElement el, List<string> dest)
    {
        foreach (var name in new[] { "cardNo", "CardNo" })
        {
            if (!TryGetPropertyInsensitive(el, name, out var cn)) continue;
            var s = JsonElementToTrimmedString(cn);
            if (!string.IsNullOrWhiteSpace(s))
                dest.Add(s);
        }

        if (TryGetPropertyInsensitive(el, "CardInfo", out var ci) && ci.ValueKind == JsonValueKind.Object)
            CollectCardNosFromUserInfo(ci, dest);

        foreach (var listName in new[] { "CardInfoList", "cardInfoList" })
        {
            if (!TryGetPropertyInsensitive(el, listName, out var list) || list.ValueKind != JsonValueKind.Array)
                continue;
            foreach (var item in list.EnumerateArray())
                CollectCardNosFromUserInfo(item, dest);
        }
    }

    /// <summary>
    /// CardInfo/Search — в доке Ultra/Pro встречается и <c>EmployeeNoList.EmployeeNo[]</c>, и массив объектов <c>{ employeeNo }</c>.
    /// </summary>
    private async Task<IReadOnlyList<string>> FetchCardNosFromCardInfoSearchWithFallbacksAsync(IsapiClient client, string deviceName, string employeeNo, CancellationToken ct)
    {
        var bodies = new[]
        {
            JsonSerializer.Serialize(new
            {
                CardInfoSearchCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = 0,
                    maxResults = 50,
                    EmployeeNoList = new { EmployeeNo = new[] { employeeNo } }
                }
            }),
            JsonSerializer.Serialize(new
            {
                CardInfoSearchCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = 0,
                    maxResults = 50,
                    EmployeeNoList = new[] { new { employeeNo } }
                }
            }),
            JsonSerializer.Serialize(new
            {
                CardInfoSearchCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = 0,
                    maxResults = 50,
                    employeeNo
                }
            }),
        };

        for (var i = 0; i < bodies.Length; i++)
        {
            var body = bodies[i];
            var (ok, content, err) = await client.PostJsonAsync("ISAPI/AccessControl/CardInfo/Search?format=json", body, ct);
            LogImportIsapiResponse(deviceName, employeeNo, $"POST CardInfo/Search (вариант {i + 1}/{bodies.Length})", ok, err, content);
            if (!ok || string.IsNullOrWhiteSpace(content)) continue;
            if (IsapiJsonStatus.GetErrorMessageIfFailed(content) is { } jsonErr)
            {
                logger.LogDebug("CardInfo/Search: {Error}", jsonErr);
                continue;
            }

            var parsed = ParseCardInfoSearchResponse(content);
            if (parsed.Count > 0) return parsed;
        }

        return [];
    }

    private static List<string> ParseCardInfoSearchResponse(string json)
    {
        var list = new List<string>();
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            JsonElement? cards = null;
            if (TryGetPropertyInsensitive(root, "CardInfoSearch", out var cs))
            {
                if (TryGetPropertyInsensitive(cs, "CardInfo", out var ci)) cards = ci;
            }
            else if (TryGetPropertyInsensitive(root, "CardInfoSearchResult", out var csr))
            {
                if (TryGetPropertyInsensitive(csr, "CardInfo", out var ci2)) cards = ci2;
            }
            else if (TryGetPropertyInsensitive(root, "CardInfo", out var direct))
                cards = direct;

            if (cards is not null)
            {
                var el = cards.Value;
                if (el.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in el.EnumerateArray())
                        CollectCardNosFromUserInfo(item, list);
                }
                else if (el.ValueKind == JsonValueKind.Object)
                    CollectCardNosFromUserInfo(el, list);
            }

            if (list.Count == 0)
                CollectCardNosRecursive(root, list, 0);
        }
        catch
        {
            // ignore
        }

        return list;
    }

    /// <summary>Собирает любые <c>cardNo</c> в дереве JSON (ответ CardInfo/Search на разных прошивках).</summary>
    private static void CollectCardNosRecursive(JsonElement el, List<string> dest, int depth)
    {
        if (depth > 24) return;
        switch (el.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var p in el.EnumerateObject())
                {
                    if (string.Equals(p.Name, "cardNo", StringComparison.OrdinalIgnoreCase))
                    {
                        var s = JsonElementToTrimmedString(p.Value);
                        if (!string.IsNullOrWhiteSpace(s) && !dest.Contains(s, StringComparer.OrdinalIgnoreCase))
                            dest.Add(s);
                    }
                    else
                        CollectCardNosRecursive(p.Value, dest, depth + 1);
                }
                break;
            case JsonValueKind.Array:
                foreach (var item in el.EnumerateArray())
                    CollectCardNosRecursive(item, dest, depth + 1);
                break;
        }
    }

    private static string? JsonElementToTrimmedString(JsonElement el) =>
        el.ValueKind switch
        {
            JsonValueKind.String => el.GetString()?.Trim(),
            JsonValueKind.Number => el.GetRawText().Trim(),
            _ => null
        };

    private static int TryGetNumOfFpHint(JsonElement userInfo)
    {
        foreach (var name in new[] { "numOfFP", "NumOfFP", "numberOfFP", "NumberOfFP" })
        {
            if (TryGetPropertyInsensitive(userInfo, name, out var el) && el.TryGetInt32(out var n) && n > 0)
                return n;
        }

        return 0;
    }

    /// <summary>Hikvision: в UserInfo иногда приходит <c>.../file.jpg@WEB...</c> — для HTTP нужен путь без суффикса после <c>@</c>.</summary>
    private static string NormalizeHikvisionFaceOrFileUrl(string url)
    {
        var u = url.Trim();
        var lastSlash = u.LastIndexOf('/');
        var at = lastSlash >= 0 ? u.IndexOf('@', lastSlash + 1) : u.IndexOf('@');
        if (at > 0 && at > lastSlash)
            return u[..at];
        return u;
    }

    /// <summary>
    /// Скачивает превью лица по <c>faceURL</c>: сначала путь через <see cref="IsapiClient.GetBytesAsync"/> (IP и порты из клиента устройства),
    /// затем полный URL. <c>modelData</c> в FDSearch — обычно шаблон лица, не JPEG; его не сохраняем как фото.
    /// </summary>
    private async Task<byte[]?> TryDownloadRasterFaceFromNormalizedUrlAsync(
        IsapiClient client,
        string normalizedUrl,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(normalizedUrl)) return null;

        if (normalizedUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            normalizedUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            if (!Uri.TryCreate(normalizedUrl, UriKind.Absolute, out var uri)) return null;

            var pathWithQuery = uri.PathAndQuery.TrimStart('/');
            if (!string.IsNullOrEmpty(pathWithQuery))
            {
                var (ok, data, _) = await client.GetBytesAsync(pathWithQuery, cancellationToken);
                if (ok && data is { Length: > 0 } && IsLikelyRasterImage(data))
                    return data;
            }

            var (okUrl, dataUrl, _) = await client.GetBytesFromUrlAsync(normalizedUrl, cancellationToken);
            if (okUrl && dataUrl is { Length: > 0 } && IsLikelyRasterImage(dataUrl))
                return dataUrl;
        }
        else
        {
            var path = normalizedUrl.TrimStart('/');
            var (ok, data, _) = await client.GetBytesAsync(path, cancellationToken);
            if (ok && data is { Length: > 0 } && IsLikelyRasterImage(data))
                return data;
        }

        return null;
    }

    private async Task<int> TrySaveFaceFromUserInfoAsync(
        IsapiClient client,
        Device device,
        JsonElement userInfo,
        Guid? employeeId,
        Guid? visitorId,
        CancellationToken cancellationToken)
    {
        var hasFace = employeeId.HasValue
            ? await dbContext.Faces.AsNoTracking().AnyAsync(f => f.EmployeeId == employeeId, cancellationToken)
            : await dbContext.Faces.AsNoTracking().AnyAsync(f => f.VisitorId == visitorId, cancellationToken);
        if (hasFace) return 0;

        byte[]? bytes = null;

        foreach (var prop in new[] { "faceData", "FaceData" })
        {
            if (!TryGetPropertyInsensitive(userInfo, prop, out var fd) || fd.ValueKind != JsonValueKind.String)
                continue;
            var s = fd.GetString();
            if (TryDecodeImageBytes(s, out var b) && b is { Length: > 0 } && IsLikelyRasterImage(b))
            {
                bytes = b;
                break;
            }
        }

        if (bytes == null)
        {
            foreach (var prop in new[] { "faceURL", "FaceURL", "faceUrl" })
            {
                if (!TryGetPropertyInsensitive(userInfo, prop, out var fu) || fu.ValueKind != JsonValueKind.String)
                    continue;
                var url = fu.GetString()?.Trim();
                if (string.IsNullOrEmpty(url)) continue;
                url = NormalizeHikvisionFaceOrFileUrl(url);

                bytes = await TryDownloadRasterFaceFromNormalizedUrlAsync(client, url, cancellationToken);
                if (bytes != null) break;
            }
        }

        if (bytes == null || bytes.Length == 0) return 0;

        var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
        Directory.CreateDirectory(facesPath);
        var fileName = $"{Guid.NewGuid():N}.jpg";
        await File.WriteAllBytesAsync(Path.Combine(facesPath, fileName), bytes, cancellationToken);

        dbContext.Faces.Add(new Face
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            VisitorId = visitorId,
            FilePath = fileName,
            FDID = 1,
            CreatedUtc = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync(cancellationToken);
        return 1;
    }

    /// <summary>
    /// Документация Ultra/Pro: лица в библиотеке FDLib; поиск — POST <c>Intelligent/FDLib/FDSearch</c>, связь с человеком по <c>FPID</c> (часто = employeeNo).
    /// UserInfo/Search обычно не содержит фото лица.
    /// </summary>
    private async Task<int> TryImportFaceFromFdLibAsync(
        IsapiClient client,
        Device device,
        string employeeNo,
        Guid? employeeId,
        Guid? visitorId,
        CancellationToken cancellationToken)
    {
        var hasFace = employeeId.HasValue
            ? await dbContext.Faces.AsNoTracking().AnyAsync(f => f.EmployeeId == employeeId, cancellationToken)
            : await dbContext.Faces.AsNoTracking().AnyAsync(f => f.VisitorId == visitorId, cancellationToken);
        if (hasFace) return 0;

        var emp = employeeNo.Trim();
        var bodies = await BuildFdSearchRequestBodiesAsync(client, device.Name, emp, cancellationToken);
        for (var bi = 0; bi < bodies.Count; bi++)
        {
            var body = bodies[bi];
            var (ok, content, err) = await client.PostJsonAsync("ISAPI/Intelligent/FDLib/FDSearch?format=json", body, cancellationToken);
            LogImportIsapiResponse(
                device.Name,
                emp,
                $"POST Intelligent/FDLib/FDSearch ({bi + 1}/{bodies.Count})",
                ok,
                err,
                content);
            if (!ok || string.IsNullOrWhiteSpace(content))
            {
                logger.LogDebug("FDSearch: HTTP error {Err}", err);
                continue;
            }

            var matches = ExtractMatchListItems(content);
            if (matches.Count == 0)
            {
                if (IsapiJsonStatus.GetErrorMessageIfFailed(content) is { } failMsg)
                    logger.LogDebug("FDSearch без MatchList: {Msg}", failMsg);
                continue;
            }

            var filtered = FilterFdMatchesForEmployee(matches, emp);
            if (filtered.Count == 0) continue;

            foreach (var match in filtered)
            {
                var bytes = await TryGetFaceImageBytesFromMatchAsync(client, match, cancellationToken);
                if (bytes is null || bytes.Length == 0 || !IsLikelyRasterImage(bytes))
                    continue;

                var facesPath = configuration["Storage:FacesPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads", "faces");
                Directory.CreateDirectory(facesPath);
                var fileName = $"{Guid.NewGuid():N}.jpg";
                await File.WriteAllBytesAsync(Path.Combine(facesPath, fileName), bytes, cancellationToken);

                dbContext.Faces.Add(new Face
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = employeeId,
                    VisitorId = visitorId,
                    FilePath = fileName,
                    FDID = 1,
                    CreatedUtc = DateTime.UtcNow
                });
                await dbContext.SaveChangesAsync(cancellationToken);
                return 1;
            }
        }

        return 0;
    }

    /// <summary>GET <c>ISAPI/Intelligent/FDLib?format=json</c> — реальные <c>FDID</c> библиотек (Ultra 8.11).</summary>
    private async Task<List<string>> DiscoverFdLibIdsAsync(IsapiClient client, string deviceName, string employeeNo, CancellationToken ct)
    {
        var ids = new List<string>();
        var (ok, content, err) = await client.GetAsync("ISAPI/Intelligent/FDLib?format=json", ct);
        LogImportIsapiResponse(deviceName, employeeNo, "GET Intelligent/FDLib", ok, err, content);
        if (ok && !string.IsNullOrWhiteSpace(content))
        {
            try
            {
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;
                if (root.TryGetProperty("FDLibList", out var fl) && fl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in fl.EnumerateArray())
                    {
                        if (item.TryGetProperty("FDID", out var fdid))
                        {
                            var s = JsonElementToTrimmedString(fdid);
                            if (!string.IsNullOrWhiteSpace(s)) ids.Add(s);
                        }
                    }
                }
                else if (root.TryGetProperty("FDLib", out var one))
                {
                    if (one.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in one.EnumerateArray())
                        {
                            if (item.TryGetProperty("FDID", out var fdid))
                            {
                                var s = JsonElementToTrimmedString(fdid);
                                if (!string.IsNullOrWhiteSpace(s)) ids.Add(s);
                            }
                        }
                    }
                    else if (one.ValueKind == JsonValueKind.Object && one.TryGetProperty("FDID", out var fdid))
                    {
                        var s = JsonElementToTrimmedString(fdid);
                        if (!string.IsNullOrWhiteSpace(s)) ids.Add(s);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "DiscoverFdLibIds: parse error");
            }
        }

        if (ids.Count == 0) ids.Add("1");
        return ids.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private async Task<List<string>> BuildFdSearchRequestBodiesAsync(IsapiClient client, string deviceName, string employeeNo, CancellationToken ct)
    {
        var fdIds = await DiscoverFdLibIdsAsync(client, deviceName, employeeNo, ct);
        var bodies = new List<string>();
        foreach (var fdId in fdIds)
        {
            foreach (var faceLib in new[] { "blackFD", "staticFD" })
            {
                foreach (var cert in new[] { "ID", "officerID" })
                {
                    bodies.Add(JsonSerializer.Serialize(new
                    {
                        searchID = Guid.NewGuid().ToString("N")[..20],
                        searchResultPosition = 0,
                        maxResults = 15,
                        faceLibType = faceLib,
                        FDID = fdId,
                        FPID = employeeNo,
                        certificateType = cert,
                        gender = "any"
                    }));
                }
                bodies.Add(JsonSerializer.Serialize(new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = 0,
                    maxResults = 40,
                    faceLibType = faceLib,
                    FDID = fdId,
                    certificateType = "ID",
                    gender = "any"
                }));
            }
        }

        return bodies;
    }

    private static List<JsonElement> ExtractMatchListItems(string json)
    {
        var list = new List<JsonElement>();
        try
        {
            using var doc = JsonDocument.Parse(json);
            CollectMatchListRecursive(doc.RootElement, list, 0);
        }
        catch
        {
            // ignore
        }

        return list;
    }

    private static void CollectMatchListRecursive(JsonElement el, List<JsonElement> dest, int depth)
    {
        if (depth > 14) return;
        if (el.ValueKind == JsonValueKind.Object)
        {
            if (TryGetPropertyInsensitive(el, "MatchList", out var ml) && ml.ValueKind == JsonValueKind.Array)
            {
                // Clone: после выхода из ExtractMatchListItems JsonDocument освобождён — без Clone JsonElement недействителен.
                foreach (var item in ml.EnumerateArray())
                    dest.Add(item.Clone());
                return;
            }

            foreach (var p in el.EnumerateObject())
                CollectMatchListRecursive(p.Value, dest, depth + 1);
        }
        else if (el.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in el.EnumerateArray())
                CollectMatchListRecursive(item, dest, depth + 1);
        }
    }

    /// <summary>Сопоставляем запись FDLib с человеком по <c>FPID</c> (док. Pro); число и строка.</summary>
    private static List<JsonElement> FilterFdMatchesForEmployee(IReadOnlyList<JsonElement> matches, string employeeNo)
    {
        var emp = employeeNo.Trim();
        var byFpid = matches.Where(m => FpidEqualsEmployeeNo(m, emp)).ToList();
        if (byFpid.Count > 0) return byFpid;
        return matches.Count == 1 ? [matches[0]] : [];
    }

    private static bool FpidEqualsEmployeeNo(JsonElement match, string employeeNo)
    {
        if (!TryGetPropertyInsensitive(match, "FPID", out var fp)) return false;
        var s = fp.ValueKind switch
        {
            JsonValueKind.String => fp.GetString()?.Trim(),
            JsonValueKind.Number => fp.GetRawText().Trim(),
            _ => null
        };
        return string.Equals(s, employeeNo.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private async Task<byte[]?> TryGetFaceImageBytesFromMatchAsync(IsapiClient client, JsonElement match, CancellationToken cancellationToken)
    {
        foreach (var prop in new[] { "faceURL", "FaceURL", "faceUrl" })
        {
            if (!TryGetPropertyInsensitive(match, prop, out var fu) || fu.ValueKind != JsonValueKind.String)
                continue;
            var url = fu.GetString()?.Trim();
            if (string.IsNullOrEmpty(url)) continue;
            url = NormalizeHikvisionFaceOrFileUrl(url);

            var raster = await TryDownloadRasterFaceFromNormalizedUrlAsync(client, url, cancellationToken);
            if (raster is { Length: > 0 }) return raster;
        }

        foreach (var prop in new[] { "modelData", "ModelData", "faceData", "FaceData" })
        {
            if (!TryGetPropertyInsensitive(match, prop, out var md) || md.ValueKind != JsonValueKind.String)
                continue;
            var s = md.GetString();
            if (TryDecodeImageBytes(s, out var b) && b is { Length: > 0 } && IsLikelyRasterImage(b))
                return b;
        }

        return null;
    }

    private static bool IsLikelyRasterImage(byte[] data)
    {
        if (data.Length < 4) return false;
        if (data[0] == 0xFF && data[1] == 0xD8) return true;
        return data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47;
    }

    private static bool TryDecodeImageBytes(string? s, out byte[]? bytes)
    {
        bytes = null;
        if (string.IsNullOrWhiteSpace(s)) return false;
        var t = s.Trim();
        if (t.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
        {
            var idx = t.IndexOf("base64,", StringComparison.OrdinalIgnoreCase);
            if (idx < 0) return false;
            t = t[(idx + 7)..];
        }
        try
        {
            bytes = Convert.FromBase64String(t);
            return bytes.Length > 0;
        }
        catch
        {
            return false;
        }
    }

    private static void CollectFingerprintsFromUserInfoFpInfo(JsonElement userInfo, List<(int FingerIndex, byte[] Data)> dest)
    {
        if (!TryGetPropertyInsensitive(userInfo, "FPInfo", out var fp) || fp.ValueKind != JsonValueKind.Object)
            return;

        if (!TryGetPropertyInsensitive(fp, "List", out var list) || list.ValueKind != JsonValueKind.Array)
            return;

        foreach (var item in list.EnumerateArray())
        {
            var fingerId = 1;
            foreach (var name in new[] { "fingerPrintID", "fingerPrintId" })
            {
                if (TryGetPropertyInsensitive(item, name, out var idEl) && idEl.TryGetInt32(out var id))
                {
                    fingerId = id;
                    break;
                }
            }

            foreach (var name in new[] { "fingerData", "FingerData" })
            {
                if (!TryGetPropertyInsensitive(item, name, out var fd) || fd.ValueKind != JsonValueKind.String)
                    continue;
                var b64 = fd.GetString();
                if (string.IsNullOrWhiteSpace(b64)) continue;
                try
                {
                    var raw = Convert.FromBase64String(b64.Trim());
                    if (raw.Length > 0)
                        dest.Add((fingerId, raw));
                }
                catch
                {
                    // skip
                }
                break;
            }
        }
    }

    private async Task<int> GetFingerPrintCountAsync(IsapiClient client, string deviceName, string employeeNo, CancellationToken ct)
    {
        var enc = Uri.EscapeDataString(employeeNo);
        var (ok, content, err) = await client.GetAsync($"ISAPI/AccessControl/FingerPrint/Count?format=json&employeeNo={enc}", ct);
        LogImportIsapiResponse(deviceName, employeeNo, "GET FingerPrint/Count", ok, err, content);
        if (!ok || string.IsNullOrWhiteSpace(content)) return 0;
        try
        {
            using var doc = JsonDocument.Parse(content);
            return CountNumberOfFpInElement(doc.RootElement);
        }
        catch
        {
            return 0;
        }
    }

    private static int CountNumberOfFpInElement(JsonElement el)
    {
        foreach (var name in new[] { "numberOfFP", "NumberOfFP", "fingerPrintNum", "FingerPrintNum" })
        {
            if (TryFindIntCaseInsensitive(el, name, out var n))
                return n;
        }

        foreach (var p in el.EnumerateObject())
        {
            if (p.Value.ValueKind == JsonValueKind.Object)
            {
                var inner = CountNumberOfFpInElement(p.Value);
                if (inner > 0) return inner;
            }
        }

        return 0;
    }

    private async Task<List<(int FingerIndex, byte[] Data)>> FetchFingerprintsFromFingerPrintUploadAsync(
        IsapiClient client,
        string deviceName,
        string employeeNo,
        CancellationToken ct)
    {
        var bodies = new[]
        {
            JsonSerializer.Serialize(new
            {
                FingerPrintUploadCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = 0,
                    maxResults = 10,
                    EmployeeNoList = new { EmployeeNo = new[] { employeeNo } }
                }
            }),
            JsonSerializer.Serialize(new
            {
                FingerPrintSearchCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = 0,
                    maxResults = 10,
                    EmployeeNoList = new { EmployeeNo = new[] { employeeNo } }
                }
            }),
            JsonSerializer.Serialize(new
            {
                FingerPrintUploadCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = 0,
                    maxResults = 10,
                    EmployeeNoList = new[] { new { employeeNo } }
                }
            }),
            JsonSerializer.Serialize(new
            {
                FingerPrintUploadCond = new
                {
                    searchID = Guid.NewGuid().ToString("N")[..20],
                    searchResultPosition = 0,
                    maxResults = 10,
                    employeeNo
                }
            }),
        };

        for (var i = 0; i < bodies.Length; i++)
        {
            var body = bodies[i];
            var (ok, content, err) = await client.PostJsonAsync("ISAPI/AccessControl/FingerPrintUpload?format=json", body, ct);
            LogImportIsapiResponse(deviceName, employeeNo, $"POST FingerPrintUpload (вариант {i + 1}/{bodies.Length})", ok, err, content);
            if (!ok || string.IsNullOrWhiteSpace(content)) continue;
            if (IsapiJsonStatus.GetErrorMessageIfFailed(content) is { } jsonErr &&
                !content.Contains("FingerPrintInfo", StringComparison.OrdinalIgnoreCase))
            {
                logger.LogDebug("FingerPrintUpload: {Err}", jsonErr);
                continue;
            }

            var batch = new List<(int FingerIndex, byte[] Data)>();
            TryParseFingerPrintUploadResponse(content, batch);
            if (batch.Count > 0) return batch;
        }

        return [];
    }

    private static void TryParseFingerPrintUploadResponse(string json, List<(int FingerIndex, byte[] Data)> dest)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            ExtractFingerprintsFromElement(doc.RootElement, dest, 0);
        }
        catch
        {
            // ignore
        }
    }

    private static void ExtractFingerprintsFromElement(JsonElement el, List<(int FingerIndex, byte[] Data)> dest, int depth)
    {
        if (depth > 8) return;

        if (TryGetPropertyInsensitive(el, "FingerPrintInfo", out var fpi))
        {
            if (fpi.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in fpi.EnumerateArray())
                    TryAddFingerprintItem(item, dest);
            }
            else if (fpi.ValueKind == JsonValueKind.Object)
                TryAddFingerprintItem(fpi, dest);
        }

        if (el.ValueKind != JsonValueKind.Object) return;
        foreach (var p in el.EnumerateObject())
        {
            if (p.Value.ValueKind is JsonValueKind.Object or JsonValueKind.Array)
                ExtractFingerprintsFromElement(p.Value, dest, depth + 1);
        }
    }

    private static void TryAddFingerprintItem(JsonElement item, List<(int FingerIndex, byte[] Data)> dest)
    {
        var fingerId = 1;
        foreach (var name in new[] { "fingerPrintID", "fingerPrintId" })
        {
            if (TryGetPropertyInsensitive(item, name, out var idEl) && idEl.TryGetInt32(out var id))
            {
                fingerId = id;
                break;
            }
        }

        foreach (var name in new[] { "fingerData", "FingerData" })
        {
            if (!TryGetPropertyInsensitive(item, name, out var fd) || fd.ValueKind != JsonValueKind.String)
                continue;
            var b64 = fd.GetString();
            if (string.IsNullOrWhiteSpace(b64)) continue;
            try
            {
                var raw = Convert.FromBase64String(b64.Trim());
                if (raw.Length > 0)
                    dest.Add((fingerId, raw));
            }
            catch
            {
                // skip
            }
            return;
        }
    }

    private static bool TryGetPropertyInsensitive(JsonElement el, string name, out JsonElement value)
    {
        foreach (var p in el.EnumerateObject())
        {
            if (string.Equals(p.Name, name, StringComparison.OrdinalIgnoreCase))
            {
                value = p.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    private static bool TryFindIntCaseInsensitive(JsonElement el, string name, out int value)
    {
        value = 0;
        foreach (var p in el.EnumerateObject())
        {
            if (!string.Equals(p.Name, name, StringComparison.OrdinalIgnoreCase)) continue;
            if (p.Value.TryGetInt32(out var v))
            {
                value = v;
                return true;
            }
            if (p.Value.ValueKind == JsonValueKind.String && int.TryParse(p.Value.GetString(), out var vs))
            {
                value = vs;
                return true;
            }
        }
        return false;
    }
}
