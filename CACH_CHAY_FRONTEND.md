# Cách chạy Frontend Nova Hotel (An toàn & Dễ dàng)

## Cách 1: Nhanh nhất (Khuyến nghị) - Dùng file .bat hoặc .ps1

1. Mở thư mục gốc dự án `NOVAHOTEL`
2. Nhấp đúp chuột vào file:
   - `start-frontend.bat`   (dành cho người dùng thường)
   - hoặc `start-frontend.ps1` (PowerShell - thường ổn định hơn)

→ Trình duyệt sẽ tự mở tại `http://localhost:5500`

**Ưu điểm**: 
- Không cần cài thêm extension
- Không ảnh hưởng máy tính về sau (chỉ dùng tạm thời qua npx)
- Header + Footer load được bình thường

---

## Cách 2: Dùng Live Server (VS Code)

Sau khi tôi đã cấu hình sẵn:

1. Mở thư mục gốc `NOVAHOTEL` trong VS Code
2. Mở file `frontend/index.html`
3. Nhìn góc dưới bên phải → bấm nút **Go Live**

Nó sẽ tự động chạy từ đúng thư mục `frontend`.

Nếu vẫn không được, dùng **Cách 1**.

---

## Lưu ý quan trọng

- **Không** mở file `index.html` bằng cách double-click trực tiếp (file://) → Header/Footer sẽ không hiện.
- Phải chạy qua HTTP server (port 5500) thì mới hoạt động đầy đủ.
- Backend (nếu cần dữ liệu thật) chạy riêng ở port 8080.

---

## Dừng server

- Nếu dùng `.bat` hoặc `.ps1`: Nhấn `Ctrl + C` trong cửa sổ đen.
- Nếu dùng Live Server: Bấm lại nút **Go Live** (nó sẽ chuyển sang "Stop Live Server").

---

Tạo bởi Grok - Không ảnh hưởng gì đến máy tính của bạn.
