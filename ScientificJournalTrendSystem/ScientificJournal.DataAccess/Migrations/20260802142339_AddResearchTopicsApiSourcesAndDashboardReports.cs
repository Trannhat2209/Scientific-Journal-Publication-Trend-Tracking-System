using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScientificJournal.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddResearchTopicsApiSourcesAndDashboardReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "api_data_source_id",
                table: "sync_logs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "research_topic_id",
                table: "keywords",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "api_data_sources",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    provider_type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    base_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    is_enabled = table.Column<bool>(type: "bit", nullable: false),
                    requires_api_key = table.Column<bool>(type: "bit", nullable: false),
                    last_successful_sync_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    last_failed_sync_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    last_error = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_api_data_sources", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "dashboard_reports",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    name = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    keyword = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    from_year = table.Column<int>(type: "int", nullable: false),
                    to_year = table.Column<int>(type: "int", nullable: false),
                    format = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    file_name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    content_type = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    file_content = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    file_size = table.Column<long>(type: "bigint", nullable: false),
                    error_message = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    completed_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dashboard_reports", x => x.id);
                    table.ForeignKey(
                        name: "FK_dashboard_reports_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "research_topics",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    normalized_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_research_topics", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_sync_logs_api_data_source_id",
                table: "sync_logs",
                column: "api_data_source_id");

            migrationBuilder.CreateIndex(
                name: "IX_keywords_research_topic_id",
                table: "keywords",
                column: "research_topic_id");

            migrationBuilder.CreateIndex(
                name: "IX_api_data_sources_name",
                table: "api_data_sources",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_dashboard_reports_user_id_created_at",
                table: "dashboard_reports",
                columns: new[] { "user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_research_topics_normalized_name",
                table: "research_topics",
                column: "normalized_name",
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO research_topics (name, normalized_name, description, is_active, created_at)
                SELECT MIN(term), normalized_term, N'Topic migrated from the normalized keyword taxonomy.', 1, SYSUTCDATETIME()
                FROM keywords
                WHERE normalized_term IS NOT NULL AND LTRIM(RTRIM(normalized_term)) <> N''
                GROUP BY normalized_term;

                UPDATE k SET research_topic_id = t.id
                FROM keywords k
                INNER JOIN research_topics t ON t.normalized_name = k.normalized_term;

                INSERT INTO api_data_sources
                    (name, provider_type, base_url, is_enabled, requires_api_key, created_at)
                VALUES
                    (N'OpenAlex', N'Public REST API', N'https://api.openalex.org', 1, 0, SYSUTCDATETIME()),
                    (N'Crossref', N'Public REST API', N'https://api.crossref.org', 1, 0, SYSUTCDATETIME()),
                    (N'Semantic Scholar', N'External scholarly provider', N'https://api.semanticscholar.org', 1, 0, SYSUTCDATETIME()),
                    (N'Google Scholar', N'SerpApi intermediary', N'https://serpapi.com', 1, 1, SYSUTCDATETIME()),
                    (N'ResearchGate', N'SerpApi intermediary', N'https://serpapi.com', 1, 1, SYSUTCDATETIME()),
                    (N'Connected Papers', N'Relationship graph API', N'https://api.connectedpapers.com', 1, 1, SYSUTCDATETIME());

                UPDATE l SET api_data_source_id = s.id
                FROM sync_logs l INNER JOIN api_data_sources s
                  ON REPLACE(LOWER(l.source_api), N' ', N'') = REPLACE(LOWER(s.name), N' ', N'');
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_keywords_research_topics_research_topic_id",
                table: "keywords",
                column: "research_topic_id",
                principalTable: "research_topics",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_sync_logs_api_data_sources_api_data_source_id",
                table: "sync_logs",
                column: "api_data_source_id",
                principalTable: "api_data_sources",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_keywords_research_topics_research_topic_id",
                table: "keywords");

            migrationBuilder.DropForeignKey(
                name: "FK_sync_logs_api_data_sources_api_data_source_id",
                table: "sync_logs");

            migrationBuilder.DropTable(
                name: "api_data_sources");

            migrationBuilder.DropTable(
                name: "dashboard_reports");

            migrationBuilder.DropTable(
                name: "research_topics");

            migrationBuilder.DropIndex(
                name: "IX_sync_logs_api_data_source_id",
                table: "sync_logs");

            migrationBuilder.DropIndex(
                name: "IX_keywords_research_topic_id",
                table: "keywords");

            migrationBuilder.DropColumn(
                name: "api_data_source_id",
                table: "sync_logs");

            migrationBuilder.DropColumn(
                name: "research_topic_id",
                table: "keywords");
        }
    }
}
