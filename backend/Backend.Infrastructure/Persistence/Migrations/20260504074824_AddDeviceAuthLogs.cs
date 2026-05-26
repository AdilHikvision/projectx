using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceAuthLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "device_auth_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceId = table.Column<Guid>(type: "uuid", nullable: true),
                    EmployeeNoString = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EventTimeUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Major = table.Column<int>(type: "integer", nullable: false),
                    Minor = table.Column<int>(type: "integer", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_device_auth_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_device_auth_logs_devices_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "devices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_device_auth_logs_DeviceId_EmployeeNoString_EventTimeUtc",
                table: "device_auth_logs",
                columns: new[] { "DeviceId", "EmployeeNoString", "EventTimeUtc" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_device_auth_logs_EmployeeNoString",
                table: "device_auth_logs",
                column: "EmployeeNoString");

            migrationBuilder.CreateIndex(
                name: "IX_device_auth_logs_EventTimeUtc",
                table: "device_auth_logs",
                column: "EventTimeUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "device_auth_logs");
        }
    }
}
