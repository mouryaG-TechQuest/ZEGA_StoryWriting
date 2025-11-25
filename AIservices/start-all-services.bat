@echo off
echo ========================================
echo   ZEGA AI Services - Start All
echo ========================================
echo.

REM Activate virtual environment if exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo Starting ZEGA Core Service on port 8002...
start "ZEGA Core" cmd /k "python -m uvicorn api:app --host 0.0.0.0 --port 8002 --reload"

echo Starting ZEGA ImageGen Service on port 8003...
start "ZEGA ImageGen" cmd /k "cd zega_image && python -m uvicorn api:app --host 0.0.0.0 --port 8003 --reload"

echo Starting ZEGA Voice Service on port 8004...
start "ZEGA Voice" cmd /k "cd zega_voice && python -m uvicorn api:app --host 0.0.0.0 --port 8004 --reload"

echo Starting ZEGA DocParser Service on port 8005...
start "ZEGA DocParser" cmd /k "cd zega_docparser && python -m uvicorn api:app --host 0.0.0.0 --port 8005 --reload"

echo Starting ZEGA MCP Server on port 8006...
start "ZEGA MCP" cmd /k "cd mcp_server && python -m uvicorn server:app --host 0.0.0.0 --port 8006 --reload"

echo.
echo ========================================
echo   All ZEGA Services Starting!
echo ========================================
echo.
echo   ZEGA Core:      http://localhost:8002
echo   ZEGA ImageGen:  http://localhost:8003
echo   ZEGA Voice:     http://localhost:8004
echo   ZEGA DocParser: http://localhost:8005
echo   ZEGA MCP:       http://localhost:8006
echo.
echo   Press any key to exit this window...
pause > nul
