using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTimeAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SelfServiceEmail",
                table: "employees",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SelfServiceEnabled",
                table: "employees",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "WorkScheduleId",
                table: "employees",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EmployeeId",
                table: "AspNetUsers",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "attendance_records",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventTimeUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EventType = table.Column<int>(type: "integer", nullable: false),
                    DeviceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Source = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_attendance_records", x => x.Id);
                    table.ForeignKey(
                        name: "FK_attendance_records_employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "attendance_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    RequestedTimeUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RequestedEndTimeUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ReviewedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReviewedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewComment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_attendance_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_attendance_requests_employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "work_schedules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    ShiftStart = table.Column<TimeSpan>(type: "interval", nullable: true),
                    ShiftEnd = table.Column<TimeSpan>(type: "interval", nullable: true),
                    RequiredHoursPerDay = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_work_schedules", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_employees_SelfServiceEmail",
                table: "employees",
                column: "SelfServiceEmail",
                unique: true,
                filter: "\"SelfServiceEmail\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_employees_WorkScheduleId",
                table: "employees",
                column: "WorkScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_attendance_records_EmployeeId_EventTimeUtc",
                table: "attendance_records",
                columns: new[] { "EmployeeId", "EventTimeUtc" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_attendance_requests_EmployeeId",
                table: "attendance_requests",
                column: "EmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_employees_work_schedules_WorkScheduleId",
                table: "employees",
                column: "WorkScheduleId",
                principalTable: "work_schedules",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_departments_companies_CompanyId",
                table: "departments");

            migrationBuilder.DropForeignKey(
                name: "FK_employees_companies_CompanyId",
                table: "employees");

            migrationBuilder.DropForeignKey(
                name: "FK_employees_work_schedules_WorkScheduleId",
                table: "employees");

            migrationBuilder.DropForeignKey(
                name: "FK_visitors_companies_CompanyId",
                table: "visitors");

            migrationBuilder.DropTable(
                name: "attendance_records");

            migrationBuilder.DropTable(
                name: "attendance_requests");

            migrationBuilder.DropTable(
                name: "companies");

            migrationBuilder.DropTable(
                name: "system_settings");

            migrationBuilder.DropTable(
                name: "work_schedules");

            migrationBuilder.DropIndex(
                name: "IX_visitors_CompanyId",
                table: "visitors");

            migrationBuilder.DropIndex(
                name: "IX_employees_CompanyId",
                table: "employees");

            migrationBuilder.DropIndex(
                name: "IX_employees_SelfServiceEmail",
                table: "employees");

            migrationBuilder.DropIndex(
                name: "IX_employees_WorkScheduleId",
                table: "employees");

            migrationBuilder.DropIndex(
                name: "IX_departments_CompanyId",
                table: "departments");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "visitors");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "SelfServiceEmail",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "SelfServiceEnabled",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "WorkScheduleId",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "departments");

            migrationBuilder.DropColumn(
                name: "EmployeeId",
                table: "AspNetUsers");
        }
    }
}
