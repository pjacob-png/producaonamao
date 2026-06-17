@echo off
echo ============================================
echo   Producao na Mao - Iniciando o sistema
echo ============================================

cd /d "%~dp0"

REM Verifica se Docker esta rodando
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Docker nao esta rodando!
    echo Abra o Docker Desktop e aguarde inicializar, depois execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker detectado

REM Sobe os containers
echo.
echo Iniciando backend e banco de dados...
docker-compose up -d db backend

echo.
echo Aguardando banco de dados ficar pronto...
timeout /t 10 /nobreak >nul

echo.
echo Iniciando frontend...
cd frontend
call npm install --legacy-peer-deps
call npm run dev

pause
