using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIrisesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "irises",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    VisitorId = table.Column<Guid>(type: "uuid", nullable: true),
                    TemplateData = table.Column<byte[]>(type: "bytea", nullable: false),
                    IrisIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_irises", x => x.Id);
                    table.CheckConstraint("CK_Irises_Owner", "(\"EmployeeId\" IS NOT NULL AND \"VisitorId\" IS NULL) OR (\"EmployeeId\" IS NULL AND \"VisitorId\" IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_irises_employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_irises_visitors_VisitorId",
                        column: x => x.VisitorId,
                        principalTable: "visitors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_irises_EmployeeId",
                table: "irises",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_irises_VisitorId",
                table: "irises",
                column: "VisitorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "irises");
        }
    }
}
