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

/// <summary>Захват карты с устройства Hikvision (CaptureCardData / ReadCard).</summary>
public sealed class DeviceCardCaptureService(
    AppDbContext dbContext,
    IDevicePersonSyncService syncService,
    IConfiguration configuration,
    ILogger<DeviceCardCaptureService> logger) : IDeviceCardCaptureService
{
    private static readonly ConcurrentDictionary<Guid, CardCaptureSession> Sessions = new();

    private sealed class CardCaptureSession
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
        var jsonBody = JsonSerializer.Serialize(new { CaptureCardData = new { employeeNo } });

        var (success, _, error) = await client.PostAsync(
            "ISAPI/AccessControl/CaptureCardData?format=json",
            jsonBody,
            "application/json",
            cancellationToken);

        if (!success && (error?.Contains("404") == true || error?.Contains("не найден") == true))
        {
            var escaped = employeeNo.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;").Replace("'", "&apos;");
            var xmlBody = $"""<?xml version="1.0" encoding="UTF-8"?><CaptureCardData version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><employeeNo>{escaped}</employeeNo></CaptureCardData>""";
            (success, _, error) = await client.PostAsync(
                "ISAPI/AccessControl/CaptureCardData?format=xml",
                xmlBody,
                "application/xml",
                cancellationToken);
        }

        if (!success)
        {
            logger.LogWarning("CaptureCardData failed for {Device}: {Error}", device.Name, error);
            return new DeviceSyncResult(false, error ?? "Устройство не поддерживает захват карты. Добавьте карту вручную (введите номер карты).");
        }

        Sessions[deviceId] = new CardCaptureSession { EmployeeNo = employeeNo, PersonId = personId, PersonType = personType };
        return new DeviceSyncResult(true, null);
    }

    public async Task<CardCaptureProgressResult> GetProgressAsync(Guid deviceId, CancellationToken cancellationToken = default)
    {
        if (!Sessions.TryGetValue(deviceId, out var session))
            return new CardCaptureProgressResult("idle", "Сессия захвата не найдена. Запустите захват.", null);

        var device = await dbContext.Devices.FindAsync([deviceId], cancellationToken);
        if (device is null)
        {
            Sessions.TryRemove(deviceId, out _);
            return new CardCaptureProgressResult("failed", "Устройство не найдено.", null);
        }

        if ((DateTime.UtcNow - session.StartedUtc).TotalSeconds > 120)
        {
            Sessions.TryRemove(deviceId, out _);
            return new CardCaptureProgressResult("failed", "Таймаут захвата.", null);
        }

        var client = CreateClient(device);
        var (success, content, error) = await client.GetAsync("ISAPI/AccessControl/CaptureCardData/Progress?format=json", cancellationToken);

        if (!success)
            return new CardCaptureProgressResult("capturing", null, null);

        try
        {
            using var doc = JsonDocument.Parse(content ?? "{}");
            var root = doc.RootElement;
            string? cardNo = null;
            string status = "capturing";
            bool? isCurRequestOver = null;

            foreach (var prop in new[] { "CaptureCardDataProgress", "captureCardDataProgress" })
            {
                if (root.TryGetProperty(prop, out var progEl))
                {
                    if (progEl.TryGetProperty("cardNo", out var cn)) cardNo = cn.GetString();
                    if (string.IsNullOrWhiteSpace(cardNo) && progEl.TryGetProperty("CardNo", out var cn2)) cardNo = cn2.GetString();
                    if (progEl.TryGetProperty("status", out var s)) status = s.GetString() ?? status;
                    if (progEl.TryGetProperty("Status", out var s2)) status = s2.GetString() ?? status;
                    if (progEl.TryGetProperty("isCurRequestOver", out var iso) && iso.ValueKind == JsonValueKind.True) isCurRequestOver = true;
                    if (progEl.TryGetProperty("IsCurRequestOver", out var iso2) && iso2.ValueKind == JsonValueKind.True) isCurRequestOver = true;
                    break;
                }
            }

            if (isCurRequestOver == true && string.IsNullOrWhiteSpace(cardNo))
            {
                Sessions.TryRemove(deviceId, out _);
                return new CardCaptureProgressResult("failed", "Карта не была считана. Приложите карту к считывателю и повторите.", null);
            }

            if (!string.IsNullOrWhiteSpace(cardNo))
            {
                cardNo = cardNo.Trim();
                var exists = await dbContext.Cards.AnyAsync(c => c.CardNo == cardNo, cancellationToken);
                if (exists)
                {
                    Sessions.TryRemove(deviceId, out _);
                    return new CardCaptureProgressResult("failed", "Карта с таким номером уже зарегистрирована.", null);
                }

                var card = new Card
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = session.PersonType == "employee" ? session.PersonId : null,
                    VisitorId = session.PersonType == "visitor" ? session.PersonId : null,
                    CardNo = cardNo,
                    CardNumber = null,
                    CreatedUtc = DateTime.UtcNow
                };
                dbContext.Cards.Add(card);
                await dbContext.SaveChangesAsync(cancellationToken);

                var syncRes = await syncService.SyncCardAsync(card.Id, deviceId, cancellationToken);
                if (!syncRes.Success)
                    logger.LogWarning("Sync card {CardNo} to device after capture: {Message}", cardNo, syncRes.Message);

                Sessions.TryRemove(deviceId, out _);
                return new CardCaptureProgressResult("completed", "Карта успешно считана и добавлена.", card.Id);
            }

            return new CardCaptureProgressResult(status, null, null);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Parse CaptureCardData Progress");
        }

        return new CardCaptureProgressResult("capturing", null, null);
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
