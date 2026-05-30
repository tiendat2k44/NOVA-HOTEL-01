@echo off
chcp 65001 >nul
echo ============================================
echo   NOVA HOTEL - Dung Backend
echo ============================================
echo.

echo Dang tim va dung cac tien trinh Java dang chay backend...
taskkill /F /IM java.exe /FI "WINDOWTITLE eq *nova-hotel*" 2>nul
taskkill /F /IM java.exe 2>nul

echo.
echo Da gui lenh dung tien trinh Java.
echo Neu port 8080 van bi chiem, hay khoi dong lai may hoac dung Task Manager.
pause
