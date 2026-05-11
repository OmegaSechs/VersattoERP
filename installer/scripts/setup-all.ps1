#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Configura o Versatto ERP após a extração dos arquivos pelo Inno Setup.
    Lê installer\config.json gravado pelo wizard.
#>

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'

# ── Caminhos ────────────────────────────────────────────────────────────────
$InstallDir = Split-Path $PSScriptRoot -Parent
$PgsqlBin   = "$InstallDir\pgsql\bin"
$NodeBin    = "$InstallDir\node"
$NssmExe    = "$InstallDir\nssm\nssm.exe"
$DataDir    = "$InstallDir\data"
$BackendDir = "$InstallDir\backend"
$LogDir     = "$InstallDir\logs"
$LogFile    = "$LogDir\install.log"

$SVC_DB  = 'VersattoERP-DB'
$SVC_APP = 'VersattoERP'

# ── Funções auxiliares ───────────────────────────────────────────────────────
function Write-Log {
    param([string]$Msg, [string]$Lv = 'INFO')
    $line = "[$(Get-Date -f 'yyyy-MM-dd HH:mm:ss')] [$Lv] $Msg"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
    Write-Host $line
}

function Wait-Port {
    param([int]$Port, [int]$TimeoutSec = 60)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $c = New-Object System.Net.Sockets.TcpClient('127.0.0.1', $Port)
            $c.Close()
            return $true
        } catch { Start-Sleep -Milliseconds 500 }
    }
    return $false
}

function Test-PortFree {
    param([int]$Port)
    try {
        $l = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
        $l.Start(); $l.Stop()
        return $true
    } catch { return $false }
}

function Remove-ServiceIfExists {
    param([string]$Name)
    if (Get-Service -Name $Name -ErrorAction SilentlyContinue) {
        Write-Log "Removendo serviço existente: $Name"
        Stop-Service -Name $Name -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        if ($Name -eq $SVC_APP) {
            & $NssmExe remove $Name confirm 2>$null
        } else {
            & "$PgsqlBin\pg_ctl.exe" unregister -N $Name 2>$null
        }
        Start-Sleep -Seconds 2
    }
}

# ── Início ───────────────────────────────────────────────────────────────────
try {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    Write-Log "========== Instalação do Versatto ERP v2.0 =========="
    Write-Log "Diretório: $InstallDir"

    # ── Lê configuração gerada pelo wizard ──────────────────────────────────
    $ConfigFile = "$PSScriptRoot\config.json"
    if (-not (Test-Path $ConfigFile)) {
        throw "Arquivo de configuração não encontrado: $ConfigFile"
    }
    $Cfg = Get-Content $ConfigFile -Raw | ConvertFrom-Json

    $DBPassword = $Cfg.dbPassword
    $DBPort     = [int]$Cfg.dbPort
    $AppPort    = [int]$Cfg.appPort
    $DBName     = $Cfg.dbName
    $DBUser     = $Cfg.dbUser
    $AutoStart  = [bool]$Cfg.autoStart

    # ── Verifica portas livres ───────────────────────────────────────────────
    Write-Log "Verificando disponibilidade das portas $AppPort e $DBPort"
    if (-not (Test-PortFree $DBPort)) {
        Write-Log "Porta $DBPort já está em uso. Tentando continuar..." 'WARN'
    }
    if (-not (Test-PortFree $AppPort)) {
        Write-Log "Porta $AppPort já está em uso. Tentando continuar..." 'WARN'
    }

    # ── Remove instalações anteriores se existirem ──────────────────────────
    Remove-ServiceIfExists $SVC_APP
    Remove-ServiceIfExists $SVC_DB

    # ── 1. Inicializar cluster PostgreSQL ────────────────────────────────────
    Write-Log "Inicializando cluster PostgreSQL em: $DataDir"

    $PgPassFile = "$PSScriptRoot\pgpass.tmp"
    [System.IO.File]::WriteAllText($PgPassFile, $DBPassword, [System.Text.Encoding]::UTF8)

    $initArgs = '-D', $DataDir,
                '-U', $DBUser,
                '-E', 'UTF8',
                '-A', 'md5',
                "--pwfile=$PgPassFile"

    $proc = Start-Process -FilePath "$PgsqlBin\initdb.exe" -ArgumentList $initArgs `
        -Wait -PassThru -NoNewWindow -RedirectStandardOutput "$LogDir\initdb.log" `
        -RedirectStandardError "$LogDir\initdb-err.log"

    Remove-Item $PgPassFile -Force -ErrorAction SilentlyContinue

    if ($proc.ExitCode -ne 0) {
        $errDetail = Get-Content "$LogDir\initdb-err.log" -Raw -ErrorAction SilentlyContinue
        throw "initdb falhou (código $($proc.ExitCode)): $errDetail"
    }

    # Configura a porta no postgresql.conf
    $PgConf = "$DataDir\postgresql.conf"
    (Get-Content $PgConf -Raw) -replace "(?m)^#?port\s*=\s*\d+", "port = $DBPort" |
        Set-Content $PgConf -Encoding UTF8

    Write-Log "Cluster PostgreSQL inicializado com sucesso"

    # ── 2. Registrar e iniciar serviço PostgreSQL ────────────────────────────
    Write-Log "Registrando serviço Windows: $SVC_DB"

    $pgCtlArgs = 'register', '-N', $SVC_DB, '-D', $DataDir, '-o', "-p $DBPort"
    $proc = Start-Process -FilePath "$PgsqlBin\pg_ctl.exe" -ArgumentList $pgCtlArgs `
        -Wait -PassThru -NoNewWindow
    if ($proc.ExitCode -ne 0) { throw "pg_ctl register falhou (código $($proc.ExitCode))" }

    $startType = if ($AutoStart) { 'Automatic' } else { 'Manual' }
    Set-Service -Name $SVC_DB -StartupType $startType

    Write-Log "Iniciando serviço $SVC_DB"
    Start-Service -Name $SVC_DB

    Write-Log "Aguardando PostgreSQL na porta $DBPort (até 60s)..."
    if (-not (Wait-Port -Port $DBPort -TimeoutSec 60)) {
        throw "Timeout aguardando o PostgreSQL iniciar na porta $DBPort"
    }
    Write-Log "PostgreSQL pronto"

    # ── 3. Criar banco de dados e executar schema.sql ────────────────────────
    Write-Log "Criando banco de dados '$DBName'"
    $env:PGPASSWORD = $DBPassword

    $psqlArgs = '-U', $DBUser, '-h', '127.0.0.1', '-p', $DBPort,
                '-c', "CREATE DATABASE $DBName ENCODING 'UTF8';"
    $proc = Start-Process -FilePath "$PgsqlBin\psql.exe" -ArgumentList $psqlArgs `
        -Wait -PassThru -NoNewWindow -RedirectStandardOutput "$LogDir\createdb.log" `
        -RedirectStandardError "$LogDir\createdb-err.log"
    if ($proc.ExitCode -ne 0) {
        $errDetail = Get-Content "$LogDir\createdb-err.log" -Raw -ErrorAction SilentlyContinue
        throw "Falha ao criar banco de dados: $errDetail"
    }

    Write-Log "Executando schema.sql"
    $schemaArgs = '-U', $DBUser, '-h', '127.0.0.1', '-p', $DBPort,
                  '-d', $DBName, '-f', "$BackendDir\schema.sql"
    $proc = Start-Process -FilePath "$PgsqlBin\psql.exe" -ArgumentList $schemaArgs `
        -Wait -PassThru -NoNewWindow -RedirectStandardOutput "$LogDir\schema.log" `
        -RedirectStandardError "$LogDir\schema-err.log"
    if ($proc.ExitCode -ne 0) {
        $errDetail = Get-Content "$LogDir\schema-err.log" -Raw -ErrorAction SilentlyContinue
        throw "Falha ao executar schema.sql: $errDetail"
    }

    $env:PGPASSWORD = $null
    Write-Log "Banco de dados criado e populado com sucesso"

    # ── 4. Criar arquivo .env ────────────────────────────────────────────────
    Write-Log "Gerando arquivo .env"
    $chars = (65..90) + (97..122) + (48..57)
    $JwtSecret = -join ($chars | Get-Random -Count 64 | ForEach-Object { [char]$_ })

    $EnvContent = @"
DB_USER=$DBUser
DB_HOST=127.0.0.1
DB_DATABASE=$DBName
DB_PASSWORD=$DBPassword
DB_PORT=$DBPort
JWT_SECRET=$JwtSecret
PORT=$AppPort
ALLOWED_ORIGIN=http://localhost:$AppPort
"@
    [System.IO.File]::WriteAllText("$BackendDir\.env", $EnvContent, [System.Text.Encoding]::UTF8)
    Write-Log "Arquivo .env criado"

    # ── 5. Criar serviço Windows para o servidor Node.js ────────────────────
    Write-Log "Criando serviço Windows: $SVC_APP"
    $NodeExe = "$NodeBin\node.exe"
    $ServerJs = "$BackendDir\server.js"

    & $NssmExe install        $SVC_APP $NodeExe $ServerJs
    & $NssmExe set $SVC_APP   AppDirectory      $BackendDir
    & $NssmExe set $SVC_APP   DisplayName       "Versatto ERP - Servidor Web"
    & $NssmExe set $SVC_APP   Description       "Servidor Fastify do Versatto ERP v2.0"
    & $NssmExe set $SVC_APP   AppStdout         "$LogDir\versatto.log"
    & $NssmExe set $SVC_APP   AppStderr         "$LogDir\versatto-error.log"
    & $NssmExe set $SVC_APP   AppRotateFiles    1
    & $NssmExe set $SVC_APP   AppRotateSeconds  86400
    & $NssmExe set $SVC_APP   AppRotateBytes    10485760
    & $NssmExe set $SVC_APP   DependOnService   $SVC_DB

    $svcStart = if ($AutoStart) { 'SERVICE_AUTO_START' } else { 'SERVICE_DEMAND_START' }
    & $NssmExe set $SVC_APP Start $svcStart

    Write-Log "Iniciando serviço $SVC_APP"
    Start-Service -Name $SVC_APP

    Write-Log "Aguardando servidor web na porta $AppPort (até 30s)..."
    if (Wait-Port -Port $AppPort -TimeoutSec 30) {
        Write-Log "Servidor iniciado com sucesso em http://localhost:$AppPort"
    } else {
        Write-Log "Servidor ainda não respondeu na porta $AppPort. Verifique $LogDir\versatto-error.log" 'WARN'
    }

    # ── 6. Limpeza de arquivos temporários ──────────────────────────────────
    Remove-Item "$PSScriptRoot\config.json" -Force -ErrorAction SilentlyContinue

    Write-Log "========== Instalação concluída com sucesso! =========="
    Write-Log "Acesse: http://localhost:$AppPort/login.html"
    Write-Log "Login: admin@versatto.com  /  Senha: admin123"
    Write-Log "(Altere a senha após o primeiro acesso)"

} catch {
    Write-Log "ERRO FATAL: $($_.Exception.Message)" 'ERROR'
    Write-Log "Stack: $($_.ScriptStackTrace)" 'ERROR'
    Write-Log "Verifique o log em: $LogFile" 'ERROR'

    # Rollback parcial
    $env:PGPASSWORD = $null
    Remove-Item "$PSScriptRoot\config.json"  -Force -ErrorAction SilentlyContinue
    Remove-Item "$PSScriptRoot\pgpass.tmp"   -Force -ErrorAction SilentlyContinue
    Stop-Service -Name $SVC_DB  -Force -ErrorAction SilentlyContinue
    if (Test-Path "$PgsqlBin\pg_ctl.exe") {
        & "$PgsqlBin\pg_ctl.exe" unregister -N $SVC_DB 2>$null
    }

    exit 1
}
