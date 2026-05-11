# Como Compilar o Instalador do Versatto ERP

O instalador final é um único `.exe` gerado pelo **Inno Setup 6**.  
O cliente executa apenas esse arquivo — sem precisar instalar Node.js, PostgreSQL ou qualquer outra coisa.

---

## Pré-requisitos (na máquina do desenvolvedor)

| Ferramenta | Versão | Download |
|---|---|---|
| Inno Setup | 6.x | https://jrsoftware.org/isdl.php |
| Node.js | 20 LTS (zip) | https://nodejs.org/dist/v20.19.2/node-v20.19.2-win-x64.zip |
| PostgreSQL (binários) | 16.x (zip) | https://www.enterprisedb.com/download-postgresql-binaries |
| NSSM | 2.24 | https://nssm.cc/release/nssm-2.24.zip |

> **Nota:** Os links acima são as versões estáveis recomendadas em maio/2025.  
> Para Node.js, use sempre a versão **LTS** na variante `win-x64.zip` (sem instalador).  
> Para PostgreSQL, baixe os **binários** (`postgresql-16.x-binaries-win64.zip`), não o instalador.

---

## Passo a passo

### 1. Instalar o Inno Setup

Baixe e instale o Inno Setup 6 normalmente. Ele ficará disponível como `iscc.exe`  
(`C:\Program Files (x86)\Inno Setup 6\iscc.exe`).

---

### 2. Preparar os runtimes na pasta `installer/bundle/`

#### Node.js
```
1. Baixe node-v20.x.x-win-x64.zip
2. Extraia o conteúdo (a pasta interna node-v20.x.x-win-x64\)
3. Copie TODOS os arquivos para:  installer/bundle/node/
   Resultado esperado:
     installer/bundle/node/node.exe
     installer/bundle/node/npm.cmd
     installer/bundle/node/node_modules/...
```

#### PostgreSQL
```
1. Baixe postgresql-16.x-binaries-win64.zip do link acima
2. Extraia o arquivo — ele contém uma pasta chamada "pgsql"
3. Copie a pasta "pgsql" inteira para:  installer/bundle/pgsql/
   Resultado esperado:
     installer/bundle/pgsql/bin/postgres.exe
     installer/bundle/pgsql/bin/initdb.exe
     installer/bundle/pgsql/bin/pg_ctl.exe
     installer/bundle/pgsql/bin/psql.exe
     installer/bundle/pgsql/lib/...
     installer/bundle/pgsql/share/...
```

#### NSSM (gerenciador de serviços Windows)
```
1. Baixe nssm-2.24.zip
2. Extraia e abra a pasta win64\
3. Copie nssm.exe para:  installer/bundle/nssm/nssm.exe
   Resultado esperado:
     installer/bundle/nssm/nssm.exe
```

---

### 3. Compilar as dependências do backend

O `bcrypt` usa código nativo compilado. Por isso, o `node_modules` é **bundlado no instalador**  
e compilado uma única vez na sua máquina de desenvolvimento.

```bash
# Na raiz do projeto:
cd backend
npm install --omit=dev
```

> Use o **mesmo Node.js 20 LTS** que você colocou em `bundle/node/`.  
> Se estiver usando outra versão instalada no sistema, instale a v20 e use-a para este passo,  
> ou rode `npm install` com o próprio binário bundlado:
> ```
> installer\bundle\node\node.exe installer\bundle\node\node_modules\npm\bin\npm-cli.js install --omit=dev
> ```

---

### 4. Compilar o instalador

Abra o **Inno Setup Compiler** (interface gráfica) ou use a linha de comando:

```bat
"C:\Program Files (x86)\Inno Setup 6\iscc.exe" installer\setup.iss
```

O arquivo final será gerado em:
```
installer\dist\VersattoERP-Setup-v2.0.exe
```

---

## Estrutura esperada de `installer/bundle/` antes de compilar

```
installer/
  bundle/
    node/
      node.exe
      npm.cmd
      npx.cmd
      node_modules/
        npm/
        ...
    pgsql/
      bin/
        initdb.exe
        pg_ctl.exe
        postgres.exe
        psql.exe
        ...
      lib/  ...
      share/ ...
    nssm/
      nssm.exe
```

---

## O que o instalador faz no computador do cliente

1. **Wizard com 4 telas:** destino, senha do banco, portas de rede, tarefas
2. Extrai o app, Node.js, PostgreSQL e NSSM para o diretório escolhido
3. Inicializa o cluster PostgreSQL (`initdb`)
4. Registra e inicia o serviço `VersattoERP-DB` (PostgreSQL)
5. Cria o banco `versatto_erp` e executa o `schema.sql`
6. Gera o arquivo `.env` com as configurações do wizard e um `JWT_SECRET` aleatório
7. Registra e inicia o serviço `VersattoERP` (Node.js via NSSM)
8. Cria atalho na área de trabalho e no Menu Iniciar
9. (Opcional) abre o navegador na tela de login

**Serviços criados no Windows:**

| Serviço | Descrição |
|---|---|
| `VersattoERP-DB` | PostgreSQL — banco de dados interno |
| `VersattoERP` | Fastify — servidor web da aplicação |

Ambos os serviços são configurados para iniciar automaticamente com o Windows  
(se o usuário marcou a opção no wizard).

**Logs de instalação:** `<diretório_instalado>\logs\install.log`

---

## Desinstalação

Via **Painel de Controle → Programas e Recursos** ou pelo atalho no Menu Iniciar.  
O desinstalador para e remove os serviços automaticamente.

> Os dados do banco (`data/`) são removidos na desinstalação. Faça backup antes se necessário.

---

## Login padrão após instalação

| Campo | Valor |
|---|---|
| URL | http://localhost:5500/login.html |
| E-mail | admin@versatto.com |
| Senha | admin123 |

**Altere a senha no primeiro acesso** em Configurações → Usuários.
