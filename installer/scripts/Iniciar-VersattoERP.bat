@echo off
setlocal

:: Lê a porta do arquivo .env para abrir o navegador na URL correta
set PORT=5500
for /f "usebackq tokens=2 delims==" %%A in (`findstr /B "PORT=" "%~dp0backend\.env" 2^>nul`) do set PORT=%%A

:: Inicia os serviços (ignora erro se já estiverem rodando)
net start VersattoERP-DB >nul 2>&1
net start VersattoERP    >nul 2>&1

:: Aguarda o servidor subir
timeout /t 3 /nobreak >nul

:: Abre o navegador padrão
start "" "http://localhost:%PORT%/login.html"

endlocal
