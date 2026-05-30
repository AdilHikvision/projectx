using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEarlyLeaveDeduction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EarlyLeaveDaysCount",
                table: "payroll_entries",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "EarlyLeaveMinutes",
                table: "payroll_entries",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "EarlyLeaveDeductionEnabled",
                table: "employee_salary_configs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "EarlyLeaveDeductionMode",
                table: "employee_salary_configs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EarlyLeaveTiersJson",
                table: "employee_salary_configs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EarlyLeaveDaysCount",
                table: "payroll_entries");

            migrationBuilder.DropColumn(
                name: "EarlyLeaveMinutes",
                table: "payroll_entries");

            migrationBuilder.DropColumn(
                name: "EarlyLeaveDeductionEnabled",
                table: "employee_salary_configs");

            migrationBuilder.DropColumn(
                name: "EarlyLeaveDeductionMode",
                table: "employee_salary_configs");

            migrationBuilder.DropColumn(
                name: "EarlyLeaveTiersJson",
                table: "employee_salary_configs");
        }
    }
}
