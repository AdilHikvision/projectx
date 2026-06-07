using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCountEarlyArrival : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CountEarlyArrival",
                table: "work_schedules",
                type: "boolean",
                nullable: false,
                defaultValue: false);
            // NOTE: work_schedule_shifts is created by the earlier
            // 20260529180000_AddWorkScheduleShifts migration. It must NOT be
            // re-created here — doing so breaks a from-scratch migrate with
            // "42P07: relation already exists".
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CountEarlyArrival",
                table: "work_schedules");
        }
    }
}
