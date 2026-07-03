using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScientificJournal.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "authors",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    external_id = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    affiliation = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_authors", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "journals",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    publisher = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    issn_online = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    is_deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_journals", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "keywords",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    term = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    normalized_term = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_keywords", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    password_hash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    full_name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    is_deleted = table.Column<bool>(type: "bit", nullable: false),
                    is_email_verified = table.Column<bool>(type: "bit", nullable: false),
                    is_pro = table.Column<bool>(type: "bit", nullable: false),
                    plan = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Free"),
                    email_verification_token = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    email_verification_token_expires_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    password_reset_token = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    password_reset_token_expires_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "publications",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    @abstract = table.Column<string>(name: "abstract", type: "nvarchar(max)", nullable: true),
                    publication_year = table.Column<int>(type: "int", nullable: false),
                    doi = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    journal_id = table.Column<int>(type: "int", nullable: true),
                    citation_count = table.Column<int>(type: "int", nullable: false),
                    source_api = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    mongo_metadata_id = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_deleted = table.Column<bool>(type: "bit", nullable: false),
                    is_original = table.Column<bool>(type: "bit", nullable: false),
                    synced_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_publications", x => x.id);
                    table.ForeignKey(
                        name: "FK_publications_journals_journal_id",
                        column: x => x.journal_id,
                        principalTable: "journals",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "trending_metrics",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    keyword_id = table.Column<int>(type: "int", nullable: false),
                    year = table.Column<int>(type: "int", nullable: false),
                    publication_count = table.Column<int>(type: "int", nullable: false),
                    trending_score = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    calculated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trending_metrics", x => x.id);
                    table.ForeignKey(
                        name: "FK_trending_metrics_keywords_keyword_id",
                        column: x => x.keyword_id,
                        principalTable: "keywords",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "admin_states",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    state_key = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    json_value = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    updated_by_user_id = table.Column<int>(type: "int", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admin_states", x => x.id);
                    table.ForeignKey(
                        name: "FK_admin_states_users_updated_by_user_id",
                        column: x => x.updated_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "admin_support_tickets",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ticket_number = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    message = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    status = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    created_by_user_id = table.Column<int>(type: "int", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admin_support_tickets", x => x.id);
                    table.ForeignKey(
                        name: "FK_admin_support_tickets_users_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "follows",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    follow_type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    follow_target_id = table.Column<int>(type: "int", nullable: false),
                    follow_target_name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_follows", x => x.id);
                    table.ForeignKey(
                        name: "FK_follows_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payment_transactions",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_code = table.Column<long>(type: "bigint", nullable: false),
                    payment_link_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    checkout_url = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    user_email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    billing_cycle = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    plan = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    amount = table.Column<int>(type: "int", nullable: false),
                    currency = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    description = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    payos_reference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    raw_webhook_json = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    expires_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    paid_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_payment_transactions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sync_logs",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    triggered_by_user_id = table.Column<int>(type: "int", nullable: true),
                    source_api = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    records_synced = table.Column<int>(type: "int", nullable: true),
                    error_message = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    started_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    finished_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sync_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_sync_logs_users_triggered_by_user_id",
                        column: x => x.triggered_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "bookmarks",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    publication_id = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bookmarks", x => x.id);
                    table.ForeignKey(
                        name: "FK_bookmarks_publications_publication_id",
                        column: x => x.publication_id,
                        principalTable: "publications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_bookmarks_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    publication_id = table.Column<int>(type: "int", nullable: true),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    route = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    notification_type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    is_read = table.Column<bool>(type: "bit", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.id);
                    table.ForeignKey(
                        name: "FK_notifications_publications_publication_id",
                        column: x => x.publication_id,
                        principalTable: "publications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_notifications_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "publication_authors",
                columns: table => new
                {
                    publication_id = table.Column<int>(type: "int", nullable: false),
                    author_id = table.Column<int>(type: "int", nullable: false),
                    author_order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_publication_authors", x => new { x.publication_id, x.author_id });
                    table.ForeignKey(
                        name: "FK_publication_authors_authors_author_id",
                        column: x => x.author_id,
                        principalTable: "authors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_publication_authors_publications_publication_id",
                        column: x => x.publication_id,
                        principalTable: "publications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "publication_keywords",
                columns: table => new
                {
                    publication_id = table.Column<int>(type: "int", nullable: false),
                    keyword_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_publication_keywords", x => new { x.publication_id, x.keyword_id });
                    table.ForeignKey(
                        name: "FK_publication_keywords_keywords_keyword_id",
                        column: x => x.keyword_id,
                        principalTable: "keywords",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_publication_keywords_publications_publication_id",
                        column: x => x.publication_id,
                        principalTable: "publications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                    table.PrimaryKey("PK_publication_submissions", x => x.id);
                    table.ForeignKey(
                        name: "FK_publication_submissions_publications_published_publication_id",
                        column: x => x.published_publication_id,
                        principalTable: "publications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_publication_submissions_users_reviewed_by_user_id",
                        column: x => x.reviewed_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_publication_submissions_users_submitter_user_id",
                        column: x => x.submitter_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_admin_states_state_key",
                table: "admin_states",
                column: "state_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_admin_states_updated_by_user_id",
                table: "admin_states",
                column: "updated_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_admin_support_tickets_created_by_user_id",
                table: "admin_support_tickets",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_admin_support_tickets_status",
                table: "admin_support_tickets",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_admin_support_tickets_ticket_number",
                table: "admin_support_tickets",
                column: "ticket_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_bookmarks_publication_id",
                table: "bookmarks",
                column: "publication_id");

            migrationBuilder.CreateIndex(
                name: "IX_bookmarks_user_id",
                table: "bookmarks",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_follows_user_id",
                table: "follows",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_journals_issn_online",
                table: "journals",
                column: "issn_online",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_keywords_normalized_term",
                table: "keywords",
                column: "normalized_term",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notifications_publication_id",
                table: "notifications",
                column: "publication_id");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_user_id",
                table: "notifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_order_code",
                table: "payment_transactions",
                column: "order_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_payment_link_id",
                table: "payment_transactions",
                column: "payment_link_id");

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_status",
                table: "payment_transactions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_user_email",
                table: "payment_transactions",
                column: "user_email");

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_user_id",
                table: "payment_transactions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_publication_authors_author_id",
                table: "publication_authors",
                column: "author_id");

            migrationBuilder.CreateIndex(
                name: "IX_publication_keywords_keyword_id",
                table: "publication_keywords",
                column: "keyword_id");

            migrationBuilder.CreateIndex(
                name: "IX_publication_submissions_published_publication_id",
                table: "publication_submissions",
                column: "published_publication_id");

            migrationBuilder.CreateIndex(
                name: "IX_publication_submissions_reviewed_by_user_id",
                table: "publication_submissions",
                column: "reviewed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_publication_submissions_status",
                table: "publication_submissions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_publication_submissions_submitted_at",
                table: "publication_submissions",
                column: "submitted_at");

            migrationBuilder.CreateIndex(
                name: "IX_publication_submissions_submitter_email",
                table: "publication_submissions",
                column: "submitter_email");

            migrationBuilder.CreateIndex(
                name: "IX_publication_submissions_submitter_user_id",
                table: "publication_submissions",
                column: "submitter_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_publications_doi",
                table: "publications",
                column: "doi",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_publications_journal_id",
                table: "publications",
                column: "journal_id");

            migrationBuilder.CreateIndex(
                name: "IX_sync_logs_triggered_by_user_id",
                table: "sync_logs",
                column: "triggered_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_trending_metrics_keyword_id_year",
                table: "trending_metrics",
                columns: new[] { "keyword_id", "year" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admin_states");

            migrationBuilder.DropTable(
                name: "admin_support_tickets");

            migrationBuilder.DropTable(
                name: "bookmarks");

            migrationBuilder.DropTable(
                name: "follows");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "payment_transactions");

            migrationBuilder.DropTable(
                name: "publication_authors");

            migrationBuilder.DropTable(
                name: "publication_keywords");

            migrationBuilder.DropTable(
                name: "publication_submissions");

            migrationBuilder.DropTable(
                name: "sync_logs");

            migrationBuilder.DropTable(
                name: "trending_metrics");

            migrationBuilder.DropTable(
                name: "authors");

            migrationBuilder.DropTable(
                name: "publications");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "keywords");

            migrationBuilder.DropTable(
                name: "journals");
        }
    }
}
