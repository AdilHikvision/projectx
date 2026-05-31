using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGymSales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "gym_sales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: true),
                    CustomerName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Subtotal = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Discount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Total = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "AZN"),
                    PaymentMethod = table.Column<int>(type: "integer", nullable: false),
                    FinanceAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    FinanceTransactionId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    SoldUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RefundedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    UserEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_sales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_gym_sales_gym_customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "gym_customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "gym_sale_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SaleId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    LineTotal = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_sale_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_gym_sale_items_gym_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "gym_products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_gym_sale_items_gym_sales_SaleId",
                        column: x => x.SaleId,
                        principalTable: "gym_sales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_gym_sale_items_ProductId",
                table: "gym_sale_items",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_sale_items_SaleId",
                table: "gym_sale_items",
                column: "SaleId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_sales_CustomerId",
                table: "gym_sales",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_sales_Number",
                table: "gym_sales",
                column: "Number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_gym_sales_SoldUtc",
                table: "gym_sales",
                column: "SoldUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "gym_sale_items");

            migrationBuilder.DropTable(
                name: "gym_sales");
        }
    }
}
