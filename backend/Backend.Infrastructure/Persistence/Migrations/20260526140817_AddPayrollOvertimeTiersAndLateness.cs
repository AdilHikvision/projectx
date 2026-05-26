using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPayrollOvertimeTiersAndLateness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "LatenessDeductionEnabled",
                table: "employee_salary_configs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LatenessTiersJson",
                table: "employee_salary_configs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "OvertimeEnabled",
                table: "employee_salary_configs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OvertimeTiersJson",
                table: "employee_salary_configs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PayByWorkedHours",
                table: "employee_salary_configs",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LatenessDeductionEnabled",
                table: "employee_salary_configs");

            migrationBuilder.DropColumn(
                name: "LatenessTiersJson",
                table: "employee_salary_configs");

            migrationBuilder.DropColumn(
                name: "OvertimeEnabled",
                table: "employee_salary_configs");

            migrationBuilder.DropColumn(
                name: "OvertimeTiersJson",
                table: "employee_salary_configs");

            migrationBuilder.DropColumn(
                name: "PayByWorkedHours",
                table: "employee_salary_configs");
        }
    }
}
