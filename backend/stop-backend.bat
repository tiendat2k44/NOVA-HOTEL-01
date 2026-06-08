@echo off
chcp 65001 >nul
echo ============================================
echo   NOVA HOTEL - Dung Backend (port 8080)
echo ============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\stop-backend.ps1"
exit /b %ERRORLEVEL%