@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Root of the repository (this script's directory)
set "ROOT=%~dp0"

REM Toggle to also start the Frontend dev server (1=yes, 0=no)
set "START_FRONTEND=1"

echo ------------------------------------------------------------
echo StoryWritingProject - Start All Services
echo Root: %ROOT%
echo ------------------------------------------------------------

REM Optional: show quick hints
echo Will launch each service in its own terminal window.
echo If a port is already in use, close prior windows or processes.
echo.

REM Define service directories
set "EUREKA_DIR=%ROOT%microservices\eureka-server"
set "USER_DIR=%ROOT%microservices\user-service"
set "STORY_DIR=%ROOT%microservices\story-service"
set "GATEWAY_DIR=%ROOT%microservices\api-gateway"
set "FRONTEND_DIR=%ROOT%Frontend"

REM Start Eureka (8761)
echo Starting Eureka Server...
start "Eureka - 8761" cmd /k "cd /d "%EUREKA_DIR%" && mvn -q spring-boot:run"
timeout /t 2 /nobreak >nul

REM Start User Service (8081)
echo Starting User Service...
start "User Service - 8081" cmd /k "cd /d "%USER_DIR%" && mvn -q spring-boot:run"
timeout /t 1 /nobreak >nul

REM Start Story Service (8082)
echo Starting Story Service...
start "Story Service - 8082" cmd /k "cd /d "%STORY_DIR%" && mvn -q spring-boot:run"
timeout /t 1 /nobreak >nul

REM Start API Gateway (8080)
echo Starting API Gateway...
start "API Gateway - 8080" cmd /k "cd /d "%GATEWAY_DIR%" && mvn -q spring-boot:run"

REM Start AI Service (8001)
echo Starting AI Service...
start "AI Service - 8001" cmd /k "cd /d "%ROOT%AIservices" && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8001"

REM Start ZEGA Model (8002)
echo Starting ZEGA Model...
start "ZEGA Model - 8002" cmd /k "cd /d "%ROOT%AIservices" && call venv\Scripts\activate && python -m zega.api"

REM Optionally start Frontend (5173) via subroutine to avoid block parsing issues
if "%START_FRONTEND%"=="1" call :start_frontend

echo.
echo ------------------------------------------------------------
echo Launched:
echo   - Eureka       http://localhost:8761
echo   - API Gateway  http://localhost:8080
echo   - User Service http://localhost:8081
echo   - Story Serv.  http://localhost:8082
echo   - AI Service   http://localhost:8001
echo   - ZEGA Model   http://localhost:8002
if "%START_FRONTEND%"=="1" echo   - Frontend     http://localhost:5173
echo ------------------------------------------------------------
echo Tips:
echo   - First run may take time to compile and register in Eureka.
echo   - If a window closes instantly, run "mvn -X spring-boot:run" in that folder.
echo   - To stop, close the spawned windows (or kill the port processes).
echo.
echo Done. Windows opened in background.
exit /b 0

:start_frontend
echo Starting Frontend (Vite dev server)...
start "Frontend - 5173" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev:fixed"
goto :eof
