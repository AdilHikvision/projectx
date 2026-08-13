using System.Collections.Concurrent;
using System.Globalization;
using System.Text.RegularExpressions;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Parking;

/// <summary>Настройки проверки распознанного номера; хранятся в системных настройках.</summary>
public sealed record PlateQualityOptions(
    /// <summary>Минимальный процент распознавания 0..1; 0 — не проверять.</summary>
    double MinConfidence,
    /// <summary>Минимальная длина номера без разделителей; 0 — не проверять.</summary>
    int MinLength,
    /// <summary>Регулярное выражение для номера; пусто — не проверять (иностранные номера).</summary>
    string? Pattern,
    /// <summary>Пускать ли машину, которая уже числится внутри (обычно это повтор или «паровозик»).</summary>
    bool AllowReentryWhileInside,
    /// <summary>Отбраковывать ли кадр, если камера не прислала процент распознавания.</summary>
    bool RequireConfidence)
{
    public static PlateQualityOptions Default { get; } = new(0d, 5, null, false, false);

    public static async Task<PlateQualityOptions> LoadAsync(AppDbContext db, CancellationToken ct)
    {
        var keys = new[]
        {
            "parking.minPlateConfidence", "parking.minPlateLength",
            "parking.platePattern", "parking.allowReentryWhileInside",
            "parking.requireConfidence"
        };
        var map = await db.SystemSettings.AsNoTracking()
            .Where(x => keys.Contains(x.Key))
            .ToDictionaryAsync(x => x.Key, x => x.Value, ct);

        string? Get(string key) => map.TryGetValue(key, out var v) && !string.IsNullOrWhiteSpace(v) ? v.Trim() : null;

        // Порог принимаем и долей (0.8), и процентом (80): в настройке легко ошибиться,
        // а «0.8» вместо «80» превратило бы строгий уровень в почти выключенный.
        var confidence = double.TryParse(Get("parking.minPlateConfidence"),
            NumberStyles.Float, CultureInfo.InvariantCulture, out var c)
            ? Math.Clamp(c > 1d ? c / 100d : c, 0d, 1d)
            : Default.MinConfidence;
        var length = int.TryParse(Get("parking.minPlateLength"), out var l) && l >= 0 ? l : Default.MinLength;
        var reentry = bool.TryParse(Get("parking.allowReentryWhileInside"), out var r) && r;
        var requireConfidence = bool.TryParse(Get("parking.requireConfidence"), out var rc) && rc;

        return new PlateQualityOptions(confidence, length, Get("parking.platePattern"), reentry, requireConfidence);
    }
}

/// <summary>
/// Проверка распознанного номера до решения о проезде. Смысл в том, чтобы не открывать
/// шлагбаум по обрывку номера: камера регулярно отдаёт частичное распознавание, а
/// нормализация (только буквы и цифры) молча превращает «10-A?-100» в «10A100» —
/// вполне правдоподобный чужой номер. Поэтому проверяем сырую строку, а не нормализованную.
/// </summary>
public static class PlateQuality
{
    /// <summary>Чем камера заменяет нечитаемый символ (последний — U+FFFD, «битый» знак).</summary>
    private static readonly char[] Placeholders = ['?', '*', '_', '#', '�'];

    /// <summary>Скомпилированные шаблоны: настройка меняется редко, а событий много.</summary>
    private static readonly ConcurrentDictionary<string, Regex?> PatternCache = new();

    /// <summary>Ok=false — номер не годится для решения; Reason уходит в журнал событий.</summary>
    public sealed record Result(bool Ok, string Reason = "", string? Detail = null)
    {
        public static Result Good { get; } = new(true);
    }

    public static Result Validate(string? rawPlate, double? confidence, PlateQualityOptions options)
    {
        var raw = (rawPlate ?? string.Empty).Trim();
        if (raw.Length == 0) return new Result(false, "empty");

        // Незакрытые позиции: часть номера камера не прочитала.
        if (raw.IndexOfAny(Placeholders) >= 0)
            return new Result(false, "incomplete", raw);

        var normalized = ParkingAccessService.NormalizePlate(raw);
        if (normalized.Length == 0) return new Result(false, "empty", raw);

        if (options.MinLength > 0 && normalized.Length < options.MinLength)
            return new Result(false, "too-short", $"{raw} ({normalized.Length} chars)");

        // Номер без единой цифры почти всегда мусор от бликов и рамки номерного знака.
        if (!normalized.Any(char.IsDigit))
            return new Result(false, "no-digits", raw);

        if (options.MinConfidence > 0)
        {
            if (confidence is { } conf)
            {
                if (conf < options.MinConfidence)
                    return new Result(false, "low-confidence",
                        $"{raw} ({conf * 100:0}% < {options.MinConfidence * 100:0}%)");
            }
            // Процент прислали не все прошивки. По умолчанию такой кадр проходит дальше —
            // иначе на камере без этого поля парковка встанет. Кому важнее строгость,
            // включает правило и получает отбраковку вместо молчаливого пропуска.
            else if (options.RequireConfidence)
                return new Result(false, "no-confidence", raw);
        }

        if (!string.IsNullOrWhiteSpace(options.Pattern))
        {
            var regex = PatternCache.GetOrAdd(options.Pattern, static p =>
            {
                // Кривой шаблон не должен ронять проезд — считаем, что проверки нет.
                try { return new Regex(p, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant, TimeSpan.FromMilliseconds(100)); }
                catch (ArgumentException) { return null; }
            });
            try
            {
                if (regex is not null && !regex.IsMatch(normalized))
                    return new Result(false, "pattern", $"{raw} ≠ {options.Pattern}");
            }
            catch (RegexMatchTimeoutException)
            {
                // Шаблон слишком тяжёлый — пропускаем проверку, а не машину задерживаем.
            }
        }

        return Result.Good;
    }
}
