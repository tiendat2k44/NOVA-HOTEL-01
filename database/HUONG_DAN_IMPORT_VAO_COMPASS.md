# HƯỚNG DẪN IMPORT DỮ LIỆU VÀO MONGODB COMPASS (Chi tiết - Dành cho người mới)

Bạn đã có **MongoDB Compass** rồi, nên đây là cách **dễ nhất và ổn định nhất** để tạo database.

---

## Bước 1: Mở MongoDB Compass và Kết nối

1. Mở ứng dụng **MongoDB Compass**
2. Ở màn hình kết nối, để nguyên:
   - **Hostname**: `localhost`
   - **Port**: `27017`
   - **Authentication**: `None` (hoặc `Username / Password` nếu bạn đã bật auth)
3. Nhấn nút **Connect**

Nếu kết nối thành công, bạn sẽ thấy danh sách các database (có thể đang trống).

---

## Bước 2: Tạo Database và 4 Collection

1. Nhấn nút **"Create Database"** (thường ở góc trên bên phải)
2. Điền:
   - **Database Name**: `nova_hotel_db`
   - **Collection Name**: `users`  (tạo collection đầu tiên luôn)
3. Nhấn **Create Database**

Sau khi tạo xong database `nova_hotel_db`, bạn cần tạo thêm 3 collection còn lại:

- Click vào database `nova_hotel_db`
- Nhấn nút **"Create Collection"**
- Tạo lần lượt:
  - `rooms`
  - `bookings`
  - `reviews`

Bây giờ bạn sẽ có đúng 4 collection trống.

---

## Bước 3: Import Dữ Liệu (Rất Quan Trọng - Làm Đúng Thứ Tự)

**Thứ tự import bắt buộc** (vì có quan hệ tham chiếu):

| Lần | File JSON                  | Collection cần import vào | Ghi chú |
|-----|----------------------------|---------------------------|--------|
| 1   | `sample-data/users.json`   | `users`                   | Không phụ thuộc |
| 2   | `sample-data/rooms.json`   | `rooms`                   | Không phụ thuộc |
| 3   | `sample-data/bookings.json`| `bookings`                | Tham chiếu userId + roomId |
| 4   | `sample-data/reviews.json` | `reviews`                 | Tham chiếu userId + roomId |

### Cách import từng file:

1. **Click vào collection** bạn muốn import (ví dụ: `users`)

2. Ở giữa màn hình sẽ hiện dòng **"This collection is empty"**

3. Nhấn nút lớn màu xanh: **"Add Data"**

4. Chọn: **"Import JSON or CSV file"**

5. Cửa sổ mở ra:
   - Nhấn **"Select File"**
   - Chọn file tương ứng trong thư mục:
     ```
     E:\Đồ Án ĐTĐ\NOVAHOTEL\database\sample-data\users.json
     ```

6. **Cài đặt quan trọng** (để mặc định là được):
   - **File Type**: JSON
   - **Import Mode**: `Insert` (mặc định)
   - **Ignore empty strings**: Có thể tick

7. Nhấn nút **"Import"** ở góc dưới bên phải.

8. Đợi vài giây. Khi thành công sẽ hiện thông báo **"Import completed"** và số document đã import.

**Lặp lại** bước trên cho 3 file còn lại theo đúng thứ tự ở bảng trên.

---

## Bước 4: Kiểm tra kết quả

Sau khi import xong 4 file:

1. Click vào từng collection xem có dữ liệu không.
2. Thử click vào tab **"Documents"** → bạn sẽ thấy dữ liệu.

**Kiểm tra nhanh bằng cách đếm số lượng:**

Bạn có thể mở tab **"Aggregations"** hoặc dùng **Shell** bên trong Compass:

- Nhấn nút **"Shell"** (ở góc trên bên phải trong Compass)
- Gõ lần lượt các lệnh sau và nhấn Enter:

```js
use nova_hotel_db

db.users.countDocuments()
db.rooms.countDocuments()
db.bookings.countDocuments()
db.reviews.countDocuments()
```

Kết quả mong đợi (khoảng):
- users: 8
- rooms: 12
- bookings: 14
- reviews: 10

---

## Lưu Ý Quan Trọng Khi Import

### Về ngày tháng (Date)
Các file JSON của mình dùng định dạng chuẩn của MongoDB (`$date`).  
Compass hiện đại (phiên bản 1.30 trở lên) sẽ tự động chuyển thành kiểu **Date** thật khi import.  
Nếu bạn thấy ngày tháng hiện dưới dạng chuỗi text thì không sao, vẫn dùng được bình thường.

### Nếu import bị lỗi "Document failed validation" (lỗi phổ biến nhất)

Lỗi này xảy ra vì **Schema Validation** cũ vẫn còn dính trên collection `bookings`.

**Cách sửa nhanh nhất:**

1. Trong Compass, click chuột phải vào collection `bookings` → chọn **Drop Collection** → gõ tên collection để xác nhận xóa.
2. Tương tự xóa luôn collection `rooms` (vì hay bị duplicate roomNumber).
3. Import lại từ đầu theo đúng thứ tự (users → rooms → bookings → reviews).

Đây là cách sạch và nhanh nhất.

### Nếu import bị lỗi "duplicate key error" trên roomNumber

Lỗi này nghĩa là bạn đã import phòng trước đó, và có unique index trên `roomNumber`.

**Giải pháp:** Xóa collection `rooms` rồi import lại.

### Nếu import bị lỗi
- Kiểm tra lại bạn đã tạo đúng tên collection chưa (phải đúng `users`, `rooms`, `bookings`, `reviews`)
- Không import file `bookings.json` trước `users.json` và `rooms.json`
- Đóng và mở lại Compass rồi thử lại
- Quan trọng nhất: **Xóa collection rồi import lại** khi bị lỗi validation hoặc duplicate.

---

## Xong rồi thì sao?

Sau khi import thành công:

- Bạn đã có đầy đủ dữ liệu mẫu giống như khi chạy script.
- Backend Spring Boot của bạn có thể kết nối và sử dụng ngay.
- Bạn có thể mở tab **"Aggregations"** trong Compass để thử các truy vấn mẫu (xem file `aggregation-queries.js`).

---

**Bạn đang gặp khó khăn ở bước nào?**

Hãy chụp màn hình hoặc mô tả:
- Bạn đã tạo được database `nova_hotel_db` chưa?
- Bạn đã import được file nào rồi?
- Khi nhấn "Add Data" thì nó hiện gì?

Mình sẽ hướng dẫn cụ thể hơn cho bước bạn đang kẹt.