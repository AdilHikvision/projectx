using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MoveOvertimeThresholdToSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OvertimeDailyThresholdMinutes",
                table: "employee_salary_configs");

            migrationBuilder.AddColumn<int>(
                name: "OvertimeDailyThresholdMinutes",
                table: "work_schedules",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OvertimeDailyThresholdMinutes",
                table: "work_schedules");

            migrationBuilder.AddColumn<int>(
                name: "OvertimeDailyThresholdMinutes",
                table: "employee_salary_configs",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
