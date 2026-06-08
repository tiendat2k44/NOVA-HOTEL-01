import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { apiCall, unwrapList } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { toDisplayRoom } from '../../utils/rooms';

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  paid: '#0ea5e9',
  'checked-in': '#8b5cf6',
  'checked-out': '#10b981',
  completed: '#059669',
  cancelled: '#ef4444',
};

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({ revenue: 0, bookings: 0, rooms: 0, users: 0 });
  const [latest, setLatest] = useState([]);
  const [allBookings, setAllBookings] = useState([]);

  useEffect(() => {
    const load = async () => {
      const bookingsRes = await apiCall('/bookings?size=100', 'GET').catch(() => null);
      const bookings = unwrapList(bookingsRes);
      setAllBookings(bookings);

      let rooms = [];
      let users = [];

      if (isAdmin) {
        const [roomsRes, usersRes] = await Promise.all([
          apiCall('/rooms?size=100', 'GET').catch(() => null),
          apiCall('/users?size=100', 'GET').catch(() => null),
        ]);
        rooms = unwrapList(roomsRes).map(toDisplayRoom);
        users = unwrapList(usersRes);
      }

      const revenue = bookings.reduce((sum, booking) => sum + Number(booking.total || booking.totalPrice || 0), 0);
      setStats({
        revenue,
        bookings: bookings.length,
        rooms: rooms.length,
        users: users.length,
      });
      setLatest(bookings.slice(0, 5));
    };

    load();
  }, [isAdmin]);

  const monthlyRevenue = useMemo(() => {
    const map = {};
    allBookings.forEach((booking) => {
      const status = String(booking?.status || '').toLowerCase();
      if (status === 'cancelled') return;
      const date = new Date(booking.checkIn || booking.checkInDate || booking.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { month: key, revenue: 0, bookings: 0 };
      map[key].revenue += Number(booking.total || booking.totalPrice || 0);
      map[key].bookings += 1;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-8);
  }, [allBookings]);

  const statusDistribution = useMemo(() => {
    const map = {};
    allBookings.forEach((booking) => {
      const status = String(booking?.status || 'pending').toLowerCase();
      map[status] = (map[status] || 0) + 1;
    });

    const labels = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      paid: 'Đã thanh toán',
      'checked-in': 'Đang lưu trú',
      'checked-out': 'Đã trả phòng',
      completed: 'Hoàn tất',
      cancelled: 'Đã hủy',
    };

    return Object.entries(map).map(([status, value]) => ({
      status,
      name: labels[status] || status,
      value,
      color: STATUS_COLORS[status] || '#64748b',
    }));
  }, [allBookings]);

  const topRooms = useMemo(() => {
    const map = new Map();
    allBookings.forEach((booking) => {
      const status = String(booking?.status || '').toLowerCase();
      if (status === 'cancelled') return;
      const name = booking.roomName || booking.roomCode || booking.roomNumber || '—';
      const current = map.get(name) || { name, revenue: 0 };
      current.revenue += Number(booking.total || booking.totalPrice || 0);
      map.set(name, current);
    });
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [allBookings]);

  return (
    <div data-admin-dashboard>
      <div className="row g-4 mb-4">
        {[
          ['Đặt phòng', stats.bookings, 'Tổng số'],
          ...(isAdmin
            ? [
                ['Doanh thu', formatCurrency(stats.revenue), 'VND'],
                ['Phòng', stats.rooms, 'Đang quản lý'],
                ['Người dùng', stats.users, 'Tài khoản'],
              ]
            : []),
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

      {isAdmin && (
        <>
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="content-card p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h3 className="h5 mb-0">Doanh thu theo tháng</h3>
                  <span className="badge bg-light text-dark border">8 tháng gần nhất</span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={monthlyRevenue} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c9a96e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#c9a96e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#c9a96e"
                      fill="url(#dashboardRevenue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="content-card p-4 h-100">
                <h3 className="h5 mb-3">Trạng thái booking</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" nameKey="name" outerRadius={85} label>
                      {statusDistribution.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v} booking`} />
                    <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="content-card p-4 mb-4">
            <h3 className="h5 mb-3">Top 5 phòng theo doanh thu</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topRooms} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="content-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="h5 mb-0">Booking gần đây</h3>
          <Link to="/admin/bookings" className="small text-decoration-none">
            Xem tất cả →
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table table-luxury">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Mã phòng</th>
                <th>Phòng</th>
                <th>Khách</th>
                <th>Ngày</th>
                <th>Tổng</th>
                <th>TT</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {latest.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted-soft py-3">
                    Chưa có booking nào.
                  </td>
                </tr>
              )}
              {latest.map((booking) => {
                const bookingId = booking.id || booking._id;
                const roomCode = booking.roomCode || booking.roomNumber || booking.room?.code || '—';
                const status = (booking.status || 'pending').toLowerCase();

                return (
                  <tr key={bookingId}>
                    <td className="fw-semibold">{booking.code || booking.bookingCode}</td>
                    <td>
                      <span className="text-gold fw-medium" style={{ fontFamily: 'monospace' }}>
                        {roomCode}
                      </span>
                    </td>
                    <td>{booking.roomName || '—'}</td>
                    <td>{booking.guestName}</td>
                    <td className="small">
                      {formatDate(booking.checkIn || booking.checkInDate)}
                      <div className="text-muted-soft" style={{ fontSize: '0.7rem' }}>
                        → {formatDate(booking.checkOut || booking.checkOutDate)}
                      </div>
                    </td>
                    <td>{formatCurrency(booking.total || booking.totalPrice)}</td>
                    <td>
                      <span
                        className={`status-badge status-${
                          status === 'confirmed'
                            ? 'confirmed'
                            : status === 'completed'
                              ? 'completed'
                              : status === 'cancelled'
                                ? 'cancelled'
                                : 'pending'
                        }`}
                      >
                        {status === 'pending'
                          ? 'Chờ'
                          : status === 'paid'
                            ? 'Đã TT'
                            : status === 'confirmed'
                              ? 'Xác nhận'
                              : status === 'completed'
                                ? 'Hoàn tất'
                                : 'Hủy'}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/admin/bookings/${bookingId}`}
                        className="btn btn-sm btn-outline-dark admin-action-btn"
                        title="Xem chi tiết booking"
                      >
                        <i className="bi bi-eye" /> Chi tiết
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}