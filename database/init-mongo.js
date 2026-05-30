/**
 * =====================================================
 *  SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU MONGODB - NOVA HOTEL
 * =====================================================
 *
 * Mục đích:
 *   - Tạo database: nova_hotel_db
 *   - Tạo 4 collection chính theo thiết kế báo cáo đồ án
 *   - Áp dụng JSON Schema Validation (ràng buộc dữ liệu)
 *   - Tạo index để tối ưu truy vấn thường dùng
 *   - Chèn dữ liệu mẫu thực tế cho khách sạn tại Sơn La
 *
 * Cách sử dụng (MongoDB Shell - mongosh):
 *   1. Mở terminal / PowerShell
 *   2. Chạy: mongosh "mongodb://localhost:27017"
 *   3. cd đến thư mục database/
 *   4. Trong mongosh gõ:   load("init-mongo.js")
 *
 * Lưu ý:
 *   - Script này chỉ dùng cho môi trường DEVELOPMENT
 *   - Sẽ xóa dữ liệu cũ trước khi tạo lại (drop collections)
 *   - Mật khẩu trong seed là plaintext (chỉ test), production phải hash BCrypt
 *
 * Tác giả: Dựa trên báo cáo đồ án "Phân tích, thiết kế và xây dựng CSDL NoSQL cho hệ thống quản lý đặt phòng khách sạn NOVA HOTEL"
 * Phiên bản: 2026-04 | MongoDB 8.0+ tương thích
 */

// Kết nối đến database (tạo mới nếu chưa có)
const dbName = "nova_hotel_db";
const db = db.getSiblingDB(dbName);

print(`\n🚀 Bắt đầu khởi tạo cơ sở dữ liệu: ${dbName}`);
print("=====================================================");

// =====================================================
// BƯỚC 1: DỌN DẸP DỮ LIỆU CŨ (CHỈ DEVELOPMENT)
// =====================================================
print("\n[1/5] Đang xóa các collection cũ (nếu tồn tại)...");

const collectionsToDrop = ["users", "rooms", "bookings", "reviews"];
collectionsToDrop.forEach((col) => {
  if (db.getCollectionNames().includes(col)) {
    db[col].drop();
    print(`   ✓ Đã xóa collection: ${col}`);
  }
});

// =====================================================
// BƯỚC 2: TẠO COLLECTION + JSON SCHEMA VALIDATION
// =====================================================
print("\n[2/5] Đang tạo collections và áp dụng JSON Schema Validation...");

/**
 * Collection USERS
 * Vai trò: Lưu thông tin người dùng (khách hàng, lễ tân, admin)
 */
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "email", "fullName", "role"],
      properties: {
        userId: { bsonType: "string", description: "Mã định danh người dùng (USRxxx)" },
        email: { bsonType: "string", pattern: "^.+@.+\\..+$", description: "Email hợp lệ" },
        password: { bsonType: "string", description: "Mật khẩu đã hash (BCrypt)" },
        fullName: { bsonType: "string" },
        phone: { bsonType: "string" },
        role: { enum: ["customer", "receptionist", "admin"], description: "Vai trò hệ thống" },
        createdAt: { bsonType: "date" },
        lastLogin: { bsonType: ["date", "null"] },
        isActive: { bsonType: "bool" }
      }
    }
  }
});
print("   ✓ Collection 'users' + validator");

/**
 * Collection ROOMS
 * Lưu ý: price và seasonalPrice là embedded document (phù hợp NoSQL)
 */
db.createCollection("rooms", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["roomId", "roomNumber", "name", "roomType", "price", "status", "maxGuests"],
      properties: {
        roomId: { bsonType: "string" },
        roomNumber: { bsonType: "string" },
        name: { bsonType: "string" },
        roomType: { enum: ["Standard", "Deluxe", "Suite", "Family"] },
        price: {
          bsonType: "object",
          required: ["basePrice"],
          properties: {
            basePrice: { bsonType: "number", minimum: 0 },
            seasonalPrice: {
              bsonType: "object",
              properties: {
                highSeason: { bsonType: "number" },
                lowSeason: { bsonType: "number" }
              }
            }
          }
        },
        status: { enum: ["available", "occupied", "maintenance"] },
        facilities: { bsonType: "array", items: { bsonType: "string" } },
        images: { bsonType: "array", items: { bsonType: "string" } },
        description: { bsonType: "string" },
        maxGuests: { bsonType: "int", minimum: 1, maximum: 10 },
        floor: { bsonType: "int", minimum: 1, maximum: 10 }   // Tầng (thêm mới theo dữ liệu mẫu mở rộng)
      }
    }
  }
});
print("   ✓ Collection 'rooms' + validator (embedded price + floor)");

/**
 * Collection BOOKINGS
 * Sử dụng tham chiếu bằng chuỗi ID (userId, roomId) thay vì ObjectId reference
 */
db.createCollection("bookings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["bookingId", "userId", "roomId", "checkIn", "checkOut", "status", "totalPrice"],
      properties: {
        bookingId: { bsonType: "string" },
        userId: { bsonType: "string" },
        roomId: { bsonType: "string" },
        checkIn: { bsonType: "date" },
        checkOut: { bsonType: "date" },
        status: { enum: ["pending", "confirmed", "checked-in", "checked-out", "cancelled"] },
        totalPrice: { bsonType: "number", minimum: 0 },
        specialRequests: { bsonType: "string" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});
print("   ✓ Collection 'bookings' + validator");

/**
 * Collection REVIEWS
 */
db.createCollection("reviews", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["reviewId", "userId", "roomId", "rating"],
      properties: {
        reviewId: { bsonType: "string" },
        userId: { bsonType: "string" },
        roomId: { bsonType: "string" },
        rating: { bsonType: "int", minimum: 1, maximum: 5 },
        comment: { bsonType: "string" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});
print("   ✓ Collection 'reviews' + validator");

// =====================================================
// BƯỚC 3: TẠO INDEX (TỐI ƯU TRUY VẤN)
// =====================================================
print("\n[3/5] Đang tạo indexes cho hiệu suất cao...");

// USERS indexes
db.users.createIndex({ email: 1 }, { unique: true, name: "idx_users_email_unique" });
db.users.createIndex({ userId: 1 }, { unique: true, name: "idx_users_userId_unique" });
db.users.createIndex({ role: 1 }, { name: "idx_users_role" });

// ROOMS indexes - hỗ trợ lọc phòng nhanh
db.rooms.createIndex({ roomId: 1 }, { unique: true, name: "idx_rooms_roomId_unique" });
db.rooms.createIndex({ status: 1 }, { name: "idx_rooms_status" });
db.rooms.createIndex({ roomType: 1 }, { name: "idx_rooms_roomType" });
db.rooms.createIndex({ "price.basePrice": 1 }, { name: "idx_rooms_basePrice" });

// BOOKINGS indexes - cực kỳ quan trọng cho kiểm tra phòng trống + thống kê
db.bookings.createIndex({ bookingId: 1 }, { unique: true, name: "idx_bookings_bookingId_unique" });
db.bookings.createIndex({ userId: 1 }, { name: "idx_bookings_userId" });
db.bookings.createIndex({ roomId: 1 }, { name: "idx_bookings_roomId" });
db.bookings.createIndex({ checkIn: 1, checkOut: 1 }, { name: "idx_bookings_dates" });
db.bookings.createIndex({ status: 1 }, { name: "idx_bookings_status" });

// REVIEWS indexes
db.reviews.createIndex({ roomId: 1 }, { name: "idx_reviews_roomId" });
db.reviews.createIndex({ userId: 1 }, { name: "idx_reviews_userId" });
db.reviews.createIndex({ rating: 1 }, { name: "idx_reviews_rating" });

print("   ✓ Đã tạo 14 indexes (unique + compound)");

// =====================================================
// BƯỚC 4: CHÈN DỮ LIỆU MẪU (SEED DATA)
// =====================================================
print("\n[4/5] Đang chèn dữ liệu mẫu thực tế...");

// Dữ liệu USERS (7 người)
const usersData = [
  { userId: "USR001", email: "admin@novahotel.vn", password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", fullName: "Đào Tiến Đạt", phone: "0987654321", role: "admin", createdAt: new Date("2025-01-10"), lastLogin: new Date("2026-04-20"), isActive: true },
  { userId: "USR002", email: "lethireception@novahotel.vn", password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", fullName: "Lê Thị Hương", phone: "0912345678", role: "receptionist", createdAt: new Date("2025-02-15"), lastLogin: new Date("2026-04-19"), isActive: true },
  { userId: "USR003", email: "nguyenvana@gmail.com", password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", fullName: "Nguyễn Văn An", phone: "0901122334", role: "customer", createdAt: new Date("2025-11-20"), lastLogin: new Date("2026-04-18"), isActive: true },
  { userId: "USR004", email: "tranthibich@gmail.com", password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", fullName: "Trần Thị Bích", phone: "0935566778", role: "customer", createdAt: new Date("2026-01-05"), lastLogin: new Date("2026-04-15"), isActive: true },
  { userId: "USR005", email: "phamminhhoang@gmail.com", password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", fullName: "Phạm Minh Hoàng", phone: "0978899001", role: "customer", createdAt: new Date("2026-02-28"), lastLogin: new Date("2026-04-10"), isActive: true },
  { userId: "USR006", email: "vuongthilananh@gmail.com", password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", fullName: "Vương Thị Lan Anh", phone: "0944455566", role: "customer", createdAt: new Date("2026-03-12"), lastLogin: new Date("2026-04-20"), isActive: true },
  { userId: "USR007", email: "hoangvanlong@gmail.com", password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", fullName: "Hoàng Văn Long", phone: "0961122334", role: "customer", createdAt: new Date("2026-04-01"), lastLogin: new Date("2026-04-19"), isActive: true },
  { userId: "USR008", email: "dangthithuy@gmail.com", password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", fullName: "Đặng Thị Thủy", phone: "0982233445", role: "customer", createdAt: new Date("2026-04-28"), lastLogin: new Date("2026-05-05"), isActive: true }
];

db.users.insertMany(usersData);
print(`   ✓ Đã chèn ${usersData.length} users`);

// Dữ liệu ROOMS (10 phòng - đa dạng loại)
const roomsData = [
  { roomId: "RM001", roomNumber: "101", name: "Phòng Standard View Núi", roomType: "Standard", price: { basePrice: 850000, seasonalPrice: { highSeason: 1150000, lowSeason: 750000 } }, status: "available", facilities: ["WiFi miễn phí", "Điều hòa", "Tivi LED", "Tủ lạnh mini", "Bàn làm việc", "Nước nóng lạnh"], images: ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800"], description: "Phòng tiêu chuẩn rộng 22m² với view núi Cà Pha thơ mộng.", maxGuests: 2, floor: 1 },
  { roomId: "RM002", roomNumber: "102", name: "Phòng Standard View Vườn", roomType: "Standard", price: { basePrice: 800000, seasonalPrice: { highSeason: 1050000, lowSeason: 700000 } }, status: "available", facilities: ["WiFi miễn phí", "Điều hòa", "Tivi LED", "Tủ lạnh mini", "Ban công"], images: ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"], description: "Phòng Standard hướng vườn, yên tĩnh.", maxGuests: 2, floor: 1 },
  { roomId: "RM003", roomNumber: "201", name: "Phòng Deluxe Ban Công", roomType: "Deluxe", price: { basePrice: 1250000, seasonalPrice: { highSeason: 1650000, lowSeason: 1100000 } }, status: "available", facilities: ["WiFi miễn phí", "Điều hòa inverter", "Tivi Smart 55\"", "Máy pha cà phê", "Két sắt", "Ban công riêng"], images: ["https://images.unsplash.com/photo-1578683010236-d348e1b7c2a1?w=800"], description: "Phòng Deluxe 28m² có ban công riêng, view thung lũng.", maxGuests: 3, floor: 2 },
  { roomId: "RM004", roomNumber: "202", name: "Phòng Deluxe Family", roomType: "Deluxe", price: { basePrice: 1350000, seasonalPrice: { highSeason: 1750000, lowSeason: 1200000 } }, status: "occupied", facilities: ["WiFi miễn phí", "Điều hòa", "Tivi Smart", "2 giường đôi", "Bồn tắm", "Ban công"], images: ["https://images.unsplash.com/photo-1560185893-a55cbcde80de?w=800"], description: "Phòng gia đình 32m², phù hợp 4 khách.", maxGuests: 4, floor: 2 },
  { roomId: "RM005", roomNumber: "301", name: "Suite Tổng Thống View Núi", roomType: "Suite", price: { basePrice: 2200000, seasonalPrice: { highSeason: 2800000, lowSeason: 1900000 } }, status: "available", facilities: ["WiFi cao cấp", "Tivi OLED 65\"", "Bồn tắm riêng", "Phòng khách riêng", "Ban công rộng"], images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"], description: "Phòng Suite cao cấp 45m², view panorama.", maxGuests: 3, floor: 3 },
  { roomId: "RM006", roomNumber: "302", name: "Suite Honeymoon", roomType: "Suite", price: { basePrice: 2450000, seasonalPrice: { highSeason: 3100000, lowSeason: 2100000 } }, status: "available", facilities: ["WiFi", "Giường king size", "Bồn tắm hoa hồng", "Máy chiếu phim", "Sân hiên riêng"], images: ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800"], description: "Phòng Honeymoon lãng mạn dành cho cặp đôi.", maxGuests: 2, floor: 3 },
  { roomId: "RM007", roomNumber: "103", name: "Phòng Standard Tiết Kiệm", roomType: "Standard", price: { basePrice: 650000, seasonalPrice: { highSeason: 850000, lowSeason: 580000 } }, status: "maintenance", facilities: ["WiFi", "Điều hòa", "Tivi", "Nước nóng lạnh"], images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"], description: "Phòng giá tốt, đang bảo trì định kỳ.", maxGuests: 2, floor: 1 },
  { roomId: "RM008", roomNumber: "203", name: "Phòng Deluxe View Sông", roomType: "Deluxe", price: { basePrice: 1380000, seasonalPrice: { highSeason: 1780000, lowSeason: 1180000 } }, status: "available", facilities: ["WiFi", "Điều hòa", "Tivi Smart", "Ban công view sông"], images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800"], description: "Phòng Deluxe view sông Nậm La, gió mát.", maxGuests: 3, floor: 2 },
  { roomId: "RM009", roomNumber: "401", name: "Family Suite 4-5 Người", roomType: "Family", price: { basePrice: 1850000, seasonalPrice: { highSeason: 2350000, lowSeason: 1600000 } }, status: "available", facilities: ["WiFi", "2 phòng ngủ", "Phòng khách", "Bếp nhỏ", "Ban công lớn"], images: ["https://images.unsplash.com/photo-1600585154340-be6161a56b0a?w=800"], description: "Suite gia đình rộng 55m², lý tưởng cho 4-5 người.", maxGuests: 5, floor: 4 },
  { roomId: "RM010", roomNumber: "105", name: "Phòng Standard Connecting", roomType: "Standard", price: { basePrice: 900000, seasonalPrice: { highSeason: 1200000, lowSeason: 800000 } }, status: "available", facilities: ["WiFi", "Điều hòa", "2 phòng nối nhau"], images: ["https://images.unsplash.com/photo-1540518614846-6eded433c457?w=800"], description: "Hai phòng nối nhau, phù hợp nhóm 4 người.", maxGuests: 4, floor: 1 },
  { roomId: "RM011", roomNumber: "204", name: "Phòng Deluxe Twin", roomType: "Deluxe", price: { basePrice: 1190000, seasonalPrice: { highSeason: 1550000, lowSeason: 1050000 } }, status: "available", facilities: ["WiFi", "2 giường đơn", "Tivi Smart", "Bàn làm việc rộng"], images: ["https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800"], description: "Phòng Deluxe 2 giường đơn, tiện cho công tác.", maxGuests: 2, floor: 2 },
  { roomId: "RM012", roomNumber: "303", name: "Suite Executive", roomType: "Suite", price: { basePrice: 2650000, seasonalPrice: { highSeason: 3300000, lowSeason: 2300000 } }, status: "available", facilities: ["WiFi cao cấp", "Phòng họp nhỏ 4 người", "Máy chiếu", "Bồn tắm + vòi sen riêng biệt"], images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"], description: "Suite Executive cho khách doanh nhân, có không gian họp nhỏ.", maxGuests: 4, floor: 3 }
];

db.rooms.insertMany(roomsData);
print(`   ✓ Đã chèn ${roomsData.length} rooms (đa dạng Standard → Suite + Family)`);

// Dữ liệu BOOKINGS (6 booking mẫu)
const bookingsData = [
  { bookingId: "BK20260305-001", userId: "USR003", roomId: "RM001", checkIn: new Date("2026-03-05"), checkOut: new Date("2026-03-08"), status: "checked-out", totalPrice: 2550000, specialRequests: "", createdAt: new Date("2026-03-01") },
  { bookingId: "BK20260312-002", userId: "USR004", roomId: "RM003", checkIn: new Date("2026-03-12"), checkOut: new Date("2026-03-15"), status: "checked-out", totalPrice: 3750000, specialRequests: "Cần thêm nôi trẻ em", createdAt: new Date("2026-03-08") },
  { bookingId: "BK20260320-003", userId: "USR005", roomId: "RM005", checkIn: new Date("2026-03-20"), checkOut: new Date("2026-03-23"), status: "checked-out", totalPrice: 6600000, specialRequests: "Yêu cầu trang trí nhẹ nhàng", createdAt: new Date("2026-03-15") },
  { bookingId: "BK20260325-004", userId: "USR006", roomId: "RM008", checkIn: new Date("2026-03-25"), checkOut: new Date("2026-03-28"), status: "checked-out", totalPrice: 4140000, specialRequests: "", createdAt: new Date("2026-03-20") },
  { bookingId: "BK20260410-006", userId: "USR003", roomId: "RM003", checkIn: new Date("2026-04-10"), checkOut: new Date("2026-04-13"), status: "checked-out", totalPrice: 3750000, specialRequests: "Cần thêm 1 gối ôm và khăn tắm cho trẻ em", createdAt: new Date("2026-04-05") },
  { bookingId: "BK20260415-007", userId: "USR006", roomId: "RM004", checkIn: new Date("2026-04-15"), checkOut: new Date("2026-04-18"), status: "checked-out", totalPrice: 4050000, specialRequests: "Có 2 trẻ em dưới 6 tuổi, cần giường phụ và nôi", createdAt: new Date("2026-04-10") },
  { bookingId: "BK20260418-008", userId: "USR004", roomId: "RM005", checkIn: new Date("2026-04-18"), checkOut: new Date("2026-04-21"), status: "confirmed", totalPrice: 6600000, specialRequests: "Yêu cầu trang trí phòng honeymoon, bánh kem + rượu vang", createdAt: new Date("2026-04-12") },
  { bookingId: "BK20260420-009", userId: "USR005", roomId: "RM001", checkIn: new Date("2026-04-22"), checkOut: new Date("2026-04-24"), status: "pending", totalPrice: 1700000, specialRequests: "", createdAt: new Date("2026-04-19") },
  { bookingId: "BK20260425-010", userId: "USR007", roomId: "RM008", checkIn: new Date("2026-04-25"), checkOut: new Date("2026-04-28"), status: "confirmed", totalPrice: 4140000, specialRequests: "Muốn view đẹp nhất, phòng cao tầng", createdAt: new Date("2026-04-20") },
  { bookingId: "BK20260428-011", userId: "USR005", roomId: "RM011", checkIn: new Date("2026-04-28"), checkOut: new Date("2026-04-30"), status: "confirmed", totalPrice: 2380000, specialRequests: "", createdAt: new Date("2026-04-22") },
  { bookingId: "BK20260502-012", userId: "USR006", roomId: "RM009", checkIn: new Date("2026-05-02"), checkOut: new Date("2026-05-05"), status: "pending", totalPrice: 5550000, specialRequests: "Gia đình có 2 trẻ nhỏ, cần nôi và ghế ăn dặm", createdAt: new Date("2026-04-25") },
  { bookingId: "BK20260508-013", userId: "USR007", roomId: "RM012", checkIn: new Date("2026-05-08"), checkOut: new Date("2026-05-11"), status: "confirmed", totalPrice: 7950000, specialRequests: "Cần phòng họp nhỏ 2 tiếng mỗi sáng", createdAt: new Date("2026-05-01") }
];

db.bookings.insertMany(bookingsData);
print(`   ✓ Đã chèn ${bookingsData.length} bookings (trạng thái đa dạng)`);

// Dữ liệu REVIEWS (6 đánh giá)
const reviewsData = [
  { reviewId: "RV001", userId: "USR003", roomId: "RM003", rating: 5, comment: "Phòng Deluxe rất đẹp, sạch sẽ, view ban công cực kỳ ấn tượng. Nhân viên lễ tân nhiệt tình.", createdAt: new Date("2026-04-14") },
  { reviewId: "RV002", userId: "USR004", roomId: "RM005", rating: 5, comment: "Suite honeymoon hoàn hảo cho tuần trăng mật. Bồn tắm view núi, dịch vụ nhanh, trang trí lãng mạn.", createdAt: new Date("2026-04-22") },
  { reviewId: "RV003", userId: "USR005", roomId: "RM001", rating: 4, comment: "Phòng Standard ổn, giá hợp lý, view núi đẹp. Nước nóng hơi yếu buổi sáng nhưng tổng thể hài lòng.", createdAt: new Date("2026-04-08") },
  { reviewId: "RV004", userId: "USR006", roomId: "RM004", rating: 5, comment: "Đi gia đình 4 người, phòng Family rộng rãi. Trẻ con rất thích. Bữa sáng ngon và đa dạng.", createdAt: new Date("2026-04-19") },
  { reviewId: "RV005", userId: "USR007", roomId: "RM008", rating: 4, comment: "View sông rất chill, phòng sạch. Đáng tiền vì không gian yên tĩnh.", createdAt: new Date("2026-04-20") },
  { reviewId: "RV006", userId: "USR003", roomId: "RM003", rating: 4, comment: "Lần thứ 2 quay lại, vẫn tốt. Lễ tân nhớ tên khách cũ rất chuyên nghiệp.", createdAt: new Date("2026-04-13") },
  { reviewId: "RV007", userId: "USR005", roomId: "RM005", rating: 5, comment: "Suite cực kỳ sang trọng, không gian riêng tư tốt. Phù hợp công tác hoặc nghỉ dưỡng cao cấp.", createdAt: new Date("2026-03-24") },
  { reviewId: "RV008", userId: "USR004", roomId: "RM011", rating: 3, comment: "Phòng Twin ổn, nhưng tiếng ồn từ hành lang hơi lớn. Cần cải thiện cách âm.", createdAt: new Date("2026-04-30") },
  { reviewId: "RV009", userId: "USR006", roomId: "RM009", rating: 5, comment: "Family Suite quá đỉnh cho gia đình có con nhỏ. Rất nhiều tiện ích và không gian cho trẻ.", createdAt: new Date("2026-05-06") },
  { reviewId: "RV010", userId: "USR007", roomId: "RM012", rating: 4, comment: "Suite Executive rất tiện cho họp hành. Có máy chiếu và bàn họp nhỏ. Dịch vụ chuyên nghiệp.", createdAt: new Date("2026-05-12") }
];

db.reviews.insertMany(reviewsData);
print(`   ✓ Đã chèn ${reviewsData.length} reviews`);

// =====================================================
// BƯỚC 5: KIỂM TRA KẾT QUẢ
// =====================================================
print("\n[5/5] Kiểm tra kết quả khởi tạo...");

const stats = {
  users: db.users.countDocuments(),
  rooms: db.rooms.countDocuments(),
  bookings: db.bookings.countDocuments(),
  reviews: db.reviews.countDocuments()
};

print("\n=====================================================");
print("✅ KHỞI TẠO THÀNH CÔNG!");
print("=====================================================");
print(`   Database : ${dbName}`);
print(`   Users    : ${stats.users} documents`);
print(`   Rooms    : ${stats.rooms} documents`);
print(`   Bookings : ${stats.bookings} documents`);
print(`   Reviews  : ${stats.reviews} documents`);
print("=====================================================\n");

// Một số truy vấn mẫu nhanh để kiểm tra
print("📌 Một số document mẫu:");
print("   - User admin: ", db.users.findOne({ role: "admin" }).fullName);
print("   - Room cao cấp: ", db.rooms.findOne({ roomType: "Suite" }).name);
print("   - Booking gần nhất: ", db.bookings.findOne({ status: "confirmed" }).bookingId);

print("\n💡 Gợi ý tiếp theo:");
print("   1. Mở MongoDB Compass → kết nối localhost:27017 → chọn nova_hotel_db");
print("   2. Thử các truy vấn Aggregation trong báo cáo (chương 3.4)");
print("   3. Chạy backend Spring Boot để test API với dữ liệu thật\n");

// Trả về thống kê cho mongosh
stats;