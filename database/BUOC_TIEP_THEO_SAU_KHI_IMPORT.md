# BƯỚC TIẾP THEO SAU KHI ĐÃ IMPORT DỮ LIỆU THÀNH CÔNG

Chúc mừng! Bạn đã import xong dữ liệu mẫu vào MongoDB Compass.

Dưới đây là các bước tiếp theo nên làm (theo thứ tự hợp lý cho đồ án).

---

## Bước 1: Kiểm tra dữ liệu đã import đúng chưa (Quan trọng)

Mở **MongoDB Compass**, kết nối vào `nova_hotel_db`, sau đó làm theo:

### Cách nhanh (dùng Shell trong Compass):

1. Nhấn nút **Shell** (góc trên bên phải)
2. Gõ từng lệnh sau và nhấn Enter:

```js
use nova_hotel_db

db.users.countDocuments()
db.rooms.countDocuments()
db.bookings.countDocuments()
db.reviews.countDocuments()
```

**Kết quả mong đợi:**
- users: 8
- rooms: 12
- bookings: 14
- reviews: 10

Nếu ra đúng số này là ổn.

### Kiểm tra nhanh một số document:

```js
// Xem 1 phòng
db.rooms.findOne()

// Xem 1 booking
db.bookings.findOne()

// Xem các booking đã hoàn thành
db.bookings.find({ status: "checked-out" })
```

---

## Bước 2: Chạy Backend Spring Boot

### 2.1. Kiểm tra cấu hình MongoDB

Mở file sau:
`backend/src/main/resources/application.properties`

Kiểm tra 2 dòng này có đúng không:

```properties
spring.data.mongodb.uri=mongodb://localhost:27017/nova_hotel_db
spring.data.mongodb.database=nova_hotel_db
```

Nếu đúng thì để nguyên.

### 2.2. Chạy Backend

Mở **PowerShell** hoặc **Terminal**, chạy lệnh sau:

```powershell
cd "E:\Đồ Án ĐTĐ\NOVAHOTEL\backend"

# Chạy bằng Maven wrapper
.\mvnw spring-boot:run
```

Hoặc nếu bạn đã cài Maven:

```powershell
cd "E:\Đồ Án ĐTĐ\NOVAHOTEL\backend"
mvn spring-boot:run
```

**Kết quả mong đợi:**
- Backend chạy thành công sẽ hiện dòng: `Started NovaHotelBackendApplication in X seconds`
- Không có lỗi kết nối MongoDB.

---

## Bước 3: Test API (Kiểm tra Backend có đọc được dữ liệu không)

### Cách đơn giản nhất: Dùng trình duyệt

Mở trình duyệt và thử các link sau:

**Lấy danh sách phòng:**
```
http://localhost:8080/api/rooms
```

**Lấy phòng còn trống (cần truyền ngày):**
```
http://localhost:8080/api/rooms/available?checkIn=2026-04-20&checkOut=2026-04-25
```

**Lấy danh sách user:**
```
http://localhost:8080/api/users
```

Nếu hiện dữ liệu dạng JSON là thành công.

### Dùng Postman (nếu có):

- Tạo request GET
- URL: `http://localhost:8080/api/rooms`
- Gửi request → xem kết quả

---

## Bước 4: Thử các Truy vấn Aggregation Mẫu (Phần quan trọng của đồ án)

Mở file:
`database/aggregation-queries.js`

Bạn có thể copy các hàm bên trong và chạy trong **Shell của Compass** để thử.

Ví dụ các truy vấn hay dùng:

```js
// 1. Thống kê doanh thu theo tháng
revenueByMonth(2026)

// 2. Top phòng được đánh giá cao
topRatedRooms(5)

// 3. Doanh thu theo loại phòng
revenueByRoomType()

// 4. Tỷ lệ lấp đầy phòng
occupancyRateByMonth(2026)
```

Những truy vấn này rất phù hợp để đưa vào phần **Kết quả và Thảo luận** của báo cáo.

---

## Bước 5: Chạy Frontend (nếu có)

Tùy theo frontend bạn đang dùng:

### Nếu dùng HTML + JS thuần (thư mục frontend):

Mở file `frontend/index.html` bằng trình duyệt (double click).

Hoặc dùng Live Server trong VS Code.

### Nếu có React/Vite:

```powershell
cd "E:\Đồ Án ĐTĐ\NOVAHOTEL\frontend"
npm install
npm run dev
```

---

## Bước 6: Những việc nên làm tiếp theo cho đồ án

1. **Test đầy đủ các chức năng**:
   - Xem danh sách phòng
   - Tìm phòng trống theo ngày
   - Xem chi tiết phòng
   - Đặt phòng (nếu có form)
   - Xem lịch sử booking

2. **Chụp màn hình kết quả**:
   - Dữ liệu trong Compass
   - Kết quả API
   - Kết quả các truy vấn aggregation

3. **Viết phần báo cáo**:
   - Chương 4: Xây dựng và Demo
   - Thêm hình ảnh kết quả truy vấn
   - So sánh với thiết kế ban đầu

4. **Cải thiện thêm (nếu còn thời gian)**:
   - Thêm index cho các truy vấn hay dùng
   - Viết thêm một số aggregation phức tạp hơn
   - Tạo user admin/receptionist để test phân quyền

---

## Tóm tắt thứ tự nên làm ngay bây giờ:

1. Kiểm tra count documents trong Compass (Bước 1)
2. Chạy backend Spring Boot (Bước 2)
3. Test vài API bằng trình duyệt (Bước 3)
4. Thử 2-3 truy vấn aggregation (Bước 4)

---

**Bạn đang ở bước nào rồi?**

Reply mình một trong các câu sau để được hướng dẫn chi tiết:

- "Đã kiểm tra count documents, kết quả là..."
- "Đang chạy backend nhưng bị lỗi..."
- "Backend chạy được rồi, giờ test API như thế nào?"
- "Muốn thử aggregation queries trước"

Bạn cứ làm theo các bước trên và báo tiến độ nhé! Mình sẽ hỗ trợ tiếp.