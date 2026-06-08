import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, unwrapList } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/format';

export default function AdminRevenue() {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      showToast('Chỉ quản trị viên mới được xem doanh thu.', 'danger');
      navigate('/admin/bookings', { replace: true });
      return;
    }

    apiCall('/bookings?size=500', 'GET')
      .then((response) => setBookings(unwrapList(response)))
      .catch(() => setBookings([]));
  }, [isAdmin, navigate, showToast]);

  const revenueBookings = useMemo(
    () => bookings.filter((booking) => String(booking?.status || '').toLowerCase() !== 'cancelled'),
    [bookings]
  );

  const totalRevenue = useMemo(
    () => revenueBookings.reduce((sum, booking) => sum + Number(booking.total || booking.totalPrice || 0), 0),
    [revenueBookings]
  );

  const averageRevenue = revenueBookings.length ? totalRevenue / revenueBookings.length : 0;
  const cancelledCount = bookings.filter((booking) => booking.status === 'cancelled').length;

  const monthlyData = useMemo(() => {
    const map = new Map();

    revenueBookings.forEach((booking) => {
      const date = new Date(booking.checkIn || booking.createdAt);
      if (Number.isNaN(date.getTime())) return;

      const month = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = map.get(month) || { month, count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += Number(booking.total || booking.totalPrice || 0);
      map.set(month, current);
    });

    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [revenueBookings]);

  const topRooms = useMemo(() => {
    const map = new Map();

    revenueBookings.forEach((booking) => {
      const room = booking.roomName || booking.roomCode || '—';
      const current = map.get(room) || { room, count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += Number(booking.total || booking.totalPrice || 0);
      map.set(room, current);
    });

    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [revenueBookings]);

  const statusData = useMemo(() => {
    const labels = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      'checked-in': 'Đang lưu trú',
      'checked-out': 'Đã trả phòng',
      completed: 'Hoàn tất',
      paid: 'Đã thanh toán',
    };

    const map = new Map();

    revenueBookings.forEach((booking) => {
      const status = booking.status || 'pending';
      const current = map.get(status) || { status, label: labels[status] || status, count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += Number(booking.total || booking.totalPrice || 0);
      map.set(status, current);
    });

    return [...map.values()];
  }, [revenueBookings]);

  const recentBookings = useMemo(() => revenueBookings.slice(0, 10), [revenueBookings]);

  return (
    <div data-admin-revenue>
      <div className="row g-4 mb-4">
        {[
          { label: 'Tổng doanh thu', value: formatCurrency(totalRevenue), icon: 'bi-cash-stack', color: '#059669' },
          { label: 'Booking có doanh thu', value: revenueBookings.length, icon: 'bi-check2-circle', color: '#3b82f6' },
          { label: 'Trung bình / booking', value: formatCurrency(Math.round(averageRevenue)), icon: 'bi-bar-chart', color: '#c9a96e' },
          { label: 'Booking bị hủy', value: cancelledCount, icon: 'bi-x-circle', color: '#ef4444' },
        ].map((item) => (
          <div className="col-md-3" key={item.label}>
            <div className="stat-card h-100 d-flex align-items-center gap-3">
              <i className={`bi ${item.icon} fs-2`} style={{ color: item.color }} />
              <div>
                <div className="text-muted-soft small text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>{item.label}</div>
                <div className="fw-bold" style={{ fontSize: '1.1rem', color: item.color }}>{item.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <div className="content-card p-4 h-100">
            <h3 className="h5 mb-3">Doanh thu theo tháng</h3>
            <div className="table-responsive">
              <table className="table table-luxury mb-0" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Tháng</th>
                    <th className="text-center">Booking</th>
                    <th className="text-end">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.length > 0 ? monthlyData.map((row) => (
                    <tr key={row.month}>
                      <td>{row.month}</td>
                      <td className="text-center">{row.count}</td>
                      <td className="text-end fw-semibold">{formatCurrency(row.revenue)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="text-center text-muted py-3">Chưa có dữ liệu.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="content-card p-4 h-100">
            <h3 className="h5 mb-3">Top phòng theo doanh thu</h3>
            <div className="table-responsive">
              <table className="table table-luxury mb-0" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Phòng</th>
                    <th className="text-center">Đơn</th>
                    <th className="text-end">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topRooms.length > 0 ? topRooms.map((row, index) => (
                    <tr key={row.room}>
                      <td>
                        <span className={`badge ${index === 0 ? 'bg-warning text-dark' : index === 1 ? 'bg-secondary' : 'bg-light text-dark border'}`}>
                          #{index + 1}
                        </span>
                        <span className="ms-2 fw-medium">{row.room}</span>
                      </td>
                      <td className="text-center">{row.count}</td>
                      <td className="text-end fw-semibold text-success">{formatCurrency(row.revenue)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="text-center text-muted py-3">Chưa có dữ liệu.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="content-card p-4 h-100">
            <h3 className="h5 mb-3">Theo trạng thái</h3>
            <div className="table-responsive">
              <table className="table table-luxury mb-0" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Trạng thái</th>
                    <th className="text-center">Booking</th>
                    <th className="text-end">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {statusData.length > 0 ? statusData.map((row) => (
                    <tr key={row.status}>
                      <td>{row.label}</td>
                      <td className="text-center">{row.count}</td>
                      <td className="text-end fw-semibold">{formatCurrency(row.revenue)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="text-center text-muted py-3">Chưa có dữ liệu.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="content-card p-4">
        <h3 className="h5 mb-3">Giao dịch gần đây</h3>
        <div className="table-responsive">
          <table className="table table-luxury mb-0" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Mã booking</th>
                <th>Khách</th>
                <th>Phòng</th>
                <th>Check-in</th>
                <th>Trạng thái</th>
                <th className="text-end">Tổng tiền</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length > 0 ? recentBookings.map((booking) => {
                const labels = {
                  pending: 'Chờ',
                  confirmed: 'Xác nhận',
                  'checked-in': 'Lưu trú',
                  'checked-out': 'Trả phòng',
                  completed: 'Hoàn tất',
                  paid: 'Đã TT',
                };

                const badgeMap = {
                  pending: 'warning',
                  confirmed: 'primary',
                  'checked-in': 'info',
                  'checked-out': 'success',
                  completed: 'success',
                  paid: 'info',
                };

                const status = booking.status || 'pending';

                return (
                  <tr key={booking.id || booking._id}>
                    <td className="fw-medium" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{booking.code || booking.bookingCode || '—'}</td>
                    <td>{booking.guestName || '—'}</td>
                    <td>
                      {booking.roomName || '—'}
                      {booking.roomNumber && <span className="ms-1 badge bg-light text-dark border" style={{ fontSize: '0.68rem' }}>P.{booking.roomNumber}</span>}
                    </td>
                    <td>{formatDate(booking.checkIn || booking.checkInDate || booking.createdAt)}</td>
                    <td><span className={`badge bg-${badgeMap[status] || 'secondary'}`}>{labels[status] || status}</span></td>
                    <td className="text-end fw-semibold">{formatCurrency(booking.total || booking.totalPrice)}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="text-center text-muted py-3">Chưa có giao dịch nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}