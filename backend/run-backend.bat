@echo off
chcp 65001 >nul

echo ============================================
echo   NOVA HOTEL - Chay Backend (Dev Mode)
echo ============================================
echo.
echo YEU CAU:
echo   - Java 21
echo   - MongoDB dang chay (localhost:27017)
echo   - Neu loi port 8080 thi chay stop-backend.bat truoc
echo.
echo Dang kiem tra port 8080...

cd /d "%~dp0"

netstat -ano | findstr ":8080" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo [LOI] Port 8080 da bi chiem!
    echo Hay chay stop-backend.bat hoac dung Task Manager.
    echo.
    pause
    exit /b 1
)

echo Port 8080 OK.
echo.
echo Dang chay Maven Wrapper...
echo Nhan Ctrl+C de dung.
echo.

call .\mvnw.cmd spring-boot:run -Dmaven.compiler.source=21 -Dmaven.compiler.target=21

echo.
echo Backend da dung.
pause