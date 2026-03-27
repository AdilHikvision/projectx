using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;
using Backend.Application.Devices;

namespace Backend.Infrastructure.Devices;

/// <summary>Разбор частей multipart из ISAPI alertStream (JSON/XML EventNotificationAlert, AccessControllerEvent).</summary>
public static class IsapiEventPartParser
{
    public static DeviceEvent? TryCreateDeviceEvent(string deviceIdentifier, IReadOnlyDictionary<string, string> headers, byte[] body)
    {
        if (body.Length == 0)
            return null;

        headers.TryGetValue("Content-Type", out var contentType);
        contentType ??= "";
        if (contentType.Contains("image/", StringComparison.OrdinalIgnoreCase))
            return null;

        var text = Encoding.UTF8.GetString(body);
        var trim = text.TrimStart();
        if (trim.StartsWith('{'))
            return ParseJson(deviceIdentifier, text);
        if (trim.StartsWith('<'))
            return ParseXml(deviceIdentifier, text);
        return null;
    }

    private static DeviceEvent? ParseJson(string deviceIdentifier, string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (!root.TryGetProperty("eventType", out var etEl))
                return null;
            var eventType = etEl.GetString();
            if (string.IsNullOrEmpty(eventType))
                return null;

            var occurred = ParseOccurred(root);

            if (eventType.Equals("heartBeat", StringComparison.OrdinalIgnoreCase) ||
                eventType.Equals("heartbeat", StringComparison.OrdinalIgnoreCase))
            {
                return new DeviceEvent(deviceIdentifier, DeviceEventType.Heartbeat, occurred, json, "Heartbeat (ISAPI)");
            }

            if (eventType.Equals("AccessControllerEvent", StringComparison.OrdinalIgnoreCase) &&
                root.TryGetProperty("AccessControllerEvent", out var ac))
            {
                if (!ac.TryGetProperty("majorEventType", out var maj) || !ac.TryGetProperty("subEventType", out var sub))
                    return new DeviceEvent(deviceIdentifier, DeviceEventType.Unknown, occurred, json, eventType);

                var major = (uint)maj.GetInt32();
                var minor = (uint)sub.GetInt32();
                var (type, summary) = AcsEventMapper.Classify(major, minor);
                return new DeviceEvent(deviceIdentifier, type, occurred, json, summary);
            }

            root.TryGetProperty("eventDescription", out var descEl);
            var desc = descEl.ValueKind == JsonValueKind.String ? descEl.GetString() : null;
            return new DeviceEvent(deviceIdentifier, DeviceEventType.Unknown, occurred, json, desc ?? eventType);
        }
        catch
        {
            return null;
        }
    }

    private static DeviceEvent? ParseXml(string deviceIdentifier, string xml)
    {
        try
        {
            var doc = XDocument.Parse(xml);
            string? Local(string name) =>
                doc.Descendants().FirstOrDefault(x => string.Equals(x.Name.LocalName, name, StringComparison.OrdinalIgnoreCase))?.Value?.Trim();

            var eventType = Local("eventType");
            if (string.IsNullOrEmpty(eventType))
                return null;

            var occurred = ParseXmlDateTime(Local("dateTime")) ?? DateTime.UtcNow;

            if (eventType.Equals("heartBeat", StringComparison.OrdinalIgnoreCase) ||
                eventType.Equals("heartbeat", StringComparison.OrdinalIgnoreCase))
                return new DeviceEvent(deviceIdentifier, DeviceEventType.Heartbeat, occurred, xml, "Heartbeat (ISAPI)");

            var majorS = Local("majorEventType") ?? Local("major");
            var minorS = Local("subEventType") ?? Local("minor");
            if (uint.TryParse(majorS, NumberStyles.Integer, CultureInfo.InvariantCulture, out var major) &&
                uint.TryParse(minorS, NumberStyles.Integer, CultureInfo.InvariantCulture, out var minor))
            {
                var (type, summary) = AcsEventMapper.Classify(major, minor);
                return new DeviceEvent(deviceIdentifier, type, occurred, xml, summary);
            }

            var desc = Local("eventDescription");
            return new DeviceEvent(deviceIdentifier, DeviceEventType.Unknown, occurred, xml, desc ?? eventType);
        }
        catch
        {
            return null;
        }
    }

    private static DateTime ParseOccurred(JsonElement root)
    {
        if (root.TryGetProperty("dateTime", out var dt) && dt.ValueKind == JsonValueKind.String)
        {
            var s = dt.GetString();
            if (!string.IsNullOrEmpty(s) && DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
                return parsed.Kind == DateTimeKind.Utc ? parsed : parsed.ToUniversalTime();
        }

        return DateTime.UtcNow;
    }

    private static DateTime? ParseXmlDateTime(string? s)
    {
        if (string.IsNullOrEmpty(s))
            return null;
        if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
            return parsed.Kind == DateTimeKind.Utc ? parsed : parsed.ToUniversalTime();
        return null;
    }
}
