using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ChangeDayPatternToDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_employee_day_patterns_EmployeeId_DayOfWeek",
                table: "employee_day_patterns");

            migrationBuilder.DropColumn(
                name: "DayOfWeek",
                table: "employee_day_patterns");

            migrationBuilder.AddColumn<DateOnly>(
                name: "Date",
                table: "employee_day_patterns",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.CreateIndex(
                name: "IX_employee_day_patterns_EmployeeId_Date",
                table: "employee_day_patterns",
                columns: new[] { "EmployeeId", "Date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_employee_day_patterns_EmployeeId_Date",
                table: "employee_day_patterns");

            migrationBuilder.DropColumn(
                name: "Date",
                table: "employee_day_patterns");

            migrationBuilder.AddColumn<int>(
                name: "DayOfWeek",
                table: "employee_day_patterns",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_employee_day_patterns_EmployeeId_DayOfWeek",
                table: "employee_day_patterns",
                columns: new[] { "EmployeeId", "DayOfWeek" },
                unique: true);
        }
    }
}
