# Nova Hotel Frontend

Frontend dùng HTML + CSS + JavaScript thuần (multi-page app).

> **Lưu ý**: Đây KHÔNG phải dự án React/Vite. Các file hướng dẫn cũ đã lỗi thời.

## Chạy nhanh nhất

Từ thư mục gốc dự án:

```bash
# Windows
start-frontend.bat
# hoặc
start-frontend.ps1
```

Server sẽ chạy tại: **http://localhost:5500**

## Chạy thủ công (nếu không dùng script)

```bash
cd frontend
npx --yes http-server . -p 5500 -o --cors
```

## Yêu cầu

- Node.js (để dùng npx http-server)
- Backend Spring Boot (port 8080) nếu muốn dữ liệu thật từ MongoDB

## Cấu trúc

- `index.html`, `login.html`, `rooms/`, `admin/`, `user/` → các trang chính
- `assets/js/` → JavaScript xử lý (auth, booking, rooms...)
- `assets/css/style.css` → style chung
- `components/header.html` + `footer.html` → được load động bằng JS

## Kết nối Backend

Frontend gọi API tại `http://localhost:8080` (đã cấu hình CORS ở backend).

Không cần proxy vì đã cho phép origin `http://localhost:5500`.
