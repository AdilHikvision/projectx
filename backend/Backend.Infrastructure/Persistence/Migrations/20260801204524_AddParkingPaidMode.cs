using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddParkingPaidMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Company",
                table: "parking_vehicles",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "parking_vehicles",
                type: "character varying(8)",
                maxLength: 8,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "parking_vehicles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VehicleType",
                table: "parking_vehicles",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CameraName",
                table: "parking_sessions",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Cost",
                table: "parking_sessions",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Operator",
                table: "parking_sessions",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaidUtc",
                table: "parking_sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "parking_sessions",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "parking_sessions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "RecognitionConfidence",
                table: "parking_sessions",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TariffId",
                table: "parking_sessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "parking_plates",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TimeLimitMinutes",
                table: "parking_plates",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "ValidTo",
                table: "parking_plates",
                type: "date",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "parking_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Plate = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Source = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parking_events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "parking_subscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Plate = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PlateNormalized = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EntriesLimit = table.Column<int>(type: "integer", nullable: true),
                    EntriesUsed = table.Column<int>(type: "integer", nullable: false),
                    Unlimited = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parking_subscriptions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "parking_tariffs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Kind = table.Column<int>(type: "integer", nullable: false),
                    FreeMinutes = table.Column<int>(type: "integer", nullable: false),
                    PricePerHour = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    PricePerDay = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    FixedPrice = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    MaxPerDay = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    NightPricePerHour = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    NightFrom = table.Column<TimeSpan>(type: "interval", nullable: true),
                    NightTo = table.Column<TimeSpan>(type: "interval", nullable: true),
                    WeekendPricePerHour = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parking_tariffs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_parking_sessions_EnteredUtc",
                table: "parking_sessions",
                column: "EnteredUtc");

            migrationBuilder.CreateIndex(
                name: "IX_parking_events_CreatedUtc",
                table: "parking_events",
                column: "CreatedUtc");

            migrationBuilder.CreateIndex(
                name: "IX_parking_events_Type",
                table: "parking_events",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_parking_subscriptions_PlateNormalized",
                table: "parking_subscriptions",
                column: "PlateNormalized");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "parking_events");

            migrationBuilder.DropTable(
                name: "parking_subscriptions");

            migrationBuilder.DropTable(
                name: "parking_tariffs");

            migrationBuilder.DropIndex(
                name: "IX_parking_sessions_EnteredUtc",
                table: "parking_sessions");

            migrationBuilder.DropColumn(
                name: "Company",
                table: "parking_vehicles");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "parking_vehicles");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "parking_vehicles");

            migrationBuilder.DropColumn(
                name: "VehicleType",
                table: "parking_vehicles");

            migrationBuilder.DropColumn(
                name: "CameraName",
                table: "parking_sessions");

            migrationBuilder.DropColumn(
                name: "Cost",
                table: "parking_sessions");

            migrationBuilder.DropColumn(
                name: "Operator",
                table: "parking_sessions");

            migrationBuilder.DropColumn(
                name: "PaidUtc",
                table: "parking_sessions");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "parking_sessions");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "parking_sessions");

            migrationBuilder.DropColumn(
                name: "RecognitionConfidence",
                table: "parking_sessions");

            migrationBuilder.DropColumn(
                name: "TariffId",
                table: "parking_sessions");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "parking_plates");

            migrationBuilder.DropColumn(
                name: "TimeLimitMinutes",
                table: "parking_plates");

            migrationBuilder.DropColumn(
                name: "ValidTo",
                table: "parking_plates");
        }
    }
}
