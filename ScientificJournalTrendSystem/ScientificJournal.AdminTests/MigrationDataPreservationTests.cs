using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Migrations;

namespace ScientificJournal.AdminTests;

public sealed class MigrationDataPreservationTests
{
    [Fact]
    public void Consolidation_migration_alters_existing_review_table_without_dropping_it()
    {
        var operations = new ConsolidationProbe().BuildOperations();
        var sql = string.Join("\n", operations.OfType<SqlOperation>().Select(item => item.Sql));
        Assert.Contains("IF OBJECT_ID('publication_reviews', 'U') IS NULL", sql);
        Assert.Contains("IF COL_LENGTH('publication_reviews', 'report_count') IS NULL", sql);
        Assert.DoesNotContain("DROP TABLE publication_reviews", sql, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task SqlServer_migration_preserves_an_existing_review_when_test_server_is_configured()
    {
        var baseConnection = Environment.GetEnvironmentVariable("SCHOLARTREND_TEST_SQLSERVER");
        if (string.IsNullOrWhiteSpace(baseConnection)) return;

        var databaseName = $"ScholarTrendMigrationTest_{Guid.NewGuid():N}";
        var masterBuilder = new SqlConnectionStringBuilder(baseConnection) { InitialCatalog = "master" };
        var testBuilder = new SqlConnectionStringBuilder(baseConnection) { InitialCatalog = databaseName };
        await using var master = new SqlConnection(masterBuilder.ConnectionString);
        await master.OpenAsync();
        await new SqlCommand($"CREATE DATABASE [{databaseName}]", master).ExecuteNonQueryAsync();
        try
        {
            var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlServer(testBuilder.ConnectionString).Options;
            await using var context = new AppDbContext(options);
            var migrator = context.Database.GetService<IMigrator>();
            await context.Database.ExecuteSqlRawAsync("""
                CREATE TABLE __EFMigrationsHistory (MigrationId NVARCHAR(150) NOT NULL PRIMARY KEY, ProductVersion NVARCHAR(32) NOT NULL);
                INSERT INTO __EFMigrationsHistory VALUES ('20260610020919_AlignDatabaseNamingConventions', '8.0.28');
                CREATE TABLE users (
                    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY, email NVARCHAR(320) NOT NULL,
                    password_hash NVARCHAR(MAX) NOT NULL, full_name NVARCHAR(200) NOT NULL,
                    role NVARCHAR(30) NOT NULL, is_active BIT NOT NULL, is_email_verified BIT NOT NULL,
                    verification_status NVARCHAR(30) NOT NULL, created_at DATETIME2 NOT NULL,
                    updated_at DATETIME2 NOT NULL, is_deleted BIT NOT NULL);
                INSERT INTO users (email, password_hash, full_name, role, is_active, is_email_verified, verification_status, created_at, updated_at, is_deleted)
                VALUES ('migration@test.edu', 'hash', 'Migration Test', 'Student', 1, 1, 'verified', SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
                DECLARE @userId INT = SCOPE_IDENTITY();
                CREATE TABLE publication_reviews (
                    id INT IDENTITY(1,1) PRIMARY KEY, publication_key NVARCHAR(300) NOT NULL,
                    publication_title NVARCHAR(500) NOT NULL, publication_authors NVARCHAR(1000) NOT NULL DEFAULT '',
                    publication_abstract NVARCHAR(MAX) NOT NULL DEFAULT '', publication_source NVARCHAR(300) NOT NULL DEFAULT '',
                    publication_year INT NULL, publication_doi NVARCHAR(300) NOT NULL DEFAULT '', publication_url NVARCHAR(1200) NOT NULL DEFAULT '',
                    user_id INT NOT NULL, credibility_rating INT NOT NULL, comment NVARCHAR(2000) NOT NULL,
                    reviewer_role NVARCHAR(30) NOT NULL, is_hidden BIT NOT NULL DEFAULT 0, moderation_reason NVARCHAR(500) NOT NULL DEFAULT '',
                    moderated_at DATETIME2 NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
                INSERT INTO publication_reviews (publication_key, publication_title, user_id, credibility_rating, comment, reviewer_role)
                VALUES ('preserve-me', 'Existing review', @userId, 5, 'Must survive migration', 'Student');
                """);
            await migrator.MigrateAsync();
            Assert.Equal(1, await context.Database.SqlQueryRaw<int>("SELECT COUNT(*) AS Value FROM publication_reviews WHERE publication_key = 'preserve-me'").SingleAsync());
        }
        finally
        {
            await new SqlCommand($"ALTER DATABASE [{databaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{databaseName}]", master).ExecuteNonQueryAsync();
        }
    }

    private sealed class ConsolidationProbe : RemovePaymentsSubmissionsAndAddReviewSchema
    {
        public IReadOnlyList<MigrationOperation> BuildOperations()
        {
            var builder = new MigrationBuilder("Microsoft.EntityFrameworkCore.SqlServer");
            base.Up(builder);
            return builder.Operations;
        }
    }
}
