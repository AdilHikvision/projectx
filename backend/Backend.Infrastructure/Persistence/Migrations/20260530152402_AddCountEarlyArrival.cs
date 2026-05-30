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

            migrationBuilder.CreateTable(
                name: "work_schedule_shifts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkScheduleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ShiftStart = table.Column<TimeSpan>(type: "interval", nullable: false),
                    ShiftEnd = table.Column<TimeSpan>(type: "interval", nullable: false),
                    ValidEntryFrom = table.Column<TimeSpan>(type: "interval", nullable: false),
                    ValidEntryTo = table.Column<TimeSpan>(type: "interval", nullable: false),
                    RequiredHoursPerDay = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_work_schedule_shifts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_work_schedule_shifts_work_schedules_WorkScheduleId",
                        column: x => x.WorkScheduleId,
                        principalTable: "work_schedules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_work_schedule_shifts_WorkScheduleId",
                table: "work_schedule_shifts",
                column: "WorkScheduleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "work_schedule_shifts");

            migrationBuilder.DropColumn(
                name: "CountEarlyArrival",
                table: "work_schedules");
        }
    }
}
