using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

// ── shared data types ─────────────────────────────────────────────────────────

public sealed record AttendancePeriodRow(
    Guid EmployeeId,
    string EmployeeName,
    string? Department,
    DateOnly Date,
    string? ScheduleName,
    string? ShiftStart,
    string? ShiftEnd,
    DateTime? CheckInUtc,
    DateTime? CheckOutUtc,
    double TotalHours,
    int? LateMinutes,
    bool Corrected,
    double NormHours,
    double OvertimeHours,
    int? EarlyLeaveMinutes,
    bool IsDayOff,
    bool IsAbsent,
    bool OnLeave,
    string? LeaveType)
{
    /// <summary>Human-readable day status, shared by the Excel and PDF reports.</summary>
    public string StatusLabel =>
        IsDayOff ? "Day off"
        : OnLeave ? (LeaveType == "DayOff" ? "Day off (leave)" : "On leave")
        : IsAbsent ? "Absent"
        : CheckInUtc.HasValue ? "Present" : "";
}

public sealed record SchedulePlannerRow(
    string EmployeeName,
    string? Department,
    DateOnly Date,
    string? ScheduleName,
    string? ShiftStart,
    string? ShiftEnd,
    bool IsDayOff,
    string? LeaveType,
    string? Color,
    string? ScheduleType);

// Строка месячного табеля (İş vaxtının aylıq uçotu): дни месяца → (часы, ключ критерия).
public sealed record MonthlyTabelCell(double Hours, string Key);
public sealed record MonthlyTabelRow(
    string No,
    string ExternalId,
    string Fullname,
    string Position,
    string Department,
    Dictionary<int, MonthlyTabelCell> Days,
    int TotalDays,
    int TotalHours,
    int ExtraDays,
    int ExtraHours);

/// <summary>Стиль критерия табеля (из attendance_criteria, с дефолтами для отсутствующих ключей).</summary>
public sealed record TabelCritStyle(string Key, string Label, string Letter, string Color, string DisplayMode, bool Enabled);

public sealed record PayrollReportRow(
    string EmployeeName,
    string? EmployeeNo,
    string? Department,
    double WorkedDays,
    double WorkedHours,
    double OvertimeHours,
    int AbsentDays,
    decimal BasePay,
    decimal OvertimePay,
    decimal AllowancesTotal,
    decimal BonusesTotal,
    decimal GrossPay,
    decimal DeductionsTotal,
    decimal TaxAmount,
    decimal NetPay);

// ── Excel helpers ─────────────────────────────────────────────────────────────

public static class ExcelReportBuilder
{
    public static byte[] BuildAttendance(
        IReadOnlyList<AttendancePeriodRow> rows,
        DateTime from, DateTime to, string? employeeFilter)
    {
        const string Brand = "#6e56cf";       // фирменный фиолетовый (Violet Aurora)
        const string BrandSoft = "#f0edfa";
        const string Line = "#e4e1ee";
        const string Muted = "#6e6980";

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Work Hours");
        ws.ShowGridLines = false;

        string[] headers = ["Employee", "Department", "Date", "Schedule", "Shift Start", "Shift End",
            "Check In", "Check Out", "Hours", "Overtime", "Late (min)", "Early (min)", "Status", "Corrected"];

        // Title block
        ws.Range(1, 1, 1, headers.Length).Merge();
        ws.Cell(1, 1).Value = "Work Hours Report";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 16;
        ws.Cell(1, 1).Style.Font.FontColor = XLColor.FromHtml(Brand);

        ws.Range(2, 1, 2, headers.Length).Merge();
        ws.Cell(2, 1).Value =
            $"Period: {from:dd.MM.yyyy} – {to:dd.MM.yyyy}"
            + (string.IsNullOrWhiteSpace(employeeFilter) ? "" : $"    ·    Employee: {employeeFilter}")
            + $"    ·    Generated: {DateTime.Now:dd.MM.yyyy HH:mm}";
        ws.Cell(2, 1).Style.Font.FontColor = XLColor.FromHtml(Muted);
        ws.Cell(2, 1).Style.Font.FontSize = 10;

        // Header row
        int headerRow = 4;
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(headerRow, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml(Brand);
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        }
        ws.Row(headerRow).Height = 24;

        // Data
        int row = headerRow + 1;
        foreach (var r in rows)
        {
            bool weekend = r.Date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
            bool zebra = (row - headerRow) % 2 == 0;
            string rowBg = weekend ? "#f4f2fb" : (zebra ? "#faf9fd" : "#ffffff");
            ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml(rowBg);

            ws.Cell(row, 1).Value = r.EmployeeName;
            ws.Cell(row, 1).Style.Font.Bold = true;
            ws.Cell(row, 2).Value = r.Department ?? "";
            ws.Cell(row, 2).Style.Font.FontColor = XLColor.FromHtml(Muted);
            ws.Cell(row, 3).Value = r.Date.ToDateTime(TimeOnly.MinValue);
            ws.Cell(row, 3).Style.DateFormat.Format = "dd.MM.yyyy";
            ws.Cell(row, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (weekend) ws.Cell(row, 3).Style.Font.FontColor = XLColor.FromHtml("#8e77e8");
            ws.Cell(row, 4).Value = r.ScheduleName ?? "";
            ws.Cell(row, 5).Value = r.ShiftStart ?? "";
            ws.Cell(row, 6).Value = r.ShiftEnd ?? "";
            ws.Cell(row, 7).Value = r.CheckInUtc.HasValue
                ? TimeZoneInfo.ConvertTimeFromUtc(r.CheckInUtc.Value, TimeZoneInfo.Local).ToString("HH:mm") : "";
            ws.Cell(row, 8).Value = r.CheckOutUtc.HasValue
                ? TimeZoneInfo.ConvertTimeFromUtc(r.CheckOutUtc.Value, TimeZoneInfo.Local).ToString("HH:mm") : "";
            ws.Range(row, 5, row, 8).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            ws.Cell(row, 9).Value = r.TotalHours;
            ws.Cell(row, 9).Style.NumberFormat.Format = "0.00";
            ws.Cell(row, 9).Style.Font.Bold = true;
            ws.Cell(row, 10).Value = r.OvertimeHours > 0 ? (double?)r.OvertimeHours : null;
            ws.Cell(row, 10).Style.NumberFormat.Format = "0.00";
            ws.Cell(row, 10).Style.Font.FontColor = XLColor.FromHtml(Brand);
            ws.Cell(row, 11).Value = r.LateMinutes.HasValue ? (int?)r.LateMinutes : null;
            if (r.LateMinutes > 0)
            {
                ws.Cell(row, 11).Style.Font.FontColor = XLColor.FromHtml("#dc2637");
                ws.Cell(row, 11).Style.Font.Bold = true;
            }
            ws.Cell(row, 12).Value = r.EarlyLeaveMinutes.HasValue ? (int?)r.EarlyLeaveMinutes : null;
            if (r.EarlyLeaveMinutes > 0)
                ws.Cell(row, 12).Style.Font.FontColor = XLColor.FromHtml("#ea580c");

            // Статус — цветной «чип»: заливка + цвет текста по состоянию дня.
            var (stBg, stFg) = r.IsDayOff || (r.OnLeave && r.LeaveType == "DayOff") ? ("#eceaf2", Muted)
                : r.OnLeave ? ("#fdf5e2", "#c07207")
                : r.IsAbsent ? ("#fdeeef", "#dc2637")
                : r.CheckInUtc.HasValue ? ("#e7f8f0", "#0e9f6e")
                : (rowBg, "#16131f");
            ws.Cell(row, 13).Value = r.StatusLabel;
            ws.Cell(row, 13).Style.Fill.BackgroundColor = XLColor.FromHtml(stBg);
            ws.Cell(row, 13).Style.Font.FontColor = XLColor.FromHtml(stFg);
            ws.Cell(row, 13).Style.Font.Bold = true;
            ws.Cell(row, 13).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            ws.Cell(row, 14).Value = r.Corrected ? "Yes" : "";
            ws.Cell(row, 14).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            row++;
        }

        // Summary row
        if (rows.Count > 0)
        {
            ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml(BrandSoft);
            ws.Range(row, 1, row, headers.Length).Style.Border.TopBorder = XLBorderStyleValues.Medium;
            ws.Range(row, 1, row, headers.Length).Style.Border.TopBorderColor = XLColor.FromHtml(Brand);
            ws.Cell(row, 1).Value = "TOTAL";
            ws.Cell(row, 1).Style.Font.Bold = true;
            ws.Cell(row, 1).Style.Font.FontColor = XLColor.FromHtml(Brand);
            ws.Cell(row, 9).Value = rows.Sum(r => r.TotalHours);
            ws.Cell(row, 10).Value = rows.Sum(r => r.OvertimeHours);
            ws.Cell(row, 11).Value = rows.Sum(r => (double)(r.LateMinutes ?? 0));
            ws.Cell(row, 12).Value = rows.Sum(r => (double)(r.EarlyLeaveMinutes ?? 0));
            foreach (var col in new[] { 9, 10, 11, 12 })
            {
                ws.Cell(row, col).Style.Font.Bold = true;
                ws.Cell(row, col).Style.NumberFormat.Format = col <= 10 ? "0.00" : "0";
            }
            ws.Row(row).Height = 20;
        }

        // Сетка: тонкие линии внутри таблицы.
        var tableRange = ws.Range(headerRow, 1, Math.Max(row, headerRow + 1), headers.Length);
        tableRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        tableRange.Style.Border.InsideBorderColor = XLColor.FromHtml(Line);
        tableRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        tableRange.Style.Border.OutsideBorderColor = XLColor.FromHtml(Line);

        ws.SheetView.FreezeRows(headerRow);
        if (rows.Count > 0)
            ws.Range(headerRow, 1, row - 1, headers.Length).SetAutoFilter();

        ws.Columns().AdjustToContents();
        ws.Column(1).Width = Math.Max(ws.Column(1).Width, 22);
        ws.Column(7).Width = 11;
        ws.Column(8).Width = 11;
        ws.Column(13).Width = Math.Max(ws.Column(13).Width, 14);

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    public static byte[] BuildPayroll(
        IReadOnlyList<PayrollReportRow> rows,
        int year, int month, string periodStatus)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Payroll");

        ws.Cell("A1").Value = $"Payroll Report — {month:D2}/{year}";
        ws.Cell("A1").Style.Font.Bold = true;
        ws.Cell("A1").Style.Font.FontSize = 14;
        ws.Cell("A2").Value = $"Status: {periodStatus}";

        int headerRow = 4;
        string[] headers = ["Employee", "No.", "Department", "Worked Days", "Worked H", "OT Hours",
            "Absent", "Base Pay", "OT Pay", "Allowances", "Bonuses", "Gross", "Deductions", "Tax", "Net Pay"];
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(headerRow, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#6e56cf");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        string numFmt = "#,##0.00";
        int row = headerRow + 1;
        foreach (var r in rows)
        {
            ws.Cell(row, 1).Value = r.EmployeeName;
            ws.Cell(row, 2).Value = r.EmployeeNo ?? "";
            ws.Cell(row, 3).Value = r.Department ?? "";
            ws.Cell(row, 4).Value = r.WorkedDays;
            ws.Cell(row, 5).Value = r.WorkedHours;
            ws.Cell(row, 5).Style.NumberFormat.Format = "0.0";
            ws.Cell(row, 6).Value = r.OvertimeHours;
            ws.Cell(row, 6).Style.NumberFormat.Format = "0.0";
            ws.Cell(row, 7).Value = r.AbsentDays;
            ws.Cell(row, 8).Value = r.BasePay; ws.Cell(row, 8).Style.NumberFormat.Format = numFmt;
            ws.Cell(row, 9).Value = r.OvertimePay; ws.Cell(row, 9).Style.NumberFormat.Format = numFmt;
            ws.Cell(row, 10).Value = r.AllowancesTotal; ws.Cell(row, 10).Style.NumberFormat.Format = numFmt;
            ws.Cell(row, 11).Value = r.BonusesTotal; ws.Cell(row, 11).Style.NumberFormat.Format = numFmt;
            ws.Cell(row, 12).Value = r.GrossPay; ws.Cell(row, 12).Style.NumberFormat.Format = numFmt;
            ws.Cell(row, 13).Value = r.DeductionsTotal; ws.Cell(row, 13).Style.NumberFormat.Format = numFmt;
            ws.Cell(row, 14).Value = r.TaxAmount; ws.Cell(row, 14).Style.NumberFormat.Format = numFmt;
            ws.Cell(row, 15).Value = r.NetPay; ws.Cell(row, 15).Style.NumberFormat.Format = numFmt;
            ws.Cell(row, 15).Style.Font.Bold = true;
            row++;
        }

        // Totals
        if (rows.Count > 0)
        {
            int[] sumCols = [8, 9, 10, 11, 12, 13, 14, 15];
            ws.Cell(row, 1).Value = "TOTAL";
            ws.Cell(row, 1).Style.Font.Bold = true;
            ws.Cell(row, 4).Value = rows.Sum(r => r.WorkedDays);
            ws.Cell(row, 5).Value = rows.Sum(r => r.WorkedHours);
            ws.Cell(row, 5).Style.NumberFormat.Format = "0.0";
            foreach (int col in sumCols)
            {
                var val = col switch
                {
                    8 => rows.Sum(r => r.BasePay),
                    9 => rows.Sum(r => r.OvertimePay),
                    10 => rows.Sum(r => r.AllowancesTotal),
                    11 => rows.Sum(r => r.BonusesTotal),
                    12 => rows.Sum(r => r.GrossPay),
                    13 => rows.Sum(r => r.DeductionsTotal),
                    14 => rows.Sum(r => r.TaxAmount),
                    15 => rows.Sum(r => r.NetPay),
                    _ => 0m
                };
                ws.Cell(row, col).Value = val;
                ws.Cell(row, col).Style.NumberFormat.Format = numFmt;
                ws.Cell(row, col).Style.Font.Bold = true;
            }
            ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromHtml("#f0f0f0");
        }

        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    public static byte[] BuildSchedulePlanner(
        IReadOnlyList<SchedulePlannerRow> rows, DateOnly from, DateOnly to)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Schedule Planner");

        ws.Cell("A1").Value = "Schedule Planner";
        ws.Cell("A1").Style.Font.Bold = true;
        ws.Cell("A1").Style.Font.FontSize = 14;
        ws.Cell("A2").Value = $"Period: {from:dd.MM.yyyy} – {to:dd.MM.yyyy}";

        var dates = new List<DateOnly>();
        for (var d = from; d <= to; d = d.AddDays(1)) dates.Add(d);

        var employees = rows.GroupBy(r => r.EmployeeName)
            .Select(g => new { Name = g.Key, Dept = g.First().Department, ByDate = g.ToDictionary(x => x.Date) })
            .OrderBy(x => x.Name).ToList();

        int headerRow = 4;
        ws.Cell(headerRow, 1).Value = "Employee";
        ws.Cell(headerRow, 2).Value = "Department";
        for (int i = 0; i < dates.Count; i++)
        {
            var c = ws.Cell(headerRow, 3 + i);
            c.Value = dates[i].ToString("dd MMM");
            var isWeekend = dates[i].DayOfWeek == DayOfWeek.Saturday || dates[i].DayOfWeek == DayOfWeek.Sunday;
            c.Style.Font.FontColor = isWeekend ? XLColor.FromHtml("#dc2626") : XLColor.White;
            c.Style.Fill.BackgroundColor = isWeekend ? XLColor.FromHtml("#fef2f2") : XLColor.FromHtml("#6e56cf");
            c.Style.Font.Bold = true;
            c.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }
        ws.Cell(headerRow, 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#6e56cf");
        ws.Cell(headerRow, 1).Style.Font.FontColor = XLColor.White;
        ws.Cell(headerRow, 1).Style.Font.Bold = true;
        ws.Cell(headerRow, 2).Style.Fill.BackgroundColor = XLColor.FromHtml("#6e56cf");
        ws.Cell(headerRow, 2).Style.Font.FontColor = XLColor.White;
        ws.Cell(headerRow, 2).Style.Font.Bold = true;

        int row = headerRow + 1;
        foreach (var emp in employees)
        {
            ws.Cell(row, 1).Value = emp.Name;
            ws.Cell(row, 1).Style.Font.Bold = true;
            ws.Cell(row, 2).Value = emp.Dept ?? "";
            ws.Cell(row, 2).Style.Font.FontColor = XLColor.FromHtml("#666666");
            for (int i = 0; i < dates.Count; i++)
            {
                var cell = ws.Cell(row, 3 + i);
                if (!emp.ByDate.TryGetValue(dates[i], out var cellRow))
                {
                    cell.Value = "";
                    continue;
                }
                if (cellRow.IsDayOff)
                {
                    cell.Value = "OFF";
                    cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#fee2e2");
                    cell.Style.Font.FontColor = XLColor.FromHtml("#dc2626");
                    cell.Style.Font.Bold = true;
                }
                else
                {
                    var schedShort = string.IsNullOrEmpty(cellRow.ScheduleName)
                        ? "—"
                        : (cellRow.ScheduleName.Length > 14 ? cellRow.ScheduleName.Substring(0, 14) + "…" : cellRow.ScheduleName);
                    var times = (cellRow.ShiftStart is null && cellRow.ShiftEnd is null)
                        ? cellRow.ScheduleType ?? ""
                        : $"{cellRow.ShiftStart ?? "—"}–{cellRow.ShiftEnd ?? "—"}";
                    cell.Value = string.IsNullOrEmpty(times) ? schedShort : $"{schedShort}\n{times}";
                    cell.Style.Alignment.WrapText = true;
                    if (!string.IsNullOrEmpty(cellRow.Color))
                    {
                        try
                        {
                            cell.Style.Fill.BackgroundColor = XLColor.FromHtml(cellRow.Color + "22");
                            cell.Style.Font.FontColor = XLColor.FromHtml(cellRow.Color);
                        }
                        catch { }
                    }
                }
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                cell.Style.Border.OutsideBorderColor = XLColor.FromHtml("#e5e7eb");
            }
            row++;
        }

        ws.Column(1).Width = 22;
        ws.Column(2).Width = 16;
        for (int i = 0; i < dates.Count; i++) ws.Column(3 + i).Width = 11;
        ws.SheetView.FreezeColumns(2);
        ws.SheetView.FreezeRows(headerRow);

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    // Ячейка табеля: часы (displayMode=hours) или буква критерия; цвет/заливка из критерия.
    static (string Text, string Color) TabelCellContent(MonthlyTabelCell cell, IReadOnlyDictionary<string, TabelCritStyle> crit)
    {
        crit.TryGetValue(cell.Key, out var c);
        var color = c?.Color ?? "#6B7280";
        var letter = c?.Letter ?? "";
        var mode = c?.DisplayMode == "hours" ? "hours" : "letter";
        var text = mode == "hours"
            ? (cell.Hours > 0 ? cell.Hours.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture) : letter)
            : (letter.Length > 0 ? letter : (cell.Hours > 0 ? cell.Hours.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture) : ""));
        return (text, color);
    }

    // Светлая заливка из hex-цвета критерия (смешение с белым, как #RRGGBB22 в UI).
    static XLColor TabelTint(string hex)
    {
        try
        {
            var c = System.Drawing.ColorTranslator.FromHtml(hex);
            static int Mix(int ch) => ch + (int)((255 - ch) * 0.85);
            return XLColor.FromArgb(Mix(c.R), Mix(c.G), Mix(c.B));
        }
        catch { return XLColor.White; }
    }

    public static byte[] BuildMonthlyTabel(
        IReadOnlyList<MonthlyTabelRow> rows,
        int year, int month,
        IReadOnlyDictionary<string, TabelCritStyle> crit)
    {
        int daysInMonth = DateTime.DaysInMonth(year, month);
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Tabel");

        ws.Cell("A1").Value = $"İş vaxtının aylıq uçotu — Tabel — {year:D4}-{month:D2}";
        ws.Cell("A1").Style.Font.Bold = true;
        ws.Cell("A1").Style.Font.FontSize = 14;

        int headerRow = 3;
        var headers = new List<string> { "S/S", "Tab. №", "Soyadı, adı, atasının adı", "Vəzifəsi", "Struktur bölməsi" };
        for (int d = 1; d <= daysInMonth; d++) headers.Add(d.ToString());
        headers.AddRange(["Cəmi gün", "Cəmi saat", "Əlavə gün", "Əlavə saat"]);
        for (int i = 0; i < headers.Count; i++)
        {
            var cell = ws.Cell(headerRow, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#6e56cf");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }
        // Выходные (сб/вс) в шапке — приглушённая заливка.
        for (int d = 1; d <= daysInMonth; d++)
        {
            var dow = new DateTime(year, month, d).DayOfWeek;
            if (dow == DayOfWeek.Saturday || dow == DayOfWeek.Sunday)
                ws.Cell(headerRow, 5 + d).Style.Fill.BackgroundColor = XLColor.FromHtml("#8e77e8");
        }

        int row = headerRow + 1;
        int idx = 1;
        foreach (var r in rows)
        {
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = r.ExternalId;
            ws.Cell(row, 3).Value = r.Fullname;
            ws.Cell(row, 4).Value = r.Position;
            ws.Cell(row, 5).Value = r.Department;
            for (int d = 1; d <= daysInMonth; d++)
            {
                var cell = ws.Cell(row, 5 + d);
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (!r.Days.TryGetValue(d, out var dayCell)) continue;
                var (text, color) = TabelCellContent(dayCell, crit);
                cell.Value = text;
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontColor = XLColor.FromHtml(color);
                cell.Style.Fill.BackgroundColor = TabelTint(color);
            }
            ws.Cell(row, 5 + daysInMonth + 1).Value = r.TotalDays;
            ws.Cell(row, 5 + daysInMonth + 2).Value = r.TotalHours;
            ws.Cell(row, 5 + daysInMonth + 3).Value = r.ExtraDays;
            ws.Cell(row, 5 + daysInMonth + 4).Value = r.ExtraHours;
            row++;
        }

        // Итого по колонке "Cəmi saat".
        if (rows.Count > 0)
        {
            ws.Cell(row, 3).Value = "TOTAL";
            ws.Cell(row, 3).Style.Font.Bold = true;
            ws.Cell(row, 5 + daysInMonth + 2).Value = rows.Sum(r => r.TotalHours);
            ws.Cell(row, 5 + daysInMonth + 2).Style.Font.Bold = true;
            ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromHtml("#f0f0f0");
        }

        // Легенда критериев.
        int legendRow = row + 2;
        ws.Cell(legendRow, 1).Value = "Kodların izahı:";
        ws.Cell(legendRow, 1).Style.Font.Bold = true;
        int lr = legendRow + 1;
        foreach (var c in crit.Values.Where(c => c.Enabled).OrderBy(c => c.Key))
        {
            ws.Cell(lr, 1).Value = c.Letter.Length > 0 ? c.Letter : "S";
            ws.Cell(lr, 1).Style.Font.Bold = true;
            ws.Cell(lr, 1).Style.Font.FontColor = XLColor.FromHtml(c.Color);
            ws.Cell(lr, 1).Style.Fill.BackgroundColor = TabelTint(c.Color);
            ws.Cell(lr, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(lr, 2).Value = c.Label + (c.DisplayMode == "hours" ? " (saat)" : "");
            lr++;
        }

        ws.Column(1).Width = 5;
        ws.Column(2).Width = 10;
        ws.Column(3).Width = 28;
        ws.Column(4).Width = 16;
        ws.Column(5).Width = 16;
        for (int d = 1; d <= daysInMonth; d++) ws.Column(5 + d).Width = 4.5;
        for (int i = 1; i <= 4; i++) ws.Column(5 + daysInMonth + i).Width = 9;
        ws.SheetView.FreezeColumns(3);
        ws.SheetView.FreezeRows(headerRow);

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }
}

// ── PDF helpers ───────────────────────────────────────────────────────────────

public static class PdfReportBuilder
{
    static readonly string PrimaryHex = "#6e56cf";

    public static byte[] BuildAttendance(
        IReadOnlyList<AttendancePeriodRow> rows,
        DateTime from, DateTime to, string? employeeFilter)
    {
        const string Line = "#ecebf4";
        const string Ink = "#1a1a2e";
        const string Muted = "#6e6980";

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(8).FontFamily("Arial"));

                page.Header().Column(col =>
                {
                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Column(left =>
                        {
                            left.Item().Text("Work Hours Report")
                                .FontSize(16).Bold().FontColor(PrimaryHex);
                            left.Item().Text($"Period: {from:dd.MM.yyyy} – {to:dd.MM.yyyy}"
                                    + (string.IsNullOrWhiteSpace(employeeFilter) ? "" : $"   ·   Employee: {employeeFilter}"))
                                .FontSize(9).FontColor(Muted);
                        });
                        r.AutoItem().AlignBottom().Text($"Generated: {DateTime.Now:dd.MM.yyyy HH:mm}")
                            .FontSize(7.5f).FontColor("#a09aaf");
                    });
                    col.Item().PaddingTop(6).LineHorizontal(1.5f).LineColor(PrimaryHex);
                });

                page.Content().PaddingTop(8).Table(table =>
                {
                    table.ColumnsDefinition(c =>
                    {
                        c.RelativeColumn(3); // Employee
                        c.RelativeColumn(2); // Department
                        c.ConstantColumn(52); // Date
                        c.RelativeColumn(2); // Schedule
                        c.ConstantColumn(38); // Shift S
                        c.ConstantColumn(38); // Shift E
                        c.ConstantColumn(38); // In
                        c.ConstantColumn(38); // Out
                        c.ConstantColumn(36); // Hours
                        c.ConstantColumn(36); // OT
                        c.ConstantColumn(36); // Late
                        c.ConstantColumn(36); // Early
                        c.ConstantColumn(58); // Status
                    });

                    table.Header(h =>
                    {
                        foreach (var hdr in new[] { "Employee", "Department", "Date", "Schedule",
                            "Shift S", "Shift E", "In", "Out", "Hours", "OT", "Late", "Early", "Status" })
                        {
                            h.Cell().Background(PrimaryHex).PaddingVertical(4).PaddingHorizontal(3)
                                .Text(hdr).FontColor("#ffffff").Bold().FontSize(7.5f);
                        }
                    });

                    // Ячейка с нижней волосяной линией — таблица читается без плотной сетки.
                    IContainer Body(string bg) => table.Cell()
                        .Background(bg)
                        .BorderBottom(0.5f).BorderColor(Line)
                        .PaddingVertical(3).PaddingHorizontal(3);

                    bool alt = false;
                    foreach (var r in rows)
                    {
                        bool weekend = r.Date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
                        string bg = weekend ? "#f4f2fb" : (alt ? "#faf9fd" : "#ffffff");
                        alt = !alt;
                        bool isLate = r.LateMinutes > 0;

                        Body(bg).Text(r.EmployeeName).FontSize(7.5f).SemiBold().FontColor(Ink);
                        Body(bg).Text(r.Department ?? "").FontSize(7.5f).FontColor(Muted);
                        Body(bg).AlignCenter().Text(r.Date.ToString("dd.MM.yy"))
                            .FontSize(7.5f).FontColor(weekend ? "#8e77e8" : Ink);
                        Body(bg).Text(r.ScheduleName ?? "").FontSize(7.5f).FontColor(Ink);
                        Body(bg).AlignCenter().Text(r.ShiftStart ?? "").FontSize(7.5f).FontColor(Muted);
                        Body(bg).AlignCenter().Text(r.ShiftEnd ?? "").FontSize(7.5f).FontColor(Muted);
                        Body(bg).AlignCenter()
                            .Text(r.CheckInUtc.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(r.CheckInUtc.Value, TimeZoneInfo.Local).ToString("HH:mm") : "—")
                            .FontSize(7.5f).FontColor(Ink);
                        Body(bg).AlignCenter()
                            .Text(r.CheckOutUtc.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(r.CheckOutUtc.Value, TimeZoneInfo.Local).ToString("HH:mm") : "—")
                            .FontSize(7.5f).FontColor(Ink);
                        Body(bg).AlignRight().Text(r.TotalHours > 0 ? r.TotalHours.ToString("0.00") : "")
                            .FontSize(7.5f).Bold().FontColor(Ink);
                        Body(bg).AlignRight().Text(r.OvertimeHours > 0 ? r.OvertimeHours.ToString("0.00") : "")
                            .FontSize(7.5f).FontColor(PrimaryHex);
                        Body(bg).AlignRight().Text(r.LateMinutes > 0 ? r.LateMinutes.ToString()! : "")
                            .FontSize(7.5f).Bold().FontColor(isLate ? "#dc2637" : Ink);
                        Body(bg).AlignRight().Text(r.EarlyLeaveMinutes > 0 ? r.EarlyLeaveMinutes.ToString()! : "")
                            .FontSize(7.5f).FontColor("#ea580c");

                        var (stBg, stFg) = r.IsDayOff || (r.OnLeave && r.LeaveType == "DayOff") ? ("#eceaf2", Muted)
                            : r.OnLeave ? ("#fdf5e2", "#c07207")
                            : r.IsAbsent ? ("#fdeeef", "#dc2637")
                            : r.CheckInUtc.HasValue ? ("#e7f8f0", "#0e9f6e")
                            : (bg, Ink);
                        Body(stBg).AlignCenter().Text(r.StatusLabel).FontSize(7.5f).SemiBold().FontColor(stFg);
                    }

                    // Summary
                    if (rows.Count > 0)
                    {
                        IContainer Total() => table.Cell()
                            .Background("#f0edfa")
                            .BorderTop(1).BorderColor(PrimaryHex)
                            .PaddingVertical(4).PaddingHorizontal(3);

                        Total().Text("TOTAL").Bold().FontSize(7.5f).FontColor(PrimaryHex);
                        table.Cell().ColumnSpan(7).Background("#f0edfa").BorderTop(1).BorderColor(PrimaryHex);
                        Total().AlignRight().Text(rows.Sum(r => r.TotalHours).ToString("0.00")).Bold().FontSize(7.5f);
                        Total().AlignRight().Text(rows.Sum(r => r.OvertimeHours).ToString("0.00")).Bold().FontSize(7.5f).FontColor(PrimaryHex);
                        Total().AlignRight().Text(rows.Sum(r => r.LateMinutes ?? 0).ToString()).Bold().FontSize(7.5f).FontColor("#dc2637");
                        Total().AlignRight().Text(rows.Sum(r => r.EarlyLeaveMinutes ?? 0).ToString()).Bold().FontSize(7.5f).FontColor("#ea580c");
                        table.Cell().Background("#f0edfa").BorderTop(1).BorderColor(PrimaryHex);
                    }
                });

                page.Footer().Row(r =>
                {
                    r.RelativeItem().Text("ProjectX · Work Hours").FontSize(7).FontColor("#a09aaf");
                    r.AutoItem().Text(x =>
                    {
                        x.Span("Page ").FontSize(7).FontColor("#888888");
                        x.CurrentPageNumber().FontSize(7);
                        x.Span(" of ").FontSize(7);
                        x.TotalPages().FontSize(7);
                    });
                });
            });
        });

        using var ms = new MemoryStream();
        doc.GeneratePdf(ms);
        return ms.ToArray();
    }

    public static byte[] BuildPayroll(
        IReadOnlyList<PayrollReportRow> rows,
        int year, int month, string periodStatus)
    {
        var monthName = new System.Globalization.CultureInfo("en-US").DateTimeFormat.GetMonthName(month);

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(8).FontFamily("Arial"));

                page.Header().Column(col =>
                {
                    col.Item().Text($"Payroll Report — {monthName} {year}")
                        .FontSize(16).Bold().FontColor(PrimaryHex);
                    col.Item().Text($"Status: {periodStatus} · Generated: {DateTime.Now:dd.MM.yyyy HH:mm}")
                        .FontSize(9).FontColor("#555555");
                    col.Item().PaddingTop(4).LineHorizontal(1).LineColor(PrimaryHex);
                });

                page.Content().PaddingTop(8).Table(table =>
                {
                    table.ColumnsDefinition(c =>
                    {
                        c.RelativeColumn(3); // Employee
                        c.ConstantColumn(40); // No.
                        c.RelativeColumn(2); // Dept
                        c.ConstantColumn(35); // WDays
                        c.ConstantColumn(35); // WH
                        c.ConstantColumn(35); // OT
                        c.ConstantColumn(60); // Base
                        c.ConstantColumn(55); // Alw+Bon
                        c.ConstantColumn(55); // Gross
                        c.ConstantColumn(45); // Ded
                        c.ConstantColumn(45); // Tax
                        c.ConstantColumn(60); // Net
                    });

                    table.Header(h =>
                    {
                        foreach (var hdr in new[] { "Employee", "No.", "Department", "Days", "Hours",
                            "OT Hrs", "Base Pay", "Alw+Bon", "Gross", "Deduct", "Tax", "Net Pay" })
                        {
                            h.Cell().Background(PrimaryHex).Padding(3)
                                .Text(hdr).FontColor("#ffffff").Bold().FontSize(7.5f);
                        }
                    });

                    bool alt = false;
                    foreach (var r in rows)
                    {
                        string bg = alt ? "#f8f8ff" : "#ffffff";
                        alt = !alt;

                        table.Cell().Background(bg).Padding(3).Text(r.EmployeeName).FontSize(7.5f);
                        table.Cell().Background(bg).Padding(3).Text(r.EmployeeNo ?? "").FontSize(7.5f);
                        table.Cell().Background(bg).Padding(3).Text(r.Department ?? "").FontSize(7.5f);
                        table.Cell().Background(bg).Padding(3).AlignRight().Text(r.WorkedDays.ToString("0.0")).FontSize(7.5f);
                        table.Cell().Background(bg).Padding(3).AlignRight().Text(r.WorkedHours.ToString("0.0")).FontSize(7.5f);
                        table.Cell().Background(bg).Padding(3).AlignRight().Text(r.OvertimeHours.ToString("0.0")).FontSize(7.5f);
                        table.Cell().Background(bg).Padding(3).AlignRight().Text(r.BasePay.ToString("N2")).FontSize(7.5f);
                        table.Cell().Background(bg).Padding(3).AlignRight()
                            .Text((r.AllowancesTotal + r.BonusesTotal).ToString("N2")).FontSize(7.5f);
                        table.Cell().Background(bg).Padding(3).AlignRight().Text(r.GrossPay.ToString("N2")).Bold().FontSize(7.5f);
                        table.Cell().Background(bg).Padding(3).AlignRight().Text(r.DeductionsTotal.ToString("N2")).FontSize(7.5f);
                        table.Cell().Background(bg).Padding(3).AlignRight().Text(r.TaxAmount.ToString("N2")).FontSize(7.5f);
                        table.Cell().Background(bg).Padding(3).AlignRight()
                            .Text(r.NetPay.ToString("N2")).Bold().FontColor("#16a34a").FontSize(7.5f);
                    }

                    // Totals row
                    if (rows.Count > 0)
                    {
                        table.Cell().ColumnSpan(3).Background("#f0f0f0").Padding(3).Text("TOTAL").Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0").Padding(3).AlignRight()
                            .Text(rows.Sum(r => r.WorkedDays).ToString("0.0")).Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0").Padding(3).AlignRight()
                            .Text(rows.Sum(r => r.WorkedHours).ToString("0.0")).Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0").Padding(3).AlignRight()
                            .Text(rows.Sum(r => r.OvertimeHours).ToString("0.0")).Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0").Padding(3).AlignRight()
                            .Text(rows.Sum(r => r.BasePay).ToString("N2")).Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0").Padding(3).AlignRight()
                            .Text((rows.Sum(r => r.AllowancesTotal) + rows.Sum(r => r.BonusesTotal)).ToString("N2")).Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0").Padding(3).AlignRight()
                            .Text(rows.Sum(r => r.GrossPay).ToString("N2")).Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0").Padding(3).AlignRight()
                            .Text(rows.Sum(r => r.DeductionsTotal).ToString("N2")).Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0").Padding(3).AlignRight()
                            .Text(rows.Sum(r => r.TaxAmount).ToString("N2")).Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0").Padding(3).AlignRight()
                            .Text(rows.Sum(r => r.NetPay).ToString("N2")).Bold().FontColor("#16a34a").FontSize(7.5f);
                    }
                });

                page.Footer().AlignRight()
                    .Text(x =>
                    {
                        x.Span("Page ").FontSize(7).FontColor("#888888");
                        x.CurrentPageNumber().FontSize(7);
                        x.Span(" of ").FontSize(7);
                        x.TotalPages().FontSize(7);
                    });
            });
        });

        using var ms = new MemoryStream();
        doc.GeneratePdf(ms);
        return ms.ToArray();
    }

    public static byte[] BuildSchedulePlanner(
        IReadOnlyList<SchedulePlannerRow> rows, DateOnly from, DateOnly to)
    {
        var dates = new List<DateOnly>();
        for (var d = from; d <= to; d = d.AddDays(1)) dates.Add(d);

        var employees = rows.GroupBy(r => r.EmployeeName)
            .Select(g => new { Name = g.Key, Dept = g.First().Department, ByDate = g.ToDictionary(x => x.Date) })
            .OrderBy(x => x.Name).ToList();

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A3.Landscape());
                page.Margin(1f, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(7).FontFamily("Arial"));

                page.Header().Column(col =>
                {
                    col.Item().Text("Schedule Planner").FontSize(14).Bold().FontColor(PrimaryHex);
                    col.Item().Text($"Period: {from:dd.MM.yyyy} – {to:dd.MM.yyyy}").FontSize(8).FontColor("#555555");
                    col.Item().PaddingTop(4).LineHorizontal(1).LineColor(PrimaryHex);
                });

                page.Content().PaddingTop(6).Table(table =>
                {
                    table.ColumnsDefinition(c =>
                    {
                        c.ConstantColumn(110); // Employee
                        c.ConstantColumn(70);  // Department
                        foreach (var _ in dates) c.RelativeColumn(1);
                    });

                    table.Header(h =>
                    {
                        h.Cell().Background(PrimaryHex).Padding(2).Text("Employee").FontColor("#ffffff").Bold().FontSize(7);
                        h.Cell().Background(PrimaryHex).Padding(2).Text("Department").FontColor("#ffffff").Bold().FontSize(7);
                        foreach (var d in dates)
                        {
                            var isWeekend = d.DayOfWeek == DayOfWeek.Saturday || d.DayOfWeek == DayOfWeek.Sunday;
                            h.Cell().Background(isWeekend ? "#fef2f2" : PrimaryHex)
                                .Padding(2).AlignCenter().Text(d.ToString("dd"))
                                .FontColor(isWeekend ? "#dc2626" : "#ffffff").Bold().FontSize(7);
                        }
                    });

                    bool alt = false;
                    foreach (var emp in employees)
                    {
                        var rowBg = alt ? "#fafafa" : "#ffffff"; alt = !alt;
                        table.Cell().Background(rowBg).Padding(3).Text(emp.Name).Bold().FontSize(7);
                        table.Cell().Background(rowBg).Padding(3).Text(emp.Dept ?? "—").FontColor("#666666").FontSize(7);
                        foreach (var d in dates)
                        {
                            if (!emp.ByDate.TryGetValue(d, out var cellRow))
                            {
                                table.Cell().Background(rowBg).Padding(2).Text("");
                                continue;
                            }
                            if (cellRow.IsDayOff)
                            {
                                table.Cell().Background("#fee2e2").Padding(2).AlignCenter()
                                    .Text("OFF").FontColor("#dc2626").Bold().FontSize(6.5f);
                            }
                            else
                            {
                                var color = string.IsNullOrEmpty(cellRow.Color) ? "#6366f1" : cellRow.Color;
                                var sched = string.IsNullOrEmpty(cellRow.ScheduleName) ? "—" : cellRow.ScheduleName!;
                                var schedShort = sched.Length > 10 ? sched.Substring(0, 10) + "…" : sched;
                                var times = (cellRow.ShiftStart is null && cellRow.ShiftEnd is null)
                                    ? (cellRow.ScheduleType ?? "")
                                    : $"{cellRow.ShiftStart ?? "—"}-{cellRow.ShiftEnd ?? "—"}";
                                string bg;
                                try { bg = color + "22"; } catch { bg = rowBg; }
                                table.Cell().Background(bg).Padding(2).Column(col =>
                                {
                                    col.Item().AlignCenter().Text(schedShort).FontColor(color).Bold().FontSize(6.5f);
                                    if (!string.IsNullOrEmpty(times))
                                        col.Item().AlignCenter().Text(times).FontColor(color).FontSize(6);
                                });
                            }
                        }
                    }
                });

                page.Footer().AlignRight().Text(x =>
                {
                    x.Span("Page ").FontSize(7).FontColor("#888888");
                    x.CurrentPageNumber().FontSize(7);
                    x.Span(" of ").FontSize(7);
                    x.TotalPages().FontSize(7);
                });
            });
        });

        using var ms = new MemoryStream();
        doc.GeneratePdf(ms);
        return ms.ToArray();
    }

    // Светлый фон из hex-цвета критерия (аналог #RRGGBB22 в UI).
    static string TabelTintHex(string hex)
    {
        try
        {
            var c = System.Drawing.ColorTranslator.FromHtml(hex);
            static int Mix(int ch) => ch + (int)((255 - ch) * 0.85);
            return $"#{Mix(c.R):X2}{Mix(c.G):X2}{Mix(c.B):X2}";
        }
        catch { return "#ffffff"; }
    }

    public static byte[] BuildMonthlyTabel(
        IReadOnlyList<MonthlyTabelRow> rows,
        int year, int month,
        IReadOnlyDictionary<string, TabelCritStyle> crit)
    {
        int daysInMonth = DateTime.DaysInMonth(year, month);

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A3.Landscape());
                page.Margin(1.0f, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(7).FontFamily("Arial"));

                page.Header().Column(col =>
                {
                    col.Item().Text("İş vaxtının aylıq uçotu — Tabel")
                        .FontSize(14).Bold().FontColor(PrimaryHex);
                    col.Item().Text($"Dövr: {year:D4}-{month:D2}")
                        .FontSize(9).FontColor("#555555");
                    col.Item().PaddingTop(4).LineHorizontal(1).LineColor(PrimaryHex);
                });

                page.Content().PaddingTop(8).Column(content =>
                {
                    content.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.ConstantColumn(20);  // S/S
                            c.ConstantColumn(44);  // Tab №
                            c.RelativeColumn(4);   // Name
                            c.RelativeColumn(2);   // Position
                            c.RelativeColumn(2);   // Department
                            for (int d = 0; d < daysInMonth; d++) c.ConstantColumn(19);
                            c.ConstantColumn(30);  // Cəmi gün
                            c.ConstantColumn(32);  // Cəmi saat
                            c.ConstantColumn(30);  // Əlavə gün
                            c.ConstantColumn(32);  // Əlavə saat
                        });

                        table.Header(h =>
                        {
                            void Head(string txt, string bg = "#6e56cf")
                                => h.Cell().Background(bg).Padding(2).AlignCenter()
                                    .Text(txt).FontColor("#ffffff").Bold().FontSize(6.5f);
                            Head("S/S"); Head("Tab.№"); Head("Soyadı, adı, atasının adı"); Head("Vəzifəsi"); Head("Şöbə");
                            for (int d = 1; d <= daysInMonth; d++)
                            {
                                var dow = new DateTime(year, month, d).DayOfWeek;
                                Head(d.ToString(), dow == DayOfWeek.Saturday || dow == DayOfWeek.Sunday ? "#8e77e8" : "#6e56cf");
                            }
                            Head("C.gün"); Head("C.saat"); Head("Ə.gün"); Head("Ə.saat");
                        });

                        bool alt = false;
                        int idx = 1;
                        foreach (var r in rows)
                        {
                            string bg = alt ? "#f8f8ff" : "#ffffff";
                            alt = !alt;
                            table.Cell().Background(bg).Padding(2).AlignCenter().Text(idx++.ToString()).FontSize(6.5f);
                            table.Cell().Background(bg).Padding(2).Text(r.ExternalId).FontSize(6.5f);
                            table.Cell().Background(bg).Padding(2).Text(r.Fullname).FontSize(6.5f);
                            table.Cell().Background(bg).Padding(2).Text(r.Position).FontSize(6.5f);
                            table.Cell().Background(bg).Padding(2).Text(r.Department).FontSize(6.5f);
                            for (int d = 1; d <= daysInMonth; d++)
                            {
                                if (!r.Days.TryGetValue(d, out var dayCell))
                                {
                                    table.Cell().Background(bg).Padding(2).Text("");
                                    continue;
                                }
                                crit.TryGetValue(dayCell.Key, out var cs);
                                var color = cs?.Color ?? "#6B7280";
                                var letter = cs?.Letter ?? "";
                                var mode = cs?.DisplayMode == "hours" ? "hours" : "letter";
                                var text = mode == "hours"
                                    ? (dayCell.Hours > 0 ? dayCell.Hours.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture) : letter)
                                    : (letter.Length > 0 ? letter : (dayCell.Hours > 0 ? dayCell.Hours.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture) : ""));
                                table.Cell().Background(TabelTintHex(color)).Padding(2).AlignCenter()
                                    .Text(text).FontColor(color).Bold().FontSize(6.5f);
                            }
                            table.Cell().Background(bg).Padding(2).AlignCenter().Text(r.TotalDays.ToString()).FontSize(6.5f);
                            table.Cell().Background(bg).Padding(2).AlignCenter().Text(r.TotalHours.ToString()).Bold().FontSize(6.5f);
                            table.Cell().Background(bg).Padding(2).AlignCenter().Text(r.ExtraDays.ToString()).FontSize(6.5f);
                            table.Cell().Background(bg).Padding(2).AlignCenter().Text(r.ExtraHours.ToString()).FontSize(6.5f);
                        }
                    });

                    // Легенда критериев.
                    content.Item().PaddingTop(10).Row(rowc =>
                    {
                        rowc.AutoItem().Text("Kodların izahı:  ").Bold().FontSize(7);
                        foreach (var c in crit.Values.Where(c => c.Enabled).OrderBy(c => c.Key))
                        {
                            rowc.AutoItem().PaddingRight(10).Text(t =>
                            {
                                t.Span((c.Letter.Length > 0 ? c.Letter : "S") + " ").FontColor(c.Color).Bold().FontSize(7);
                                t.Span(c.Label + (c.DisplayMode == "hours" ? " (saat)" : "")).FontSize(7).FontColor("#555555");
                            });
                        }
                    });
                });

                page.Footer().AlignRight().Text(x =>
                {
                    x.Span("Page ").FontSize(7).FontColor("#888888");
                    x.CurrentPageNumber().FontSize(7);
                    x.Span(" of ").FontSize(7);
                    x.TotalPages().FontSize(7);
                });
            });
        });

        using var ms = new MemoryStream();
        doc.GeneratePdf(ms);
        return ms.ToArray();
    }
}
