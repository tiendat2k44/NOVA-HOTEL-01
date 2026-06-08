@echo off
chcp 65001 >nul

echo ============================================
echo   NOVA HOTEL - Chay Backend (Dev Mode)
echo ============================================
echo.

cd /d "%~dp0"

netstat -ano | findstr ":8080" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo Port 8080 dang duoc su dung — kiem tra backend...
    powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8080/api/rooms?size=1' -UseBasicParsing -TimeoutSec 4; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
    if %errorlevel% equ 0 (
        echo.
        echo [OK] Backend DA CHAY tai http://localhost:8080
        echo      Khong can khoi dong them. Muon restart: chay stop-backend.bat
        echo.
        pause
        exit /b 0
    )
    echo.
    echo [CANH BAO] Port 8080 bi chiem nhung API khong phan hoi.
    echo Dang giai phong port...
    call "%~dp0stop-backend.bat"
)

echo Port 8080 OK.
echo Dang chay Maven Wrapper... (Ctrl+C de dung)
echo.

call .\mvnw.cmd spring-boot:run -Dmaven.compiler.source=21 -Dmaven.compiler.target=21

echo.
echo Backend da dung.
pause