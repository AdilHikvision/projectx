using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddParkingResidents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "parking_residents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Unit = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parking_residents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "parking_vehicles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResidentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Plate = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PlateNormalized = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Brand = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    Color = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parking_vehicles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_parking_vehicles_parking_residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "parking_residents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "parking_permits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    ZoneId = table.Column<Guid>(type: "uuid", nullable: true),
                    ValidFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    ValidTo = table.Column<DateOnly>(type: "date", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parking_permits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_parking_permits_parking_vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "parking_vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_parking_permits_parking_zones_ZoneId",
                        column: x => x.ZoneId,
                        principalTable: "parking_zones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_parking_permits_VehicleId",
                table: "parking_permits",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_parking_permits_ZoneId",
                table: "parking_permits",
                column: "ZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_parking_residents_IsActive",
                table: "parking_residents",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_parking_vehicles_PlateNormalized",
                table: "parking_vehicles",
                column: "PlateNormalized");

            migrationBuilder.CreateIndex(
                name: "IX_parking_vehicles_ResidentId",
                table: "parking_vehicles",
                column: "ResidentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "parking_permits");

            migrationBuilder.DropTable(
                name: "parking_vehicles");

            migrationBuilder.DropTable(
                name: "parking_residents");
        }
    }
}
