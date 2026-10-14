@echo off
echo ========================================================
echo   Starting CyberShield AI Flask Backend on port 5000...
echo ========================================================
set PYTHONPATH=%~dp0
call "%~dp0backend\venv\Scripts\activate.bat"
python "%~dp0backend\app.py"
pause
