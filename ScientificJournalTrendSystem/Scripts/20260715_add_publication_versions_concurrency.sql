SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
GO

IF OBJECT_ID('publication_versions', 'U') IS NULL
BEGIN
    CREATE TABLE publication_versions
    (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_publication_versions PRIMARY KEY,
        publication_id INT NOT NULL,
        version_number INT NOT NULL,
        snapshot_json NVARCHAR(MAX) NOT NULL,
        change_type NVARCHAR(40) NOT NULL,
        changed_by_user_id INT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT df_publication_versions_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_publication_versions_publication FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE,
        CONSTRAINT fk_publication_versions_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT uq_publication_versions_number UNIQUE (publication_id, version_number)
    );
END;
GO
