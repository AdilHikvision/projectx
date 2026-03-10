using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCardsFacesFingerprints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmployeeNo",
                table: "employees",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_employees_EmployeeNo",
                table: "employees",
                column: "EmployeeNo",
                unique: true,
                filter: "\"EmployeeNo\" IS NOT NULL");

            migrationBuilder.CreateTable(
                name: "cards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    VisitorId = table.Column<Guid>(type: "uuid", nullable: true),
                    CardNo = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CardNumber = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cards", x => x.Id);
                    table.CheckConstraint("CK_Cards_Owner", "(\"EmployeeId\" IS NOT NULL AND \"VisitorId\" IS NULL) OR (\"EmployeeId\" IS NULL AND \"VisitorId\" IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_cards_employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cards_visitors_VisitorId",
                        column: x => x.VisitorId,
                        principalTable: "visitors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "faces",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    VisitorId = table.Column<Guid>(type: "uuid", nullable: true),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FDID = table.Column<int>(type: "integer", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_faces", x => x.Id);
                    table.CheckConstraint("CK_Faces_Owner", "(\"EmployeeId\" IS NOT NULL AND \"VisitorId\" IS NULL) OR (\"EmployeeId\" IS NULL AND \"VisitorId\" IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_faces_employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_faces_visitors_VisitorId",
                        column: x => x.VisitorId,
                        principalTable: "visitors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fingerprints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    VisitorId = table.Column<Guid>(type: "uuid", nullable: true),
                    TemplateData = table.Column<byte[]>(type: "bytea", nullable: false),
                    FingerIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fingerprints", x => x.Id);
                    table.CheckConstraint("CK_Fingerprints_Owner", "(\"EmployeeId\" IS NOT NULL AND \"VisitorId\" IS NULL) OR (\"EmployeeId\" IS NULL AND \"VisitorId\" IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_fingerprints_employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_fingerprints_visitors_VisitorId",
                        column: x => x.VisitorId,
                        principalTable: "visitors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cards_CardNo",
                table: "cards",
                column: "CardNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cards_EmployeeId",
                table: "cards",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_cards_VisitorId",
                table: "cards",
                column: "VisitorId");

            migrationBuilder.CreateIndex(
                name: "IX_faces_EmployeeId",
                table: "faces",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_faces_VisitorId",
                table: "faces",
                column: "VisitorId");

            migrationBuilder.CreateIndex(
                name: "IX_fingerprints_EmployeeId",
                table: "fingerprints",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_fingerprints_VisitorId",
                table: "fingerprints",
                column: "VisitorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "cards");
            migrationBuilder.DropTable(name: "faces");
            migrationBuilder.DropTable(name: "fingerprints");
            migrationBuilder.DropIndex(name: "IX_employees_EmployeeNo", table: "employees");
            migrationBuilder.DropColumn(name: "EmployeeNo", table: "employees");
        }
    }
}
