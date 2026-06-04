import { useCallback, useEffect, useState } from 'react';
import { apiCall, unwrap } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/format';
import Pagination from '../../components/Pagination';

export default function AdminBookings() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async (page = currentPage, size = pageSize) => {
    try {
      const res = await apiCall(`/bookings?page=${page}&size=${size}`, 'GET');
      const pageData = unwrap(res);
      const list = pageData?.content || [];
      setBookings(list);
      setTotalItems(pageData?.totalElements || 0);
      setTotalPages(pageData?.totalPages || 0);
      setCurrentPage(pageData?.number || 0);
    } catch (err) {
      showToast(err.message || 'Không tải booking.', 'danger');
      setBookings([]);
    }
  }, [showToast, currentPage, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (bookingId, newStatus) => {
    if (!bookingId || !newStatus) return;
    try {
      await apiCall(`/bookings/${bookingId}`, 'PUT', { status: newStatus });
      showToast('Đã cập nhật trạng thái.', 'success');
      load(currentPage, pageSize);
    } catch (err) {
      showToast(err.message || 'Cập nhật trạng thái thất bại.', 'danger');
    }
  };

  const cancelBooking = async (bookingId, code) => {
    if (!window.confirm(`Hủy booking ${code || bookingId}?`)) return;
    try {
      await apiCall(`/bookings/${bookingId}`, 'DELETE');
      showToast('Đã hủy booking.', 'success');
      load(currentPage, pageSize);
    } catch (err) {
      showToast(err.message || 'Hủy thất bại.', 'danger');
    }
  };

  const filtered = bookings.filter((b) => {
    const kw = search.toLowerCase();
    const matchSearch =
      !kw ||
      [b.code, b.bookingCode, b.guestName, b.roomName].some((v) =>
        (v || '').toLowerCase().includes(kw)
      );
    const matchStatus = !statusFilter || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    load(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
    load(0, newSize);
  };

  return (
    <div>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Tìm booking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-luxury">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Khách</th>
              <th>Phòng</th>
              <th>Ngày</th>
              <th>Tổng</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id || b._id}>
                <td>{b.code || b.bookingCode}</td>
                <td>{b.guestName}</td>
                <td>{b.roomName}</td>
                <td>
                  {formatDate(b.checkIn || b.checkInDate)} — {formatDate(b.checkOut || b.checkOutDate)}
                </td>
                <td>{formatCurrency(b.total || b.totalPrice)}</td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={b.status || 'pending'}
                    onChange={(e) => updateStatus(b.id || b._id, e.target.value)}
                  >
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => cancelBooking(b.id || b._id, b.code || b.bookingCode)}
                    disabled={(b.status || '').toLowerCase() === 'cancelled'}
                  >
                    Hủy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}