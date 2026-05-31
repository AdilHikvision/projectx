using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGymCustomerCredentialsAndPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Fingerprints_Owner",
                table: "fingerprints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Faces_Owner",
                table: "faces");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Cards_Owner",
                table: "cards");

            migrationBuilder.AddColumn<Guid>(
                name: "GymCustomerId",
                table: "fingerprints",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GymCustomerId",
                table: "faces",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GymCustomerId",
                table: "cards",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "gym_payments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    MembershipId = table.Column<Guid>(type: "uuid", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "AZN"),
                    Method = table.Column<int>(type: "integer", nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PaidUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_gym_payments_gym_customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "gym_customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_gym_payments_gym_memberships_MembershipId",
                        column: x => x.MembershipId,
                        principalTable: "gym_memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_fingerprints_GymCustomerId",
                table: "fingerprints",
                column: "GymCustomerId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Fingerprints_Owner",
                table: "fingerprints",
                sql: "(\"EmployeeId\" IS NOT NULL)::int + (\"VisitorId\" IS NOT NULL)::int + (\"GymCustomerId\" IS NOT NULL)::int = 1");

            migrationBuilder.CreateIndex(
                name: "IX_faces_GymCustomerId",
                table: "faces",
                column: "GymCustomerId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Faces_Owner",
                table: "faces",
                sql: "(\"EmployeeId\" IS NOT NULL)::int + (\"VisitorId\" IS NOT NULL)::int + (\"GymCustomerId\" IS NOT NULL)::int = 1");

            migrationBuilder.CreateIndex(
                name: "IX_cards_GymCustomerId",
                table: "cards",
                column: "GymCustomerId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Cards_Owner",
                table: "cards",
                sql: "(\"EmployeeId\" IS NOT NULL)::int + (\"VisitorId\" IS NOT NULL)::int + (\"GymCustomerId\" IS NOT NULL)::int = 1");

            migrationBuilder.CreateIndex(
                name: "IX_gym_payments_CustomerId",
                table: "gym_payments",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_payments_MembershipId",
                table: "gym_payments",
                column: "MembershipId");

            migrationBuilder.AddForeignKey(
                name: "FK_cards_gym_customers_GymCustomerId",
                table: "cards",
                column: "GymCustomerId",
                principalTable: "gym_customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_faces_gym_customers_GymCustomerId",
                table: "faces",
                column: "GymCustomerId",
                principalTable: "gym_customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_fingerprints_gym_customers_GymCustomerId",
                table: "fingerprints",
                column: "GymCustomerId",
                principalTable: "gym_customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_cards_gym_customers_GymCustomerId",
                table: "cards");

            migrationBuilder.DropForeignKey(
                name: "FK_faces_gym_customers_GymCustomerId",
                table: "faces");

            migrationBuilder.DropForeignKey(
                name: "FK_fingerprints_gym_customers_GymCustomerId",
                table: "fingerprints");

            migrationBuilder.DropTable(
                name: "gym_payments");

            migrationBuilder.DropIndex(
                name: "IX_fingerprints_GymCustomerId",
                table: "fingerprints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Fingerprints_Owner",
                table: "fingerprints");

            migrationBuilder.DropIndex(
                name: "IX_faces_GymCustomerId",
                table: "faces");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Faces_Owner",
                table: "faces");

            migrationBuilder.DropIndex(
                name: "IX_cards_GymCustomerId",
                table: "cards");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Cards_Owner",
                table: "cards");

            migrationBuilder.DropColumn(
                name: "GymCustomerId",
                table: "fingerprints");

            migrationBuilder.DropColumn(
                name: "GymCustomerId",
                table: "faces");

            migrationBuilder.DropColumn(
                name: "GymCustomerId",
                table: "cards");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Fingerprints_Owner",
                table: "fingerprints",
                sql: "(EmployeeId IS NOT NULL AND VisitorId IS NULL) OR (EmployeeId IS NULL AND VisitorId IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Faces_Owner",
                table: "faces",
                sql: "(EmployeeId IS NOT NULL AND VisitorId IS NULL) OR (EmployeeId IS NULL AND VisitorId IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Cards_Owner",
                table: "cards",
                sql: "(EmployeeId IS NOT NULL AND VisitorId IS NULL) OR (EmployeeId IS NULL AND VisitorId IS NOT NULL)");
        }
    }
}
