@echo off
echo Starting ZEGA AI Service in background...
cd AIservices
if exist "venv\Scripts\python.exe" (
    start /B "" cmd /c "venv\Scripts\activate.bat && set ZEGA_USE_V2=true && python -m zega.api > zega.log 2>&1"
    echo ZEGA started on port 8002. Check AIservices\zega.log for details.
) else (
    echo ERROR: Virtual environment not found in AIservices\venv
    echo Please create venv and install dependencies first.
)
timeout /t 3
