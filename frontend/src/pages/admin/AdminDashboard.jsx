import { useEffect, useState } from 'react';
import { apiCall, unwrapList } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { toDisplayRoom } from '../../utils/rooms';

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({ revenue: 0, bookings: 0, rooms: 0, users: 0 });
  const [latest, setLatest] = useState([]);

  useEffect(() => {
    const load = async () => {
      // Lễ tân chỉ fetch bookings (không có quyền rooms/users)
      const bookingsRes = await apiCall('/bookings?size=100', 'GET').catch(() => null);
      const bookings = unwrapList(bookingsRes);

      let rooms = [];
      let users = [];

      if (isAdmin) {
        const [roomsRes, usersRes] = await Promise.all([
          apiCall('/rooms?size=100', 'GET').catch(() => null),
          apiCall('/users?size=100', 'GET').catch(() => null)
        ]);
        rooms = unwrapList(roomsRes).map(toDisplayRoom);
        users = unwrapList(usersRes);
      }

      const revenue = bookings.reduce((s, b) => s + Number(b.total || b.totalPrice || 0), 0);
      setStats({
        revenue,
        bookings: bookings.length,
        rooms: rooms.length,
        users: users.length
      });
      setLatest(bookings.slice(0, 5));
    };
    load();
  }, [isAdmin]);

  return (
    <div data-admin-dashboard>
      <div className="row g-4 mb-4">
        {[
          ['Đặt phòng', stats.bookings, 'Tổng số'],
          ...(isAdmin ? [
            ['Doanh thu', formatCurrency(stats.revenue), 'VND'],
            ['Phòng', stats.rooms, 'Đang quản lý'],
            ['Người dùng', stats.users, 'Tài khoản']
          ] : [])
        ].map(([title, value, sub]) => (
          <div className={`col-md-${isAdmin ? '3' : '6'}`} key={title}>
            <div className="stat-card h-100">
              <div className="text-muted-soft small text-uppercase fw-semibold">{title}</div>
              <h3 className="display-6 mb-0">{value}</h3>
              <div className="stat-chip mt-2">{sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="content-card p-4">
        <h3 className="h5 mb-3">Booking gần đây</h3>
        <div className="table-responsive">
          <table className="table table-luxury">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Phòng</th>
                <th>Khách</th>
                <th>Check-in</th>
                <th>Tổng</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((b) => (
                <tr key={b.id || b._id}>
                  <td>{b.code || b.bookingCode}</td>
                  <td>{b.roomName}</td>
                  <td>{b.guestName}</td>
                  <td>{formatDate(b.checkIn || b.checkInDate)}</td>
                  <td>{formatCurrency(b.total || b.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}