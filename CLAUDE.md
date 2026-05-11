# CLAUDE.md — Versatto ERP v2

Este arquivo fornece contexto essencial para o Claude Code trabalhar neste repositório.

---

## Visão Geral do Projeto

**Versatto ERP v2.0** é um sistema ERP para **oficinas mecânicas**, desenvolvido como trabalho de curso (Engenharia de Software / Design para Web).

- **Backend:** Fastify 5 + Node.js + PostgreSQL
- **Frontend:** HTML5 + CSS3 + JavaScript puro (sem framework)
- **Autenticação:** JWT (8h de expiração), perfis `admin` e `operador`; token armazenado em `localStorage` e enviado como `Authorization: Bearer` em todas as chamadas de API
- **E-mail do autor:** versattoerp@gmail.com

---

## Como Rodar

```bash
# 1. Banco de dados (uma única vez)
psql -U postgres -c "CREATE DATABASE versatto_erp;"
psql -U postgres -d versatto_erp -f backend/schema.sql
# schema.sql já inclui todas as tabelas e dados iniciais —
# as migrations abaixo só são necessárias em bancos criados antes de maio/2025:
# psql -U postgres -d versatto_erp -f backend/migrations/add_financeiro.sql
# psql -U postgres -d versatto_erp -f backend/migrations/fix_estoque_numeric.sql
# psql -U postgres -d versatto_erp -f backend/migrations/add_parametros_empresa.sql

# 2. Ambiente
cp backend/.env.example backend/.env
# Edite backend/.env com a senha do seu PostgreSQL

# 3. Dependências e servidor
cd backend
npm install
npm run dev        # porta padrão: 5500 (configurável via PORT no .env)
```

Acesse: **http://localhost:5500/login.html**
Login padrão: `admin@versatto.com` / `admin123`

> **Ambiente local:** `PORT=5500`, `DB_PASSWORD=123456`, `DB_DATABASE=versatto_erp`

---

## Variáveis de Ambiente (backend/.env)

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_USER` | postgres | Usuário PostgreSQL |
| `DB_HOST` | localhost | Host do banco |
| `DB_DATABASE` | versatto_erp | Nome do banco |
| `DB_PASSWORD` | — | Senha PostgreSQL |
| `DB_PORT` | 5432 | Porta PostgreSQL |
| `JWT_SECRET` | *(trocar!)* | Chave de assinatura JWT |
| `PORT` | 5500 | Porta do servidor Fastify |
| `ALLOWED_ORIGIN` | * | CORS — restringir em produção |

---

## Arquivos Chave

```
backend/
  server.js               ← Entrada principal — registra rotas e hook JWT global
  auth.js                 ← Middleware: verificarToken(), requerAdmin()
  validators.js           ← Sanitização e validação de entrada
  database.js             ← Pool de conexão PostgreSQL (pg)
  schema.sql              ← DDL completo + usuário admin padrão
  migrations/
    add_financeiro.sql        ← (legado) Cria contas_receber e contas_pagar — já no schema.sql
    fix_estoque_numeric.sql   ← (legado) Converte quantidade_estoque/minima/maxima para NUMERIC — já no schema.sql
    add_parametros_empresa.sql← (legado) Cria parametros_empresa — já no schema.sql
  routes/
    authRoutes.js         ← /auth/login (retorna { token, usuario }), /auth/me, /auth/senha, /usuarios
    pessoasRoutes.js      ← CRUD /pessoas (clientes + fornecedores + geral)
    clientesRoutes.js     ← GET /clientes (filtro: is_cliente=true)
    fornecedoresRoutes.js ← GET /fornecedores (filtro: is_fornecedor=true)
    veiculosRoutes.js     ← CRUD /veiculos
    catalogoRoutes.js     ← CRUD /catalogo (produtos, serviços, materiais)
    ordensServicoRoutes.js← CRUD /ordens-servico + baixa/reversão estoque + parcelas
    relatoriosRoutes.js   ← GET /relatorios/faturamento|estoque|os-abertas
    financeiroRoutes.js   ← CRUD /financeiro/receber|pagar + GET /financeiro/relatorio
    parametrosRoutes.js   ← GET /parametros (todos) + PUT /parametros (admin)

frontend/public/
  login.html              ← Ponto de entrada do frontend
  Home.html               ← Dashboard: KPIs, OS abertas, alertas de estoque, dados da empresa
  parametros.html         ← Configuração da empresa (nome, slogan, CNPJ etc.) — somente admin
  ContasReceber.html      ← Lista/gerencia contas a receber
  ContasPagar.html        ← Lança e gerencia contas a pagar
  RelatorioFinanceiro.html← Relatório financeiro com saldo previsto e vencidos
  assets/js/api.js        ← Camada fetch centralizada; Auth.salvar(usuario, token), Auth.token(); apiFetch envia Authorization: Bearer
  assets/js/script.js     ← Sidebar, footer, logout; oculta links data-admin para operadores
  assets/js/cadastrarOS.js← Cria OS com itens e parcelamento
  assets/js/listarOS.js   ← Lista OS; modal de edição com itens e parcelas
```

---

## Banco de Dados — Tabelas

| Tabela | Descrição |
|---|---|
| `pessoas` | Pessoas físicas e jurídicas (clientes e/ou fornecedores) |
| `veiculos` | Veículos vinculados a clientes |
| `catalogo_itens` | Catálogo: serviços (1), produtos (2), materiais (3); colunas de quantidade são `NUMERIC(10,2)` |
| `ordem_servico` | Ordens de serviço e orçamentos |
| `os_itens` | Itens de linha de cada OS |
| `usuarios` | Usuários do sistema (admin / operador) |
| `contas_receber` | Parcelas/recebimentos; FK `os_id` ON DELETE CASCADE |
| `contas_pagar` | Contas a pagar manuais; FK opcional `fornecedor_id` |
| `parametros_empresa` | Singleton (id=1): nome, slogan, CNPJ, telefone, e-mail e endereço da empresa |

**Estoque:** apenas `tipo 2` (produto) e `tipo 3` (material) movimentam `quantidade_estoque`.

> **Atenção de tipo:** `quantidade_estoque` é `NUMERIC(10,2)`. Nos `UPDATE catalogo_itens` sempre usar cast explícito `$1::NUMERIC` para evitar erro de inferência de tipo do PostgreSQL quando o parâmetro é decimal.

---

## Regras de Negócio Críticas

1. **Baixa automática de estoque** ao criar OS — revertida ao excluir ou editar.
2. **Transações PostgreSQL** em toda operação de OS para garantir atomicidade.
3. **Admins não podem se auto-excluir** — verificação em `DELETE /usuarios/:id`.
4. **OS tipo `orcamento`** não gera faturamento nos relatórios nem parcelas financeiras.
5. **Campos `placa` e `email`** têm constraint `UNIQUE` no banco.
6. **JWT** é verificado em um `preHandler` global (`auth.js`). O token é lido do header `Authorization: Bearer <token>` (preferencial) ou do cookie `versatto_jwt` (fallback). O login retorna `{ token, usuario }` — o frontend persiste o token em `localStorage` e o envia em toda chamada via `apiFetch`. Rotas públicas listadas em `auth.js`.
7. **Parcelamento de OS:** ao criar uma OS do tipo `ordem_servico`, o frontend pode enviar `parcelas[]` que são inseridas em `contas_receber` na mesma transação.
8. **PUT financeiro usa COALESCE** — campos não enviados preservam o valor atual (suporta atualizações parciais como "marcar pago").
9. **Exclusão de OS** cascateia para `contas_receber` (ON DELETE CASCADE).

---

## Módulo Financeiro — Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/financeiro/receber` | Lista contas a receber; filtros: `status`, `de`, `ate`, `os_id`, `cliente_id`, `cliente_nome` (ILIKE) |
| POST | `/financeiro/receber` | Cria conta a receber manual |
| PUT | `/financeiro/receber/:id` | Atualiza (parcial via COALESCE) — usado para marcar pago/cancelado |
| DELETE | `/financeiro/receber/:id` | Remove |
| GET | `/financeiro/pagar` | Lista contas a pagar; filtros: `status`, `de`, `ate` |
| POST | `/financeiro/pagar` | Cria conta a pagar |
| PUT | `/financeiro/pagar/:id` | Atualiza (parcial via COALESCE) |
| DELETE | `/financeiro/pagar/:id` | Remove |
| GET | `/financeiro/relatorio` | Resumo por status + vencidos globais; filtros: `de`, `ate` |

---

## Módulo Parâmetros — Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/parametros` | Retorna os dados da empresa (qualquer usuário autenticado) |
| PUT | `/parametros` | Atualiza dados da empresa via COALESCE (somente admin) |

`GET /parametros` retorna: `nome_empresa`, `slogan`, `cnpj`, `telefone`, `email_empresa`, `endereco`, `cidade`, `estado`, `atualizado_em`.

---

## Convenções de Código

- **Backend:** rotas em `routes/`, sem lógica de negócio em `server.js`.
- **Frontend:** cada entidade tem par `lista*.html` + `Cad*.html` e par `listar*.js` + `cadastrar*.js`. Exceções: telas financeiras têm JS inline (simples o suficiente).
- `api.js` é sempre incluído antes de qualquer script de página no frontend.
- Comentários apenas quando o "porquê" não é óbvio — sem blocos explicativos.
- Sem abstrações prematuras — manter código direto e simples.

---

## Preferências do Usuário

- Idioma de trabalho: **Português Brasileiro**.
- Projeto didático — manter código legível e sem over-engineering.
- Não criar arquivos de documentação extras além do solicitado.
