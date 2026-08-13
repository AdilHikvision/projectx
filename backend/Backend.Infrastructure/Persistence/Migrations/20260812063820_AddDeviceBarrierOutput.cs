using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Реле шлагбаума задаётся у самой камеры: на парковке с несколькими въездами
    /// общей настройки parking.barrierOutput не хватает. Она остаётся запасным значением
    /// для камер, у которых номер выхода не указан.
    /// Шаг идемпотентен — колонка могла появиться раньше из патчей DatabaseInitializer.
    /// </summary>
    public partial class AddDeviceBarrierOutput : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE devices ADD COLUMN IF NOT EXISTS "BarrierOutput" integer
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE devices DROP COLUMN IF EXISTS "BarrierOutput"
                """);
        }
    }
}
