using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Разрешение на въезд переезжает из пропусков в саму карточку машины: срок действия
    /// (AccessValidTo) и зона (ZoneId). Отдельная страница пропусков убрана, поэтому сроки
    /// действующих пропусков переносим в машины — иначе после обновления белый список
    /// оказался бы бессрочным, а зоны потерялись бы.
    /// Шаги идемпотентны: колонки могли появиться раньше из патчей DatabaseInitializer.
    /// </summary>
    public partial class AddParkingVehicleAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE parking_vehicles
                    ADD COLUMN IF NOT EXISTS "AccessValidTo" date,
                    ADD COLUMN IF NOT EXISTS "ZoneId" uuid
                """);
            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_parking_vehicles_ZoneId" ON parking_vehicles ("ZoneId")
                """);
            // Имя ограничения задаём явно, как это сделал бы EF: безымянный FK от inline REFERENCES
            // получил бы имя от Postgres, и последующие миграции не смогли бы его найти.
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_parking_vehicles_parking_zones_ZoneId') THEN
                        ALTER TABLE parking_vehicles
                            ADD CONSTRAINT "FK_parking_vehicles_parking_zones_ZoneId"
                            FOREIGN KEY ("ZoneId") REFERENCES parking_zones("Id") ON DELETE SET NULL;
                    END IF;
                END $$;
                """);
            // Из нескольких пропусков берём самый «сильный»: с самым поздним сроком
            // (бессрочный — сильнее любой даты), при равенстве — свежий по дате создания.
            migrationBuilder.Sql("""
                UPDATE parking_vehicles v
                SET "AccessValidTo" = p."ValidTo",
                    "ZoneId" = p."ZoneId"
                FROM (
                    SELECT DISTINCT ON ("VehicleId") "VehicleId", "ValidTo", "ZoneId"
                    FROM parking_permits
                    WHERE "IsActive"
                    ORDER BY "VehicleId", "ValidTo" DESC NULLS FIRST, "CreatedUtc" DESC
                ) p
                WHERE v."Id" = p."VehicleId"
                  AND v."AccessValidTo" IS NULL
                  AND v."ZoneId" IS NULL
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE parking_vehicles
                    DROP CONSTRAINT IF EXISTS "FK_parking_vehicles_parking_zones_ZoneId"
                """);
            migrationBuilder.Sql("""
                DROP INDEX IF EXISTS "IX_parking_vehicles_ZoneId"
                """);
            migrationBuilder.Sql("""
                ALTER TABLE parking_vehicles
                    DROP COLUMN IF EXISTS "AccessValidTo",
                    DROP COLUMN IF EXISTS "ZoneId"
                """);
        }
    }
}
