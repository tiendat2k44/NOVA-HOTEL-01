import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiCall, unwrap } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/format';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { exportVietQRInvoice } from '../../utils/exportInvoice';

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

  // QR modal for admin
  const [showQR, setShowQR] = useState(false);
  const [qrInfo, setQrInfo] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');

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

  const openAdminQR = async (b, bankKey = null) => {
    const bid = b.id || b._id;
    setQrInfo(null);
    setQrLoading(true);
    setShowQR(true);

    if (banks.length === 0) {
      try {
        const br = await apiCall('/bookings/banks', 'GET');
        const bl = unwrap(br) || [];
        setBanks(bl);
        if (!selectedBank && bl[0]) setSelectedBank(bl[0].key);
      } catch {}
    }

    const q = bankKey ? `?bank=${bankKey}` : (selectedBank ? `?bank=${selectedBank}` : '');
    try {
      const res = await apiCall(`/bookings/${bid}/payment-qr${q}`, 'GET');
      setQrInfo(unwrap(res));
    } catch (e) {
      showToast(e.message || 'Không tải QR', 'danger');
      setShowQR(false);
    } finally {
      setQrLoading(false);
    }
  };

  const changeAdminBank = (newKey) => {
    setSelectedBank(newKey);
    if (qrInfo && qrInfo.bookingCode) {
      const current = bookings.find(bb => (bb.code || bb.bookingCode) === qrInfo.bookingCode);
      if (current) openAdminQR(current, newKey);
    }
  };

  const closeAdminQR = () => {
    setShowQR(false);
    setQrInfo(null);
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
            <option value="pending">Chờ xác nhận</option>
            <option value="paid">Đã thanh toán (chờ xác nhận)</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="completed">Hoàn tất</option>
            <option value="cancelled">Đã hủy</option>
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
                    <option value="pending">Chờ xác nhận</option>
                    <option value="paid">Đã thanh toán (chờ xác nhận)</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="completed">Hoàn tất</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </td>
                <td>
                  <div className="d-flex gap-1 flex-wrap">
                    <Link to={`/admin/bookings/${b.id || b._id}`} className="btn btn-sm btn-outline-dark">
                      <i className="bi bi-eye me-1" /> Chi tiết
                    </Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-luxury btn-luxury-primary"
                      onClick={() => openAdminQR(b)}
                      title="Xem QR VietQR thanh toán"
                    >
                      <i className="bi bi-qr-code me-1" /> QR
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => cancelBooking(b.id || b._id, b.code || b.bookingCode)}
                      disabled={(b.status || '').toLowerCase() === 'cancelled'}
                    >
                      Hủy
                    </button>
                  </div>
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

      {/* Admin QR VietQR Modal (nhẹ) */}
      <Modal show={showQR} onClose={closeAdminQR} title={qrInfo ? `QR - ${qrInfo.bookingCode}` : 'QR Thanh toán'} size="xl">
        {qrLoading && <div className="text-center p-4"><div className="spinner-border" /> <div>Đang tạo QR...</div></div>}
        {qrInfo && !qrLoading && (
          <div className="text-center">
            <img src={qrInfo.qrUrl} alt="VietQR" style={{maxWidth:'100%', maxHeight:300, border:'1px solid #ddd', borderRadius:8 }} />

            {/* Chọn ngân hàng (admin) */}
            {banks.length > 0 && (
              <div className="my-2 text-start">
                <select className="form-select form-select-sm" value={selectedBank} onChange={e => changeAdminBank(e.target.value)}>
                  {banks.map(b => <option key={b.key} value={b.key}>{b.name} ({b.bin})</option>)}
                </select>
              </div>
            )}

            <div className="mt-1 small text-start bg-light p-2 rounded">
              <div><strong>Ngân hàng:</strong> {qrInfo.bankName}</div>
              <div><strong>STK:</strong> {qrInfo.accountNo} <button className="btn btn-sm btn-link p-0" onClick={() => {navigator.clipboard.writeText(qrInfo.accountNo);}}>copy</button></div>
              <div><strong>Chủ TK:</strong> {qrInfo.accountName}</div>
              <div><strong>Số tiền:</strong> {formatCurrency(qrInfo.amount)}</div>
              <div><strong>Nội dung:</strong> {qrInfo.description} <button className="btn btn-sm btn-link p-0" onClick={() => {navigator.clipboard.writeText(qrInfo.description);}}>copy</button></div>
            </div>
            <div className="small text-muted mt-2">{qrInfo.instructions}</div>

            <div className="text-center mt-3 border-top pt-3">
              <button
                type="button"
                className="btn btn-outline-dark w-100"
                onClick={async () => { await exportVietQRInvoice({ bookingCode: qrInfo.bookingCode }, qrInfo); }}
              >
                <i className="bi bi-printer me-2"></i> Xuất hóa đơn / Biên nhận
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}