using System.Text.Json;
using System.Text.RegularExpressions;

namespace Backend.Infrastructure.Devices;

/// <summary>Hikvision ISAPI часто возвращает HTTP 200 с телом <c>statusCode != 1</c> (JSON или XML).</summary>
public static class IsapiJsonStatus
{
    private static readonly Regex XmlStatusCode = new(@"<statusCode>\s*(\d+)\s*</statusCode>", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    /// <summary>Есть ли в ответе явное подтверждение успеха (<c>statusCode == 1</c> в JSON/XML).</summary>
    public static bool HasExplicitSuccess(string? content)
    {
        if (string.IsNullOrWhiteSpace(content)) return false;
        var t = content.TrimStart();
        if (t.StartsWith('{'))
        {
            try
            {
                using var doc = JsonDocument.Parse(content);
                return TryGetFirstStatusCode(doc.RootElement, 0, out var code, out _) && code == 1;
            }
            catch (JsonException)
            {
                return false;
            }
        }
        if (t.StartsWith('<'))
        {
            var m = XmlStatusCode.Match(content);
            return m.Success && int.TryParse(m.Groups[1].Value, out var c) && c == 1;
        }
        return false;
    }

    /// <summary>Если найден <c>statusCode</c> и он не 1 — текст ошибки.</summary>
    public static string? GetErrorMessageIfFailed(string? content)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;
        var t = content.TrimStart();
        if (t.StartsWith('{'))
        {
            try
            {
                using var doc = JsonDocument.Parse(content);
                if (!TryGetFirstStatusCode(doc.RootElement, 0, out var code, out var owner))
                    return null;
                if (code == 1) return null;
                return FormatJsonError(owner, code);
            }
            catch (JsonException)
            {
                return null;
            }
        }
        if (t.StartsWith('<'))
        {
            var m = XmlStatusCode.Match(content);
            if (!m.Success) return null;
            if (!int.TryParse(m.Groups[1].Value, out var code) || code == 1) return null;
            return $"ISAPI statusCode={code} (XML)";
        }
        return null;
    }

    private static bool TryGetFirstStatusCode(JsonElement el, int depth, out int code, out JsonElement owner)
    {
        code = 0;
        owner = default;
        if (depth > 14 || el.ValueKind != JsonValueKind.Object)
            return false;
        // Учитываем только "statusCode" (число), не строковый "status" (напр. "NoFP" в FingerPrintInfo — не ошибка, см. ISAPI §9.12.2.2).
        if (el.TryGetProperty("statusCode", out var sc))
        {
            if (sc.TryGetInt32(out code) || (sc.ValueKind == JsonValueKind.String && int.TryParse(sc.GetString(), out code)))
            {
                owner = el;
                return true;
            }
        }
        foreach (var p in el.EnumerateObject())
        {
            if (p.Value.ValueKind == JsonValueKind.Object &&
                TryGetFirstStatusCode(p.Value, depth + 1, out code, out owner))
                return true;
        }
        return false;
    }

    private static string FormatJsonError(JsonElement el, int code)
    {
        var str = el.TryGetProperty("statusString", out var s) && s.ValueKind == JsonValueKind.String
            ? s.GetString()
            : null;
        var sub = el.TryGetProperty("subStatusCode", out var ss) && ss.ValueKind == JsonValueKind.String
            ? ss.GetString()
            : null;
        return string.IsNullOrEmpty(str)
            ? $"ISAPI statusCode={code}{(sub != null ? $", subStatusCode={sub}" : "")}"
            : $"{str}{(sub != null ? $" ({sub})" : "")}";
    }
}
