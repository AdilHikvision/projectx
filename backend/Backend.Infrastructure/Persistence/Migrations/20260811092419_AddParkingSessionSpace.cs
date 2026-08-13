using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Сессия занимает конкретное место: схема парковки показывает, какая машина где стоит.
    /// Шаги идемпотентны — колонка могла появиться раньше из патчей DatabaseInitializer.
    /// Открытым сессиям места раздаём здесь же, иначе на схеме они остались бы «нигде».
    /// </summary>
    public partial class AddParkingSessionSpace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE parking_sessions ADD COLUMN IF NOT EXISTS "SpaceId" uuid
                """);
            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_parking_sessions_SpaceId" ON parking_sessions ("SpaceId")
                """);
            migrationBuilder.Sql("""
                ALTER TABLE parking_sessions
                    DROP CONSTRAINT IF EXISTS "FK_parking_sessions_parking_spaces_SpaceId"
                """);
            migrationBuilder.Sql("""
                ALTER TABLE parking_sessions
                    ADD CONSTRAINT "FK_parking_sessions_parking_spaces_SpaceId"
                    FOREIGN KEY ("SpaceId") REFERENCES parking_spaces("Id") ON DELETE SET NULL
                """);

            // Машины, стоящие внутри прямо сейчас, раскладываем по свободным местам своего типа
            // в том же порядке, что и на схеме (этаж → ряд → место).
            migrationBuilder.Sql("""
                WITH free AS (
                    SELECT sp."Id", sp."Type",
                           ROW_NUMBER() OVER (PARTITION BY sp."Type"
                               ORDER BY f."Level", r."SortOrder", sp."SortOrder", sp."Code") AS rn
                    FROM parking_spaces sp
                    JOIN parking_rows r ON r."Id" = sp."RowId"
                    JOIN parking_floors f ON f."Id" = r."FloorId"
                    WHERE sp."IsActive"
                      AND NOT EXISTS (
                          SELECT 1 FROM parking_sessions os
                          WHERE os."ExitedUtc" IS NULL AND os."SpaceId" = sp."Id")
                ), sess AS (
                    SELECT s."Id", s."SpaceType",
                           ROW_NUMBER() OVER (PARTITION BY s."SpaceType" ORDER BY s."EnteredUtc") AS rn
                    FROM parking_sessions s
                    WHERE s."ExitedUtc" IS NULL AND s."SpaceId" IS NULL
                )
                UPDATE parking_sessions t
                SET "SpaceId" = free."Id"
                FROM sess
                JOIN free ON free."Type" = sess."SpaceType" AND free.rn = sess.rn
                WHERE t."Id" = sess."Id"
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE parking_sessions
                    DROP CONSTRAINT IF EXISTS "FK_parking_sessions_parking_spaces_SpaceId"
                """);
            migrationBuilder.Sql("""
                DROP INDEX IF EXISTS "IX_parking_sessions_SpaceId"
                """);
            migrationBuilder.Sql("""
                ALTER TABLE parking_sessions DROP COLUMN IF EXISTS "SpaceId"
                """);
        }
    }
}
