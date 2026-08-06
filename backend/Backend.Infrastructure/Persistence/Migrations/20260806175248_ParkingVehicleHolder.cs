using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Белый список заменён пропусками на машины: владелец мест, лимит стоянки и категория
    /// переезжают из parking_plates в parking_vehicles, разрешающие записи превращаются
    /// в машины с бессрочным пропуском.
    /// Шаги идемпотентны: часть колонок могла появиться раньше из патчей DatabaseInitializer,
    /// и повторный проход по такой базе не должен падать.
    /// </summary>
    public partial class ParkingVehicleHolder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Новые поля машины.
            migrationBuilder.Sql("""
                ALTER TABLE parking_vehicles
                    ADD COLUMN IF NOT EXISTS "HolderId" uuid,
                    ADD COLUMN IF NOT EXISTS "TimeLimitMinutes" integer,
                    ADD COLUMN IF NOT EXISTS "Category" character varying(32)
                """);

            // 2. Перенос данных — обязательно до удаления старых колонок.
            migrationBuilder.Sql("""
                INSERT INTO parking_vehicles ("Id","Plate","PlateNormalized","IsActive","CreatedUtc","HolderId","TimeLimitMinutes","Category")
                SELECT gen_random_uuid(), p."Plate", p."PlateNormalized", TRUE, now(), p."HolderId", p."TimeLimitMinutes", p."Category"
                FROM parking_plates p
                WHERE p."ListType" = 1 AND p."IsActive"
                  AND NOT EXISTS (SELECT 1 FROM parking_vehicles v WHERE v."PlateNormalized" = p."PlateNormalized")
                """);
            migrationBuilder.Sql("""
                INSERT INTO parking_permits ("Id","VehicleId","ValidFrom","ValidTo","IsActive","CreatedUtc","Notes")
                SELECT gen_random_uuid(), v."Id", CURRENT_DATE, p."ValidTo", TRUE, now(), 'Migrated from allowlist'
                FROM parking_plates p
                JOIN parking_vehicles v ON v."PlateNormalized" = p."PlateNormalized"
                WHERE p."ListType" = 1 AND p."IsActive"
                  AND NOT EXISTS (SELECT 1 FROM parking_permits pp WHERE pp."VehicleId" = v."Id")
                """);
            migrationBuilder.Sql("""
                DELETE FROM parking_plates WHERE "ListType" = 1
                """);

            // 3. Старые колонки списка больше не нужны.
            migrationBuilder.Sql("""
                ALTER TABLE parking_plates
                    DROP CONSTRAINT IF EXISTS "FK_parking_plates_parking_holders_HolderId"
                """);
            migrationBuilder.Sql("""
                DROP INDEX IF EXISTS "IX_parking_plates_HolderId"
                """);
            migrationBuilder.Sql("""
                ALTER TABLE parking_plates
                    DROP COLUMN IF EXISTS "HolderId",
                    DROP COLUMN IF EXISTS "TimeLimitMinutes"
                """);

            // 4. Связь машины с владельцем мест.
            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_parking_vehicles_HolderId" ON parking_vehicles ("HolderId")
                """);
            migrationBuilder.Sql("""
                ALTER TABLE parking_vehicles
                    DROP CONSTRAINT IF EXISTS "FK_parking_vehicles_parking_holders_HolderId"
                """);
            migrationBuilder.Sql("""
                ALTER TABLE parking_vehicles
                    ADD CONSTRAINT "FK_parking_vehicles_parking_holders_HolderId"
                    FOREIGN KEY ("HolderId") REFERENCES parking_holders("Id") ON DELETE SET NULL
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE parking_vehicles
                    DROP CONSTRAINT IF EXISTS "FK_parking_vehicles_parking_holders_HolderId"
                """);
            migrationBuilder.Sql("""
                DROP INDEX IF EXISTS "IX_parking_vehicles_HolderId"
                """);
            migrationBuilder.Sql("""
                ALTER TABLE parking_vehicles
                    DROP COLUMN IF EXISTS "HolderId",
                    DROP COLUMN IF EXISTS "TimeLimitMinutes",
                    DROP COLUMN IF EXISTS "Category"
                """);
            migrationBuilder.Sql("""
                ALTER TABLE parking_plates
                    ADD COLUMN IF NOT EXISTS "HolderId" uuid,
                    ADD COLUMN IF NOT EXISTS "TimeLimitMinutes" integer
                """);
        }
    }
}
