using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScientificJournal.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class SyncSchemaWithCurrentModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_bookmarks_publications_PublicationId",
                table: "bookmarks");

            migrationBuilder.DropForeignKey(
                name: "FK_bookmarks_users_UserId",
                table: "bookmarks");

            migrationBuilder.DropForeignKey(
                name: "FK_follows_users_UserId",
                table: "follows");

            migrationBuilder.DropForeignKey(
                name: "FK_notifications_publications_PublicationId",
                table: "notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_notifications_users_UserId",
                table: "notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_publication_authors_authors_AuthorId",
                table: "publication_authors");

            migrationBuilder.DropForeignKey(
                name: "FK_publication_authors_publications_PublicationId",
                table: "publication_authors");

            migrationBuilder.DropForeignKey(
                name: "FK_publication_keywords_keywords_KeywordId",
                table: "publication_keywords");

            migrationBuilder.DropForeignKey(
                name: "FK_publication_keywords_publications_PublicationId",
                table: "publication_keywords");

            migrationBuilder.DropForeignKey(
                name: "FK_publications_journals_JournalId",
                table: "publications");

            migrationBuilder.DropForeignKey(
                name: "FK_trending_metrics_keywords_KeywordId",
                table: "trending_metrics");

            migrationBuilder.RenameColumn(
                name: "Role",
                table: "users",
                newName: "role");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "users",
                newName: "email");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "users",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "PasswordHash",
                table: "users",
                newName: "password_hash");

            migrationBuilder.RenameColumn(
                name: "IsDeleted",
                table: "users",
                newName: "is_deleted");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "users",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "users",
                newName: "full_name");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "users",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_users_Email",
                table: "users",
                newName: "IX_users_email");

            migrationBuilder.RenameColumn(
                name: "Year",
                table: "trending_metrics",
                newName: "year");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "trending_metrics",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "TrendingScore",
                table: "trending_metrics",
                newName: "trending_score");

            migrationBuilder.RenameColumn(
                name: "PublicationCount",
                table: "trending_metrics",
                newName: "publication_count");

            migrationBuilder.RenameColumn(
                name: "KeywordId",
                table: "trending_metrics",
                newName: "keyword_id");

            migrationBuilder.RenameColumn(
                name: "CalculatedAt",
                table: "trending_metrics",
                newName: "calculated_at");

            migrationBuilder.RenameIndex(
                name: "IX_trending_metrics_KeywordId_Year",
                table: "trending_metrics",
                newName: "IX_trending_metrics_keyword_id_year");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "sync_logs",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "sync_logs",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "StartedAt",
                table: "sync_logs",
                newName: "started_at");

            migrationBuilder.RenameColumn(
                name: "SourceApi",
                table: "sync_logs",
                newName: "source_api");

            migrationBuilder.RenameColumn(
                name: "RecordsSynced",
                table: "sync_logs",
                newName: "records_synced");

            migrationBuilder.RenameColumn(
                name: "FinishedAt",
                table: "sync_logs",
                newName: "finished_at");

            migrationBuilder.RenameColumn(
                name: "ErrorMessage",
                table: "sync_logs",
                newName: "error_message");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "publications",
                newName: "title");

            migrationBuilder.RenameColumn(
                name: "DOI",
                table: "publications",
                newName: "doi");

            migrationBuilder.RenameColumn(
                name: "Abstract",
                table: "publications",
                newName: "abstract");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "publications",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "Year",
                table: "publications",
                newName: "publication_year");

            migrationBuilder.RenameColumn(
                name: "SyncedAt",
                table: "publications",
                newName: "synced_at");

            migrationBuilder.RenameColumn(
                name: "SourceApi",
                table: "publications",
                newName: "source_api");

            migrationBuilder.RenameColumn(
                name: "MongoMetadataId",
                table: "publications",
                newName: "mongo_metadata_id");

            migrationBuilder.RenameColumn(
                name: "JournalId",
                table: "publications",
                newName: "journal_id");

            migrationBuilder.RenameColumn(
                name: "IsDeleted",
                table: "publications",
                newName: "is_deleted");

            migrationBuilder.RenameColumn(
                name: "CitationCount",
                table: "publications",
                newName: "citation_count");

            migrationBuilder.RenameIndex(
                name: "IX_publications_DOI",
                table: "publications",
                newName: "IX_publications_doi");

            migrationBuilder.RenameIndex(
                name: "IX_publications_JournalId",
                table: "publications",
                newName: "IX_publications_journal_id");

            migrationBuilder.RenameColumn(
                name: "KeywordId",
                table: "publication_keywords",
                newName: "keyword_id");

            migrationBuilder.RenameColumn(
                name: "PublicationId",
                table: "publication_keywords",
                newName: "publication_id");

            migrationBuilder.RenameIndex(
                name: "IX_publication_keywords_KeywordId",
                table: "publication_keywords",
                newName: "IX_publication_keywords_keyword_id");

            migrationBuilder.RenameColumn(
                name: "AuthorOrder",
                table: "publication_authors",
                newName: "author_order");

            migrationBuilder.RenameColumn(
                name: "AuthorId",
                table: "publication_authors",
                newName: "author_id");

            migrationBuilder.RenameColumn(
                name: "PublicationId",
                table: "publication_authors",
                newName: "publication_id");

            migrationBuilder.RenameIndex(
                name: "IX_publication_authors_AuthorId",
                table: "publication_authors",
                newName: "IX_publication_authors_author_id");

            migrationBuilder.RenameColumn(
                name: "Message",
                table: "notifications",
                newName: "message");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "notifications",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "notifications",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "PublicationId",
                table: "notifications",
                newName: "publication_id");

            migrationBuilder.RenameColumn(
                name: "IsRead",
                table: "notifications",
                newName: "is_read");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "notifications",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_notifications_UserId",
                table: "notifications",
                newName: "IX_notifications_user_id");

            migrationBuilder.RenameIndex(
                name: "IX_notifications_PublicationId",
                table: "notifications",
                newName: "IX_notifications_publication_id");

            migrationBuilder.RenameColumn(
                name: "Term",
                table: "keywords",
                newName: "term");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "keywords",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "NormalizedTerm",
                table: "keywords",
                newName: "normalized_term");

            migrationBuilder.RenameIndex(
                name: "IX_keywords_NormalizedTerm",
                table: "keywords",
                newName: "IX_keywords_normalized_term");

            migrationBuilder.RenameColumn(
                name: "Publisher",
                table: "journals",
                newName: "publisher");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "journals",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "journals",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "IsDeleted",
                table: "journals",
                newName: "is_deleted");

            migrationBuilder.RenameColumn(
                name: "ISSNOnline",
                table: "journals",
                newName: "issn_online");

            migrationBuilder.RenameIndex(
                name: "IX_journals_ISSNOnline",
                table: "journals",
                newName: "IX_journals_issn_online");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "follows",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "follows",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "FollowType",
                table: "follows",
                newName: "follow_type");

            migrationBuilder.RenameColumn(
                name: "FollowTargetName",
                table: "follows",
                newName: "follow_target_name");

            migrationBuilder.RenameColumn(
                name: "FollowTargetId",
                table: "follows",
                newName: "follow_target_id");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "follows",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_follows_UserId",
                table: "follows",
                newName: "IX_follows_user_id");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "bookmarks",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "bookmarks",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "PublicationId",
                table: "bookmarks",
                newName: "publication_id");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "bookmarks",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_bookmarks_UserId",
                table: "bookmarks",
                newName: "IX_bookmarks_user_id");

            migrationBuilder.RenameIndex(
                name: "IX_bookmarks_PublicationId",
                table: "bookmarks",
                newName: "IX_bookmarks_publication_id");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "authors",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Affiliation",
                table: "authors",
                newName: "affiliation");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "authors",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "ExternalId",
                table: "authors",
                newName: "external_id");

            migrationBuilder.AlterColumn<string>(
                name: "role",
                table: "users",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "users",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<string>(
                name: "email_verification_token",
                table: "users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "email_verification_token_expires_at",
                table: "users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_email_verified",
                table: "users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_pro",
                table: "users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "password_reset_token",
                table: "users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "password_reset_token_expires_at",
                table: "users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "plan",
                table: "users",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Free");

            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "trending_metrics",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<decimal>(
                name: "trending_score",
                table: "trending_metrics",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "float");

            migrationBuilder.AlterColumn<int>(
                name: "keyword_id",
                table: "trending_metrics",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "sync_logs",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<int>(
                name: "records_synced",
                table: "sync_logs",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "triggered_by_user_id",
                table: "sync_logs",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "publications",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<int>(
                name: "journal_id",
                table: "publications",
                type: "int",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<bool>(
                name: "is_original",
                table: "publications",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<int>(
                name: "keyword_id",
                table: "publication_keywords",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<int>(
                name: "publication_id",
                table: "publication_keywords",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<int>(
                name: "author_id",
                table: "publication_authors",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<int>(
                name: "publication_id",
                table: "publication_authors",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "notifications",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<int>(
                name: "user_id",
                table: "notifications",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<int>(
                name: "publication_id",
                table: "notifications",
                type: "int",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "notification_type",
                table: "notifications",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "route",
                table: "notifications",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "title",
                table: "notifications",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "keywords",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "journals",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "follows",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<int>(
                name: "user_id",
                table: "follows",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<string>(
                name: "follow_type",
                table: "follows",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "follow_target_id",
                table: "follows",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "bookmarks",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<int>(
                name: "user_id",
                table: "bookmarks",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<int>(
                name: "publication_id",
                table: "bookmarks",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "authors",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

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
                name: "IX_sync_logs_triggered_by_user_id",
                table: "sync_logs",
                column: "triggered_by_user_id");

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

            migrationBuilder.AddForeignKey(
                name: "FK_bookmarks_publications_publication_id",
                table: "bookmarks",
                column: "publication_id",
                principalTable: "publications",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_bookmarks_users_user_id",
                table: "bookmarks",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_follows_users_user_id",
                table: "follows",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_notifications_publications_publication_id",
                table: "notifications",
                column: "publication_id",
                principalTable: "publications",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_notifications_users_user_id",
                table: "notifications",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_publication_authors_authors_author_id",
                table: "publication_authors",
                column: "author_id",
                principalTable: "authors",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_publication_authors_publications_publication_id",
                table: "publication_authors",
                column: "publication_id",
                principalTable: "publications",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_publication_keywords_keywords_keyword_id",
                table: "publication_keywords",
                column: "keyword_id",
                principalTable: "keywords",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_publication_keywords_publications_publication_id",
                table: "publication_keywords",
                column: "publication_id",
                principalTable: "publications",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_publications_journals_journal_id",
                table: "publications",
                column: "journal_id",
                principalTable: "journals",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_sync_logs_users_triggered_by_user_id",
                table: "sync_logs",
                column: "triggered_by_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_trending_metrics_keywords_keyword_id",
                table: "trending_metrics",
                column: "keyword_id",
                principalTable: "keywords",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_bookmarks_publications_publication_id",
                table: "bookmarks");

            migrationBuilder.DropForeignKey(
                name: "FK_bookmarks_users_user_id",
                table: "bookmarks");

            migrationBuilder.DropForeignKey(
                name: "FK_follows_users_user_id",
                table: "follows");

            migrationBuilder.DropForeignKey(
                name: "FK_notifications_publications_publication_id",
                table: "notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_notifications_users_user_id",
                table: "notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_publication_authors_authors_author_id",
                table: "publication_authors");

            migrationBuilder.DropForeignKey(
                name: "FK_publication_authors_publications_publication_id",
                table: "publication_authors");

            migrationBuilder.DropForeignKey(
                name: "FK_publication_keywords_keywords_keyword_id",
                table: "publication_keywords");

            migrationBuilder.DropForeignKey(
                name: "FK_publication_keywords_publications_publication_id",
                table: "publication_keywords");

            migrationBuilder.DropForeignKey(
                name: "FK_publications_journals_journal_id",
                table: "publications");

            migrationBuilder.DropForeignKey(
                name: "FK_sync_logs_users_triggered_by_user_id",
                table: "sync_logs");

            migrationBuilder.DropForeignKey(
                name: "FK_trending_metrics_keywords_keyword_id",
                table: "trending_metrics");

            migrationBuilder.DropTable(
                name: "admin_states");

            migrationBuilder.DropTable(
                name: "admin_support_tickets");

            migrationBuilder.DropTable(
                name: "payment_transactions");

            migrationBuilder.DropTable(
                name: "publication_submissions");

            migrationBuilder.DropIndex(
                name: "IX_sync_logs_triggered_by_user_id",
                table: "sync_logs");

            migrationBuilder.DropColumn(
                name: "email_verification_token",
                table: "users");

            migrationBuilder.DropColumn(
                name: "email_verification_token_expires_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "is_email_verified",
                table: "users");

            migrationBuilder.DropColumn(
                name: "is_pro",
                table: "users");

            migrationBuilder.DropColumn(
                name: "password_reset_token",
                table: "users");

            migrationBuilder.DropColumn(
                name: "password_reset_token_expires_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "plan",
                table: "users");

            migrationBuilder.DropColumn(
                name: "triggered_by_user_id",
                table: "sync_logs");

            migrationBuilder.DropColumn(
                name: "is_original",
                table: "publications");

            migrationBuilder.DropColumn(
                name: "notification_type",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "route",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "title",
                table: "notifications");

            migrationBuilder.RenameColumn(
                name: "role",
                table: "users",
                newName: "Role");

            migrationBuilder.RenameColumn(
                name: "email",
                table: "users",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "users",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "password_hash",
                table: "users",
                newName: "PasswordHash");

            migrationBuilder.RenameColumn(
                name: "is_deleted",
                table: "users",
                newName: "IsDeleted");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "users",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "full_name",
                table: "users",
                newName: "FullName");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "users",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_users_email",
                table: "users",
                newName: "IX_users_Email");

            migrationBuilder.RenameColumn(
                name: "year",
                table: "trending_metrics",
                newName: "Year");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "trending_metrics",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "trending_score",
                table: "trending_metrics",
                newName: "TrendingScore");

            migrationBuilder.RenameColumn(
                name: "publication_count",
                table: "trending_metrics",
                newName: "PublicationCount");

            migrationBuilder.RenameColumn(
                name: "keyword_id",
                table: "trending_metrics",
                newName: "KeywordId");

            migrationBuilder.RenameColumn(
                name: "calculated_at",
                table: "trending_metrics",
                newName: "CalculatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_trending_metrics_keyword_id_year",
                table: "trending_metrics",
                newName: "IX_trending_metrics_KeywordId_Year");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "sync_logs",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "sync_logs",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "started_at",
                table: "sync_logs",
                newName: "StartedAt");

            migrationBuilder.RenameColumn(
                name: "source_api",
                table: "sync_logs",
                newName: "SourceApi");

            migrationBuilder.RenameColumn(
                name: "records_synced",
                table: "sync_logs",
                newName: "RecordsSynced");

            migrationBuilder.RenameColumn(
                name: "finished_at",
                table: "sync_logs",
                newName: "FinishedAt");

            migrationBuilder.RenameColumn(
                name: "error_message",
                table: "sync_logs",
                newName: "ErrorMessage");

            migrationBuilder.RenameColumn(
                name: "title",
                table: "publications",
                newName: "Title");

            migrationBuilder.RenameColumn(
                name: "doi",
                table: "publications",
                newName: "DOI");

            migrationBuilder.RenameColumn(
                name: "abstract",
                table: "publications",
                newName: "Abstract");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "publications",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "synced_at",
                table: "publications",
                newName: "SyncedAt");

            migrationBuilder.RenameColumn(
                name: "source_api",
                table: "publications",
                newName: "SourceApi");

            migrationBuilder.RenameColumn(
                name: "publication_year",
                table: "publications",
                newName: "Year");

            migrationBuilder.RenameColumn(
                name: "mongo_metadata_id",
                table: "publications",
                newName: "MongoMetadataId");

            migrationBuilder.RenameColumn(
                name: "journal_id",
                table: "publications",
                newName: "JournalId");

            migrationBuilder.RenameColumn(
                name: "is_deleted",
                table: "publications",
                newName: "IsDeleted");

            migrationBuilder.RenameColumn(
                name: "citation_count",
                table: "publications",
                newName: "CitationCount");

            migrationBuilder.RenameIndex(
                name: "IX_publications_doi",
                table: "publications",
                newName: "IX_publications_DOI");

            migrationBuilder.RenameIndex(
                name: "IX_publications_journal_id",
                table: "publications",
                newName: "IX_publications_JournalId");

            migrationBuilder.RenameColumn(
                name: "keyword_id",
                table: "publication_keywords",
                newName: "KeywordId");

            migrationBuilder.RenameColumn(
                name: "publication_id",
                table: "publication_keywords",
                newName: "PublicationId");

            migrationBuilder.RenameIndex(
                name: "IX_publication_keywords_keyword_id",
                table: "publication_keywords",
                newName: "IX_publication_keywords_KeywordId");

            migrationBuilder.RenameColumn(
                name: "author_order",
                table: "publication_authors",
                newName: "AuthorOrder");

            migrationBuilder.RenameColumn(
                name: "author_id",
                table: "publication_authors",
                newName: "AuthorId");

            migrationBuilder.RenameColumn(
                name: "publication_id",
                table: "publication_authors",
                newName: "PublicationId");

            migrationBuilder.RenameIndex(
                name: "IX_publication_authors_author_id",
                table: "publication_authors",
                newName: "IX_publication_authors_AuthorId");

            migrationBuilder.RenameColumn(
                name: "message",
                table: "notifications",
                newName: "Message");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "notifications",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "notifications",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "publication_id",
                table: "notifications",
                newName: "PublicationId");

            migrationBuilder.RenameColumn(
                name: "is_read",
                table: "notifications",
                newName: "IsRead");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "notifications",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_notifications_user_id",
                table: "notifications",
                newName: "IX_notifications_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_notifications_publication_id",
                table: "notifications",
                newName: "IX_notifications_PublicationId");

            migrationBuilder.RenameColumn(
                name: "term",
                table: "keywords",
                newName: "Term");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "keywords",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "normalized_term",
                table: "keywords",
                newName: "NormalizedTerm");

            migrationBuilder.RenameIndex(
                name: "IX_keywords_normalized_term",
                table: "keywords",
                newName: "IX_keywords_NormalizedTerm");

            migrationBuilder.RenameColumn(
                name: "publisher",
                table: "journals",
                newName: "Publisher");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "journals",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "journals",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "issn_online",
                table: "journals",
                newName: "ISSNOnline");

            migrationBuilder.RenameColumn(
                name: "is_deleted",
                table: "journals",
                newName: "IsDeleted");

            migrationBuilder.RenameIndex(
                name: "IX_journals_issn_online",
                table: "journals",
                newName: "IX_journals_ISSNOnline");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "follows",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "follows",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "follow_type",
                table: "follows",
                newName: "FollowType");

            migrationBuilder.RenameColumn(
                name: "follow_target_name",
                table: "follows",
                newName: "FollowTargetName");

            migrationBuilder.RenameColumn(
                name: "follow_target_id",
                table: "follows",
                newName: "FollowTargetId");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "follows",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_follows_user_id",
                table: "follows",
                newName: "IX_follows_UserId");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "bookmarks",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "bookmarks",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "publication_id",
                table: "bookmarks",
                newName: "PublicationId");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "bookmarks",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_bookmarks_user_id",
                table: "bookmarks",
                newName: "IX_bookmarks_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_bookmarks_publication_id",
                table: "bookmarks",
                newName: "IX_bookmarks_PublicationId");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "authors",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "affiliation",
                table: "authors",
                newName: "Affiliation");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "authors",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "external_id",
                table: "authors",
                newName: "ExternalId");

            migrationBuilder.AlterColumn<int>(
                name: "Role",
                table: "users",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "users",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "trending_metrics",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<double>(
                name: "TrendingScore",
                table: "trending_metrics",
                type: "float",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "KeywordId",
                table: "trending_metrics",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "sync_logs",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<int>(
                name: "RecordsSynced",
                table: "sync_logs",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "publications",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<Guid>(
                name: "JournalId",
                table: "publications",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "KeywordId",
                table: "publication_keywords",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<Guid>(
                name: "PublicationId",
                table: "publication_keywords",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<Guid>(
                name: "AuthorId",
                table: "publication_authors",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<Guid>(
                name: "PublicationId",
                table: "publication_authors",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "notifications",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "notifications",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<Guid>(
                name: "PublicationId",
                table: "notifications",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "keywords",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "journals",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "follows",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "follows",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "FollowType",
                table: "follows",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "FollowTargetId",
                table: "follows",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "bookmarks",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "bookmarks",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<Guid>(
                name: "PublicationId",
                table: "bookmarks",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "authors",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddForeignKey(
                name: "FK_bookmarks_publications_PublicationId",
                table: "bookmarks",
                column: "PublicationId",
                principalTable: "publications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_bookmarks_users_UserId",
                table: "bookmarks",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_follows_users_UserId",
                table: "follows",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_notifications_publications_PublicationId",
                table: "notifications",
                column: "PublicationId",
                principalTable: "publications",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_notifications_users_UserId",
                table: "notifications",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_publication_authors_authors_AuthorId",
                table: "publication_authors",
                column: "AuthorId",
                principalTable: "authors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_publication_authors_publications_PublicationId",
                table: "publication_authors",
                column: "PublicationId",
                principalTable: "publications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_publication_keywords_keywords_KeywordId",
                table: "publication_keywords",
                column: "KeywordId",
                principalTable: "keywords",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_publication_keywords_publications_PublicationId",
                table: "publication_keywords",
                column: "PublicationId",
                principalTable: "publications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_publications_journals_JournalId",
                table: "publications",
                column: "JournalId",
                principalTable: "journals",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_trending_metrics_keywords_KeywordId",
                table: "trending_metrics",
                column: "KeywordId",
                principalTable: "keywords",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
