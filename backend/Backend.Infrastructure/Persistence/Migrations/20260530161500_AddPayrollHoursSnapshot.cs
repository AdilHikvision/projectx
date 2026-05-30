using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPayrollHoursSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_payroll_periods_Year_Month",
                table: "payroll_periods");

            migrationBuilder.AddColumn<DateTime>(
                name: "HoursConfirmedAt",
                table: "payroll_periods",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LatenessMinutes",
                table: "payroll_entries",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "TotalWorkingDays",
                table: "payroll_entries",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HoursConfirmedAt",
                table: "payroll_periods");

            migrationBuilder.DropColumn(
                name: "LatenessMinutes",
                table: "payroll_entries");

            migrationBuilder.DropColumn(
                name: "TotalWorkingDays",
                table: "payroll_entries");

            migrationBuilder.CreateIndex(
                name: "IX_payroll_periods_Year_Month",
                table: "payroll_periods",
                columns: new[] { "Year", "Month" },
                unique: true);
        }
    }
}
