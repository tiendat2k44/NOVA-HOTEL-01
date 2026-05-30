/**
 * import-data.js
 * 
 * Script Node.js hỗ trợ import dữ liệu mẫu vào MongoDB
 * Dùng khi bạn không muốn dùng mongosh hoặc muốn tích hợp vào CI/CD
 * 
 * Yêu cầu:
 *   npm install mongodb
 * 
 * Chạy:
 *   node import-data.js
 * 
 * Hoặc chỉ định URI:
 *   MONGODB_URI="mongodb://localhost:27017/nova_hotel_db" node import-data.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Cấu hình
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nova_hotel_db';
const DB_NAME = 'nova_hotel_db';

// Danh sách file JSON mẫu (theo thứ tự phụ thuộc)
const SAMPLE_FILES = [
  { collection: 'users', file: 'sample-data/users.json' },
  { collection: 'rooms', file: 'sample-data/rooms.json' },
  { collection: 'bookings', file: 'sample-data/bookings.json' },
  { collection: 'reviews', file: 'sample-data/reviews.json' }
];

async function importCollection(db, collectionName, filePath) {
  console.log(`\n📥 Đang import ${collectionName} từ ${filePath}...`);

  // Đọc file JSON
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`   ❌ Không tìm thấy file: ${fullPath}`);
    return 0;
  }

  const rawData = fs.readFileSync(fullPath, 'utf8');
  let documents = JSON.parse(rawData);

  // Chuyển đổi các trường { $date: "..." } thành Date object thật
  documents = documents.map(doc => {
    const converted = { ...doc };
    Object.keys(converted).forEach(key => {
      if (converted[key] && typeof converted[key] === 'object' && converted[key].$date) {
        converted[key] = new Date(converted[key].$date);
      }
    });
    return converted;
  });

  // Xóa dữ liệu cũ trước khi import (development only)
  await db.collection(collectionName).deleteMany({});
  
  // Insert
  if (documents.length > 0) {
    const result = await db.collection(collectionName).insertMany(documents);
    console.log(`   ✅ Đã import thành công ${result.insertedCount} documents`);
    return result.insertedCount;
  }
  return 0;
}

async function main() {
  console.log('=====================================================');
  console.log('   NOVA HOTEL - IMPORT DỮ LIỆU MẪU MONGODB');
  console.log('=====================================================');
  console.log(`URI: ${MONGODB_URI}\n`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Kết nối MongoDB thành công!');

    const db = client.db(DB_NAME);

    let total = 0;
    for (const item of SAMPLE_FILES) {
      const count = await importCollection(db, item.collection, item.file);
      total += count;
    }

    // Tạo index nhanh (nếu chưa có)
    console.log('\n🔧 Đang tạo indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('rooms').createIndex({ roomId: 1 }, { unique: true });
    await db.collection('bookings').createIndex({ bookingId: 1 }, { unique: true });
    console.log('   ✅ Indexes cơ bản đã sẵn sàng');

    console.log('\n=====================================================');
    console.log(`🎉 HOÀN TẤT! Tổng cộng ${total} documents đã được import.`);
    console.log('=====================================================\n');

    // Thống kê nhanh
    const stats = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('rooms').countDocuments(),
      db.collection('bookings').countDocuments(),
      db.collection('reviews').countDocuments()
    ]);
    console.log('Thống kê database:');
    console.log(`  users    : ${stats[0]}`);
    console.log(`  rooms    : ${stats[1]}`);
    console.log(`  bookings : ${stats[2]}`);
    console.log(`  reviews  : ${stats[3]}\n`);

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Đã đóng kết nối MongoDB.');
  }
}

// Chạy
main();
