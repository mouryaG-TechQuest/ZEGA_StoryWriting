@echo off
cd /d "%~dp0microservices\api-gateway"
echo Starting API Gateway on port 8080...
mvn spring-boot:run
pause
