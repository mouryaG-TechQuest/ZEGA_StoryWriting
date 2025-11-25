@echo off
REM Start ZEGA V2 with Auto-Training Features
echo Starting ZEGA V2 Backend...
echo.

cd /d "%~dp0"

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo Virtual environment activated.
) else (
    echo No virtual environment found. Using system Python.
)

REM Set ZEGA V2 flag
set ZEGA_USE_V2=true

REM Start ZEGA API
echo Starting ZEGA on http://localhost:8002
echo.
python -m zega.api

pause
