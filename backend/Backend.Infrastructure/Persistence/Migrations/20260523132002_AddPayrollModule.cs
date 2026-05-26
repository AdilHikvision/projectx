using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPayrollModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "employee_salary_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: false),
                    SalaryType = table.Column<int>(type: "integer", nullable: false),
                    BaseAmount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "AZN"),
                    OvertimeMultiplier = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false, defaultValue: 1.5m),
                    EffectiveFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_employee_salary_configs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_employee_salary_configs_employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payroll_components",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ComponentType = table.Column<int>(type: "integer", nullable: false),
                    IsFixed = table.Column<bool>(type: "boolean", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Percentage = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payroll_components", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "payroll_periods",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Month = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ApprovedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payroll_periods", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "employee_payroll_components",
                columns: table => new
                {
                    SalaryConfigId = table.Column<Guid>(type: "uuid", nullable: false),
                    ComponentId = table.Column<Guid>(type: "uuid", nullable: false),
                    OverrideAmount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    OverridePercentage = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_employee_payroll_components", x => new { x.SalaryConfigId, x.ComponentId });
                    table.ForeignKey(
                        name: "FK_employee_payroll_components_employee_salary_configs_SalaryC~",
                        column: x => x.SalaryConfigId,
                        principalTable: "employee_salary_configs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_employee_payroll_components_payroll_components_ComponentId",
                        column: x => x.ComponentId,
                        principalTable: "payroll_components",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payroll_entries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PeriodId = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkedDays = table.Column<int>(type: "integer", nullable: false),
                    WorkedHours = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: false),
                    OvertimeHours = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: false),
                    AbsentDays = table.Column<int>(type: "integer", nullable: false),
                    BasePay = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    OvertimePay = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    AllowancesTotal = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    BonusesTotal = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    GrossPay = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    DeductionsTotal = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    TaxRate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    TaxAmount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    NetPay = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ComponentsJson = table.Column<string>(type: "text", nullable: true),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payroll_entries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_payroll_entries_employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_payroll_entries_payroll_periods_PeriodId",
                        column: x => x.PeriodId,
                        principalTable: "payroll_periods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_employee_payroll_components_ComponentId",
                table: "employee_payroll_components",
                column: "ComponentId");

            migrationBuilder.CreateIndex(
                name: "IX_employee_salary_configs_EmployeeId",
                table: "employee_salary_configs",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_payroll_entries_EmployeeId",
                table: "payroll_entries",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_payroll_entries_PeriodId_EmployeeId",
                table: "payroll_entries",
                columns: new[] { "PeriodId", "EmployeeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payroll_periods_Year_Month",
                table: "payroll_periods",
                columns: new[] { "Year", "Month" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "employee_payroll_components");

            migrationBuilder.DropTable(
                name: "payroll_entries");

            migrationBuilder.DropTable(
                name: "employee_salary_configs");

            migrationBuilder.DropTable(
                name: "payroll_components");

            migrationBuilder.DropTable(
                name: "payroll_periods");
        }
    }
}
