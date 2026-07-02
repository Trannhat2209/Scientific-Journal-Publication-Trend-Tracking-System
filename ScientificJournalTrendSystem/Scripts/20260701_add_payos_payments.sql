IF COL_LENGTH('users', 'plan') IS NULL
BEGIN
    ALTER TABLE users
        ADD [plan] NVARCHAR(20) NOT NULL
            CONSTRAINT df_users_plan DEFAULT 'Free';

    EXEC('UPDATE users SET [plan] = CASE WHEN is_pro = 1 THEN ''Pro'' ELSE ''Free'' END');
END
GO

IF OBJECT_ID('payment_transactions', 'U') IS NULL
BEGIN
    CREATE TABLE payment_transactions (
        id               INT            IDENTITY(1,1) NOT NULL,
        order_code       BIGINT         NOT NULL,
        payment_link_id  NVARCHAR(100)  NULL,
        checkout_url     NVARCHAR(1000) NULL,
        user_id          INT            NOT NULL,
        user_email       NVARCHAR(256)  NOT NULL,
        billing_cycle    NVARCHAR(20)   NOT NULL CONSTRAINT df_pt_cycle DEFAULT 'yearly',
        [plan]           NVARCHAR(20)   NOT NULL CONSTRAINT df_pt_plan DEFAULT 'Pro',
        amount           INT            NOT NULL,
        currency         NVARCHAR(10)   NOT NULL CONSTRAINT df_pt_currency DEFAULT 'VND',
        description      NVARCHAR(100)  NOT NULL,
        status           NVARCHAR(30)   NOT NULL CONSTRAINT df_pt_status DEFAULT 'PENDING',
        payos_reference  NVARCHAR(100)  NULL,
        raw_webhook_json NVARCHAR(MAX)  NULL,
        created_at       DATETIME2      NOT NULL CONSTRAINT df_pt_created DEFAULT GETUTCDATE(),
        expires_at       DATETIME2      NULL,
        paid_at          DATETIME2      NULL,
        updated_at       DATETIME2      NULL,

        CONSTRAINT pk_payment_transactions PRIMARY KEY (id),
        CONSTRAINT uq_payment_transactions_order UNIQUE (order_code),
        CONSTRAINT fk_pt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX ix_payment_transactions_user_email ON payment_transactions(user_email);
    CREATE INDEX ix_payment_transactions_status ON payment_transactions(status);
    CREATE INDEX ix_payment_transactions_payment_link_id ON payment_transactions(payment_link_id);
END
GO
