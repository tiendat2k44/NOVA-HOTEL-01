# ===============================================
# NOVA HOTEL - Chạy Frontend (An toàn, không ảnh hưởng máy)
# ===============================================

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   NOVA HOTEL - Khởi động Frontend" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sử dụng npx http-server (tạm thời, không cài đặt gì vĩnh viễn)" -ForegroundColor Yellow
Write-Host ""

# Chuyển vào thư mục frontend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptDir\frontend"

Write-Host "Đang khởi động server tại http://localhost:5500 ..." -ForegroundColor Green
Write-Host "Nhấn Ctrl + C để dừng." -ForegroundColor DarkGray
Write-Host ""

# Chạy server (tự động tải nếu chưa có, không ảnh hưởng hệ thống)
npx --yes http-server . -p 5500 -o -c-1 --cors
