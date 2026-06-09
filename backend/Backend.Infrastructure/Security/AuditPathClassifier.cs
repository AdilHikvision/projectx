namespace Backend.Infrastructure.Security;

/// <summary>Сопоставляет (метод, путь) → (категория, человеко-читаемое действие).</summary>
public static class AuditPathClassifier
{
    public static (string? Category, string? Action) Classify(string method, string path)
    {
        var verb = method.ToUpperInvariant() switch
        {
            "POST" => "Created",
            "PUT" => "Updated",
            "PATCH" => "Updated",
            "DELETE" => "Deleted",
            _ => method
        };

        // Order matters — more specific routes first.
        if (Match(path, "/api/employees")) return ("Employees", $"{verb} employee");
        if (Match(path, "/api/visitors")) return ("Visitors", $"{verb} visitor");

        if (Match(path, "/api/devices/time/sync-all")) return ("System", "Synchronized device time");
        if (Match(path, "/api/devices/time/schedule")) return ("System", "Updated device time-sync schedule");
        if (Match(path, "/api/devices/time")) return ("System", "Updated device time");
        if (Match(path, "/api/devices")) return ("Devices", $"{verb} device");

        if (Match(path, "/api/access-levels")) return ("AccessLevels", $"{verb} access level");

        if (Match(path, "/api/work-schedules")) return ("WorkSchedules", $"{verb} work schedule");
        if (Match(path, "/api/employee-schedule")) return ("WorkSchedules", $"{verb} employee schedule");
        if (Match(path, "/api/work-shifts")) return ("WorkSchedules", $"{verb} work shift");
        if (Match(path, "/api/attendance/log-sync-settings")) return ("System", "Updated log-sync schedule");
        if (Match(path, "/api/attendance-corrections")) return ("WorkSchedules", $"{verb} attendance correction");
        if (Match(path, "/api/attendance-requests")) return ("WorkSchedules", $"{verb} attendance request");
        if (Match(path, "/api/employee-leaves")) return ("WorkSchedules", $"{verb} employee leave");
        if (Match(path, "/api/leaves")) return ("WorkSchedules", $"{verb} employee leave");

        if (Match(path, "/api/users") && path.EndsWith("/change-password", StringComparison.OrdinalIgnoreCase))
            return ("Users", "Changed user password");
        if (Match(path, "/api/users")) return ("Users", $"{verb} user");
        if (Match(path, "/api/roles")) return ("Roles", $"{verb} role");
        if (Match(path, "/api/auth/register")) return ("Users", "Created user (legacy register)");
        if (Match(path, "/api/auth/reset-password")) return ("Users", "Reset password");
        if (Match(path, "/api/auth/forgot-password")) return ("Users", "Requested password reset");
        if (Match(path, "/api/auth/setup-admin-password")) return ("Users", "Set admin password");

        if (Match(path, "/api/vault/backup")) return ("Backup", "Created database backup");
        if (path.Contains("/restore")) return ("Backup", "Restored database from backup");
        if (Match(path, "/api/vault/upload-restore")) return ("Backup", "Restored database from uploaded backup");
        if (Match(path, "/api/vault/backups")) return ("Backup", verb == "Deleted" ? "Deleted database backup" : "Backup operation");
        if (Match(path, "/api/vault/secondary-db")) return ("Backup", "Updated secondary DB connection");

        if (Match(path, "/api/geo-zones")) return ("GeoZones", $"{verb} geo zone");
        if (Match(path, "/api/geozones")) return ("GeoZones", $"{verb} geo zone");

        if (Match(path, "/api/companies")) return ("System", $"{verb} company");
        if (Match(path, "/api/system-settings")) return ("System", "Updated system setting");
        if (Match(path, "/api/settings/smtp")) return ("System", "Updated SMTP settings");
        if (Match(path, "/api/email-templates")) return ("System", $"{verb} email template");
        if (Match(path, "/api/departments")) return ("System", $"{verb} department");

        if (Match(path, "/api/payroll")) return ("System", $"{verb} payroll");

        return (null, null);
    }

    private static bool Match(string path, string prefix)
        => path.Equals(prefix, StringComparison.OrdinalIgnoreCase)
        || path.StartsWith(prefix + "/", StringComparison.OrdinalIgnoreCase)
        || path.StartsWith(prefix + "?", StringComparison.OrdinalIgnoreCase);
}
