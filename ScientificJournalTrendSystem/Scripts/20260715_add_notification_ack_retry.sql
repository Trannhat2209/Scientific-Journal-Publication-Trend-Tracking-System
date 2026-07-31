SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('notifications', 'acknowledged_at') IS NULL ALTER TABLE notifications ADD acknowledged_at DATETIME2 NULL;
IF COL_LENGTH('notifications', 'next_attempt_at') IS NULL ALTER TABLE notifications ADD next_attempt_at DATETIME2 NULL;
IF COL_LENGTH('notifications', 'attempt_count') IS NULL ALTER TABLE notifications ADD attempt_count INT NOT NULL CONSTRAINT df_notifications_attempt_count DEFAULT 0;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_notifications_delivery_status_scheduled_at' AND object_id = OBJECT_ID('notifications'))
    DROP INDEX ix_notifications_delivery_status_scheduled_at ON notifications;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_notifications_delivery_due' AND object_id = OBJECT_ID('notifications'))
    CREATE INDEX ix_notifications_delivery_due ON notifications(delivery_status, scheduled_at, next_attempt_at);
GO
