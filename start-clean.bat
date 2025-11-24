@echo off
setlocal ENABLEDELAYEDEXPANSION

echo ============================================================
echo StoryWritingProject - CLEAN START
echo ============================================================
echo.

REM Step 1: Kill all existing Java and Node processes
echo [1/5] Stopping all existing services...
taskkill /F /IM java.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo       Services stopped.
echo.

REM Step 2: Clean and rebuild each microservice independently
echo [2/5] Cleaning and building microservices...
echo.

cd /d "%~dp0microservices\eureka-server"
echo       Building Eureka Server...
call mvn clean package -DskipTests -q
if errorlevel 1 (
    echo       ERROR: Failed to build Eureka Server
    cd /d "%~dp0"
    pause
    exit /b 1
)

cd /d "%~dp0microservices\user-service"
echo       Building User Service...
call mvn clean package -DskipTests -q
if errorlevel 1 (
    echo       ERROR: Failed to build User Service
    cd /d "%~dp0"
    pause
    exit /b 1
)

cd /d "%~dp0microservices\story-service"
echo       Building Story Service...
call mvn clean package -DskipTests -q
if errorlevel 1 (
    echo       ERROR: Failed to build Story Service
    cd /d "%~dp0"
    pause
    exit /b 1
)

cd /d "%~dp0microservices\api-gateway"
echo       Building API Gateway...
call mvn clean package -DskipTests -q
if errorlevel 1 (
    echo       ERROR: Failed to build API Gateway
    cd /d "%~dp0"
    pause
    exit /b 1
)

cd /d "%~dp0"
echo.
echo       All microservices built successfully.
echo.

REM Step 3: Install frontend dependencies if needed
echo [3/5] Checking frontend dependencies...
cd /d "%~dp0Frontend"
if not exist "node_modules\" (
    echo       Installing frontend dependencies...
    call npm install --silent
    if errorlevel 1 (
        echo       WARNING: Some npm packages may have warnings
    )
) else (
    echo       Frontend dependencies already installed.
)
cd /d "%~dp0"
echo.

REM Step 4: Start services in order
echo [4/5] Starting services...
echo.

echo       Starting Eureka Server (port 8761)...
start "Eureka Server - 8761" cmd /k "cd /d "%~dp0microservices\eureka-server" && mvn spring-boot:run -q"
timeout /t 25 /nobreak >nul

echo       Starting User Service (port 8081)...
start "User Service - 8081" cmd /k "cd /d "%~dp0microservices\user-service" && mvn spring-boot:run -q"
timeout /t 15 /nobreak >nul

echo       Starting Story Service (port 8082)...
start "Story Service - 8082" cmd /k "cd /d "%~dp0microservices\story-service" && mvn spring-boot:run -q"
timeout /t 15 /nobreak >nul

echo       Starting API Gateway (port 8080)...
start "API Gateway - 8080" cmd /k "cd /d "%~dp0microservices\api-gateway" && mvn spring-boot:run -q"
timeout /t 20 /nobreak >nul

echo       Starting Frontend (port 5173)...
start "Frontend - 5173" cmd /k "cd /d "%~dp0Frontend" && npm run dev"
timeout /t 10 /nobreak >nul

echo.
echo [5/5] Services started. Waiting for initialization...
timeout /t 15 /nobreak >nul
echo.

REM Step 5: Verify services are running
echo [6/5] Verifying service health...
echo.

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8761' -UseBasicParsing -TimeoutSec 5 | Out-Null; Write-Host '       [OK] Eureka Server (8761)' -ForegroundColor Green } catch { Write-Host '       [FAIL] Eureka Server (8761)' -ForegroundColor Red }"

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8081/actuator/health' -UseBasicParsing -TimeoutSec 5 | Out-Null; Write-Host '       [OK] User Service (8081)' -ForegroundColor Green } catch { Write-Host '       [FAIL] User Service (8081)' -ForegroundColor Yellow; Write-Host '            (May still be starting...)' -ForegroundColor Yellow }"

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8082/actuator/health' -UseBasicParsing -TimeoutSec 5 | Out-Null; Write-Host '       [OK] Story Service (8082)' -ForegroundColor Green } catch { Write-Host '       [FAIL] Story Service (8082)' -ForegroundColor Yellow; Write-Host '            (May still be starting...)' -ForegroundColor Yellow }"

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing -TimeoutSec 5 | Out-Null; Write-Host '       [OK] API Gateway (8080)' -ForegroundColor Green } catch { Write-Host '       [FAIL] API Gateway (8080)' -ForegroundColor Yellow; Write-Host '            (May still be starting...)' -ForegroundColor Yellow }"

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 5 | Out-Null; Write-Host '       [OK] Frontend (5173)' -ForegroundColor Green } catch { Write-Host '       [FAIL] Frontend (5173)' -ForegroundColor Yellow; Write-Host '            (May still be starting...)' -ForegroundColor Yellow }"

echo.
echo ============================================================
echo STARTUP COMPLETE
echo ============================================================
echo.
echo Services are running in separate windows:
echo   - Eureka Server:  http://localhost:8761
echo   - User Service:   http://localhost:8081
echo   - Story Service:  http://localhost:8082
echo   - API Gateway:    http://localhost:8080
echo   - Frontend:       http://localhost:5173
echo.
echo Application URL:    http://localhost:5173
echo.
echo To stop all services: run stop-all.bat
echo Or close the individual service windows
echo ============================================================
echo.
pause
