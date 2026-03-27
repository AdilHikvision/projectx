using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVisitorCompanyId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Идемпотентно: схема БД могла быть изменена вручную или миграция применялась частично.
            migrationBuilder.Sql("""
                ALTER TABLE visitors ADD COLUMN IF NOT EXISTS "CompanyId" uuid;
                ALTER TABLE employees ADD COLUMN IF NOT EXISTS "CompanyId" uuid;
                ALTER TABLE departments ADD COLUMN IF NOT EXISTS "CompanyId" uuid;
                CREATE INDEX IF NOT EXISTS "IX_visitors_CompanyId" ON visitors ("CompanyId");
                CREATE INDEX IF NOT EXISTS "IX_employees_CompanyId" ON employees ("CompanyId");
                CREATE INDEX IF NOT EXISTS "IX_departments_CompanyId" ON departments ("CompanyId");
                """);

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS companies (
                    "Id" uuid NOT NULL,
                    "Name" character varying(255) NOT NULL,
                    "Description" character varying(500),
                    "CreatedUtc" timestamp with time zone NOT NULL,
                    "UpdatedUtc" timestamp with time zone,
                    CONSTRAINT "PK_companies" PRIMARY KEY ("Id")
                );
                CREATE TABLE IF NOT EXISTS system_settings (
                    "Id" uuid NOT NULL,
                    "Key" character varying(120) NOT NULL,
                    "Value" text,
                    "CreatedUtc" timestamp with time zone NOT NULL,
                    "UpdatedUtc" timestamp with time zone,
                    CONSTRAINT "PK_system_settings" PRIMARY KEY ("Id")
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_system_settings_Key" ON system_settings ("Key");
                """);

            migrationBuilder.Sql("""
                DO $$
                BEGIN
                  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_departments_companies_CompanyId') THEN
                    ALTER TABLE departments ADD CONSTRAINT "FK_departments_companies_CompanyId" FOREIGN KEY ("CompanyId") REFERENCES companies ("Id") ON DELETE SET NULL;
                  END IF;
                  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_employees_companies_CompanyId') THEN
                    ALTER TABLE employees ADD CONSTRAINT "FK_employees_companies_CompanyId" FOREIGN KEY ("CompanyId") REFERENCES companies ("Id") ON DELETE SET NULL;
                  END IF;
                  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_visitors_companies_CompanyId') THEN
                    ALTER TABLE visitors ADD CONSTRAINT "FK_visitors_companies_CompanyId" FOREIGN KEY ("CompanyId") REFERENCES companies ("Id") ON DELETE SET NULL;
                  END IF;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_departments_companies_CompanyId",
                table: "departments");

            migrationBuilder.DropForeignKey(
                name: "FK_employees_companies_CompanyId",
                table: "employees");

            migrationBuilder.DropForeignKey(
                name: "FK_visitors_companies_CompanyId",
                table: "visitors");

            migrationBuilder.DropTable(
                name: "companies");

            migrationBuilder.DropTable(
                name: "system_settings");

            migrationBuilder.DropIndex(
                name: "IX_visitors_CompanyId",
                table: "visitors");

            migrationBuilder.DropIndex(
                name: "IX_employees_CompanyId",
                table: "employees");

            migrationBuilder.DropIndex(
                name: "IX_departments_CompanyId",
                table: "departments");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "visitors");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "departments");
        }
    }
}
