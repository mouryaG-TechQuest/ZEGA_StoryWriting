@echo off
echo Starting ZEGA AI Service in background...
cd AIservices
start /B cmd /c "venv\Scripts\activate && python -m zega.api > zega.log 2>&1"
echo ZEGA started. Check zega.log for details.
timeout /t 3
