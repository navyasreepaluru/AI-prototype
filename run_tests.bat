@echo off
echo ========================================================
echo   Running CyberShield AI Automated Test Suite (Pytest)
echo ========================================================
set PYTHONPATH=%~dp0
call "%~dp0backend\venv\Scripts\activate.bat"
pytest "%~dp0backend\tests\test_api.py" -v
pause
