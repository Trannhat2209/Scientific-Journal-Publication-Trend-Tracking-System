SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
GO

IF COL_LENGTH('notifications', 'scheduled_at') IS NULL ALTER TABLE notifications ADD scheduled_at DATETIME2 NULL;
IF COL_LENGTH('notifications', 'delivered_at') IS NULL ALTER TABLE notifications ADD delivered_at DATETIME2 NULL;
IF COL_LENGTH('notifications', 'read_at') IS NULL ALTER TABLE notifications ADD read_at DATETIME2 NULL;
IF COL_LENGTH('notifications', 'failed_at') IS NULL ALTER TABLE notifications ADD failed_at DATETIME2 NULL;
IF COL_LENGTH('notifications', 'delivery_status') IS NULL ALTER TABLE notifications ADD delivery_status NVARCHAR(30) NOT NULL CONSTRAINT df_notifications_delivery_status DEFAULT N'delivered';
IF COL_LENGTH('notifications', 'failure_reason') IS NULL ALTER TABLE notifications ADD failure_reason NVARCHAR(1000) NULL;
IF COL_LENGTH('notifications', 'batch_id') IS NULL ALTER TABLE notifications ADD batch_id UNIQUEIDENTIFIER NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_notifications_delivery_status_scheduled_at')
    CREATE INDEX ix_notifications_delivery_status_scheduled_at ON notifications(delivery_status, scheduled_at);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_notifications_batch_id')
    CREATE INDEX ix_notifications_batch_id ON notifications(batch_id);
GO

UPDATE notifications
SET delivery_status = N'delivered', delivered_at = COALESCE(delivered_at, created_at)
WHERE delivery_status IS NULL OR delivery_status = N'';
GO
