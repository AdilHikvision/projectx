using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHousingStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Block",
                table: "employees");

            migrationBuilder.AddColumn<Guid>(
                name: "HousingBlockId",
                table: "employees",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "housing_blocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_housing_blocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_housing_blocks_housing_blocks_ParentId",
                        column: x => x.ParentId,
                        principalTable: "housing_blocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_employees_HousingBlockId",
                table: "employees",
                column: "HousingBlockId");

            migrationBuilder.CreateIndex(
                name: "IX_housing_blocks_ParentId",
                table: "housing_blocks",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_employees_housing_blocks_HousingBlockId",
                table: "employees",
                column: "HousingBlockId",
                principalTable: "housing_blocks",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_employees_housing_blocks_HousingBlockId",
                table: "employees");

            migrationBuilder.DropTable(
                name: "housing_blocks");

            migrationBuilder.DropIndex(
                name: "IX_employees_HousingBlockId",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "HousingBlockId",
                table: "employees");

            migrationBuilder.AddColumn<string>(
                name: "Block",
                table: "employees",
                type: "text",
                nullable: true);
        }
    }
}
