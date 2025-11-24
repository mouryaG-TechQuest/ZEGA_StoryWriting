@echo off
cd /d "%~dp0microservices\user-service"
echo Starting User Service on port 8081...
mvn spring-boot:run
pause
