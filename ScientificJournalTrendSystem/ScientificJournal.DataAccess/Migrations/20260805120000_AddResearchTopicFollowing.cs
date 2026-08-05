using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ScientificJournal.DataAccess.Context;

#nullable disable

namespace ScientificJournal.DataAccess.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260805120000_AddResearchTopicFollowing")]
public partial class AddResearchTopicFollowing : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "research_topics",
            columns: table => new
            {
                id = table.Column<int>(type: "int", nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                normalized_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_research_topics", x => x.id));

        migrationBuilder.CreateIndex(name: "IX_research_topics_normalized_name", table: "research_topics", column: "normalized_name", unique: true);
        migrationBuilder.AddColumn<int>(name: "research_topic_id", table: "keywords", type: "int", nullable: true);

        migrationBuilder.Sql("""
            INSERT INTO research_topics (name, normalized_name, description, is_active, created_at)
            SELECT MIN(term), normalized_term, N'Created from the existing publication keyword catalog.', 1, SYSUTCDATETIME()
            FROM keywords
            WHERE normalized_term IS NOT NULL AND LTRIM(RTRIM(normalized_term)) <> N''
            GROUP BY normalized_term;

            UPDATE k SET research_topic_id = t.id
            FROM keywords k INNER JOIN research_topics t ON t.normalized_name = k.normalized_term;
            """);

        migrationBuilder.CreateIndex(name: "IX_keywords_research_topic_id", table: "keywords", column: "research_topic_id");
        migrationBuilder.AddForeignKey(name: "FK_keywords_research_topics_research_topic_id", table: "keywords", column: "research_topic_id", principalTable: "research_topics", principalColumn: "id", onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(name: "FK_keywords_research_topics_research_topic_id", table: "keywords");
        migrationBuilder.DropIndex(name: "IX_keywords_research_topic_id", table: "keywords");
        migrationBuilder.DropColumn(name: "research_topic_id", table: "keywords");
        migrationBuilder.DropTable(name: "research_topics");
    }
}
