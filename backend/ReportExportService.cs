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
    bool Corrected);

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
            "Check In", "Check Out", "Hours", "Late (min)", "Corrected"];
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
            ws.Cell(row, 10).Value = r.LateMinutes.HasValue ? (int?)r.LateMinutes : null;
            ws.Cell(row, 11).Value = r.Corrected ? "Yes" : "";
            if (r.LateMinutes > 0)
                ws.Cell(row, 10).Style.Font.FontColor = XLColor.Red;
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
                        c.ConstantColumn(60); // Date
                        c.RelativeColumn(2); // Schedule
                        c.ConstantColumn(45); // Shift S
                        c.ConstantColumn(45); // Shift E
                        c.ConstantColumn(45); // In
                        c.ConstantColumn(45); // Out
                        c.ConstantColumn(40); // Hours
                        c.ConstantColumn(40); // Late
                    });

                    table.Header(h =>
                    {
                        foreach (var hdr in new[] { "Employee", "Department", "Date", "Schedule",
                            "Shift S", "Shift E", "In", "Out", "Hours", "Late" })
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
                            .Text(r.LateMinutes.HasValue ? r.LateMinutes.ToString()! : "")
                            .FontSize(7.5f).FontColor(isLate ? "#dc2626" : textColor);
                    }

                    // Summary
                    if (rows.Count > 0)
                    {
                        table.Cell().ColumnSpan(8).Background("#f0f0f0").Padding(3)
                            .Text("TOTAL").Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0").Padding(3)
                            .Text(rows.Sum(r => r.TotalHours).ToString("0.00")).Bold().FontSize(7.5f);
                        table.Cell().Background("#f0f0f0");
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
}
