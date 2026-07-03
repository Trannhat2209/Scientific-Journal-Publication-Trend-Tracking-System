IF COL_LENGTH('notifications', 'title') IS NULL
BEGIN
    ALTER TABLE notifications
    ADD title nvarchar(200) NOT NULL CONSTRAINT df_notifications_title DEFAULT('');
END
GO

IF COL_LENGTH('notifications', 'route') IS NULL
BEGIN
    ALTER TABLE notifications
    ADD route nvarchar(300) NULL;
END
GO

IF OBJECT_ID('admin_states', 'U') IS NULL
BEGIN
    CREATE TABLE admin_states (
        id int IDENTITY(1,1) NOT NULL CONSTRAINT pk_admin_states PRIMARY KEY,
        state_key nvarchar(80) NOT NULL,
        json_value nvarchar(max) NOT NULL,
        updated_by_user_id int NULL,
        updated_at datetime2 NOT NULL,
        CONSTRAINT fk_admin_states_users_updated_by_user_id
            FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE UNIQUE INDEX ix_admin_states_state_key ON admin_states(state_key);
    CREATE INDEX ix_admin_states_updated_by_user_id ON admin_states(updated_by_user_id);
END
GO

IF OBJECT_ID('admin_support_tickets', 'U') IS NULL
BEGIN
    CREATE TABLE admin_support_tickets (
        id int IDENTITY(1,1) NOT NULL CONSTRAINT pk_admin_support_tickets PRIMARY KEY,
        ticket_number nvarchar(40) NOT NULL,
        message nvarchar(2000) NOT NULL,
        status nvarchar(40) NOT NULL,
        created_by_user_id int NULL,
        created_at datetime2 NOT NULL,
        updated_at datetime2 NULL,
        CONSTRAINT fk_admin_support_tickets_users_created_by_user_id
            FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE UNIQUE INDEX ix_admin_support_tickets_ticket_number ON admin_support_tickets(ticket_number);
    CREATE INDEX ix_admin_support_tickets_created_by_user_id ON admin_support_tickets(created_by_user_id);
    CREATE INDEX ix_admin_support_tickets_status ON admin_support_tickets(status);
END
GO
