import { useCallback, useEffect, useState } from 'react';
import { apiCall, unwrapList } from '../api/client';
import Reveal from '../components/Reveal';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';

const statusLabel = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  completed: 'Hoàn tất'
};

const statusClass = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  cancelled: 'status-cancelled',
  completed: 'status-completed'
};

export default function MyBookings() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState({ status: 'all', keyword: '' });

  const load = useCallback(async () => {
    try {
      const res = await apiCall('/bookings/my-bookings', 'GET');
      setBookings(unwrapList(res));
    } catch {
      showToast('Không tải được lịch sử đặt phòng.', 'warning');
      setBookings([]);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = bookings.filter((b) => {
    const matchesStatus = filter.status === 'all' || b.status === filter.status;
    const kw = filter.keyword.toLowerCase();
    const matchesKw =
      !kw ||
      [b.code, b.bookingCode, b.roomName, b.guestName].some((v) =>
        (v || '').toLowerCase().includes(kw)
      );
    return matchesStatus && matchesKw;
  });

  const cancelMyBooking = async (bookingId, code) => {
    if (!window.confirm(`Hủy đơn ${code || bookingId}?`)) return;
    try {
      await apiCall(`/bookings/${bookingId}`, 'DELETE');
      showToast('Đã hủy đơn đặt phòng.', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Hủy thất bại (có thể đã quá hạn).', 'danger');
    }
  };

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <h1 className="section-title">Lịch sử đặt phòng</h1>
            <p className="section-subtitle ms-0">{filtered.length} đơn đặt phòng</p>
          </Reveal>
        </div>
      </section>
      <section className="section-pad">
        <div className="container">
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Tìm mã đơn, phòng..."
                value={filter.keyword}
                onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filter.status}
                onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="completed">Hoàn tất</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-luxury align-middle">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Phòng</th>
                  <th>Ngày</th>
                  <th>Tổng</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id || b._id}>
                    <td>
                      <div className="fw-semibold">{b.code || b.bookingCode}</div>
                      <small className="text-muted-soft">{formatDateTime(b.createdAt)}</small>
                    </td>
                    <td>{b.roomName}</td>
                    <td>
                      {formatDate(b.checkIn || b.checkInDate)}
                      <br />
                      <small>đến {formatDate(b.checkOut || b.checkOutDate)}</small>
                    </td>
                    <td>{formatCurrency(b.total || b.totalPrice)}</td>
                    <td>
                      <span className={`status-badge ${statusClass[b.status] || 'status-pending'}`}>
                        {statusLabel[b.status] || b.status}
                      </span>
                    </td>
                    <td>
                      {(['pending', 'confirmed'].includes((b.status || '').toLowerCase())) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => cancelMyBooking(b.id || b._id, b.code || b.bookingCode)}
                        >
                          Hủy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-soft">Chưa có đơn đặt phòng.</p>
          )}
        </div>
      </section>
    </main>
  );
}