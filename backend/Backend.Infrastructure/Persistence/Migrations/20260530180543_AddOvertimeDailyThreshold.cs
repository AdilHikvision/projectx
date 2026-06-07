using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOvertimeDailyThreshold : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OvertimeDailyThresholdMinutes",
                table: "employee_salary_configs",
                type: "integer",
                nullable: false,
                defaultValue: 0);
            // NOTE: audit_logs is created by the earlier
            // 20260530180431_AddAuditLogs migration. It must NOT be re-created
            // here — doing so breaks a from-scratch migrate with
            // "42P07: relation already exists".
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OvertimeDailyThresholdMinutes",
                table: "employee_salary_configs");
        }
    }
}
