using System.Globalization;
using Backend.Application.Devices;

namespace Backend.Infrastructure.Devices;

/// <summary>
/// Классификация событий ACS по major/minor (ISAPI / HCNetSDK GET_ACS_EVENT).
/// </summary>
public static class AcsEventMapper
{
    private static readonly HashSet<uint> DoorOpenedMinors =
    [
        0x11, 0x13, 0x15, 0x17, 0x19, 0x1B, 0x21, 0x34
    ];

    private static readonly HashSet<uint> DoorClosedMinors =
    [
        0x12, 0x14, 0x16, 0x1A, 0x1F, 0x20, 0x35
    ];

    private static readonly HashSet<uint> AuthTimeoutMinors =
    [
        0x04, 0x05, 0x24, 0x2A, 0x2D, 0x30, 0x38, 0x3B, 0x3E, 0x41, 0x44, 0x47, 0x4A, 0x4F, 0x67, 0x9A,
        0x5D, 0x89, 0x1C
    ];

    private static readonly HashSet<uint> AccessDeniedMinors =
    [
        0x03, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x27, 0x29, 0x2C, 0x2F, 0x31, 0x37,
        0x3A, 0x3D, 0x40, 0x43, 0x46, 0x49, 0x4C, 0x4E, 0x50, 0x66, 0x68, 0x70, 0x71, 0x73, 0x75, 0x76, 0x85,
        0x77, 0x78, 0x82, 0x84, 0x8B, 0x8E, 0x91, 0x94, 0x96, 0x9B, 0x9D, 0xA0, 0xA2, 0xA3, 0xA4, 0xAC
    ];

    private static readonly HashSet<uint> AccessGrantedMinors =
    [
        0x01, 0x02, 0x0F, 0x10, 0x22, 0x26, 0x28, 0x2B, 0x2E, 0x32, 0x36, 0x39, 0x3C, 0x3F, 0x42, 0x45,
        0x48, 0x4B, 0x4D, 0x65, 0x69, 0x90, 0x99, 0x9C, 0x9E, 0x9F
    ];

    public static bool TryParseAcsCode(string? eventCode, out uint major, out uint minor)
    {
        major = 0;
        minor = 0;
        if (string.IsNullOrWhiteSpace(eventCode) || !eventCode.StartsWith("ACS_", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var parts = eventCode.Split('_', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 3)
        {
            return false;
        }

        return uint.TryParse(parts[1], NumberStyles.HexNumber, CultureInfo.InvariantCulture, out major)
               && uint.TryParse(parts[2], NumberStyles.HexNumber, CultureInfo.InvariantCulture, out minor);
    }

    public static (DeviceEventType Type, string Summary) Classify(uint major, uint minor)
    {
        if (major == 5)
        {
            return ClassifyOther(minor);
        }

        if (major == 3)
        {
            return ClassifyOperation(minor);
        }

        if (major == 1 && minor == 0x40C)
        {
            return (DeviceEventType.AccessDenied, DescribeMinor5(0x40C, prefix: "Alarm: "));
        }

        return (DeviceEventType.Unknown, DescribeFallback(major, minor));
    }

    private static (DeviceEventType Type, string Summary) ClassifyOperation(uint minor)
    {
        switch (minor)
        {
            case 0x400: // Door remotely open
            case 0x402: // Remain open remotely
                return (DeviceEventType.DoorOpened, DescribeOperationMinor(minor));
            case 0x401: // Door remotely closed
            case 0x403: // Remain closed remotely
                return (DeviceEventType.DoorClosed, DescribeOperationMinor(minor));
            default:
                return (DeviceEventType.DeviceOperation, DescribeOperationMinor(minor));
        }
    }

    private static string DescribeFallback(uint major, uint minor) =>
        $"Event (major {major}, minor {minor})";

    /// <summary>Operation events (major 0x3), ISAPI Pro Series.</summary>
    private static string DescribeOperationMinor(uint minor)
    {
        var text = minor switch
        {
            0x41 => "Startup",
            0x42 => "Shutdown",
            0x43 => "Shutdown exception",
            0x44 => "Local: device restart",
            0x50 => "Local login",
            0x51 => "Local logout",
            0x52 => "Local: configuration",
            0x53 => "Local: playback/download by file",
            0x54 => "Local: playback/download by time",
            0x55 => "Local: start recording",
            0x56 => "Local: stop recording",
            0x59 => "Local: edit time",
            0x5A => "Local upgrade",
            0x5B => "Local: back up recording file(s)",
            0x5C => "Local: initialize HDD",
            0x5D => "Local: export configuration file",
            0x5E => "Local: import configuration file",
            0x5F => "Local: back up files",
            0x60 => "Local: lock recording files",
            0x61 => "Local: unlock recording files",
            0x62 => "Local: manually clear and trigger alarms",
            0x66 => "Local: start backup",
            0x67 => "Local: stop backup",
            0x68 => "Local: start time of backup",
            0x69 => "Local: end time of backup",
            0x6D => "Local: restore admin default password",
            0x70 => "Remote login",
            0x71 => "Remote logout",
            0x72 => "Remote: start recording",
            0x73 => "Remote: stop recording",
            0x74 => "Start transparent transmission",
            0x75 => "Stop transparent transmission",
            0x76 => "Remote: get parameters",
            0x77 => "Remote: configure parameters",
            0x78 => "Remote: get status",
            0x79 => "Remote arming",
            0x7A => "Remote disarming",
            0x7B => "Remote reboot",
            0x7C => "Start two-way audio",
            0x7D => "Stop two-way audio",
            0x7E => "Remote upgrade",
            0x7F => "Remote: playback/download by file",
            0x80 => "Remote: playback/download by time",
            0x83 => "Remote: shutdown",
            0x84 => "Remote: lock file",
            0x85 => "Remote: unlock file",
            0x86 => "Remote: export configuration file",
            0x87 => "Remote: import configuration file",
            0x88 => "Remote: export recording files",
            0x89 => "Remote: manually clear and trigger alarms",
            0x8A => "Remote: add network camera",
            0x8B => "Remote: delete network camera",
            0x8C => "Remote: set network camera",
            0x400 => "Door remotely open",
            0x401 => "Door remotely closed",
            0x402 => "Remain open remotely",
            0x403 => "Remain closed remotely",
            0x404 => "Remote: manual time sync",
            0x405 => "Network time protocol synchronization",
            0x406 => "Remote: clear all card numbers",
            0x407 => "Remote: restore defaults",
            0x408 => "Zone arming",
            0x409 => "Zone disarming",
            0x417 => "Visitor calling elevator",
            0x418 => "Resident calling elevator",
            0x419 => "Remotely arming",
            0x41A => "Remotely disarming",
            0x41C => "Keyfob: close door",
            0x41D => "Keyfob: open door",
            0x41E => "Keyfob: remain door open",
            0x200 => "Other operations",
            _ => $"Operation (minor 0x{minor:X})"
        };

        return text;
    }

    private static (DeviceEventType Type, string Summary) ClassifyOther(uint minor)
    {
        if (AuthTimeoutMinors.Contains(minor))
        {
            return (DeviceEventType.AuthenticationTimeout, DescribeMinor5(minor));
        }

        if (DoorClosedMinors.Contains(minor))
        {
            return (DeviceEventType.DoorClosed, DescribeMinor5(minor));
        }

        if (DoorOpenedMinors.Contains(minor))
        {
            return (DeviceEventType.DoorOpened, DescribeMinor5(minor));
        }

        if (AccessDeniedMinors.Contains(minor))
        {
            return (DeviceEventType.AccessDenied, DescribeMinor5(minor));
        }

        if (AccessGrantedMinors.Contains(minor))
        {
            return (DeviceEventType.AccessGranted, DescribeMinor5(minor));
        }

        return (DeviceEventType.Unknown, DescribeMinor5(minor));
    }

    private static string DescribeMinor5(uint minor, string prefix = "")
    {
        var text = minor switch
        {
            0x01 => "Valid card authentication completed",
            0x02 => "Card and password authentication completed",
            0x03 => "Card and password authentication failed",
            0x04 or 0x05 => "Card and password authentication timed out",
            0x06 => "No permission",
            0x07 => "Invalid card time period",
            0x08 => "Expired card",
            0x09 => "Card number does not exist",
            0x0A => "Anti-passback authentication failed",
            0x0B => "Interlocking door not closed",
            0x0F => "Multiple authentication completed",
            0x10 => "Multiple authenticated",
            0x11 => "Open door with first card started",
            0x12 => "Open door with first card stopped",
            0x13 => "Remain open started",
            0x14 => "Remain open stopped",
            0x15 => "Door unlocked",
            0x16 => "Door locked",
            0x17 => "Exit button pressed",
            0x18 => "Exit button released",
            0x19 => "Door open (contact)",
            0x1A => "Door closed (contact)",
            0x1B => "Door abnormally open (contact)",
            0x1C => "Door open timed out (contact)",
            0x1F => "Remain closed started",
            0x20 => "Remain closed stopped",
            0x21 => "Remotely open door (multi-auth)",
            0x24 => "Multiple authentications timed out",
            0x26 => "Fingerprint matched",
            0x27 => "Fingerprint mismatched",
            0x28 => "Card and fingerprint authentication completed",
            0x29 => "Card and fingerprint authentication failed",
            0x2A => "Card and fingerprint authentication timed out",
            0x2B => "Card, fingerprint and password authentication completed",
            0x2C => "Card, fingerprint and password authentication failed",
            0x2D => "Card, fingerprint and password authentication timed out",
            0x2E => "Fingerprint and password authentication completed",
            0x2F => "Fingerprint and password authentication failed",
            0x30 => "Fingerprint and password authentication timed out",
            0x31 => "Fingerprint does not exist",
            0x32 => "Card platform authentication",
            0x36 => "Access granted (face and fingerprint)",
            0x37 => "Access denied (face and fingerprint)",
            0x38 => "Access timed out (face and fingerprint)",
            0x39 => "Access granted (face and PIN)",
            0x3A => "Access denied (face and PIN)",
            0x3B => "Access timed out (face and PIN)",
            0x3C => "Access granted (face and card)",
            0x3D => "Access denied (face and card)",
            0x3E => "Access timed out (face and card)",
            0x3F => "Access granted (face, PIN and fingerprint)",
            0x40 => "Access denied (face, PIN and fingerprint)",
            0x41 => "Access timed out (face, PIN and fingerprint)",
            0x42 => "Access granted (face, card and fingerprint)",
            0x43 => "Access denied (face, card and fingerprint)",
            0x44 => "Access timed out (face, card and fingerprint)",
            0x4B => "Face authentication completed",
            0x4C => "Face authentication failed",
            0x4D => "Employee ID and face authentication completed",
            0x4E => "Employee ID and face authentication failed",
            0x4F => "Employee ID and face authentication timed out",
            0x50 => "Face recognition failed",
            0x5D => "Unlocking timed out",
            0x65 => "Employee ID and password authentication completed",
            0x66 => "Employee ID and password authentication failed",
            0x67 => "Employee ID and password authentication timed out",
            0x68 => "Human detection failed",
            0x69 => "Person and ID card matched",
            0x70 => "Person and ID card mismatched",
            0x71 => "Blocklist event",
            0x73 => "Invalid message",
            0x82 => "Open door via exit button failed (remain closed or sleeping)",
            0x84 => "Door linkage open failed (remain closed or sleeping)",
            0x85 => "Tailgating",
            0x8B => "Authentication failed when free passing",
            0x8E => "Failed to update local face modeling",
            0x89 => "Passing timed out",
            0x90 => "Allowlist authentication succeeded",
            0x91 => "Allowlist authentication failed",
            0x94 => "Password authentication attempts limit reached",
            0x96 => "Password authentication failed",
            0x99 => "Combined authentication completed",
            0x9A => "Combined authentication timed out",
            0x9C => "Authenticated via QR code",
            0x9D => "QR code authentication failed",
            0x9E => "Authenticated via householder",
            0x9F => "Authenticated via Bluetooth",
            0xA0 => "Bluetooth authentication failed",
            0x34 => "Fire relay: door remains open",
            0x35 => "Fire relay: door remains closed",
            0x40C => "Maximum failed card authentications alarm",
            _ => $"Access event (minor 0x{minor:X})"
        };

        return prefix + text;
    }
}
