using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCriteriaDisplayMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DisplayMode",
                table: "attendance_criteria",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "letter");

            // İşlənmiş-saat tipli kriteriyalar üçün default göstərilmə rejimi = saat; absent/dayoff = hərf (letter, yuxarıdakı default).
            migrationBuilder.Sql("UPDATE attendance_criteria SET \"DisplayMode\" = 'hours' WHERE \"Key\" IN ('normal','undertime','overtime','late','early_leave');");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisplayMode",
                table: "attendance_criteria");
        }
    }
}
