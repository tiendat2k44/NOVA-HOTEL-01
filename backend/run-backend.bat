@echo off
chcp 65001 >nul
echo ============================================
echo   NOVA HOTEL - Chay Backend (Dev Mode)
echo ============================================
echo.
echo Su dung Maven Wrapper (on dinh hon, khong can cai Maven global)
echo.

cd /d "%~dp0"

REM Dung Maven Wrapper thay vi mvn de tranh loi
call .\mvnw.cmd spring-boot:run -Dspring-boot.run.arguments=--server.port=8080

echo.
echo Backend da dung hoac bi loi.
pause