using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScientificJournal.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AlignDatabaseNamingConventions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "authors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExternalId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Affiliation = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_authors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "journals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Publisher = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ISSNOnline = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_journals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "keywords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Term = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NormalizedTerm = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_keywords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "sync_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceApi = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecordsSynced = table.Column<int>(type: "int", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sync_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "publications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Abstract = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Year = table.Column<int>(type: "int", nullable: false),
                    DOI = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    JournalId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CitationCount = table.Column<int>(type: "int", nullable: false),
                    SourceApi = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MongoMetadataId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SyncedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_publications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_publications_journals_JournalId",
                        column: x => x.JournalId,
                        principalTable: "journals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "trending_metrics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    KeywordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    PublicationCount = table.Column<int>(type: "int", nullable: false),
                    TrendingScore = table.Column<double>(type: "float", nullable: false),
                    CalculatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trending_metrics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_trending_metrics_keywords_KeywordId",
                        column: x => x.KeywordId,
                        principalTable: "keywords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "follows",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FollowType = table.Column<int>(type: "int", nullable: false),
                    FollowTargetId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FollowTargetName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_follows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_follows_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bookmarks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PublicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bookmarks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bookmarks_publications_PublicationId",
                        column: x => x.PublicationId,
                        principalTable: "publications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_bookmarks_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PublicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_notifications_publications_PublicationId",
                        column: x => x.PublicationId,
                        principalTable: "publications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_notifications_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "publication_authors",
                columns: table => new
                {
                    PublicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuthorOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_publication_authors", x => new { x.PublicationId, x.AuthorId });
                    table.ForeignKey(
                        name: "FK_publication_authors_authors_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "authors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_publication_authors_publications_PublicationId",
                        column: x => x.PublicationId,
                        principalTable: "publications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "publication_keywords",
                columns: table => new
                {
                    PublicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    KeywordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_publication_keywords", x => new { x.PublicationId, x.KeywordId });
                    table.ForeignKey(
                        name: "FK_publication_keywords_keywords_KeywordId",
                        column: x => x.KeywordId,
                        principalTable: "keywords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_publication_keywords_publications_PublicationId",
                        column: x => x.PublicationId,
                        principalTable: "publications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_bookmarks_PublicationId",
                table: "bookmarks",
                column: "PublicationId");

            migrationBuilder.CreateIndex(
                name: "IX_bookmarks_UserId",
                table: "bookmarks",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_follows_UserId",
                table: "follows",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_journals_ISSNOnline",
                table: "journals",
                column: "ISSNOnline",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_keywords_NormalizedTerm",
                table: "keywords",
                column: "NormalizedTerm",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notifications_PublicationId",
                table: "notifications",
                column: "PublicationId");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_UserId",
                table: "notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_publication_authors_AuthorId",
                table: "publication_authors",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_publication_keywords_KeywordId",
                table: "publication_keywords",
                column: "KeywordId");

            migrationBuilder.CreateIndex(
                name: "IX_publications_DOI",
                table: "publications",
                column: "DOI",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_publications_JournalId",
                table: "publications",
                column: "JournalId");

            migrationBuilder.CreateIndex(
                name: "IX_trending_metrics_KeywordId_Year",
                table: "trending_metrics",
                columns: new[] { "KeywordId", "Year" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bookmarks");

            migrationBuilder.DropTable(
                name: "follows");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "publication_authors");

            migrationBuilder.DropTable(
                name: "publication_keywords");

            migrationBuilder.DropTable(
                name: "sync_logs");

            migrationBuilder.DropTable(
                name: "trending_metrics");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "authors");

            migrationBuilder.DropTable(
                name: "publications");

            migrationBuilder.DropTable(
                name: "keywords");

            migrationBuilder.DropTable(
                name: "journals");
        }
    }
}
