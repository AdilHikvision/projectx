using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGymMemberships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "gym_memberships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    TariffId = table.Column<Guid>(type: "uuid", nullable: true),
                    TariffName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "AZN"),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    VisitLimit = table.Column<int>(type: "integer", nullable: true),
                    VisitsUsed = table.Column<int>(type: "integer", nullable: false),
                    HasTimeRestriction = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFrom = table.Column<TimeSpan>(type: "interval", nullable: true),
                    AccessTo = table.Column<TimeSpan>(type: "interval", nullable: true),
                    DaysOfWeekMask = table.Column<int>(type: "integer", nullable: false),
                    FreezeAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    FreezeMaxDays = table.Column<int>(type: "integer", nullable: false),
                    TransferAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_memberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_gym_memberships_gym_customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "gym_customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_gym_memberships_gym_tariffs_TariffId",
                        column: x => x.TariffId,
                        principalTable: "gym_tariffs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_gym_memberships_CustomerId",
                table: "gym_memberships",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_memberships_TariffId",
                table: "gym_memberships",
                column: "TariffId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "gym_memberships");
        }
    }
}
