using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScientificJournal.DataAccess.Migrations;

public partial class RemovePaymentsSubmissionsAndAddReviewSchema : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID('publication_reviews', 'U') IS NULL
            BEGIN
                CREATE TABLE publication_reviews (
                    id INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_publication_reviews PRIMARY KEY,
                    publication_key NVARCHAR(300) NOT NULL,
                    publication_title NVARCHAR(500) NOT NULL,
                    publication_authors NVARCHAR(1000) NOT NULL CONSTRAINT df_publication_reviews_authors DEFAULT '',
                    publication_abstract NVARCHAR(MAX) NOT NULL CONSTRAINT df_publication_reviews_abstract DEFAULT '',
                    publication_source NVARCHAR(300) NOT NULL CONSTRAINT df_publication_reviews_source DEFAULT '',
                    publication_year INT NULL,
                    publication_doi NVARCHAR(300) NOT NULL CONSTRAINT df_publication_reviews_doi DEFAULT '',
                    publication_url NVARCHAR(1200) NOT NULL CONSTRAINT df_publication_reviews_url DEFAULT '',
                    user_id INT NOT NULL,
                    credibility_rating INT NOT NULL,
                    comment NVARCHAR(2000) NOT NULL,
                    reviewer_role NVARCHAR(30) NOT NULL,
                    is_hidden BIT NOT NULL CONSTRAINT df_publication_reviews_hidden DEFAULT 0,
                    moderation_reason NVARCHAR(500) NOT NULL CONSTRAINT df_publication_reviews_reason DEFAULT '',
                    moderated_at DATETIME2 NULL,
                    created_at DATETIME2 NOT NULL CONSTRAINT df_publication_reviews_created DEFAULT SYSUTCDATETIME(),
                    updated_at DATETIME2 NOT NULL CONSTRAINT df_publication_reviews_updated DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT fk_publication_reviews_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    CONSTRAINT ck_publication_reviews_rating CHECK (credibility_rating BETWEEN 1 AND 5),
                    CONSTRAINT ux_publication_reviews_user_key UNIQUE (user_id, publication_key)
                );
                CREATE INDEX ix_publication_reviews_key ON publication_reviews(publication_key);
            END;

            IF COL_LENGTH('users', 'is_institutional_email_verified') IS NULL ALTER TABLE users ADD is_institutional_email_verified BIT NOT NULL CONSTRAINT df_users_institutional_email_verified DEFAULT 0;
            IF COL_LENGTH('users', 'institutional_email_verification_token') IS NULL ALTER TABLE users ADD institutional_email_verification_token NVARCHAR(100) NULL;
            IF COL_LENGTH('users', 'institutional_email_verification_token_expires_at') IS NULL ALTER TABLE users ADD institutional_email_verification_token_expires_at DATETIME2 NULL;
            IF COL_LENGTH('users', 'review_restricted_until') IS NULL ALTER TABLE users ADD review_restricted_until DATETIME2 NULL;
            IF COL_LENGTH('publication_reviews', 'report_count') IS NULL ALTER TABLE publication_reviews ADD report_count INT NOT NULL CONSTRAINT df_publication_reviews_report_count DEFAULT 0;
            IF COL_LENGTH('publication_reviews', 'moderation_status') IS NULL ALTER TABLE publication_reviews ADD moderation_status NVARCHAR(30) NOT NULL CONSTRAINT df_publication_reviews_status DEFAULT 'visible';

            IF OBJECT_ID('publication_review_reports', 'U') IS NULL
            BEGIN
                CREATE TABLE publication_review_reports (
                    id INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_publication_review_reports PRIMARY KEY,
                    review_id INT NOT NULL,
                    reporter_user_id INT NOT NULL,
                    reason NVARCHAR(500) NOT NULL,
                    status NVARCHAR(30) NOT NULL CONSTRAINT df_review_reports_status DEFAULT 'reported',
                    created_at DATETIME2 NOT NULL CONSTRAINT df_review_reports_created DEFAULT SYSUTCDATETIME(),
                    resolved_at DATETIME2 NULL,
                    CONSTRAINT fk_review_reports_review FOREIGN KEY (review_id) REFERENCES publication_reviews(id) ON DELETE CASCADE,
                    CONSTRAINT fk_review_reports_user FOREIGN KEY (reporter_user_id) REFERENCES users(id),
                    CONSTRAINT ux_review_reports_reporter UNIQUE (review_id, reporter_user_id)
                );
            END;

            IF OBJECT_ID('publication_review_moderation_events', 'U') IS NULL
            BEGIN
                CREATE TABLE publication_review_moderation_events (
                    id INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_review_moderation_events PRIMARY KEY,
                    review_id INT NOT NULL,
                    moderator_user_id INT NOT NULL,
                    action NVARCHAR(40) NOT NULL,
                    reason NVARCHAR(500) NOT NULL,
                    created_at DATETIME2 NOT NULL CONSTRAINT df_review_events_created DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT fk_review_events_review FOREIGN KEY (review_id) REFERENCES publication_reviews(id) ON DELETE CASCADE
                );
            END;

            IF OBJECT_ID('payment_transactions', 'U') IS NOT NULL DROP TABLE payment_transactions;
            IF OBJECT_ID('publication_submissions', 'U') IS NOT NULL DROP TABLE publication_submissions;
            IF COL_LENGTH('users', 'is_pro') IS NOT NULL ALTER TABLE users DROP COLUMN [is_pro];
            IF COL_LENGTH('users', 'plan') IS NOT NULL ALTER TABLE users DROP COLUMN [plan];
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally irreversible for removed legacy features. Review data is
        // never dropped by this migration's rollback path.
    }
}
