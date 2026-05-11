#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Remove os serviços do Versatto ERP antes da desinstalação.
    Chamado pelo Inno Setup Uninstaller via [UninstallRun].
#>

$ErrorActionPreference = 'SilentlyContinue'

$InstallDir = Split-Path $PSScriptRoot -Parent
$PgsqlBin   = "$InstallDir\pgsql\bin"
$NssmExe    = "$InstallDir\nssm\nssm.exe"
$SVC_APP    = 'VersattoERP'
$SVC_DB     = 'VersattoERP-DB'

function Stop-And-Remove {
    param([string]$Name, [string]$Type)
    $svc = Get-Service -Name $Name -ErrorAction SilentlyContinue
    if (-not $svc) { return }

    if ($svc.Status -eq 'Running') {
        Stop-Service -Name $Name -Force
        Start-Sleep -Seconds 3
    }

    if ($Type -eq 'nssm') {
        & $NssmExe remove $Name confirm 2>$null
    } elseif ($Type -eq 'pg') {
        & "$PgsqlBin\pg_ctl.exe" unregister -N $Name 2>$null
    }
}

Stop-And-Remove -Name $SVC_APP -Type 'nssm'
Stop-And-Remove -Name $SVC_DB  -Type 'pg'

exit 0
