using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGymInventory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "gym_stocktakes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CompletedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_stocktakes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "gym_suppliers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ContactName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Phone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_suppliers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "gym_products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Sku = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Barcode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Category = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    Unit = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false, defaultValue: "pcs"),
                    SalePrice = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Cost = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "AZN"),
                    StockQuantity = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    MinStock = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_gym_products_gym_suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "gym_suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "gym_purchase_orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: true),
                    SupplierName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ExpectedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ReceivedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "AZN"),
                    Total = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_purchase_orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_gym_purchase_orders_gym_suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "gym_suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "gym_stock_movements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    UnitCost = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Reference = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    UserEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_stock_movements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_gym_stock_movements_gym_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "gym_products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "gym_stocktake_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StocktakeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ExpectedQuantity = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    CountedQuantity = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_stocktake_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_gym_stocktake_items_gym_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "gym_products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_gym_stocktake_items_gym_stocktakes_StocktakeId",
                        column: x => x.StocktakeId,
                        principalTable: "gym_stocktakes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "gym_purchase_order_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PurchaseOrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    UnitCost = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gym_purchase_order_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_gym_purchase_order_items_gym_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "gym_products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_gym_purchase_order_items_gym_purchase_orders_PurchaseOrderId",
                        column: x => x.PurchaseOrderId,
                        principalTable: "gym_purchase_orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_gym_products_IsActive",
                table: "gym_products",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_gym_products_Sku",
                table: "gym_products",
                column: "Sku");

            migrationBuilder.CreateIndex(
                name: "IX_gym_products_SupplierId",
                table: "gym_products",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_purchase_order_items_ProductId",
                table: "gym_purchase_order_items",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_purchase_order_items_PurchaseOrderId",
                table: "gym_purchase_order_items",
                column: "PurchaseOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_purchase_orders_Number",
                table: "gym_purchase_orders",
                column: "Number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_gym_purchase_orders_Status",
                table: "gym_purchase_orders",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_gym_purchase_orders_SupplierId",
                table: "gym_purchase_orders",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_stock_movements_ProductId_CreatedUtc",
                table: "gym_stock_movements",
                columns: new[] { "ProductId", "CreatedUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_gym_stock_movements_Type",
                table: "gym_stock_movements",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_gym_stocktake_items_ProductId",
                table: "gym_stocktake_items",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_stocktake_items_StocktakeId",
                table: "gym_stocktake_items",
                column: "StocktakeId");

            migrationBuilder.CreateIndex(
                name: "IX_gym_stocktakes_Number",
                table: "gym_stocktakes",
                column: "Number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_gym_stocktakes_Status",
                table: "gym_stocktakes",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_gym_suppliers_IsActive",
                table: "gym_suppliers",
                column: "IsActive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "gym_purchase_order_items");

            migrationBuilder.DropTable(
                name: "gym_stock_movements");

            migrationBuilder.DropTable(
                name: "gym_stocktake_items");

            migrationBuilder.DropTable(
                name: "gym_purchase_orders");

            migrationBuilder.DropTable(
                name: "gym_products");

            migrationBuilder.DropTable(
                name: "gym_stocktakes");

            migrationBuilder.DropTable(
                name: "gym_suppliers");
        }
    }
}
