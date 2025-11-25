@echo off
REM Production Deployment Script - Optimized for Speed and Performance
REM All services start with minimal logging and production profiles

TITLE Story Writing Platform - PRODUCTION MODE

echo.
echo ============================================
echo   PRODUCTION DEPLOYMENT - ZEGA Platform
echo ============================================
echo.

REM Set production environment variables
set SPRING_PROFILES_ACTIVE=production
set LOG_LEVEL=ERROR
set ENABLE_FILE_LOGGING=true
set NODE_ENV=production

REM Check if Java is available
java -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node is available
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo [1/7] Starting Eureka Server...
cd microservices\eureka-server
start /min "" cmd /c "title Eureka-8761 && mvn spring-boot:run -Dspring-boot.run.jvmArguments=\"-Xms256m -Xmx512m -XX:+UseG1GC\" -q >nul 2>&1"
cd ..\..
timeout /t 20 /nobreak >nul

echo [2/7] Starting User Service...
cd microservices\user-service
start /min "" cmd /c "title User-Service-8081 && mvn spring-boot:run -Dspring-boot.run.jvmArguments=\"-Xms256m -Xmx512m -XX:+UseG1GC\" -q >nul 2>&1"
cd ..\..
timeout /t 8 /nobreak >nul

echo [3/7] Starting Story Service...
cd microservices\story-service
start /min "" cmd /c "title Story-Service-8082 && mvn spring-boot:run -Dspring-boot.run.jvmArguments=\"-Xms512m -Xmx1024m -XX:+UseG1GC\" -q >nul 2>&1"
cd ..\..
timeout /t 8 /nobreak >nul

echo [4/7] Starting API Gateway...
cd microservices\api-gateway
start /min "" cmd /c "title API-Gateway-8080 && mvn spring-boot:run -Dspring-boot.run.jvmArguments=\"-Xms256m -Xmx512m -XX:+UseG1GC\" -q >nul 2>&1"
cd ..\..
timeout /t 12 /nobreak >nul

echo [5/7] Starting AI Service...
cd AIservices
if not exist venv (
    echo [ERROR] Python venv not found. Run: python -m venv venv
    pause
    exit /b 1
)
start /min "" cmd /c "title AI-Service-8001 && call venv\Scripts\activate && set LOG_LEVEL=ERROR && python app/main.py >nul 2>&1"
cd ..
timeout /t 5 /nobreak >nul

echo [6/7] Starting ZEGA AI Engine...
cd AIservices
start /min "" cmd /c "title ZEGA-8002 && call venv\Scripts\activate && set LOG_LEVEL=ERROR && python zega/api.py >nul 2>&1"
cd ..
timeout /t 10 /nobreak >nul

echo [7/7] Starting Frontend (Production Build)...
cd Frontend
if not exist node_modules (
    echo [ERROR] Node modules not found. Run: npm install
    pause
    exit /b 1
)
start /min "" cmd /c "title Frontend-5173 && npm run dev -- --mode production >nul 2>&1"
cd ..

timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo   ALL SERVICES STARTED - PRODUCTION MODE
echo ============================================
echo.
echo   Eureka Server:    http://localhost:8761
echo   API Gateway:      http://localhost:8080
echo   User Service:     http://localhost:8081
echo   Story Service:    http://localhost:8082
echo   AI Service:       http://localhost:8001
echo   ZEGA Engine:      http://localhost:8002
echo   Frontend:         http://localhost:5173
echo.
echo   Log Level:        ERROR only
echo   JVM Optimization: G1GC with optimized heap
echo   Memory Profile:   Minimized for production
echo.
echo Press any key to open monitoring dashboard...
pause >nul
start http://localhost:5173

echo.
echo To stop all services, run: stop-all.bat
echo.
