@echo off
chcp 65001 >nul
title Nova Hotel - Backend

echo ===============================================
echo   NOVA HOTEL - Chay Backend (Spring Boot)
echo ===============================================
echo.
echo Yeu cau:
echo   - MongoDB phai dang chay (localhost:27017)
echo   - Neu loi port 8080 thi chay stop-backend.bat truoc
echo.

cd /d "%~dp0backend"

call run-backend.bat
