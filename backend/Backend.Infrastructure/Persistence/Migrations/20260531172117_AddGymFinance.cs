using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGymFinance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "gym_finance_accounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "AZN"),
                    OpeningBalance = table.Column<decimal>(type: "numeric(16,2)", precision: 16, scale: 2, nullable: false),
                    Balance = table.Column<decimal>(type: "numeric(16,2)", precision: 16, scale: 2, nullable: false),
                    BankName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AccountNumber = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_finance_accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "gym_finance_categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Direction = table.Column<int>(type: "integer", nullable: false),
                    Color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false, defaultValue: "#6366f1"),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_finance_categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "gym_finance_transactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    Direction = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(16,2)", precision: 16, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "AZN"),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    OccurredOn = table.Column<DateOnly>(type: "date", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Reference = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    CounterpartyName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Method = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    IsTransfer = table.Column<bool>(type: "boolean", nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "numeric(16,2)", precision: 16, scale: 2, nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    UserEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_finance_transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_gym_finance_transactions_gym_finance_accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "gym_finance_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_gym_finance_transactions_gym_finance_categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "gym_finance_categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_gym_finance_accounts_IsActive",
                table: "gym_finance_accounts",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_gym_finance_accounts_Type",
                table: "gym_finance_accounts",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_gym_finance_categories_Direction",
                table: "gym_finance_categories",
                column: "Direction");

            migrationBuilder.CreateIndex(
                name: "IX_gym_finance_transactions_AccountId",
                table: "gym_finance_transactions",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_finance_transactions_CategoryId",
                table: "gym_finance_transactions",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_finance_transactions_Direction_OccurredOn",
                table: "gym_finance_transactions",
                columns: new[] { "Direction", "OccurredOn" });

            migrationBuilder.CreateIndex(
                name: "IX_gym_finance_transactions_OccurredOn",
                table: "gym_finance_transactions",
                column: "OccurredOn");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "gym_finance_transactions");

            migrationBuilder.DropTable(
                name: "gym_finance_accounts");

            migrationBuilder.DropTable(
                name: "gym_finance_categories");
        }
    }
}
