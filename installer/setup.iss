; ==============================================================
;  Versatto ERP v2.0  —  Inno Setup 6
;  Compilar com: Inno Setup 6.x  (https://jrsoftware.org/isinfo.php)
;  Leia COMO-COMPILAR.md antes de compilar.
; ==============================================================

#define AppName      "Versatto ERP"
#define AppVersion   "2.0"
#define AppPublisher "Versatto"
#define AppContact   "versattoerp@gmail.com"
#define AppURL       "http://localhost:5500"
#define ServiceDB    "VersattoERP-DB"
#define ServiceApp   "VersattoERP"

[Setup]
AppId={{7F4A2B1C-3D5E-4F6A-8B9C-1D2E3F4A5B6C}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppContact={#AppContact}
AppPublisherURL={#AppURL}
DefaultDirName={autopf64}\VersattoERP
DefaultGroupName={#AppName}
AllowNoIcons=yes
OutputDir=dist
OutputBaseFilename=VersattoERP-Setup-v{#AppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
MinVersion=10.0
SetupLogging=yes
UninstallDisplayName={#AppName}
UninstallDisplayIcon={app}\nssm\nssm.exe
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Messages]
BeveledLabel={#AppName} v{#AppVersion}
WizardReady=Bem-vindo ao instalador do %1
ReadyLabel1=O instalador está pronto para instalar o [name] no seu computador.

[Tasks]
Name: "desktopicon"; Description: "Criar ícone na área de trabalho"; GroupDescription: "Atalhos:"
Name: "autostart";  Description: "Iniciar o Versatto ERP automaticamente com o Windows (recomendado)"; GroupDescription: "Inicialização:"; Flags: checked

[Dirs]
Name: "{app}\installer"
Name: "{app}\data"
Name: "{app}\logs"

[Files]
; ── Aplicação ────────────────────────────────────────────────────────────────
Source: "..\backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: ".env,*.log"
Source: "..\frontend\*"; DestDir: "{app}\frontend"; Flags: ignoreversion recursesubdirs createallsubdirs

; node_modules pré-compilados (rodar "npm install" no backend antes de compilar)
Source: "..\backend\node_modules\*"; DestDir: "{app}\backend\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs

; ── Scripts de instalação ────────────────────────────────────────────────────
Source: "scripts\setup-all.ps1";          DestDir: "{app}\installer"; Flags: ignoreversion
Source: "scripts\uninstall.ps1";          DestDir: "{app}\installer"; Flags: ignoreversion
Source: "scripts\Iniciar-VersattoERP.bat"; DestDir: "{app}";          Flags: ignoreversion
Source: "scripts\Parar-VersattoERP.bat";   DestDir: "{app}";          Flags: ignoreversion

; ── Runtimes (pré-baixados — ver COMO-COMPILAR.md) ──────────────────────────
Source: "bundle\node\*";    DestDir: "{app}\node"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "bundle\pgsql\*";   DestDir: "{app}\pgsql"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "bundle\nssm\nssm.exe"; DestDir: "{app}\nssm"; Flags: ignoreversion

[Icons]
Name: "{group}\{#AppName}";         Filename: "{app}\Iniciar-VersattoERP.bat"; WorkingDir: "{app}"
Name: "{group}\Parar {#AppName}";   Filename: "{app}\Parar-VersattoERP.bat";  WorkingDir: "{app}"
Name: "{group}\Desinstalar {#AppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}";   Filename: "{app}\Iniciar-VersattoERP.bat"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
; Configuração completa via PowerShell (lê config.json gravado pelo wizard)
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\installer\setup-all.ps1"""; StatusMsg: "Configurando banco de dados e serviços... (pode levar alguns minutos)"; Flags: runhidden waituntilterminated

; Abrir navegador ao finalizar (checkbox opcional)
Filename: "{app}\Iniciar-VersattoERP.bat"; Description: "Abrir o Versatto ERP no navegador"; Flags: nowait postinstall skipifsilent shellexec

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\installer\uninstall.ps1"""; RunOnceId: "RemoveServices"; Flags: runhidden waituntilterminated

[UninstallDelete]
Type: filesandordirs; Name: "{app}\data"
Type: filesandordirs; Name: "{app}\logs"
Type: filesandordirs; Name: "{app}\installer"
Type: files;          Name: "{app}\backend\.env"

[Code]
var
  PageDB:  TInputQueryWizardPage;
  PageNet: TInputQueryWizardPage;

{ ── Cria as páginas customizadas do wizard ──────────────────────────── }
procedure InitializeWizard;
begin
  PageDB := CreateInputQueryPage(wpSelectDir,
    'Configuração do Banco de Dados',
    'Defina a senha interna do banco de dados PostgreSQL',
    'Esta senha é usada internamente pelo sistema. Guarde-a em local seguro ' +
    'caso precise de suporte técnico ou recuperação de dados.');
  PageDB.Add('Senha do banco de dados:', True);
  PageDB.Add('Confirme a senha:', True);

  PageNet := CreateInputQueryPage(PageDB.ID,
    'Configuração de Portas',
    'Defina as portas de rede do sistema',
    'As portas padrão são recomendadas. Altere somente se outro programa ' +
    'já estiver usando essas portas neste computador.');
  PageNet.Add('Porta do servidor web (padrão: 5500):', False);
  PageNet.Add('Porta do banco de dados (padrão: 5432):', False);
  PageNet.Values[0] := '5500';
  PageNet.Values[1] := '5432';
end;

{ ── Valida as páginas antes de avançar ─────────────────────────────── }
function NextButtonClick(CurPageID: Integer): Boolean;
var
  P1, P2: Integer;
begin
  Result := True;

  if CurPageID = PageDB.ID then
  begin
    if PageDB.Values[0] = '' then
    begin
      MsgBox('Informe uma senha para o banco de dados.', mbError, MB_OK);
      Result := False; Exit;
    end;
    if Length(PageDB.Values[0]) < 8 then
    begin
      MsgBox('A senha deve ter no mínimo 8 caracteres.', mbError, MB_OK);
      Result := False; Exit;
    end;
    if PageDB.Values[0] <> PageDB.Values[1] then
    begin
      MsgBox('As senhas não coincidem. Verifique e tente novamente.', mbError, MB_OK);
      PageDB.Values[1] := '';
      Result := False; Exit;
    end;
  end;

  if CurPageID = PageNet.ID then
  begin
    P1 := StrToIntDef(PageNet.Values[0], 0);
    P2 := StrToIntDef(PageNet.Values[1], 0);
    if (P1 < 1024) or (P1 > 65535) then
    begin
      MsgBox('Porta do servidor inválida. Use um valor entre 1024 e 65535.', mbError, MB_OK);
      Result := False; Exit;
    end;
    if (P2 < 1024) or (P2 > 65535) then
    begin
      MsgBox('Porta do banco de dados inválida. Use um valor entre 1024 e 65535.', mbError, MB_OK);
      Result := False; Exit;
    end;
    if P1 = P2 then
    begin
      MsgBox('As portas do servidor e do banco de dados devem ser diferentes.', mbError, MB_OK);
      Result := False; Exit;
    end;
  end;
end;

{ ── Escapa caracteres especiais para JSON ──────────────────────────── }
function JsonStr(S: String): String;
begin
  Result := StringReplace(S,  '\', '\\', [rfReplaceAll]);
  Result := StringReplace(Result, '"', '\"', [rfReplaceAll]);
end;

{ ── Grava config.json após a extração dos arquivos (antes de [Run]) ── }
procedure CurStepChanged(CurStep: TSetupStep);
var
  ConfigPath, AutoStart, Content: String;
begin
  if CurStep = ssPostInstall then
  begin
    ConfigPath := ExpandConstant('{app}\installer\config.json');

    if IsTaskSelected('autostart') then AutoStart := 'true'
    else AutoStart := 'false';

    Content :=
      '{' + #13#10 +
      '  "dbPassword": "' + JsonStr(PageDB.Values[0])  + '",' + #13#10 +
      '  "appPort":    "' + JsonStr(PageNet.Values[0]) + '",' + #13#10 +
      '  "dbPort":     "' + JsonStr(PageNet.Values[1]) + '",' + #13#10 +
      '  "dbName":     "versatto_erp",'   + #13#10 +
      '  "dbUser":     "postgres",'       + #13#10 +
      '  "autoStart":  ' + AutoStart      + #13#10 +
      '}';

    SaveStringToFile(ConfigPath, Content, False);
  end;
end;
