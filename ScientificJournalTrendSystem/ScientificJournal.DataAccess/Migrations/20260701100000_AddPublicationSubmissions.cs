using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScientificJournal.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicationSubmissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "publication_submissions",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    submitter_user_id = table.Column<int>(type: "int", nullable: true),
                    submitter_email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    submitter_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    submitter_role = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    authors_text = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    keywords_text = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    @abstract = table.Column<string>(name: "abstract", type: "nvarchar(max)", nullable: false),
                    file_name = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: true),
                    file_content_type = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    file_content = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    extracted_text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    similarity_percent = table.Column<double>(type: "float", nullable: false),
                    matched_title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    matched_source = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    matched_link = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    candidates_json = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    decision = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    rejected_reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    rejected_evidence = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    is_deleted = table.Column<bool>(type: "bit", nullable: false),
                    published_publication_id = table.Column<int>(type: "int", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    reviewed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    reviewed_by_user_id = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_publication_submissions", x => x.id);
                    table.ForeignKey(
                        name: "fk_pubsub_submitter_user",
                        column: x => x.submitter_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_pubsub_reviewer_user",
                        column: x => x.reviewed_by_user_id,
                        principalTable: "users",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_pubsub_publication",
                        column: x => x.published_publication_id,
                        principalTable: "publications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_publication_submissions_status",
                table: "publication_submissions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_publication_submissions_submitter_email",
                table: "publication_submissions",
                column: "submitter_email");

            migrationBuilder.CreateIndex(
                name: "ix_publication_submissions_submitted_at",
                table: "publication_submissions",
                column: "submitted_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "publication_submissions");
        }
    }
}
