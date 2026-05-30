HƯỚNG DẪN NHANH CHO NGƯỜI DÙNG COMPASS

Nếu bạn dùng MongoDB Compass để import và thấy ngày tháng bị lỗi hoặc không chuyển đúng kiểu Date, hãy dùng 4 file JSON trong thư mục này:

- users.json
- rooms.json
- bookings.json
- reviews.json

Đây là định dạng Extended JSON chuẩn của MongoDB. Compass hiện đại (1.30+) sẽ tự chuyển `$date` thành kiểu Date thật.

Nếu Compass của bạn cũ hoặc báo lỗi khi import, hãy báo mình, mình sẽ tạo thêm bản JSON "đơn giản" (không có $date) cho bạn.

Thứ tự import:
1. users.json  → collection "users"
2. rooms.json  → collection "rooms"
3. bookings.json → collection "bookings"
4. reviews.json → collection "reviews"

Đừng đảo thứ tự kẻo bị lỗi tham chiếu!
