@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Root of the repository (this script's directory)
set "ROOT=%~dp0"

REM Toggle to also start the Frontend dev server (1=yes, 0=no)
set "START_FRONTEND=1"

echo ============================================================
echo   StoryWritingProject - Start All Services
echo ============================================================
echo Root: %ROOT%
echo.

REM Define service directories
set "EUREKA_DIR=%ROOT%microservices\eureka-server"
set "USER_DIR=%ROOT%microservices\user-service"
set "STORY_DIR=%ROOT%microservices\story-service"
set "GATEWAY_DIR=%ROOT%microservices\api-gateway"
set "AISERVICES_DIR=%ROOT%AIservices"
set "FRONTEND_DIR=%ROOT%Frontend"

REM Check if directories exist
echo [CHECK] Verifying directories...
if not exist "%EUREKA_DIR%" (
    echo [ERROR] Eureka directory not found: %EUREKA_DIR%
    pause
    exit /b 1
)
if not exist "%AISERVICES_DIR%\venv" (
    echo [WARNING] Python venv not found. Please run setup-ai.bat first.
    echo [INFO] Attempting to create venv...
    cd /d "%AISERVICES_DIR%"
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd /d "%ROOT%"
)
echo [OK] All directories found.
echo.

echo ============================================================
echo   Starting Backend Services (Java Spring Boot)
echo ============================================================
echo.

REM Start Eureka Server (8761) - Wait longer for Eureka
echo [1/4] Starting Eureka Server (Discovery Service)...
start "Eureka-8761" cmd /k "cd /d "%EUREKA_DIR%" && echo [EUREKA] Starting on port 8761... && mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8761"
echo       Waiting 15 seconds for Eureka to initialize...
timeout /t 15 /nobreak >nul

REM Start User Service (8081)
echo [2/4] Starting User Service...
start "User-Service-8081" cmd /k "cd /d "%USER_DIR%" && echo [USER-SERVICE] Starting on port 8081... && mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081"
timeout /t 5 /nobreak >nul

REM Start Story Service (8082)
echo [3/4] Starting Story Service (with Training History API)...
start "Story-Service-8082" cmd /k "cd /d "%STORY_DIR%" && echo [STORY-SERVICE] Starting on port 8082... && mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8082"
timeout /t 5 /nobreak >nul

REM Start API Gateway (8080)
echo [4/4] Starting API Gateway...
start "API-Gateway-8080" cmd /k "cd /d "%GATEWAY_DIR%" && echo [API-GATEWAY] Starting on port 8080... && mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8080"
echo       Waiting 10 seconds for services to register with Eureka...
timeout /t 10 /nobreak >nul

echo.
echo ============================================================
echo   Starting AI Services (Python FastAPI)
echo ============================================================
echo.

REM Start AI Service (8001)
echo [1/2] Starting AI Service (Multi-Model Ensemble)...
start "AI-Service-8001" cmd /k "cd /d "%AISERVICES_DIR%" && call venv\Scripts\activate && echo [AI-SERVICE] Starting on port 8001... && python -m uvicorn app.main:app --reload --port 8001 --host 0.0.0.0"
timeout /t 3 /nobreak >nul

REM Start ZEGA Model (8002) with SSE Streaming
echo [2/2] Starting ZEGA Model (with Real-Time Streaming)...
start "ZEGA-Model-8002" cmd /k "cd /d "%AISERVICES_DIR%" && call venv\Scripts\activate.bat && set ZEGA_USE_V2=true && echo [ZEGA] Starting on port 8002... && python -m zega.api"
timeout /t 5 /nobreak >nul

REM Start Frontend if enabled
if "%START_FRONTEND%"=="1" (
    echo.
    echo ============================================================
    echo   Starting Frontend (React + Vite)
    echo ============================================================
    echo.
    echo [1/1] Starting Frontend Dev Server...
    start "Frontend-5173" cmd /k "cd /d "%FRONTEND_DIR%" && echo [FRONTEND] Starting on port 5173... && npm run dev:fixed"
    timeout /t 3 /nobreak >nul
)

echo.
echo ============================================================
echo   ALL SERVICES LAUNCHED SUCCESSFULLY!
echo ============================================================
echo.
echo Backend Services (Java):
echo   [√] Eureka Server    : http://localhost:8761
echo   [√] API Gateway      : http://localhost:8080
echo   [√] User Service     : http://localhost:8081
echo   [√] Story Service    : http://localhost:8082
echo.
echo AI Services (Python):
echo   [√] AI Service       : http://localhost:8001
echo   [√] ZEGA Model       : http://localhost:8002
echo       - Regular API    : http://localhost:8002/auto-train
echo       - Streaming API  : http://localhost:8002/auto-train-stream
echo.
if "%START_FRONTEND%"=="1" (
    echo Frontend:
    echo   [√] React App        : http://localhost:5173
    echo.
)
echo ============================================================
echo   Quick Tips:
echo ============================================================
echo   - First run may take 2-3 minutes for Maven compilation
echo   - Services register with Eureka within 30-60 seconds
echo   - Check Eureka dashboard to verify all services are UP
echo   - Training History API available after Story Service starts
echo   - Real-time training progress via ZEGA streaming endpoint
echo.
echo   To stop all services: run stop-all.bat or close all windows
echo.
echo   Health Check URLs:
echo     http://localhost:8761 - Eureka Dashboard
echo     http://localhost:8001/docs - AI Service API Docs
echo     http://localhost:8002/health - ZEGA Health Check
echo.
echo ============================================================
echo Press any key to exit this launcher window...
pause >nul
exit /b 0
