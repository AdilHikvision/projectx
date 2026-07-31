using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddParkingAccessLogic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "parking_plates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Plate = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PlateNormalized = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ListType = table.Column<int>(type: "integer", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parking_plates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "parking_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Plate = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PlateNormalized = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ZoneId = table.Column<Guid>(type: "uuid", nullable: true),
                    SpaceType = table.Column<int>(type: "integer", nullable: false),
                    EnteredUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExitedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsPaid = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parking_sessions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_parking_plates_PlateNormalized_ListType",
                table: "parking_plates",
                columns: new[] { "PlateNormalized", "ListType" });

            migrationBuilder.CreateIndex(
                name: "IX_parking_sessions_PlateNormalized",
                table: "parking_sessions",
                column: "PlateNormalized");

            migrationBuilder.CreateIndex(
                name: "IX_parking_sessions_ZoneId_ExitedUtc",
                table: "parking_sessions",
                columns: new[] { "ZoneId", "ExitedUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "parking_plates");

            migrationBuilder.DropTable(
                name: "parking_sessions");
        }
    }
}
