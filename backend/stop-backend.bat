@echo off
chcp 65001 >nul
echo ============================================
echo   NOVA HOTEL - Dung Backend
echo ============================================
echo.

echo Dang dung tien trinh Java...
taskkill /F /IM java.exe /FI "WINDOWTITLE eq *nova-hotel*" 2>nul
taskkill /F /IM java.exe 2>nul

echo.
echo Da gui lenh dung.
pause
