@echo off
cd /d "%~dp0microservices\eureka-server"
echo Starting Eureka Server on port 8761...
mvn spring-boot:run
pause
