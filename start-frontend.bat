@echo off
chcp 65001 >nul
title Nova Hotel - Frontend (Live Server)

echo ===============================================
echo   NOVA HOTEL - Chay Frontend (Khong can cai dat)
echo ===============================================
echo.
echo Dang su dung npx http-server (tam thoi, khong anh huong may ban)
echo.

cd /d "%~dp0frontend"

echo Dang khoi dong server tai http://localhost:5500
echo Nhan Ctrl + C de dung.
echo.

npx --yes http-server . -p 5500 -o -c-1 --cors

pause
