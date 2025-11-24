@echo off
echo ============================================================
echo StoryWritingProject - QUICK START
echo ============================================================
echo.
echo Stopping old services...
taskkill /F /IM java.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo.

echo Starting services (building in background)...
echo.

echo [1/6] AI Service - ZEGA (8002)
start "ZEGA-8002" /min cmd /c "cd /d "%~dp0AIservices\zega" && python -m uvicorn api:app --host 0.0.0.0 --port 8002"

timeout /t 10 /nobreak >nul

echo [2/6] Eureka Server (8761)
start "Eureka-8761" /min cmd /c "cd /d "%~dp0microservices\eureka-server" && mvn spring-boot:run -q"

timeout /t 25 /nobreak >nul

echo [3/6] User Service (8081)
start "User-8081" /min cmd /c "cd /d "%~dp0microservices\user-service" && mvn spring-boot:run -q"

timeout /t 15 /nobreak >nul

echo [4/6] Story Service (8082)
start "Story-8082" /min cmd /c "cd /d "%~dp0microservices\story-service" && mvn spring-boot:run -q"

timeout /t 15 /nobreak >nul

echo [5/6] API Gateway (8080)
start "Gateway-8080" /min cmd /c "cd /d "%~dp0microservices\api-gateway" && mvn spring-boot:run -q"

timeout /t 20 /nobreak >nul

echo [6/6] Frontend (5173)
start "Frontend-5173" /min cmd /c "cd /d "%~dp0Frontend" && npm run dev:fixed"

echo.
echo ============================================================
echo All services are starting...
echo.
echo Services:
echo   - AI Service (ZEGA): http://localhost:8002
echo   - Eureka Server: http://localhost:8761
echo   - User Service: http://localhost:8081
echo   - Story Service: http://localhost:8082
echo   - API Gateway: http://localhost:8080
echo   - Frontend: http://localhost:5173
echo.
echo Wait 60-90 seconds for full initialization, then visit:
echo   http://localhost:5173
echo.
echo To stop: run stop-all.bat
echo ============================================================
