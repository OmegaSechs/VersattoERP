# Versatto ERP — v2.0

ERP para oficinas mecânicas com autenticação JWT, controle de estoque integrado, impressão de OS e relatório de faturamento.

---

## Pré-requisitos

| Requisito | Versão mínima |
|---|---|
| [Node.js](https://nodejs.org/) | 18+ |
| [PostgreSQL](https://www.postgresql.org/) | 13+ |

---

## Instalação passo a passo

### 1. Clone ou baixe o projeto

```bash
git clone <url-do-repositório>
cd VersattoERP-v2
```

### 2. Crie o banco de dados

Abra o terminal com acesso ao `psql` e execute:

```bash
psql -U postgres -c "CREATE DATABASE versatto_erp;"
psql -U postgres -d versatto_erp -f backend/schema.sql
```

Isso cria todas as tabelas e insere o **usuário admin padrão**:

| Campo | Valor |
|---|---|
| E-mail | admin@versatto.com |
| Senha | admin123 |

> **Importante:** troque a senha após o primeiro acesso em **Usuários → Editar**.

### 3. Configure as variáveis de ambiente

```bash
cp backend/.env.example backend/.env
```

Abra `backend/.env` e ajuste os valores:

```env
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=versatto_erp
DB_PASSWORD=sua_senha_aqui      # ← altere aqui
DB_PORT=5432

JWT_SECRET=troque_por_string_aleatoria_longa   # ← altere em produção
PORT=3000
ALLOWED_ORIGIN=*                # ← restrinja em produção (ex: https://minha-oficina.com.br)
```

Para gerar um JWT_SECRET seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Instale as dependências

```bash
cd backend
npm install
```

### 5. Inicie o servidor

```bash
# Modo desenvolvimento (reinicia automaticamente ao salvar)
npm run dev

# Modo produção
npm start
```

O servidor sobe em: **http://localhost:3000**

### 6. Acesse o sistema

Abra no navegador: **http://localhost:3000/login.html**

Use as credenciais do admin padrão para o primeiro acesso.

---

## Solução de problemas comuns

| Problema | Causa provável | Solução |
|---|---|---|
| `ECONNREFUSED` ao iniciar | PostgreSQL não está rodando | Inicie o serviço PostgreSQL |
| `password authentication failed` | Senha errada no `.env` | Corrija `DB_PASSWORD` no `.env` |
| `database "versatto_erp" does not exist` | Banco não foi criado | Execute o passo 2 novamente |
| Tela em branco no navegador | Servidor não iniciado | Verifique se `npm run dev` está rodando |
| `401 Unauthorized` na API | Token JWT expirado | Faça login novamente |

---

## O que há de novo na v2.0

| Módulo | O que foi feito |
|---|---|
| **Autenticação** | Login real com JWT (8h), proteção de todas as rotas, logout, perfis admin/operador |
| **Segurança** | Validação e sanitização em todas as rotas, tratamento de tipos, prevenção de dados corrompidos |
| **Estoque** | Baixa automática ao criar OS, reversão ao excluir, coluna situação (zerado/abaixo do mínimo/normal) |
| **Impressão de OS** | Página `imprimirOS.html` com layout A4, todos os dados + itens + total + campos de assinatura |
| **Relatório de faturamento** | Filtros por período e status, resumo (total OS, faturamento bruto, ticket médio), faturamento por mês, top 10 serviços e clientes, listagem detalhada |
| **Usuários** | Tela de gerenciamento (admin), criar/editar/desativar usuários, troca de senha |

---

## Rotas da API

### Autenticação

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/auth/login` | Público | Login — retorna JWT |
| GET | `/auth/me` | Token | Dados do usuário logado |
| PUT | `/auth/senha` | Token | Troca a própria senha |

### Usuários (somente admin)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/usuarios` | Lista todos os usuários |
| POST | `/usuarios` | Cria usuário |
| PUT | `/usuarios/:id` | Edita usuário |
| DELETE | `/usuarios/:id` | Remove usuário |

### Dados (todas requerem token JWT)

| Método | Rota | Descrição |
|---|---|---|
| GET / POST | `/pessoas` | Listar / Criar pessoa |
| GET / PUT / DELETE | `/pessoas/:id` | Detalhar / Editar / Excluir |
| GET | `/clientes` | Listar apenas clientes |
| GET | `/fornecedores` | Listar apenas fornecedores |
| GET / POST | `/veiculos` | Listar / Criar veículo |
| GET / PUT / DELETE | `/veiculos/:id` | Detalhar / Editar / Excluir |
| GET / POST | `/catalogo` | Listar / Criar item do catálogo |
| GET / PUT / DELETE | `/catalogo/:id` | Detalhar / Editar / Excluir |
| GET / POST | `/ordens-servico` | Listar / Criar OS |
| GET / PUT / DELETE | `/ordens-servico/:id` | Detalhar / Editar / Excluir OS |

### Relatórios (requerem token JWT)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/relatorios/faturamento` | Faturamento por período, top serviços e clientes |
| GET | `/relatorios/estoque` | Situação atual do estoque |
| GET | `/relatorios/os-abertas` | Ordens de serviço em aberto |

---

## Estrutura de arquivos

```
VersattoERP-v2/
├── backend/
│   ├── server.js                  ← Fastify + hook JWT global
│   ├── auth.js                    ← Middleware JWT
│   ├── validators.js              ← Sanitização e validação
│   ├── database.js                ← Pool PostgreSQL
│   ├── schema.sql                 ← DDL completo (tabelas + admin padrão)
│   ├── .env.example               ← Modelo de configuração
│   └── routes/
│       ├── authRoutes.js
│       ├── pessoasRoutes.js
│       ├── clientesRoutes.js
│       ├── fornecedoresRoutes.js
│       ├── veiculosRoutes.js
│       ├── catalogoRoutes.js
│       ├── ordensServicoRoutes.js ← Transações + baixa de estoque
│       └── relatoriosRoutes.js
└── frontend/public/
    ├── login.html                 ← Ponto de entrada
    ├── Home.html                  ← Dashboard
    ├── listaPessoas.html / CadPessoas.html
    ├── listaVeiculos.html / CadVeiculos.html
    ├── listaProdutos.html / CadastroProdutos.html
    ├── listaOS.html / CadastroOS.html
    ├── detalhes-os.html           ← Detalhes da OS
    ├── imprimirOS.html            ← Impressão / PDF da OS
    ├── Relatorios.html            ← Relatório de faturamento
    ├── usuarios.html              ← Gerenciar usuários (admin)
    └── assets/js/
        ├── api.js                 ← Fetch centralizado com JWT automático
        ├── script.js              ← Sidebar, footer, logout
        └── *.js                   ← Scripts por módulo
```
