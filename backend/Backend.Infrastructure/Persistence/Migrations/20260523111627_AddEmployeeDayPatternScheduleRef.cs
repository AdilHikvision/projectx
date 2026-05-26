using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeDayPatternScheduleRef : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShiftEnd",
                table: "employee_day_patterns");

            migrationBuilder.DropColumn(
                name: "ShiftStart",
                table: "employee_day_patterns");

            migrationBuilder.AddColumn<Guid>(
                name: "WorkScheduleId",
                table: "employee_day_patterns",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_employee_day_patterns_WorkScheduleId",
                table: "employee_day_patterns",
                column: "WorkScheduleId");

            migrationBuilder.AddForeignKey(
                name: "FK_employee_day_patterns_work_schedules_WorkScheduleId",
                table: "employee_day_patterns",
                column: "WorkScheduleId",
                principalTable: "work_schedules",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_employee_day_patterns_work_schedules_WorkScheduleId",
                table: "employee_day_patterns");

            migrationBuilder.DropIndex(
                name: "IX_employee_day_patterns_WorkScheduleId",
                table: "employee_day_patterns");

            migrationBuilder.DropColumn(
                name: "WorkScheduleId",
                table: "employee_day_patterns");

            migrationBuilder.AddColumn<TimeSpan>(
                name: "ShiftEnd",
                table: "employee_day_patterns",
                type: "interval",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "ShiftStart",
                table: "employee_day_patterns",
                type: "interval",
                nullable: true);
        }
    }
}
