# Hướng Dẫn Tạo Cơ Sở Dữ Liệu MongoDB cho NOVA HOTEL

> **🚀 Dành cho người dùng Windows nhanh nhất:**
> 1. Mở **PowerShell** trong thư mục `database/`
> 2. Chạy lệnh: `.\init-db.ps1`
> 3. Xong! Mở MongoDB Compass kiểm tra database `nova_hotel_db`

## Mục tiêu
Tạo và khởi tạo cơ sở dữ liệu **nova_hotel_db** trên MongoDB Compass (hoặc mongo shell) dựa trên thiết kế trong **Báo cáo đồ án - Đào Tiến Đạt**.

Thiết kế tuân thủ:
- 4 collection chính: `users`, `rooms`, `bookings`, `reviews`
- Sử dụng embedding cho dữ liệu lồng nhau (price, seasonalPrice, facilities, images)
- Tham chiếu bằng chuỗi ID (userId, roomId, bookingId) phù hợp với mô hình Spring Boot hiện tại
- Hỗ trợ JSON Schema Validation (tùy chọn)
- Dữ liệu mẫu thực tế cho khách sạn tại Sơn La

---

## Yêu cầu trước khi chạy

1. **Cài đặt MongoDB** (Community Server) + **MongoDB Compass**
   - Tải tại: https://www.mongodb.com/try/download/community
   - Hoặc dùng MongoDB Atlas (nếu không cài local)

2. **Khởi động MongoDB**
   ```powershell
   # Windows - chạy dưới quyền Administrator
   net start MongoDB
   ```
   Hoặc mở MongoDB Compass → Connect to `mongodb://localhost:27017`

3. **Kiểm tra kết nối**
   - Mở MongoDB Compass
   - URI: `mongodb://localhost:27017`
   - Tạo database mới tên `nova_hotel_db` (nếu chưa có)

---

## Cách 1: Khởi tạo nhanh bằng MongoDB Shell (Khuyến nghị)

### Bước 1: Mở mongo shell
```powershell
# Trong thư mục database/
mongosh "mongodb://localhost:27017/nova_hotel_db"
```

### Bước 2: Chạy script khởi tạo
```javascript
// Trong mongosh, paste hoặc load file:
load("init-mongo.js")
```

Script sẽ tự động:
- Xóa dữ liệu cũ (nếu có)
- Tạo 4 collection + JSON Schema validator
- Tạo index tối ưu
- Chèn dữ liệu mẫu (~15 users, ~12 rooms, ~8 bookings, ~10 reviews)

### Bước 3: Kiểm tra kết quả
```javascript
db.users.countDocuments()
db.rooms.countDocuments()
db.bookings.countDocuments()
db.reviews.countDocuments()

// Xem một phòng mẫu
db.rooms.findOne()
```

---

## Cách 2: Import thủ công qua MongoDB Compass (Khuyến nghị nếu không có mongosh)

**Đây là cách dễ nhất** nếu bạn đã cài MongoDB Compass (bạn không cần mongosh).

### Hướng dẫn chi tiết từng bước (rất dễ làm theo):

→ Mở file này và làm theo:  
**[`HUONG_DAN_IMPORT_VAO_COMPASS.md`](HUONG_DAN_IMPORT_VAO_COMPASS.md)**

File này có:
- Hình ảnh minh họa từng bước
- Thứ tự import bắt buộc
- Cách xử lý khi bị lỗi
- Cách kiểm tra sau khi import xong

### Tóm tắt nhanh:
1. Kết nối Compass vào `localhost:27017`
2. Tạo database `nova_hotel_db`
3. Tạo 4 collection: `users`, `rooms`, `bookings`, `reviews`
4. Import 4 file JSON theo đúng thứ tự (users → rooms → bookings → reviews) bằng nút **Add Data → Import JSON or CSV file**

---

## Cấu trúc dữ liệu chi tiết

### 1. users
```json
{
  "_id": ObjectId,
  "userId": "USR001",
  "email": "khach1@gmail.com",
  "password": "$2a$10$...",   // BCrypt hash (thực tế)
  "fullName": "Nguyễn Thị Lan",
  "phone": "0912345678",
  "role": "customer" | "receptionist" | "admin",
  "createdAt": ISODate,
  "lastLogin": ISODate,
  "isActive": true
}
```

**Index**: `email` (unique), `userId` (unique), `role`

### 2. rooms (Embedded documents)
```json
{
  "_id": ObjectId,
  "roomId": "RM001",
  "roomNumber": "101",
  "name": "Phòng Standard View Núi",
  "roomType": "Standard" | "Deluxe" | "Suite" | "Family",
  "price": {
    "basePrice": 850000,
    "seasonalPrice": {
      "highSeason": 1200000,
      "lowSeason": 750000
    }
  },
  "status": "available" | "occupied" | "maintenance",
  "facilities": ["WiFi", "Điều hòa", "Tivi", "Tủ lạnh"],
  "images": ["https://.../room101-1.jpg", "..."],
  "description": "Phòng rộng rãi, view núi Cà Pha...",
  "maxGuests": 2
}
```

**Index**: `roomId`, `status`, `roomType`, `price.basePrice`

### 3. bookings (Referencing)
```json
{
  "_id": ObjectId,
  "bookingId": "BK20260425-001",
  "userId": "USR003",
  "roomId": "RM005",
  "checkIn": ISODate("2026-05-01"),
  "checkOut": ISODate("2026-05-04"),
  "status": "confirmed" | "pending" | "checked-in" | "checked-out" | "cancelled",
  "totalPrice": 2550000,
  "specialRequests": "Cần giường phụ cho trẻ em",
  "createdAt": ISODate
}
```

**Index**: `bookingId`, `userId`, `roomId`, `checkIn`, `status`, compound `(checkIn, checkOut)`

### 4. reviews
```json
{
  "_id": ObjectId,
  "reviewId": "RV001",
  "userId": "USR003",
  "roomId": "RM005",
  "rating": 5,
  "comment": "Phòng sạch sẽ, view đẹp, nhân viên thân thiện!",
  "createdAt": ISODate
}
```

**Index**: `roomId`, `userId`, `rating`

---

## Truy vấn mẫu quan trọng (từ báo cáo)

```javascript
// 1. Tìm phòng trống theo khoảng thời gian (cần logic ứng dụng)
db.rooms.find({ status: "available" })

// 2. Thống kê doanh thu theo tháng (Aggregation)
db.bookings.aggregate([
  { $match: { status: { $in: ["confirmed", "checked-out"] } } },
  { $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
      totalRevenue: { $sum: "$totalPrice" },
      count: { $sum: 1 }
  }},
  { $sort: { _id: -1 } }
])

// 3. Lấy đánh giá trung bình của phòng
db.reviews.aggregate([
  { $group: { _id: "$roomId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
])
```

---

## Lưu ý bảo mật & Production

- **Mật khẩu** trong file seed là plaintext chỉ dùng cho development. Trong production phải hash BCrypt.
- Nên bật **Schema Validation** trên production (đã có trong init script).
- Tạo **user MongoDB** riêng với quyền hạn chế cho ứng dụng Spring Boot.
- Backup thường xuyên: `mongodump --db nova_hotel_db`

---

## Tương thích với Backend

Backend Spring Boot đã cấu hình sẵn:
```properties
spring.data.mongodb.uri=mongodb://localhost:27017/nova_hotel_db
```

Chạy Spring Boot sau khi có dữ liệu → có thể test API ngay.

---

**Tác giả script**: Tự động sinh từ mô hình hiện tại + thiết kế trong báo cáo đồ án  
**Phiên bản**: 2026-05 (mở rộng dữ liệu + aggregation queries)

---

## Sau khi import xong thì làm gì tiếp?

Mở file này để xem hướng dẫn chi tiết các bước tiếp theo:

**[`BUOC_TIEP_THEO_SAU_KHI_IMPORT.md`](BUOC_TIEP_THEO_SAU_KHI_IMPORT.md)**

Nội dung chính:
- Kiểm tra dữ liệu đã import đúng chưa
- Chạy Backend Spring Boot
- Test API
- Chạy các truy vấn Aggregation mẫu (rất quan trọng cho báo cáo)
- Hướng dẫn chạy Frontend
- Các việc nên làm tiếp theo để hoàn thiện đồ án

---

## 📌 Truy vấn Aggregation Mẫu (Chương 3.4 báo cáo)

File [aggregation-queries.js](aggregation-queries.js) chứa **10+ truy vấn quan trọng** đã được comment tiếng Việt đầy đủ:

### Các truy vấn nổi bật:
- `findAvailableRoomsByDateRange(checkIn, checkOut)` → Tìm phòng trống (query cốt lõi)
- `revenueByMonth(year)` → Doanh thu + ADR theo tháng
- `occupancyRateByMonth(year)` → Tỷ lệ lấp đầy phòng
- `topRatedRooms(limit)` → Xếp hạng phòng theo đánh giá
- `revenueByRoomType()` → Doanh thu theo loại phòng (Standard/Deluxe/Suite/Family)
- `bookingHistoryByUser(userId)` → Lịch sử đặt phòng của khách
- `revenueByQuarter(year)` → Báo cáo theo quý
- `ratingStatsByRoomType()` → Thống kê đánh giá theo loại phòng

### Cách chạy nhanh:
```powershell
mongosh "mongodb://localhost:27017/nova_hotel_db"
load("aggregation-queries.js")

# Sau đó gọi:
revenueByMonth(2026)
topRatedRooms(5)
findAvailableRoomsByDateRange(new Date("2026-04-20"), new Date("2026-04-25"))
```

Tất cả truy vấn đều sẵn sàng copy sang **MongoDB Compass → Aggregations** để xem kết quả dạng bảng/biểu đồ.

---

## Dữ liệu mẫu đã mở rộng (v2026-05)

- **12 phòng** (thêm Executive, Twin, Connecting, nhiều tầng)
- **14 booking** trải dài tháng 3-5/2026 (hỗ trợ tốt truy vấn theo quý/tháng)
- **10 review** với phân bố rating thực tế (3-5 sao)
- **8 users** (1 admin, 1 lễ tân, 6 khách)

Dữ liệu này đủ để demo đầy đủ các báo cáo quản lý theo đúng yêu cầu trong báo cáo đồ án.
