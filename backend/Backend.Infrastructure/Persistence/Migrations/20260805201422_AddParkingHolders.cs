using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddParkingHolders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "HolderId",
                table: "parking_plates",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "parking_holders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Unit = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    SpacesLimit = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parking_holders", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_parking_plates_HolderId",
                table: "parking_plates",
                column: "HolderId");

            migrationBuilder.CreateIndex(
                name: "IX_parking_holders_IsActive",
                table: "parking_holders",
                column: "IsActive");

            migrationBuilder.AddForeignKey(
                name: "FK_parking_plates_parking_holders_HolderId",
                table: "parking_plates",
                column: "HolderId",
                principalTable: "parking_holders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_parking_plates_parking_holders_HolderId",
                table: "parking_plates");

            migrationBuilder.DropTable(
                name: "parking_holders");

            migrationBuilder.DropIndex(
                name: "IX_parking_plates_HolderId",
                table: "parking_plates");

            migrationBuilder.DropColumn(
                name: "HolderId",
                table: "parking_plates");
        }
    }
}
