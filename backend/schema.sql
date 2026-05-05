-- ============================================================
-- Versatto ERP — Schema completo v2
-- Execute: psql -U postgres -d versatto_erp -f schema.sql
-- ============================================================

-- Pessoas
CREATE TABLE IF NOT EXISTS pessoas (
    pessoa_id          SERIAL PRIMARY KEY,
    nome               VARCHAR(200) NOT NULL,
    cpf_cnpj           VARCHAR(20),
    email              VARCHAR(150),
    telefone           VARCHAR(20),
    celular            VARCHAR(20),
    rua                VARCHAR(200),
    numero             VARCHAR(20),
    bairro             VARCHAR(100),
    cidade             VARCHAR(100),
    estado             VARCHAR(2),
    cep                VARCHAR(10),
    complemento        VARCHAR(100),
    nome_fantasia      VARCHAR(200),
    inscricao_estadual VARCHAR(30),
    is_cliente         BOOLEAN DEFAULT false,
    is_fornecedor      BOOLEAN DEFAULT false,
    is_pessoa_fisica   BOOLEAN DEFAULT true,
    is_pessoa_juridica BOOLEAN DEFAULT false,
    criado_em          TIMESTAMP DEFAULT NOW(),
    atualizado_em      TIMESTAMP DEFAULT NOW()
);

-- Veículos
CREATE TABLE IF NOT EXISTS veiculos (
    id            SERIAL PRIMARY KEY,
    cliente_id    INTEGER REFERENCES pessoas(pessoa_id) ON DELETE SET NULL,
    marca         VARCHAR(100),
    modelo        VARCHAR(100),
    ano           INTEGER,
    placa         VARCHAR(10) NOT NULL UNIQUE,
    cor           VARCHAR(50),
    quilometragem NUMERIC(10,2),
    observacoes   TEXT,
    criado_em     TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Catálogo (Produtos / Serviços / Materiais)
CREATE TABLE IF NOT EXISTS catalogo_itens (
    id                 SERIAL PRIMARY KEY,
    nome               VARCHAR(200) NOT NULL,
    tipo               INTEGER,          -- 1=Serviço  2=Produto  3=Material
    preco_padrao       NUMERIC(12,2),
    preco_custo        NUMERIC(12,2),
    unidade_medida     VARCHAR(20),
    descricao          TEXT,
    quantidade_minima  INTEGER DEFAULT 0,
    quantidade_maxima  INTEGER DEFAULT 0,
    quantidade_estoque INTEGER DEFAULT 0,
    criado_em          TIMESTAMP DEFAULT NOW(),
    atualizado_em      TIMESTAMP DEFAULT NOW()
);

-- Ordens de Serviço
CREATE TABLE IF NOT EXISTS ordem_servico (
    os_id         SERIAL PRIMARY KEY,
    cliente_id    INTEGER REFERENCES pessoas(pessoa_id) ON DELETE SET NULL,
    veiculo_id    INTEGER REFERENCES veiculos(id) ON DELETE SET NULL,
    veiculo       VARCHAR(200),
    placa         VARCHAR(10),
    os_dt_entrada DATE,
    os_dt_saida   DATE,
    os_hr_entrada TIME,
    os_hr_saida   TIME,
    tipo          VARCHAR(50),               -- 'orcamento' | 'ordem_servico'
    status        VARCHAR(30) DEFAULT 'aberta',  -- aberta | em_andamento | concluida | cancelada
    valor_total   NUMERIC(12,2) DEFAULT 0,
    observacoes   TEXT,
    criado_em     TIMESTAMP DEFAULT NOW()
);

-- Itens da OS
CREATE TABLE IF NOT EXISTS os_itens (
    id             SERIAL PRIMARY KEY,
    os_id          INTEGER REFERENCES ordem_servico(os_id) ON DELETE CASCADE,
    catalogo_id    INTEGER REFERENCES catalogo_itens(id) ON DELETE SET NULL,
    nome           VARCHAR(200),
    quantidade     NUMERIC(10,2) DEFAULT 1,
    valor_unitario NUMERIC(12,2),
    subtotal       NUMERIC(12,2),
    criado_em      TIMESTAMP DEFAULT NOW()
);

-- Usuários do sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id         SERIAL PRIMARY KEY,
    nome       VARCHAR(150) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil     VARCHAR(30) DEFAULT 'operador',  -- 'admin' | 'operador'
    ativo      BOOLEAN DEFAULT true,
    criado_em  TIMESTAMP DEFAULT NOW()
);

-- ── Migrações seguras (tabelas que já podem existir) ──────────────────────────

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='ordem_servico' AND column_name='status') THEN
        ALTER TABLE ordem_servico ADD COLUMN status VARCHAR(30) DEFAULT 'aberta';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='ordem_servico' AND column_name='valor_total') THEN
        ALTER TABLE ordem_servico ADD COLUMN valor_total NUMERIC(12,2) DEFAULT 0;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='ordem_servico' AND column_name='observacoes') THEN
        ALTER TABLE ordem_servico ADD COLUMN observacoes TEXT;
    END IF;
END $$;

-- Usuário admin padrão (senha: admin123) — troque após o primeiro acesso
-- Hash gerado com bcrypt rounds=10
INSERT INTO usuarios (nome, email, senha_hash, perfil)
SELECT 'Administrador', 'admin@versatto.com',
       '$2b$10$EJHDnVsHH75wuFKCUhuQfeCmcCArgb0mMF.ePp///jJ/J394ROBG2',
       'admin'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@versatto.com');
