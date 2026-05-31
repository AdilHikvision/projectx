using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGymTariffs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "gym_tariffs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Kind = table.Column<int>(type: "integer", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "AZN"),
                    DurationType = table.Column<int>(type: "integer", nullable: false),
                    DurationCount = table.Column<int>(type: "integer", nullable: false),
                    VisitLimit = table.Column<int>(type: "integer", nullable: true),
                    HasTimeRestriction = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFrom = table.Column<TimeSpan>(type: "interval", nullable: true),
                    AccessTo = table.Column<TimeSpan>(type: "interval", nullable: true),
                    DaysOfWeekMask = table.Column<int>(type: "integer", nullable: false),
                    AutoRenew = table.Column<bool>(type: "boolean", nullable: false),
                    FreezeAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    FreezeMaxDays = table.Column<int>(type: "integer", nullable: false),
                    TransferAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_tariffs", x => x.Id);
                });

            // NOTE: role_permissions is created idempotently via raw SQL in DatabaseInitializer
            // (CREATE TABLE IF NOT EXISTS) and is not owned by migrations. EF added it here only
            // because it was missing from the snapshot; recreating it would fail on existing DBs,
            // so we intentionally only create gym_tariffs. The snapshot still records the entity.

            migrationBuilder.CreateIndex(
                name: "IX_gym_tariffs_IsActive",
                table: "gym_tariffs",
                column: "IsActive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "gym_tariffs");
        }
    }
}
