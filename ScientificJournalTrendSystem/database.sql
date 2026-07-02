-- ================================================================
--  Scientific Journal Publication Trend Tracking System
--  Database : ScientificJournalDB
--  Engine   : SQL Server 2019+ (INT IDENTITY, DATETIME2)
--  Encoding : Vietnamese_CI_AS
--
--  v7 (Integer Refactoring & Email Verification): Chuyển đổi khóa chính/ngoại
--  sang kiểu INT IDENTITY và thêm trường xác thực Email.
-- ================================================================

USE master;
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

-- Xóa DB cũ nếu tồn tại (tiện cho lần chạy lại)
IF EXISTS (SELECT 1 FROM sys.databases WHERE name = N'ScientificJournalDB')
BEGIN
    ALTER DATABASE ScientificJournalDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ScientificJournalDB;
END
GO

CREATE DATABASE ScientificJournalDB COLLATE Vietnamese_CI_AS;
GO

USE ScientificJournalDB;
GO
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

PRINT '>> Creating tables...';
GO

-- ================================================================
--  1. USERS (Bổ sung các trường xác thực Email & Premium)
-- ================================================================
CREATE TABLE users (
    id              INT                 IDENTITY(1,1)   NOT NULL,
    full_name       NVARCHAR(200)       NOT NULL,
    email           NVARCHAR(256)       NOT NULL,
    password_hash   NVARCHAR(500)       NOT NULL,
    role            NVARCHAR(20)        NOT NULL        CONSTRAINT df_users_role    DEFAULT 'Student',
    is_active       BIT                 NOT NULL        CONSTRAINT df_users_active  DEFAULT 1,
    is_deleted      BIT                 NOT NULL        CONSTRAINT df_users_del     DEFAULT 0,
    is_email_verified BIT               NOT NULL        CONSTRAINT df_users_verified DEFAULT 0,
    is_pro          BIT                 NOT NULL        CONSTRAINT df_users_pro      DEFAULT 0,
    [plan]          NVARCHAR(20)        NOT NULL        CONSTRAINT df_users_plan     DEFAULT 'Free',
    email_verification_token NVARCHAR(100) NULL,
    email_verification_token_expires_at DATETIME2 NULL,
    password_reset_token NVARCHAR(100) NULL,
    password_reset_token_expires_at DATETIME2 NULL,
    last_login_at   DATETIME2           NULL,
    created_at      DATETIME2           NOT NULL        CONSTRAINT df_users_cat     DEFAULT GETUTCDATE(),
    updated_at      DATETIME2           NULL,

    CONSTRAINT pk_users             PRIMARY KEY (id),
    CONSTRAINT uq_users_email       UNIQUE      (email),
    CONSTRAINT ck_users_role        CHECK       (role IN ('Admin','Researcher','Lecturer','Student'))
);
GO

-- ================================================================
--  1A. PAYMENT TRANSACTIONS (PayOS Pro upgrades)
-- ================================================================
CREATE TABLE payment_transactions (
    id              INT                 IDENTITY(1,1)   NOT NULL,
    order_code      BIGINT              NOT NULL,
    payment_link_id NVARCHAR(100)       NULL,
    checkout_url    NVARCHAR(1000)      NULL,
    user_id         INT                 NOT NULL,
    user_email      NVARCHAR(256)       NOT NULL,
    billing_cycle   NVARCHAR(20)        NOT NULL        CONSTRAINT df_pt_cycle DEFAULT 'yearly',
    [plan]          NVARCHAR(20)        NOT NULL        CONSTRAINT df_pt_plan DEFAULT 'Pro',
    amount          INT                 NOT NULL,
    currency        NVARCHAR(10)        NOT NULL        CONSTRAINT df_pt_currency DEFAULT 'VND',
    description     NVARCHAR(100)       NOT NULL,
    status          NVARCHAR(30)        NOT NULL        CONSTRAINT df_pt_status DEFAULT 'PENDING',
    payos_reference NVARCHAR(100)       NULL,
    raw_webhook_json NVARCHAR(MAX)      NULL,
    created_at      DATETIME2           NOT NULL        CONSTRAINT df_pt_created DEFAULT GETUTCDATE(),
    expires_at      DATETIME2           NULL,
    paid_at         DATETIME2           NULL,
    updated_at      DATETIME2           NULL,

    CONSTRAINT pk_payment_transactions PRIMARY KEY (id),
    CONSTRAINT uq_payment_transactions_order UNIQUE (order_code),
    CONSTRAINT fk_pt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

CREATE INDEX ix_payment_transactions_user_email ON payment_transactions(user_email);
CREATE INDEX ix_payment_transactions_status ON payment_transactions(status);
CREATE INDEX ix_payment_transactions_payment_link_id ON payment_transactions(payment_link_id);
GO

-- ================================================================
--  2. JOURNALS
-- ================================================================
CREATE TABLE journals (
    id           INT                 IDENTITY(1,1)   NOT NULL,
    name         NVARCHAR(500)       NOT NULL,
    publisher    NVARCHAR(300)       NULL,
    issn_online  NVARCHAR(20)        NULL,
    external_id  NVARCHAR(200)       NULL,
    is_deleted   BIT                 NOT NULL        CONSTRAINT df_journals_del DEFAULT 0,
    created_at   DATETIME2           NOT NULL        CONSTRAINT df_journals_cat DEFAULT GETUTCDATE(),
    updated_at   DATETIME2           NULL,

    CONSTRAINT pk_journals          PRIMARY KEY (id),
    CONSTRAINT uq_journals_issn     UNIQUE      (issn_online)
);
GO

-- ================================================================
--  3. PUBLICATIONS
-- ================================================================
CREATE TABLE publications (
    id                  INT                 IDENTITY(1,1)   NOT NULL,
    journal_id          INT                 NULL,
    external_paper_id   NVARCHAR(200)       NULL,
    title               NVARCHAR(1000)      NOT NULL,
    abstract            NVARCHAR(MAX)       NULL,
    publication_year    INT                 NOT NULL,
    doi                 NVARCHAR(300)       NULL,
    citation_count      INT                 NOT NULL        CONSTRAINT df_pub_cit   DEFAULT 0,
    source_api          NVARCHAR(50)        NOT NULL        CONSTRAINT df_pub_src   DEFAULT 'SemanticScholar',
    mongo_metadata_id   NVARCHAR(100)       NULL,
    synced_at           DATETIME2           NOT NULL        CONSTRAINT df_pub_sync  DEFAULT GETUTCDATE(),
    is_deleted          BIT                 NOT NULL        CONSTRAINT df_pub_del   DEFAULT 0,
    is_original         BIT                 NOT NULL        CONSTRAINT df_pub_orig  DEFAULT 0,
    created_at          DATETIME2           NOT NULL        CONSTRAINT df_pub_cat   DEFAULT GETUTCDATE(),
    updated_at          DATETIME2           NULL,

    CONSTRAINT pk_publications          PRIMARY KEY (id),
    CONSTRAINT uq_publications_doi      UNIQUE      (doi),
    CONSTRAINT ck_pub_year              CHECK       (publication_year BETWEEN 1900 AND 2100),
    CONSTRAINT fk_publications_journal  FOREIGN KEY (journal_id) REFERENCES journals(id)
                                        ON UPDATE NO ACTION ON DELETE SET NULL
);
GO

-- ================================================================
--  4. AUTHORS
-- ================================================================
CREATE TABLE authors (
    id           INT                 IDENTITY(1,1)   NOT NULL,
    name         NVARCHAR(300)       NOT NULL,
    external_id  NVARCHAR(200)       NULL,
    affiliation  NVARCHAR(500)       NULL,
    is_deleted   BIT                 NOT NULL        CONSTRAINT df_authors_del   DEFAULT 0,
    created_at   DATETIME2           NOT NULL        CONSTRAINT df_authors_cat   DEFAULT GETUTCDATE(),
    updated_at   DATETIME2           NULL,

    CONSTRAINT pk_authors PRIMARY KEY (id)
);
GO

-- ================================================================
--  5. PUBLICATION_AUTHORS
-- ================================================================
CREATE TABLE publication_authors (
    publication_id  INT                 NOT NULL,
    author_id       INT                 NOT NULL,
    author_order    INT                 NOT NULL    CONSTRAINT df_pa_order DEFAULT 1,

    CONSTRAINT pk_publication_authors   PRIMARY KEY (publication_id, author_id),
    CONSTRAINT fk_pa_publication        FOREIGN KEY (publication_id) REFERENCES publications(id)
                                        ON DELETE CASCADE,
    CONSTRAINT fk_pa_author             FOREIGN KEY (author_id)      REFERENCES authors(id)
                                        ON DELETE CASCADE
);
GO

-- ================================================================
--  6. KEYWORDS
-- ================================================================
CREATE TABLE keywords (
    id               INT                 IDENTITY(1,1)   NOT NULL,
    term             NVARCHAR(300)       NOT NULL,
    normalized_term  NVARCHAR(300)       NOT NULL,
    is_deleted       BIT                 NOT NULL        CONSTRAINT df_kw_del    DEFAULT 0,
    created_at       DATETIME2           NOT NULL        CONSTRAINT df_kw_cat    DEFAULT GETUTCDATE(),
    updated_at       DATETIME2           NULL,

    CONSTRAINT pk_keywords              PRIMARY KEY (id),
    CONSTRAINT uq_keywords_normalized   UNIQUE      (normalized_term)
);
GO

-- ================================================================
--  7. PUBLICATION_KEYWORDS
-- ================================================================
CREATE TABLE publication_keywords (
    publication_id  INT                 NOT NULL,
    keyword_id      INT                 NOT NULL,

    CONSTRAINT pk_publication_keywords  PRIMARY KEY (publication_id, keyword_id),
    CONSTRAINT fk_pk_publication        FOREIGN KEY (publication_id) REFERENCES publications(id)
                                        ON DELETE CASCADE,
    CONSTRAINT fk_pk_keyword            FOREIGN KEY (keyword_id)     REFERENCES keywords(id)
                                        ON DELETE CASCADE
);
GO

-- ================================================================
--  8. TRENDING_METRICS
-- ================================================================
CREATE TABLE trending_metrics (
    id                  INT                 IDENTITY(1,1)   NOT NULL,
    keyword_id          INT                 NOT NULL,
    year                INT                 NOT NULL,
    publication_count   INT                 NOT NULL        CONSTRAINT df_tm_cnt    DEFAULT 0,
    trending_score      DECIMAL(10,2)       NULL,
    calculated_at       DATETIME2           NOT NULL        CONSTRAINT df_tm_calc   DEFAULT GETUTCDATE(),

    CONSTRAINT pk_trending_metrics          PRIMARY KEY (id),
    CONSTRAINT uq_trending_keyword_year     UNIQUE      (keyword_id, year),
    CONSTRAINT fk_trending_keyword          FOREIGN KEY (keyword_id) REFERENCES keywords(id)
                                            ON DELETE CASCADE
);
GO

-- ================================================================
--  9. BOOKMARKS
-- ================================================================
CREATE TABLE bookmarks (
    id              INT                 IDENTITY(1,1)   NOT NULL,
    user_id         INT                 NOT NULL,
    publication_id  INT                 NOT NULL,
    created_at      DATETIME2           NOT NULL        CONSTRAINT df_bm_cat    DEFAULT GETUTCDATE(),

    CONSTRAINT pk_bookmarks             PRIMARY KEY (id),
    CONSTRAINT uq_bookmarks_user_pub    UNIQUE      (user_id, publication_id),
    CONSTRAINT fk_bm_user               FOREIGN KEY (user_id)           REFERENCES users(id)
                                        ON DELETE CASCADE,
    CONSTRAINT fk_bm_publication        FOREIGN KEY (publication_id)    REFERENCES publications(id)
                                        ON DELETE CASCADE
);
GO

-- ================================================================
--  10. FOLLOWS
-- ================================================================
CREATE TABLE follows (
    id                  INT                 IDENTITY(1,1)   NOT NULL,
    user_id             INT                 NOT NULL,
    follow_type         NVARCHAR(20)        NOT NULL,
    follow_target_id    INT                 NOT NULL,
    follow_target_name  NVARCHAR(300)       NOT NULL,
    created_at          DATETIME2           NOT NULL        CONSTRAINT df_fw_cat    DEFAULT GETUTCDATE(),

    CONSTRAINT pk_follows               PRIMARY KEY (id),
    CONSTRAINT uq_follows_user_type_tgt UNIQUE      (user_id, follow_type, follow_target_id),
    CONSTRAINT ck_follows_type          CHECK       (follow_type IN ('Keyword','Journal')),
    CONSTRAINT fk_fw_user               FOREIGN KEY (user_id) REFERENCES users(id)
                                        ON DELETE CASCADE
);
GO

-- ================================================================
--  11. NOTIFICATIONS
-- ================================================================
CREATE TABLE notifications (
    id              INT                 IDENTITY(1,1)   NOT NULL,
    user_id         INT                 NOT NULL,
    publication_id  INT                 NULL,
    message         NVARCHAR(500)       NOT NULL,
    notification_type NVARCHAR(50)      NOT NULL        CONSTRAINT df_nf_type   DEFAULT 'NEW_PUBLICATION',
    is_read         BIT                 NOT NULL        CONSTRAINT df_nf_read   DEFAULT 0,
    created_at      DATETIME2           NOT NULL        CONSTRAINT df_nf_cat    DEFAULT GETUTCDATE(),

    CONSTRAINT pk_notifications         PRIMARY KEY (id),
    CONSTRAINT ck_nf_type               CHECK       (notification_type IN ('NEW_PUBLICATION','TREND_ALERT','RECOMMENDATION','SYSTEM')),
    CONSTRAINT fk_nf_user               FOREIGN KEY (user_id)           REFERENCES users(id)
                                        ON DELETE CASCADE,
    CONSTRAINT fk_nf_publication        FOREIGN KEY (publication_id)    REFERENCES publications(id)
                                        ON DELETE SET NULL
);
GO

-- ================================================================
--  12. SYNC_LOGS
-- ================================================================
CREATE TABLE sync_logs (
    id                      INT                 IDENTITY(1,1)   NOT NULL,
    triggered_by_user_id    INT                 NULL,
    source_api              NVARCHAR(50)        NOT NULL,
    status                  NVARCHAR(20)        NOT NULL        CONSTRAINT df_sl_status DEFAULT 'Running',
    records_synced          INT                 NULL,
    error_message           NVARCHAR(MAX)       NULL,
    started_at              DATETIME2           NOT NULL        CONSTRAINT df_sl_start  DEFAULT GETUTCDATE(),
    finished_at             DATETIME2           NULL,

    CONSTRAINT pk_sync_logs             PRIMARY KEY (id),
    CONSTRAINT ck_sync_logs_status      CHECK       (status IN ('Running','Completed','Failed')),
    CONSTRAINT fk_sl_user               FOREIGN KEY (triggered_by_user_id) REFERENCES users(id)
                                        ON DELETE SET NULL
);
GO

-- ================================================================
--  INDEXES
-- ================================================================
PRINT '>> Creating indexes...';
GO

CREATE INDEX ix_pub_year        ON publications (publication_year);
CREATE INDEX ix_pub_journal     ON publications (journal_id);
CREATE INDEX ix_pub_source      ON publications (source_api);
CREATE INDEX ix_pub_deleted     ON publications (is_deleted)    WHERE is_deleted = 0;
CREATE INDEX ix_pub_synced      ON publications (synced_at      DESC);

CREATE UNIQUE INDEX uq_publications_external ON publications(external_paper_id) WHERE external_paper_id IS NOT NULL;
CREATE UNIQUE INDEX uq_journals_external ON journals(external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX uq_authors_external ON authors(external_id) WHERE external_id IS NOT NULL;

CREATE INDEX ix_pa_author       ON publication_authors  (author_id);
CREATE INDEX ix_pk_keyword      ON publication_keywords (keyword_id);

CREATE INDEX ix_tm_year         ON trending_metrics (year);
CREATE INDEX ix_tm_score        ON trending_metrics (trending_score DESC);

CREATE INDEX ix_bm_user         ON bookmarks      (user_id);
CREATE INDEX ix_fw_user         ON follows        (user_id);
CREATE INDEX ix_fw_type_target  ON follows        (follow_type, follow_target_id);
CREATE INDEX ix_nf_user_unread  ON notifications  (user_id, is_read)   WHERE is_read = 0;
CREATE INDEX ix_nf_user_all     ON notifications  (user_id, created_at DESC);

CREATE INDEX ix_sl_status       ON sync_logs (status);
CREATE INDEX ix_sl_started      ON sync_logs (started_at DESC);
GO

-- ================================================================
--  SEED DATA
-- ================================================================
PRINT '>> Seeding data...';
GO

SET IDENTITY_INSERT users ON;
INSERT INTO users (id, full_name, email, password_hash, role, is_email_verified, is_pro, [plan]) VALUES
(1, N'Nguyen Van Admin',  'admin@scijtrend.io',              '$2a$12$39eC79rFq37dF3vF7C38feO6GgUu.3eC.3rFq37dF3vF7C38feO6G', 'Admin', 1, 1, 'Pro'),
(2, N'Le Thi Minh',       'le.researcher@uni.edu.vn',        '$2a$12$39eC79rFq37dF3vF7C38feO6GgUu.3eC.3rFq37dF3vF7C38feO6G', 'Researcher', 1, 0, 'Free'),
(3, N'Tran Quoc Binh',    'tran.lecturer@hcmus.edu.vn',      '$2a$12$39eC79rFq37dF3vF7C38feO6GgUu.3eC.3rFq37dF3vF7C38feO6G', 'Lecturer', 1, 0, 'Free'),
(4, N'Pham Thi Lan',      'student01@student.hcmus.edu.vn',  '$2a$12$39eC79rFq37dF3vF7C38feO6GgUu.3eC.3rFq37dF3vF7C38feO6G', 'Student', 1, 0, 'Free'),
(5, N'Demo Researcher',   'demo.researcher@local.test',      '$2a$11$0NK5SsVUz4joZ4n2biOdzemEsmchErWdWn.VZnbk1awoF3mspueCi', 'Researcher', 1, 0, 'Free');
SET IDENTITY_INSERT users OFF;

SET IDENTITY_INSERT journals ON;
INSERT INTO journals (id, name, publisher, issn_online, external_id) VALUES
(1, N'Nature Machine Intelligence',               'Springer Nature',       '2522-5839', '12345'),
(2, N'IEEE Transactions on Neural Networks',      'IEEE',                  '2162-237X', '67890'),
(3, N'Journal of Artificial Intelligence Research','AI Access Foundation', '1076-9757', '11223');
SET IDENTITY_INSERT journals OFF;

SET IDENTITY_INSERT publications ON;
INSERT INTO publications
    (id, journal_id, title, abstract, publication_year, doi, citation_count, source_api, external_paper_id, is_original)
VALUES
(
    1, 2,
    N'Attention Is All You Need',
    N'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    2017, '10.48550/arXiv.1706.03762', 98420, 'SemanticScholar', 'paper_transformer_01', 1
),
(
    2, 1,
    N'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    N'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text.',
    2019, '10.18653/v1/N19-1423', 68310, 'SemanticScholar', 'paper_bert_01', 1
),
(
    3, 1,
    N'GPT-4 Technical Report',
    N'We report the development of GPT-4, a large-scale, multimodal model which can accept image and text inputs and produce text outputs. GPT-4 exhibits human-level performance on various professional and academic benchmarks.',
    2023, '10.48550/arXiv.2303.08774', 12540, 'SemanticScholar', 'paper_gpt4_01', 1
);
SET IDENTITY_INSERT publications OFF;

SET IDENTITY_INSERT authors ON;
INSERT INTO authors (id, name, external_id, affiliation) VALUES
(1, N'Ashish Vaswani', '2099584', 'Google Brain'),
(2, N'Jacob Devlin',   '3125149', 'Google AI'),
(3, N'OpenAI',         '1800422', 'OpenAI LP');
SET IDENTITY_INSERT authors OFF;

INSERT INTO publication_authors (publication_id, author_id, author_order) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1);

SET IDENTITY_INSERT keywords ON;
INSERT INTO keywords (id, term, normalized_term) VALUES
(1, 'Transformer',          'transformer'),
(2, 'Large Language Model', 'large language model'),
(3, 'Self-Attention',       'self-attention'),
(4, 'BERT',                 'bert'),
(5, 'GPT',                  'gpt');
SET IDENTITY_INSERT keywords OFF;

INSERT INTO publication_keywords (publication_id, keyword_id) VALUES
(1, 1), (1, 3),
(2, 1), (2, 4),
(3, 2), (3, 5);

SET IDENTITY_INSERT trending_metrics ON;
INSERT INTO trending_metrics (id, keyword_id, year, publication_count, trending_score) VALUES
(1, 1, 2020,  1240,    NULL ),
(2, 1, 2021,  2870,   131.50),
(3, 1, 2022,  5410,    88.50),
(4, 1, 2023,  9820,    81.50),
(5, 1, 2024, 14300,    45.60);
SET IDENTITY_INSERT trending_metrics OFF;

SET IDENTITY_INSERT bookmarks ON;
INSERT INTO bookmarks (id, user_id, publication_id, created_at) VALUES
(1, 4, 1, '2024-03-10 09:00:00'),
(2, 2, 3, '2024-11-02 14:30:00');
SET IDENTITY_INSERT bookmarks OFF;

SET IDENTITY_INSERT follows ON;
INSERT INTO follows (id, user_id, follow_type, follow_target_id, follow_target_name) VALUES
(1, 2, 'Keyword', 1,  'Transformer'),
(2, 3, 'Journal', 2,  N'IEEE Transactions on Neural Networks');
SET IDENTITY_INSERT follows OFF;

SET IDENTITY_INSERT notifications ON;
INSERT INTO notifications (id, user_id, publication_id, message, notification_type, is_read) VALUES
(1, 2, 3, N'New publication matched your followed keyword: Transformer', 'NEW_PUBLICATION', 0);
SET IDENTITY_INSERT notifications OFF;

SET IDENTITY_INSERT sync_logs ON;
INSERT INTO sync_logs
    (id, triggered_by_user_id, source_api, status, records_synced, started_at, finished_at)
VALUES
(1, 1, 'SemanticScholar', 'Completed', 1204, '2024-12-01 02:00:00', '2024-12-01 02:14:00'),
(2, NULL, 'OpenAlex', 'Failed', 0, '2024-12-02 02:00:00', '2024-12-02 02:01:00'),
(3, NULL, 'SemanticScholar', 'Completed', 890, '2024-12-03 02:00:00', '2024-12-03 02:11:00');
SET IDENTITY_INSERT sync_logs OFF;
GO

PRINT '>> Verifying row counts...';
SELECT t.name AS [Table], p.rows AS [Rows]
FROM sys.tables t
JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0,1)
ORDER BY t.name;
GO
