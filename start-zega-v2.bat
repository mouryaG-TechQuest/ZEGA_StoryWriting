@echo off
REM ZEGA v2.0 Agentic AI - Quick Start
REM This script starts the ZEGA service with V2 agentic mode enabled

echo ========================================
echo   ZEGA v2.0 Agentic AI
echo   Starting Service...
echo ========================================
echo.

cd /d "%~dp0AIservices"

REM Check if port 8002 is already in use
netstat -ano | findstr :8002 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 8002 is already in use
    echo [INFO] ZEGA may already be running
    echo.
    echo Press any key to force restart, or Ctrl+C to cancel...
    pause >nul
    
    REM Kill existing process
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8002 ^| findstr LISTENING') do (
        echo [INFO] Stopping existing service (PID: %%a)
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo [INFO] Setting V2 mode: ENABLED
set ZEGA_USE_V2=true

echo [INFO] Starting ZEGA service...
echo.
echo ========================================
echo   Expected Output:
echo   - [ENSEMBLE] Loading 7 teacher models
echo   - [ZEGA v2] Agentic AI System ready
echo   - [API] Running on http://0.0.0.0:8002
echo ========================================
echo.

python -m zega.api

echo.
echo ========================================
echo   Service Stopped
echo ========================================
pause
