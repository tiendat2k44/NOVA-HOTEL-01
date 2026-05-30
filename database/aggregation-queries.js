/**
 * ============================================================
 *  TẬP TRUY VẤN AGGREGATION MẪU - NOVA HOTEL
 * ============================================================
 *
 * File này chứa các truy vấn MongoDB quan trọng nhất theo Chương 3.4
 * của báo cáo đồ án "Phân tích, thiết kế và xây dựng CSDL NoSQL
 * cho hệ thống quản lý đặt phòng khách sạn NOVA HOTEL".
 *
 * Sử dụng:
 *   - Mở mongosh: mongosh "mongodb://localhost:27017/nova_hotel_db"
 *   - Chạy: load("aggregation-queries.js")
 *   - Sau đó gọi từng function:
 *       findAvailableRoomsByDateRange(new Date("2026-04-20"), new Date("2026-04-25"))
 *       revenueByMonth()
 *
 * Hoặc copy từng đoạn pipeline vào MongoDB Compass → Aggregations tab.
 *
 * Tác giả: Dựa trên thiết kế báo cáo + thực tế triển khai Spring Boot
 * Phiên bản: 2026-05
 */

// Đảm bảo đang ở đúng database
const db = db.getSiblingDB("nova_hotel_db");

// ============================================================
// 1. TÌM PHÒNG TRỐNG THEO KHOẢNG THỜI GIAN (QUAN TRỌNG NHẤT)
// ============================================================
// Chiếm 60-70% truy vấn của khách hàng.
// Logic thực tế thường kết hợp cả MongoDB + code Java (xem RoomService.java)

function findAvailableRoomsByDateRange(checkIn, checkOut) {
  print(`\n🔍 Tìm phòng trống từ ${checkIn.toISOString().slice(0,10)} đến ${checkOut.toISOString().slice(0,10)}`);
  
  // Bước 1: Tìm các booking đã xác nhận/đã nhận phòng chồng chéo
  const bookedRoomIds = db.bookings.distinct("roomId", {
    status: { $in: ["confirmed", "checked-in"] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn }
  });

  // Bước 2: Tìm phòng available và không nằm trong danh sách đã đặt
  const availableRooms = db.rooms.find({
    status: "available",
    roomId: { $nin: bookedRoomIds }
  }).toArray();

  print(`   → Tìm được ${availableRooms.length} phòng trống`);
  return availableRooms;
}

// Ví dụ gọi:
// findAvailableRoomsByDateRange(new Date("2026-04-20"), new Date("2026-04-25"));


// ============================================================
// 2. THỐNG KÊ DOANH THU THEO THÁNG (BÁO CÁO QUẢN LÝ)
// ============================================================
// Dùng để tính: Tổng doanh thu, số booking, ADR (Average Daily Rate)

function revenueByMonth(year = 2026) {
  print(`\n📊 Thống kê doanh thu năm ${year} theo tháng`);
  
  return db.bookings.aggregate([
    {
      $match: {
        status: { $in: ["confirmed", "checked-out"] },
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year+1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        totalRevenue: { $sum: "$totalPrice" },
        bookingCount: { $sum: 1 },
        avgBookingValue: { $avg: "$totalPrice" }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        month: "$_id",
        totalRevenue: 1,
        bookingCount: 1,
        avgBookingValue: { $round: ["$avgBookingValue", 0] },
        _id: 0
      }
    }
  ]).toArray();
}

// Ví dụ: revenueByMonth(2026);


// ============================================================
// 3. TỶ LỆ LẤP ĐẦY PHÒNG (OCCUPANCY RATE) THEO THÁNG
// ============================================================

function occupancyRateByMonth(year = 2026) {
  print(`\n📈 Tỷ lệ lấp đầy phòng năm ${year}`);
  
  // Giả sử khách sạn có 12 phòng (có thể thay đổi theo thực tế)
  const TOTAL_ROOMS = 12;
  const DAYS_IN_MONTH = 30;

  return db.bookings.aggregate([
    {
      $match: {
        status: { $in: ["confirmed", "checked-in", "checked-out"] },
        checkIn: { $gte: new Date(`${year}-01-01`) }
      }
    },
    {
      $addFields: {
        nights: {
          $divide: [
            { $subtract: ["$checkOut", "$checkIn"] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$checkIn" } },
        totalRoomNights: { $sum: "$nights" }
      }
    },
    {
      $project: {
        month: "$_id",
        totalRoomNights: 1,
        possibleRoomNights: TOTAL_ROOMS * DAYS_IN_MONTH,
        occupancyRate: {
          $round: [
            { $multiply: [{ $divide: ["$totalRoomNights", TOTAL_ROOMS * DAYS_IN_MONTH] }, 100] },
            1
          ]
        },
        _id: 0
      }
    },
    { $sort: { month: 1 } }
  ]).toArray();
}


// ============================================================
// 4. XẾP HẠNG PHÒNG THEO ĐÁNH GIÁ TRUNG BÌNH
// ============================================================

function topRatedRooms(limit = 5) {
  print(`\n⭐ Top ${limit} phòng được đánh giá cao nhất`);
  
  return db.reviews.aggregate([
    {
      $group: {
        _id: "$roomId",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 }
      }
    },
    { $match: { reviewCount: { $gte: 1 } } },
    {
      $lookup: {
        from: "rooms",
        localField: "_id",
        foreignField: "roomId",
        as: "roomInfo"
      }
    },
    { $unwind: "$roomInfo" },
    {
      $project: {
        roomId: "$_id",
        roomName: "$roomInfo.name",
        roomType: "$roomInfo.roomType",
        avgRating: { $round: ["$avgRating", 2] },
        reviewCount: 1,
        _id: 0
      }
    },
    { $sort: { avgRating: -1, reviewCount: -1 } },
    { $limit: limit }
  ]).toArray();
}


// ============================================================
// 5. THỐNG KÊ DOANH THU THEO LOẠI PHÒNG
// ============================================================

function revenueByRoomType() {
  print(`\n💰 Doanh thu theo loại phòng`);
  
  return db.bookings.aggregate([
    {
      $match: { status: { $in: ["confirmed", "checked-out"] } }
    },
    {
      $lookup: {
        from: "rooms",
        localField: "roomId",
        foreignField: "roomId",
        as: "room"
      }
    },
    { $unwind: "$room" },
    {
      $group: {
        _id: "$room.roomType",
        totalRevenue: { $sum: "$totalPrice" },
        bookingCount: { $sum: 1 },
        avgPrice: { $avg: "$totalPrice" }
      }
    },
    {
      $project: {
        roomType: "$_id",
        totalRevenue: 1,
        bookingCount: 1,
        avgPrice: { $round: ["$avgPrice", 0] },
        _id: 0
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]).toArray();
}


// ============================================================
// 6. LỊCH SỬ ĐẶT PHÒNG CỦA MỘT KHÁCH HÀNG
// ============================================================

function bookingHistoryByUser(userId) {
  print(`\n📋 Lịch sử đặt phòng của user: ${userId}`);
  
  return db.bookings.aggregate([
    { $match: { userId: userId } },
    {
      $lookup: {
        from: "rooms",
        localField: "roomId",
        foreignField: "roomId",
        as: "room"
      }
    },
    { $unwind: "$room" },
    {
      $project: {
        bookingId: 1,
        checkIn: 1,
        checkOut: 1,
        status: 1,
        totalPrice: 1,
        roomName: "$room.name",
        roomType: "$room.roomType",
        createdAt: 1,
        _id: 0
      }
    },
    { $sort: { createdAt: -1 } }
  ]).toArray();
}

// Ví dụ: bookingHistoryByUser("USR003");


// ============================================================
// 7. PHÒNG CÓ NHIỀU BOOKING NHẤT (PHỔ BIẾN)
// ============================================================

function mostBookedRooms(limit = 5) {
  return db.bookings.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: "$roomId",
        bookingCount: { $sum: 1 },
        totalRevenue: { $sum: "$totalPrice" }
      }
    },
    {
      $lookup: {
        from: "rooms",
        localField: "_id",
        foreignField: "roomId",
        as: "room"
      }
    },
    { $unwind: "$room" },
    {
      $project: {
        roomId: "$_id",
        roomName: "$room.name",
        roomType: "$room.roomType",
        bookingCount: 1,
        totalRevenue: 1,
        _id: 0
      }
    },
    { $sort: { bookingCount: -1 } },
    { $limit: limit }
  ]).toArray();
}


// ============================================================
// 8. TRUY VẤN TÌM PHÒNG THEO TIỆN ÍCH (FACILITIES)
// ============================================================

function findRoomsByFacilities(facilitiesList) {
  print(`\n🛏️  Tìm phòng có đầy đủ tiện ích: ${facilitiesList.join(", ")}`);
  
  return db.rooms.find({
    status: "available",
    facilities: { $all: facilitiesList }
  }).toArray();
}

// Ví dụ: findRoomsByFacilities(["WiFi cao cấp", "Bồn tắm riêng"]);


// ============================================================
// 9. DOANH THU THEO QUÝ (DÀNH CHO BÁO CÁO CAO CẤP)
// ============================================================

function revenueByQuarter(year = 2026) {
  return db.bookings.aggregate([
    {
      $match: {
        status: { $in: ["confirmed", "checked-out"] },
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year+1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          quarter: { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } }
        },
        totalRevenue: { $sum: "$totalPrice" },
        bookingCount: { $sum: 1 }
      }
    },
    {
      $project: {
        quarter: { $concat: ["Q", { $toString: "$_id.quarter" }, "/", { $toString: "$_id.year" }] },
        totalRevenue: 1,
        bookingCount: 1,
        _id: 0
      }
    },
    { $sort: { quarter: 1 } }
  ]).toArray();
}


// ============================================================
// 10. THỐNG KÊ ĐÁNH GIÁ THEO LOẠI PHÒNG
// ============================================================

function ratingStatsByRoomType() {
  return db.reviews.aggregate([
    {
      $lookup: {
        from: "rooms",
        localField: "roomId",
        foreignField: "roomId",
        as: "room"
      }
    },
    { $unwind: "$room" },
    {
      $group: {
        _id: "$room.roomType",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating"
        }
      }
    },
    {
      $project: {
        roomType: "$_id",
        avgRating: { $round: ["$avgRating", 2] },
        totalReviews: 1,
        _id: 0
      }
    },
    { $sort: { avgRating: -1 } }
  ]).toArray();
}


// ============================================================
// CHẠY DEMO KHI LOAD FILE (tùy chọn)
// ============================================================

print("\n✅ Đã nạp xong tập truy vấn aggregation mẫu NOVA HOTEL");
print("   Các hàm sẵn sàng sử dụng:");
print("   - findAvailableRoomsByDateRange(checkIn, checkOut)");
print("   - revenueByMonth(2026)");
print("   - occupancyRateByMonth(2026)");
print("   - topRatedRooms(5)");
print("   - revenueByRoomType()");
print("   - bookingHistoryByUser('USR003')");
print("   - mostBookedRooms(5)");
print("   - revenueByQuarter(2026)");
print("   - ratingStatsByRoomType()\n");

// Ví dụ chạy nhanh khi load file (bỏ comment nếu muốn):
// revenueByMonth(2026);
// topRatedRooms(3);
