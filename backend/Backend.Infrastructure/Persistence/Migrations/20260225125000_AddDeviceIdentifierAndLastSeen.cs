using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public class AddDeviceIdentifierAndLastSeen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeviceIdentifier",
                table: "devices",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSeenUtc",
                table: "devices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("UPDATE devices SET \"DeviceIdentifier\" = CONCAT('device-', REPLACE(CAST(\"Id\" AS text), '-', '')) WHERE \"DeviceIdentifier\" = '';");

            migrationBuilder.CreateIndex(
                name: "IX_devices_DeviceIdentifier",
                table: "devices",
                column: "DeviceIdentifier",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_devices_DeviceIdentifier",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "DeviceIdentifier",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "LastSeenUtc",
                table: "devices");
        }
    }
}
