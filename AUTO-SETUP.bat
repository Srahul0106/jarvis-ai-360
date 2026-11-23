@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0SETUP-JARVIS.ps1"
echo.
echo If setup stopped, read the error above.
pause
