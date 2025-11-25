@echo off
REM Start ZEGA V2 with Auto-Training Features
echo Starting ZEGA V2 Backend...
echo.

cd /d "%~dp0"

REM Set ZEGA V2 flag
set ZEGA_USE_V2=true

REM Activate virtual environment and start ZEGA
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
    echo [ZEGA] Starting on port 8002...
    python -m zega.api
) else (
    echo ERROR: Virtual environment not found!
    echo Please run: python -m venv venv
    echo Then: venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

pause
