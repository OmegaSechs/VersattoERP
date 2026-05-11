-- Migração: quantidade_estoque passa de INTEGER para NUMERIC(10,2)
-- Necessário porque os_itens.quantidade é NUMERIC e o PostgreSQL falha ao inferir
-- o tipo do parâmetro $1 como INTEGER quando o valor é decimal (ex: 1.01).
ALTER TABLE catalogo_itens
  ALTER COLUMN quantidade_estoque TYPE NUMERIC(10,2);

ALTER TABLE catalogo_itens
  ALTER COLUMN quantidade_minima  TYPE NUMERIC(10,2);

ALTER TABLE catalogo_itens
  ALTER COLUMN quantidade_maxima  TYPE NUMERIC(10,2);
