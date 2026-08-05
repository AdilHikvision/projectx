using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddParkingOverstay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "OverstayUtc",
                table: "parking_sessions",
                type: "timestamp with time zone",
                nullable: true);

            // Таблица attendance_permissions появилась в модели без своей миграции, поэтому EF
            // подмешал её сюда. Создаёт её идемпотентный патч в DatabaseInitializer, а тут
            // повторный CREATE падал бы на «relation already exists». Оставляем IF NOT EXISTS,
            // чтобы и чистая база, накатанная одними миграциями, получила таблицу.
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS attendance_permissions (
                    "Id" uuid NOT NULL PRIMARY KEY,
                    "EmployeeId" uuid NOT NULL REFERENCES employees("Id") ON DELETE CASCADE,
                    "Date" date NOT NULL,
                    "FromTime" interval NOT NULL,
                    "ToTime" interval NOT NULL,
                    "Reason" character varying(500),
                    "ShowInReport" boolean NOT NULL DEFAULT true,
                    "CreatedUtc" timestamp with time zone NOT NULL,
                    "UpdatedUtc" timestamp with time zone
                )
                """);
            migrationBuilder.Sql("""
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_attendance_permissions_EmployeeId_Date"
                    ON attendance_permissions ("EmployeeId", "Date")
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS attendance_permissions");

            migrationBuilder.DropColumn(
                name: "OverstayUtc",
                table: "parking_sessions");
        }
    }
}
