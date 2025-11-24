@echo off
echo Setting up AI Service environment...
cd AIservices
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
echo Setup complete. Please add your GOOGLE_API_KEY to AIservices\.env
pause
