-- ============================================================
-- Módulo Financeiro — Versatto ERP v2
-- Execute: psql -U postgres -d versatto_erp -f backend/migrations/add_financeiro.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS contas_receber (
  id             SERIAL PRIMARY KEY,
  os_id          INTEGER REFERENCES ordem_servico(os_id) ON DELETE CASCADE,
  descricao      VARCHAR(200) NOT NULL,
  valor          NUMERIC(12,2) NOT NULL,
  vencimento     DATE NOT NULL,
  data_pagamento DATE,
  status         VARCHAR(20) NOT NULL DEFAULT 'pendente',
  observacoes    VARCHAR(500),
  criado_em      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contas_pagar (
  id             SERIAL PRIMARY KEY,
  fornecedor_id  INTEGER REFERENCES pessoas(pessoa_id) ON DELETE SET NULL,
  descricao      VARCHAR(200) NOT NULL,
  categoria      VARCHAR(100),
  valor          NUMERIC(12,2) NOT NULL,
  vencimento     DATE NOT NULL,
  data_pagamento DATE,
  status         VARCHAR(20) NOT NULL DEFAULT 'pendente',
  observacoes    VARCHAR(500),
  criado_em      TIMESTAMP DEFAULT NOW()
);
