using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;
using Backend.Application.Parking;

namespace Backend.Infrastructure.Devices;

/// <summary>
/// Разбор событий распознавания номеров с камер Hikvision (ISAPI ANPR / Vehicle Access).
/// Прошивки отдают либо XML EventNotificationAlert с блоком &lt;ANPR&gt;, либо JSON с тем же
/// набором полей, либо вариант с &lt;plateNumber&gt; внутри &lt;Vehicle&gt;/&lt;VehicleInfo&gt;.
/// Разбираем по локальным именам узлов, чтобы не зависеть от namespace и версии схемы.
/// </summary>
public static class IsapiAnprParser
{
    /// <summary>Имена узлов, в которых прошивки Hikvision присылают номер.</summary>
    private static readonly string[] PlateNodes = ["licensePlate", "plateNumber", "plateNo", "licensePlateNumber"];

    public static bool IsImagePart(IReadOnlyDictionary<string, string> headers)
    {
        headers.TryGetValue("Content-Type", out var contentType);
        return contentType?.Contains("image/", StringComparison.OrdinalIgnoreCase) == true;
    }

    public static AnprPlateEvent? TryParse(IReadOnlyDictionary<string, string> headers, byte[] body)
    {
        if (body.Length == 0 || IsImagePart(headers)) return null;

        var text = Encoding.UTF8.GetString(body);
        var trim = text.TrimStart();
        try
        {
            if (trim.StartsWith('{')) return ParseJson(text);
            if (trim.StartsWith('<')) return ParseXml(text);
        }
        catch
        {
            return null;
        }
        return null;
    }

    private static AnprPlateEvent? ParseXml(string xml)
    {
        var doc = XDocument.Parse(xml);
        string? Local(params string[] names) => doc.Descendants()
            .FirstOrDefault(x => names.Any(n => string.Equals(x.Name.LocalName, n, StringComparison.OrdinalIgnoreCase)))
            ?.Value?.Trim();

        var plate = Local(PlateNodes);
        if (string.IsNullOrWhiteSpace(plate)) return null;

        // Событие с пустым/служебным номером (например «нет номера») нам не нужно.
        if (plate.Equals("unknown", StringComparison.OrdinalIgnoreCase)) return null;

        var occurred = ParseDate(Local("dateTime", "captureTime")) ?? DateTime.UtcNow;
        return new AnprPlateEvent(
            plate,
            occurred,
            ParseConfidence(Local("confidenceLevel", "confidence")),
            Local("country", "countryName"),
            Local("direction", "vehicleDirection"));
    }

    private static AnprPlateEvent? ParseJson(string json)
    {
        using var doc = JsonDocument.Parse(json);

        // Ищем поля в корне и в любом вложенном объекте (ANPR, Vehicle, AID…).
        string? Find(params string[] names)
        {
            string? found = null;
            void Walk(JsonElement el)
            {
                if (found != null) return;
                if (el.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in el.EnumerateObject())
                    {
                        if (found != null) return;
                        if (names.Any(n => string.Equals(prop.Name, n, StringComparison.OrdinalIgnoreCase)))
                        {
                            found = prop.Value.ValueKind switch
                            {
                                JsonValueKind.String => prop.Value.GetString(),
                                JsonValueKind.Number => prop.Value.GetRawText(),
                                _ => null
                            };
                            if (found != null) return;
                        }
                        Walk(prop.Value);
                    }
                }
                else if (el.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in el.EnumerateArray()) Walk(item);
                }
            }
            Walk(doc.RootElement);
            return found?.Trim();
        }

        var plate = Find(PlateNodes);
        if (string.IsNullOrWhiteSpace(plate) || plate.Equals("unknown", StringComparison.OrdinalIgnoreCase)) return null;

        var occurred = ParseDate(Find("dateTime", "captureTime")) ?? DateTime.UtcNow;
        return new AnprPlateEvent(
            plate,
            occurred,
            ParseConfidence(Find("confidenceLevel", "confidence")),
            Find("country", "countryName"),
            Find("direction", "vehicleDirection"));
    }

    /// <summary>Камеры шлют уверенность как 0..100, реже как 0..1 — приводим к 0..1.</summary>
    private static double? ParseConfidence(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        if (!double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out var v)) return null;
        if (v <= 0) return null;
        return v > 1 ? Math.Min(1.0, v / 100.0) : v;
    }

    private static DateTime? ParseDate(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
            return parsed.Kind == DateTimeKind.Utc ? parsed : parsed.ToUniversalTime();
        return null;
    }
}
