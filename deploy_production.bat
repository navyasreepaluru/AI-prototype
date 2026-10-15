@echo off
echo ========================================================
echo   Deploying CyberShield AI Production Backend Service
echo   KALAM INNOVISTA 2K26 Model Innovation Challenge
echo ========================================================

set PYTHONPATH=%~dp0
set FLASK_ENV=production
set HOST=0.0.0.0
set PORT=5000

echo [1/3] Activating virtual environment...
call "%~dp0backend\venv\Scripts\activate.bat"

echo [2/3] Verifying machine learning models and database...
python "%~dp0backend\seed_data.py"

echo [3/3] Starting Production WSGI Server on http://0.0.0.0:5000...
echo Endpoint health: http://127.0.0.1:5000/api/health
echo Press Ctrl+C to stop the deployment.
echo.

python "%~dp0backend\wsgi.py"
pause
