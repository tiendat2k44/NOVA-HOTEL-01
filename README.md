# Nova Hotel

Hệ thống quản lý khách sạn và đặt phòng (Full-stack: Spring Boot + HTML/JS thuần).

## Yêu cầu hệ thống

- **Java 21** (Temurin / Adoptium khuyến nghị)
- **Node.js 18+** (LTS)
- **MongoDB** chạy tại `localhost:27017`
- (Khuyến nghị) VS Code + Extension Pack for Java (để debug backend)

## Chạy nhanh (Windows)

### 1. Backend (Spring Boot)

```cmd
start-backend.bat
```

Hoặc trong VS Code:
- `Ctrl+Shift+P` → **Tasks: Run Task** → chọn **Start Backend (Spring Boot)**

Backend chạy tại: http://localhost:8080

### 2. Frontend (tĩnh)

```cmd
start-frontend.bat
```
hoặc
```powershell
.\start-frontend.ps1
```

Frontend chạy tại: http://localhost:5500 (trình duyệt tự mở)

### 3. Dừng Backend

```cmd
backend\stop-backend.bat
```

## Lệnh thủ công

**Backend (dev mode với hot reload):**

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

**Frontend:**

```bash
cd frontend
npx --yes http-server . -p 5500 -o --cors
```

## Lưu ý quan trọng khi dùng VS Code

- Nhiều lỗi chỉ xuất hiện khi chạy lệnh trong **Integrated Terminal** của VS Code (đặc biệt encoding + PATH).
- Khuyến nghị: **double-click** các file `start-*.bat` bên ngoài VS Code.
- Hoặc dùng **Tasks** (Command Palette) – đã được cấu hình sẵn trong `.vscode/tasks.json`.
- Sau khi sửa Java code: dùng task **Rebuild Backend**.

## Cấu trúc thư mục

```
NOVAHOTEL/
├── backend/           # Spring Boot 4 + Java 21 + MongoDB
├── frontend/          # HTML + JS + CSS (không phải React)
├── database/          # Script import dữ liệu mẫu vào MongoDB
├── start-backend.bat
├── start-frontend.bat
└── start-frontend.ps1
```

## Dữ liệu mẫu

Xem hướng dẫn trong `database/README.md` và `database/HUONG_DAN_IMPORT_VAO_COMPASS.md`.

## Giải quyết lỗi thường gặp

- **Port 8080 đã dùng**: Chạy `backend/stop-backend.bat`
- **MongoDB connection refused**: Khởi động MongoDB service
- **npx không tìm thấy**: Cài Node.js + restart VS Code
- **Lỗi Java trong VS Code Problems**: Reload Window hoặc Java: Clean Language Server Workspace

---

> Dự án được hiện đại hóa (Java 21 + Spring Boot 4) trên nhánh `modernize/java-...`

"# NOVA-HOTEL-01"  
