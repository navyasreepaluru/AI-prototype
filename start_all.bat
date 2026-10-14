@echo off
echo ========================================================
echo   Launching CyberShield AI Full-Stack Platform
echo   KALAM INNOVISTA 2K26 Model Innovation Challenge
echo ========================================================
start "CyberShield Backend (Port 5000)" "%~dp0start_backend.bat"
start "CyberShield Frontend (Port 5173)" "%~dp0start_frontend.bat"
echo Services launched! Open http://localhost:5173 in your browser.
pause
