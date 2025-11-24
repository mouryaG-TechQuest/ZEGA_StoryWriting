@echo off
echo ========================================
echo Starting All Services
echo ========================================
echo.

echo [1/6] Starting Eureka Server (Port 8761)...
start "Eureka Server" cmd /k "cd microservices\eureka-server && mvn spring-boot:run"
timeout /t 25 /nobreak >nul
echo Eureka Server started!
echo.

echo [2/6] Starting API Gateway (Port 8080)...
start "API Gateway" cmd /k "cd microservices\api-gateway && mvn spring-boot:run"
timeout /t 15 /nobreak >nul
echo API Gateway started!
echo.

echo [3/6] Starting User Service (Port 8081)...
start "User Service" cmd /k "cd microservices\user-service && mvn spring-boot:run"
timeout /t 15 /nobreak >nul
echo User Service started!
echo.

echo [4/6] Starting Story Service (Port 8082)...
start "Story Service" cmd /k "cd microservices\story-service && mvn spring-boot:run"
timeout /t 15 /nobreak >nul
echo Story Service started!
echo.

echo [5/6] Starting Frontend (Port 5173)...
start "Frontend" cmd /k "cd Frontend && npm run dev"
timeout /t 10 /nobreak >nul
echo Frontend started!
echo.

echo [6/6] Starting ZEGA AI Service (Port 8002)...
start "ZEGA AI" cmd /k "cd AIservices\zega && python -m uvicorn api:app --host 0.0.0.0 --port 8002"
timeout /t 10 /nobreak >nul
echo ZEGA AI Service started!
echo.

echo ========================================
echo All Services Started Successfully!
echo ========================================
echo.
echo Service URLs:
echo - Eureka:       http://localhost:8761
echo - Gateway:      http://localhost:8080
echo - User:         http://localhost:8081
echo - Story:        http://localhost:8082
echo - Frontend:     http://localhost:5173
echo - ZEGA AI:      http://localhost:8002
echo.
echo Press any key to check service health...
pause >nul

echo.
echo Checking service health...
echo.
curl -s http://localhost:8761 >nul && echo [OK] Eureka Server || echo [FAIL] Eureka Server
curl -s http://localhost:8080/actuator/health >nul && echo [OK] API Gateway || echo [FAIL] API Gateway
curl -s http://localhost:8081/actuator/health >nul && echo [OK] User Service || echo [FAIL] User Service
curl -s http://localhost:8082/actuator/health >nul && echo [OK] Story Service || echo [FAIL] Story Service
curl -s http://localhost:5173 >nul && echo [OK] Frontend || echo [FAIL] Frontend
curl -s http://localhost:8002/health >nul && echo [OK] ZEGA AI || echo [FAIL] ZEGA AI
echo.
echo Health check complete!
pause
