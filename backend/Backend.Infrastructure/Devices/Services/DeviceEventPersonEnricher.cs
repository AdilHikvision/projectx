using System.Text.Json;
using System.Xml.Linq;
using Backend.Application.Devices;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Devices.Services;

/// <summary>
/// Достаёт employeeNo/name из JSON payload и сопоставляет сотрудника в БД для имени и PrimaryFaceId.
/// </summary>
public static class DeviceEventPersonEnricher
{
    public static async Task<DeviceEvent> EnrichAsync(DeviceEvent e, AppDbContext db, CancellationToken cancellationToken)
    {
        if (e.EventType == DeviceEventType.Heartbeat)
            return e;

        var employeeNo = e.EmployeeNo;
        var nameHint = e.PersonName;
        TryExtractFromPayload(e.Payload, ref employeeNo, ref nameHint);

        if (string.IsNullOrWhiteSpace(employeeNo) && string.IsNullOrWhiteSpace(nameHint))
            return e;

        if (string.IsNullOrWhiteSpace(employeeNo))
        {
            return e with
            {
                PersonName = string.IsNullOrWhiteSpace(nameHint) ? e.PersonName : nameHint
            };
        }

        var key = employeeNo.Trim();
        var keyLower = key.ToLowerInvariant();
        var employee = await db.Employees
            .AsNoTracking()
            .Include(x => x.Faces)
            .FirstOrDefaultAsync(
                x => x.EmployeeNo != null && x.EmployeeNo.Trim().ToLower() == keyLower,
                cancellationToken);

        if (employee is null)
        {
            return e with
            {
                EmployeeNo = key,
                PersonName = string.IsNullOrWhiteSpace(nameHint) ? e.PersonName : nameHint
            };
        }

        var displayName = $"{employee.FirstName} {employee.LastName}".Trim();
        if (string.IsNullOrEmpty(displayName))
            displayName = nameHint;
        if (string.IsNullOrEmpty(displayName))
            displayName = key;

        var primaryFaceId = (employee.Faces ?? [])
            .OrderBy(f => f.CreatedUtc)
            .Select(f => (Guid?)f.Id)
            .FirstOrDefault();

        return e with
        {
            EmployeeNo = key,
            PersonName = displayName,
            PrimaryFaceId = primaryFaceId
        };
    }

    public static void TryExtractFromPayload(string payload, ref string? employeeNo, ref string? nameHint)
    {
        if (string.IsNullOrWhiteSpace(payload))
            return;

        var trim = payload.TrimStart();
        if (trim.StartsWith('<'))
        {
            TryExtractFromXml(payload, ref employeeNo, ref nameHint);
            return;
        }

        try
        {
            using var doc = JsonDocument.Parse(payload);
            var root = doc.RootElement;
            TryReadPersonFromObject(root, ref employeeNo, ref nameHint);
            if (root.TryGetProperty("AccessControllerEvent", out var ac))
                TryReadPersonFromObject(ac, ref employeeNo, ref nameHint);
        }
        catch
        {
            /* ignore */
        }
    }

    private static void TryExtractFromXml(string xml, ref string? employeeNo, ref string? nameHint)
    {
        try
        {
            var doc = XDocument.Parse(xml);
            string? Local(string name) =>
                doc.Descendants().FirstOrDefault(x => string.Equals(x.Name.LocalName, name, StringComparison.OrdinalIgnoreCase))?.Value?.Trim();

            if (string.IsNullOrWhiteSpace(employeeNo))
                employeeNo = Local("employeeNoString") ?? Local("employeeNo");
            if (string.IsNullOrWhiteSpace(nameHint))
                nameHint = Local("name");
        }
        catch
        {
            /* ignore */
        }
    }

    private static void TryReadPersonFromObject(JsonElement obj, ref string? employeeNo, ref string? nameHint)
    {
        if (obj.ValueKind != JsonValueKind.Object)
            return;

        if (string.IsNullOrWhiteSpace(employeeNo))
        {
            if (obj.TryGetProperty("employeeNoString", out var ens) && ens.ValueKind == JsonValueKind.String)
                employeeNo = ens.GetString();
            if (string.IsNullOrWhiteSpace(employeeNo) && obj.TryGetProperty("employeeNo", out var eno))
            {
                if (eno.ValueKind == JsonValueKind.String)
                    employeeNo = eno.GetString();
                else if (eno.ValueKind == JsonValueKind.Number)
                    employeeNo = eno.GetInt64().ToString();
            }
        }

        if (string.IsNullOrWhiteSpace(nameHint) && obj.TryGetProperty("name", out var nm) && nm.ValueKind == JsonValueKind.String)
            nameHint = nm.GetString();

        if (obj.TryGetProperty("EmployeeNoDetail", out var detail) && detail.ValueKind == JsonValueKind.Object)
        {
            if (string.IsNullOrWhiteSpace(employeeNo) && detail.TryGetProperty("employeeNo", out var dno))
            {
                if (dno.ValueKind == JsonValueKind.String)
                    employeeNo = dno.GetString();
                else if (dno.ValueKind == JsonValueKind.Number)
                    employeeNo = dno.GetInt64().ToString();
            }

            if (string.IsNullOrWhiteSpace(nameHint) && detail.TryGetProperty("name", out var dn) && dn.ValueKind == JsonValueKind.String)
                nameHint = dn.GetString();
        }
    }
}
