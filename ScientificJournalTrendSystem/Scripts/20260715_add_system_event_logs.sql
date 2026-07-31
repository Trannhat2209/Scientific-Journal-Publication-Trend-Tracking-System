SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
GO

IF OBJECT_ID('system_event_logs', 'U') IS NULL
BEGIN
    CREATE TABLE system_event_logs
    (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_system_event_logs PRIMARY KEY,
        created_at DATETIME2 NOT NULL CONSTRAINT df_system_event_logs_created_at DEFAULT SYSUTCDATETIME(),
        category NVARCHAR(50) NOT NULL,
        level NVARCHAR(20) NOT NULL,
        event_code NVARCHAR(100) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        method NVARCHAR(12) NULL,
        path NVARCHAR(1000) NULL,
        status_code INT NULL,
        user_id INT NULL,
        actor NVARCHAR(256) NULL,
        ip_address NVARCHAR(64) NULL,
        user_agent NVARCHAR(1000) NULL,
        correlation_id NVARCHAR(100) NULL,
        metadata_json NVARCHAR(MAX) NULL
    );
    CREATE INDEX ix_system_event_logs_created_at ON system_event_logs(created_at DESC);
    CREATE INDEX ix_system_event_logs_category_level ON system_event_logs(category, level);
END;
GO
