-- ============================================================
-- Parâmetros da empresa — tabela singleton (sempre id = 1)
-- Execute: psql -U postgres -d versatto_erp -f backend/migrations/add_parametros_empresa.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS parametros_empresa (
    id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nome_empresa    VARCHAR(200) NOT NULL DEFAULT 'Minha Oficina',
    slogan          VARCHAR(300) DEFAULT '',
    cnpj            VARCHAR(20)  DEFAULT '',
    telefone        VARCHAR(30)  DEFAULT '',
    email_empresa   VARCHAR(150) DEFAULT '',
    endereco        VARCHAR(300) DEFAULT '',
    cidade          VARCHAR(100) DEFAULT '',
    estado          VARCHAR(2)   DEFAULT '',
    atualizado_em   TIMESTAMP    DEFAULT NOW()
);

INSERT INTO parametros_empresa (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
