@echo off
echo Parando Versatto ERP...
net stop VersattoERP    >nul 2>&1
net stop VersattoERP-DB >nul 2>&1
echo Servicos parados.
timeout /t 2 /nobreak >nul
