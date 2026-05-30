<#
.SYNOPSIS
    Khoi tao co so du lieu MongoDB NOVA HOTEL (Windows PowerShell)

.DESCRIPTION
    Script nay giup nguoi dung Windows de dang khoi tao database nova_hotel_db
    ma khong can go lenh mongosh thu cong.

    Ghi chu: File nay duoc viet ASCII-safe de tranh loi encoding tren Windows.

.USAGE
    Mo PowerShell trong thu muc database/ roi chay:
        .\init-db.ps1

    Hoac chi dinh MongoDB URI khac:
        .\init-db.ps1 -MongoUri "mongodb://localhost:27017/nova_hotel_db"
#>

param(
    [string]$MongoUri = "mongodb://localhost:27017/nova_hotel_db"
)

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   NOVA HOTEL - KHOI TAO CSDL MONGODB (Windows)" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Kiem tra mongosh co ton tai khong
$mongosh = Get-Command mongosh -ErrorAction SilentlyContinue
if (-not $mongosh) {
    Write-Host "[LOI] Khong tim thay 'mongosh' trong PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Vui long:" -ForegroundColor Yellow
    Write-Host "  1. Cai dat MongoDB Shell: https://www.mongodb.com/try/download/shell" -ForegroundColor Yellow
    Write-Host "  2. Hoac dung MongoDB Compass de import file JSON thu cong" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Cach dung thay the (khuyen nghi):" -ForegroundColor Green
    Write-Host "  1. Mo MongoDB Compass" -ForegroundColor Green
    Write-Host "  2. Ket noi mongodb://localhost:27017" -ForegroundColor Green
    Write-Host "  3. Tao database 'nova_hotel_db'" -ForegroundColor Green
    Write-Host "  4. Import tung file JSON trong thu muc sample-data/" -ForegroundColor Green
    exit 1
}

Write-Host "[OK] Tim thay mongosh tai: $($mongosh.Source)" -ForegroundColor Green
Write-Host "URI: $MongoUri" -ForegroundColor Gray
Write-Host ""

# Chay script init-mongo.js bang mongosh
Write-Host "Dang chay init-mongo.js ..." -ForegroundColor Cyan
& mongosh $MongoUri --quiet --eval "load('init-mongo.js')"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[THANH CONG] Mo MongoDB Compass de kiem tra database 'nova_hotel_db'." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[LOI] Co loi xay ra trong qua trinh khoi tao." -ForegroundColor Red
}
