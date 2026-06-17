@echo off
echo ============================================
echo   Producao na Mao - Sem Docker (dev local)
echo ============================================
echo.
echo ATENCAO: Este modo requer PostgreSQL instalado localmente.
echo Banco: producao_na_mao | Usuario: postgres | Porta: 5432
echo.

cd /d "%~dp0"

REM Backend
echo [1/2] Iniciando backend Python...
cd backend
if not exist ".venv" (
    echo Criando ambiente virtual...
    python -m venv .venv
)
call .venv\Scripts\activate

pip install -r requirements.txt --quiet

REM Ajusta DATABASE_URL para localhost
set DATABASE_URL=postgresql+asyncpg://postgres:changeme@localhost:5432/producao_na_mao

start cmd /k "call .venv\Scripts\activate && set DATABASE_URL=postgresql+asyncpg://postgres:changeme@localhost:5432/producao_na_mao && uvicorn app.main:app --reload --port 8000"

cd ..

REM Frontend
echo [2/2] Iniciando frontend Next.js...
cd frontend
if not exist "node_modules" (
    echo Instalando dependencias do frontend...
    call npm install --legacy-peer-deps
)

echo.
echo Sistema iniciando...
echo Backend: http://localhost:8000/docs
echo Frontend: http://localhost:3000
echo.

call npm run dev

pause
