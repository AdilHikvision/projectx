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
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Work Hours");

        // Title
        ws.Cell("A1").Value = "Work Hours Report";
        ws.Cell("A1").Style.Font.Bold = true;
        ws.Cell("A1").Style.Font.FontSize = 14;
        ws.Cell("A2").Value = $"Period: {from:dd.MM.yyyy} – {to:dd.MM.yyyy}";
        if (!string.IsNullOrWhiteSpace(employeeFilter))
            ws.Cell("A3").Value = $"Employee: {employeeFilter}";

        // Headers
        int headerRow = 5;
        string[] headers = ["Employee", "Department", "Date", "Schedule", "Shift Start", "Shift End",
            "Check In", "Check Out", "Hours", "Overtime", "Late (min)", "Early (min)", "Status", "Corrected"];
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(headerRow, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#4f46e5");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        // Data
        int row = headerRow + 1;
        foreach (var r in rows)
        {
            ws.Cell(row, 1).Value = r.EmployeeName;
            ws.Cell(row, 2).Value = r.Department ?? "";
            ws.Cell(row, 3).Value = r.Date.ToString("dd.MM.yyyy");
            ws.Cell(row, 4).Value = r.ScheduleName ?? "";
            ws.Cell(row, 5).Value = r.ShiftStart ?? "";
            ws.Cell(row, 6).Value = r.ShiftEnd ?? "";
            ws.Cell(row, 7).Value = r.CheckInUtc.HasValue
                ? TimeZoneInfo.ConvertTimeFromUtc(r.CheckInUtc.Value, TimeZoneInfo.Local).ToString("HH:mm") : "";
            ws.Cell(row, 8).Value = r.CheckOutUtc.HasValue
                ? TimeZoneInfo.ConvertTimeFromUtc(r.CheckOutUtc.Value, TimeZoneInfo.Local).ToString("HH:mm") : "";
            ws.Cell(row, 9).Value = r.TotalHours;
            ws.Cell(row, 9).Style.NumberFormat.Format = "0.00";
            ws.Cell(row, 10).Value = r.OvertimeHours > 0 ? (double?)r.OvertimeHours : null;
            ws.Cell(row, 10).Style.NumberFormat.Format = "0.00";
            ws.Cell(row, 11).Value = r.LateMinutes.HasValue ? (int?)r.LateMinutes : null;
            if (r.LateMinutes > 0)
                ws.Cell(row, 11).Style.Font.FontColor = XLColor.Red;
            ws.Cell(row, 12).Value = r.EarlyLeaveMinutes.HasValue ? (int?)r.EarlyLeaveMinutes : null;
            if (r.EarlyLeaveMinutes > 0)
                ws.Cell(row, 12).Style.Font.FontColor = XLColor.FromHtml("#ea580c");
            ws.Cell(row, 13).Value = r.StatusLabel;
            ws.Cell(row, 14).Value = r.Corrected ? "Yes" : "";
            row++;
        }

        // Summary row
        if (rows.Count > 0)
        {
            ws.Cell(row, 1).Value = "TOTAL";
            ws.Cell(row, 1).Style.Font.Bold = true;
            ws.Cell(row, 9).Value = rows.Sum(r => r.TotalHours);
            ws.Cell(row, 9).Style.NumberFormat.Format = "0.00";
            ws.Cell(row, 9).Style.Font.Bold = true;
            ws.Cell(row, 10).Value = rows.Sum(r => r.OvertimeHours);
            ws.Cell(row, 10).Style.NumberFormat.Format = "0.00";
            ws.Cell(row, 10).Style.Font.Bold = true;
            ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromHtml("#f0f0f0");
        }

        ws.Columns().AdjustToContents();
        ws.Column(7).Width = 12;
        ws.Column(8).Width = 12;

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
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#4f46e5");
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
            c.Style.Fill.BackgroundColor = isWeekend ? XLColor.FromHtml("#fef2f2") : XLColor.FromHtml("#4f46e5");
            c.Style.Font.Bold = true;
            c.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }
        ws.Cell(headerRow, 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#4f46e5");
        ws.Cell(headerRow, 1).Style.Font.FontColor = XLColor.White;
        ws.Cell(headerRow, 1).Style.Font.Bold = true;
        ws.Cell(headerRow, 2).Style.Fill.BackgroundColor = XLColor.FromHtml("#4f46e5");
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
}

// ── PDF helpers ───────────────────────────────────────────────────────────────

public static class PdfReportBuilder
{
    static readonly string PrimaryHex = "#4f46e5";

    public static byte[] BuildAttendance(
        IReadOnlyList<AttendancePeriodRow> rows,
        DateTime from, DateTime to, string? employeeFilter)
    {
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(8).FontFamily("Arial"));

                page.Header().Column(col =>
                {
                    col.Item().Text("Work Hours Report")
                        .FontSize(16).Bold().FontColor(PrimaryHex);
                    col.Item().Text($"Period: {from:dd.MM.yyyy} – {to:dd.MM.yyyy}")
                        .FontSize(9).FontColor("#555555");
                    if (!string.IsNullOrWhiteSpace(employeeFilter))
                        col.Item().Text($"Employee: {employeeFilter}").FontSize(9);
                    col.Item().PaddingTop(4).LineHorizontal(1).LineColor(PrimaryHex);
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
                            h.Cell().Background(PrimaryHex).Padding(3)
                                .Text(hdr).FontColor("#ffffff").Bold().FontSize(7.5f);
                        }
                    });

                    bool alt = false;
                    foreach (var r in rows)
                    {
                        string bg = alt ? "#f8f8ff" : "#ffffff";
                        alt = !alt;
                        bool isLate = r.LateMinutes > 0;
                        string textColor = "#1a1a2e";

                        table.Cell().Background(bg).Padding(3).Text(r.EmployeeName).FontSize(7.5f).FontColor(textColor);
                        table.Cell().Background(bg).Padding(3).Text(r.Department ?? "").FontSize(7.5f).FontColor(textColor);
                        table.Cell().Background(bg).Padding(3).Text(r.Date.ToString("dd.MM.yy")).FontSize(7.5f).FontColor(textColor);
                        table.Cell().Background(bg).Padding(3).Text(r.ScheduleName ?? "").FontSize(7.5f).FontColor(textColor);
                        table.Cell().Background(bg).Padding(3).Text(r.ShiftStart ?? "").FontSize(7.5f).FontColor(textColor);
                        table.Cell().Background(bg).Padding(3).Text(r.ShiftEnd ?? "").FontSize(7.5f).FontColor(textColor);
                        table.Cell().Background(bg).Padding(3)
                            .Text(r.CheckInUtc.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(r.CheckInUtc.Value, TimeZoneInfo.Local).ToString("HH:mm") : "")
                            .FontSize(7.5f).FontColor(textColor);
                        table.Cell().Background(bg).Padding(3)
                            .Text(r.CheckOutUtc.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(r.CheckOutUtc.Value, TimeZoneInfo.Local).ToString("HH:mm") : "")
                            .FontSize(7.5f).FontColor(textColor);
                        table.Cell().Background(bg).Padding(3).Text(r.TotalHours.ToString("0.00")).FontSize(7.5f).Bold().FontColor(textColor);
                        table.Cell().Background(bg).Padding(3)
                            .Text(r.OvertimeHours > 0 ? r.OvertimeHours.ToString("0.00") : "")
                            .FontSize(7.5f).FontColor("#7c3aed");
                        table.Cell().Background(bg).Padding(3)
                            .Text(r.LateMinutes.HasValue ? r.LateMinutes.ToString()! : "")
                            .FontSize(7.5f).FontColor(isLate ? "#dc2626" : textColor);
                        table.Cell().Background(bg).Padding(3)
                            .Text(r.EarlyLeaveMinutes.HasValue ? r.EarlyLeaveMinutes.ToString()! : "")
                            .FontSize(7.5f).FontColor(r.EarlyLeaveMinutes > 0 ? "#ea580c" : textColor);
                        table.Cell().Background(bg).Padding(3)
                            .Text(r.StatusLabel).FontSize(7.5f).FontColor(textColor);
                    }

                    // Summary
                    if (rows.Count > 0)
                    {
                        table.Cell().ColumnSpan(8).Background("#f0f0f0").Padding(3)
                            .Text("TOTAL").Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0").Padding(3)
                            .Text(rows.Sum(r => r.TotalHours).ToString("0.00")).Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0").Padding(3)
                            .Text(rows.Sum(r => r.OvertimeHours).ToString("0.00")).Bold().FontSize(7.5f);
                        table.Cell().ColumnSpan(3).Background("#f0f0f0");
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
}
