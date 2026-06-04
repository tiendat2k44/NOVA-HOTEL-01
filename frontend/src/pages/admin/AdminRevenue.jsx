import { useEffect, useState } from 'react';
import { apiCall, unwrapList } from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/format';

export default function AdminRevenue() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    apiCall('/bookings?size=100', 'GET')
      .then((res) => setBookings(unwrapList(res)))
      .catch(() => setBookings([]));
  }, []);

  const revenueBookings = bookings.filter((b) => {
    const status = String(b?.status || '').toLowerCase();
    if (status === 'cancelled') return false;
    return status === 'confirmed' || status === 'completed' || String(b?.payment || '').toLowerCase() === 'paid';
  });

  const totalRevenue = revenueBookings.reduce((s, b) => s + Number(b.total || b.totalPrice || 0), 0);
  const avg = revenueBookings.length ? totalRevenue / revenueBookings.length : 0;

  const roomMap = new Map();
  revenueBookings.forEach((b) => {
    const key = b.roomName || b.roomCode || '---';
    const cur = roomMap.get(key) || { count: 0, total: 0 };
    roomMap.set(key, {
      count: cur.count + 1,
      total: cur.total + Number(b.total || b.totalPrice || 0)
    });
  });
  const topRooms = [...roomMap.entries()]
    .map(([room, stats]) => ({ room, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div data-admin-revenue>
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="stat-card">
            <div className="text-muted-soft small">Tổng doanh thu</div>
            <h3 className="display-6">{formatCurrency(totalRevenue)}</h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <div className="text-muted-soft small">Booking có doanh thu</div>
            <h3 className="display-6">{revenueBookings.length}</h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <div className="text-muted-soft small">Trung bình</div>
            <h3 className="display-6">{formatCurrency(Math.round(avg))}</h3>
          </div>
        </div>
      </div>

      <div className="content-card p-4">
        <h3 className="h5 mb-3">Top phòng theo doanh thu</h3>
        <table className="table table-luxury">
          <thead>
            <tr>
              <th>Phòng</th>
              <th>Số đơn</th>
              <th>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {topRooms.map((row) => (
              <tr key={row.room}>
                <td>{row.room}</td>
                <td>{row.count}</td>
                <td>{formatCurrency(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="content-card p-4 mt-4">
        <h3 className="h5 mb-3">Giao dịch gần đây</h3>
        <table className="table table-luxury">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Khách</th>
              <th>Ngày</th>
              <th>Tổng</th>
            </tr>
          </thead>
          <tbody>
            {revenueBookings.slice(0, 8).map((b) => (
              <tr key={b.id || b._id}>
                <td>{b.code || b.bookingCode}</td>
                <td>{b.guestName}</td>
                <td>{formatDate(b.checkIn || b.checkInDate || b.createdAt)}</td>
                <td>{formatCurrency(b.total || b.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}