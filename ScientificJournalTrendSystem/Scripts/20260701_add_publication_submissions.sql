IF OBJECT_ID('publication_submissions', 'U') IS NULL
BEGIN
    CREATE TABLE publication_submissions (
        id                       INT             IDENTITY(1,1) NOT NULL,
        submitter_user_id        INT             NULL,
        submitter_email          NVARCHAR(256)   NOT NULL,
        submitter_name           NVARCHAR(200)   NOT NULL,
        submitter_role           NVARCHAR(30)    NOT NULL,
        title                    NVARCHAR(500)   NOT NULL,
        authors_text             NVARCHAR(1000)  NOT NULL,
        keywords_text            NVARCHAR(1000)  NOT NULL,
        [abstract]               NVARCHAR(MAX)   NOT NULL,
        file_name                NVARCHAR(260)   NULL,
        file_content_type        NVARCHAR(120)   NULL,
        file_content             VARBINARY(MAX)  NULL,
        extracted_text           NVARCHAR(MAX)   NULL,
        similarity_percent       FLOAT           NOT NULL,
        matched_title            NVARCHAR(500)   NULL,
        matched_source           NVARCHAR(300)   NULL,
        matched_link             NVARCHAR(1000)  NULL,
        candidates_json          NVARCHAR(MAX)   NULL,
        status                   NVARCHAR(30)    NOT NULL CONSTRAINT df_pubsub_status DEFAULT 'pending',
        decision                 NVARCHAR(1000)  NOT NULL,
        rejected_reason          NVARCHAR(1000)  NULL,
        rejected_evidence        NVARCHAR(2000)  NULL,
        is_deleted               BIT             NOT NULL CONSTRAINT df_pubsub_deleted DEFAULT 0,
        published_publication_id INT             NULL,
        submitted_at             DATETIME2       NOT NULL CONSTRAINT df_pubsub_submitted DEFAULT GETUTCDATE(),
        reviewed_at              DATETIME2       NULL,
        reviewed_by_user_id      INT             NULL,

        CONSTRAINT pk_publication_submissions PRIMARY KEY (id),
        CONSTRAINT fk_pubsub_submitter_user FOREIGN KEY (submitter_user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_pubsub_reviewer_user FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id),
        CONSTRAINT fk_pubsub_publication FOREIGN KEY (published_publication_id) REFERENCES publications(id) ON DELETE SET NULL
    );

    CREATE INDEX ix_publication_submissions_status ON publication_submissions(status);
    CREATE INDEX ix_publication_submissions_submitter_email ON publication_submissions(submitter_email);
    CREATE INDEX ix_publication_submissions_submitted_at ON publication_submissions(submitted_at);
END
GO
