import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiCall, getBookingPaymentQr, unwrap, unwrapList } from '../api/client';
import Reveal from '../components/Reveal';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import Modal from '../components/Modal';
import { exportVietQRInvoice } from '../utils/exportInvoice';

const statusLabel = {
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán (chờ xác nhận)',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  completed: 'Hoàn tất'
};

const statusClass = {
  pending: 'status-pending',
  paid: 'status-paid',
  confirmed: 'status-confirmed',
  cancelled: 'status-cancelled',
  completed: 'status-completed'
};

export default function MyBookings() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState({ status: 'all', keyword: '' });

  // QR Payment modal state (VietQR checkout)
  const [showQR, setShowQR] = useState(false);
  const [qrInfo, setQrInfo] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');

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
      [b.code, b.bookingCode, b.roomName, b.roomNumber, b.roomId, b.guestName].some((v) =>
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

  // Mở modal QR VietQR (checkout / thanh toán chuyển khoản)
  const openPaymentQR = async (booking, bankKey = null) => {
    const bid = booking.id || booking._id || booking.bookingId || booking.code || booking.bookingCode;
    const code = booking.code || booking.bookingCode;
    setQrError('');
    setQrLoading(true);
    if (!showQR) setShowQR(true);

    // Load danh sách ngân hàng (chỉ 1 lần)
    if (banks.length === 0) {
      try {
        const banksRes = await apiCall('/bookings/banks', 'GET');
        const bankList = unwrap(banksRes) || [];
        setBanks(bankList);
        if (!selectedBank && bankList.length > 0) setSelectedBank(bankList[0].key);
      } catch (e) { /* ignore */ }
    }

    try {
      const bank = (bankKey || selectedBank || '').trim();
      const res = await getBookingPaymentQr(bid, bank);
      const data = unwrap(res);
      setQrInfo(data);
    } catch (err) {
      setQrError(err.message || 'Không tạo được mã QR thanh toán.');
      showToast(err.message || 'Không tải QR được.', 'danger');
    } finally {
      setQrLoading(false);
    }
  };

  const changeBank = (newBank) => {
    setSelectedBank(newBank);
    // Tìm booking hiện tại để re-fetch
    if (qrInfo && qrInfo.bookingCode) {
      const current = bookings.find(b => (b.code || b.bookingCode) === qrInfo.bookingCode);
      if (current) openPaymentQR(current, newBank);
    }
  };

  const closeQRModal = () => {
    setShowQR(false);
    setQrInfo(null);
    setQrError('');
  };

  const copyToClipboard = async (text, label = 'Thông tin') => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Đã copy ${label}`, 'success');
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(`Đã copy ${label}`, 'success');
    }
  };

  // Khách báo "đã thanh toán" → update status = paid (sẽ trigger email cho admin)
  const markAsPaid = async () => {
    if (!qrInfo || !qrInfo.bookingCode) return;
    // Tìm booking hiện tại từ list để lấy id
    const currentBooking = bookings.find(b => (b.code || b.bookingCode) === qrInfo.bookingCode);
    if (!currentBooking) {
      showToast('Không tìm thấy đơn để cập nhật.', 'danger');
      return;
    }
    const bid = currentBooking.id || currentBooking._id;
    if (!window.confirm('Xác nhận bạn đã chuyển khoản thành công? Admin sẽ kiểm tra và cập nhật.')) return;

    try {
      await apiCall(`/bookings/${bid}/status`, 'PATCH', { status: 'paid' });
      showToast('Đã ghi nhận thanh toán! Cảm ơn bạn. Admin sẽ xác nhận sớm.', 'success');
      closeQRModal();
      load(); // refresh list
    } catch (err) {
      showToast(err.message || 'Cập nhật thất bại.', 'danger');
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
                <option value="paid">Đã thanh toán (chờ xác nhận)</option>
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
                    <td>
                      <div className="fw-semibold">{b.roomName || 'Phòng không xác định'}</div>
                      <small className="text-muted-soft">
                        {b.roomNumber ? `Số phòng: ${b.roomNumber}` : (b.roomId ? `Mã phòng: ${b.roomId}` : 'Chưa có mã phòng')}
                      </small>
                    </td>
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
                      <div className="d-flex gap-2 flex-wrap">
                        <Link 
                          to={`/bookings/${b.id || b._id}`} 
                          className="btn btn-sm btn-outline-dark"
                        >
                          <i className="bi bi-eye me-1" /> Chi tiết
                        </Link>
                        {(['pending', 'paid', 'confirmed'].includes((b.status || '').toLowerCase())) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-luxury btn-luxury-primary"
                            onClick={() => openPaymentQR(b)}
                            title="Xem QR VietQR thanh toán / chuyển khoản"
                          >
                            QR Thanh toán
                          </button>
                        )}
                        {(['pending', 'confirmed'].includes((b.status || '').toLowerCase())) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => cancelMyBooking(b.id || b._id, b.code || b.bookingCode)}
                          >
                            Hủy
                          </button>
                        )}
                      </div>
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

      {/* VietQR Checkout Modal */}
      <Modal
        show={showQR}
        onClose={closeQRModal}
        title={qrInfo ? `QR Thanh toán - ${qrInfo.bookingCode}` : 'QR Thanh toán'}
        size="xl"
        footer={
          <button className="btn-luxury btn-luxury-outline" onClick={closeQRModal}>
            Đóng
          </button>
        }
      >
        {qrLoading && (
          <div className="text-center py-4">
            <div className="spinner-border text-dark" role="status" />
            <p className="mt-2 text-muted-soft">Đang tạo mã QR VietQR...</p>
          </div>
        )}

        {qrError && !qrLoading && (
          <div className="alert alert-danger">{qrError}</div>
        )}

        {qrInfo && !qrLoading && (
          <div>
            <div className="text-center mb-3">
              <img
                src={qrInfo.qrUrl}
                alt={`VietQR ${qrInfo.bookingCode}`}
                style={{ maxWidth: '100%', maxHeight: 420, border: '1px solid #eee', borderRadius: 12, background: '#fff' }}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/280x280?text=QR+Error'; }}
              />
            </div>

            {/* Chọn ngân hàng động - centered */}
            {banks.length > 0 && (
              <div className="mb-3 text-center">
                <label className="form-label small text-muted-soft mb-1 d-block">Chọn ngân hàng nhận tiền:</label>
                <select
                  className="form-select form-select-sm mx-auto"
                  style={{ maxWidth: '280px' }}
                  value={selectedBank || qrInfo.selectedBankKey || ''}
                  onChange={(e) => changeBank(e.target.value)}
                >
                  {banks.map(b => (
                    <option key={b.key} value={b.key}>{b.name} ({b.bin})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="content-card p-3 mb-3 text-center" style={{ fontSize: 14 }}>
              <div><strong>Ngân hàng:</strong> {qrInfo.bankName} ({qrInfo.bankBin})</div>

              <div className="mt-1">
                <strong>Số TK:</strong> {qrInfo.accountNo}
                <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-1 ms-1" onClick={() => copyToClipboard(qrInfo.accountNo, 'Số TK')} style={{ fontSize: 11 }}>Copy</button>
              </div>

              <div className="mt-1"><strong>Chủ TK:</strong> {qrInfo.accountName}</div>

              <div className="mt-1 fw-bold text-danger">
                <strong>Số tiền cần chuyển:</strong> {formatCurrency(qrInfo.amount)}
              </div>
              {qrInfo.roomAmount > 0 && qrInfo.surchargeAmount > 0 && (
                <div className="small text-muted-soft mt-1">
                  (Tiền phòng: {formatCurrency(qrInfo.roomAmount)} + Phụ phí QR: {formatCurrency(qrInfo.surchargeAmount)})
                </div>
              )}

              <div className="mt-1">
                <strong>Nội dung CK:</strong> <span className="text-break">{qrInfo.description}</span>
                <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-1 ms-1" onClick={() => copyToClipboard(qrInfo.description, 'Nội dung CK')} style={{ fontSize: 11 }}>Copy</button>
              </div>
            </div>

            <div className="small text-muted-soft mb-2 text-center">
              <strong>Hướng dẫn:</strong> {qrInfo.instructions}
            </div>

            <div className="alert alert-info py-2 small mb-0 text-center">
              Sau khi chuyển khoản thành công, vui lòng giữ lại biên lai. Admin sẽ cập nhật trạng thái đơn trong thời gian sớm nhất (thường 5-30 phút).
            </div>

            {/* Nút "Đã thanh toán" cho khách hàng - chỉ hiện nếu chưa paid */}
            {qrInfo && (qrInfo.bookingCode) && !['paid', 'confirmed', 'completed'].includes((qrInfo.status || '').toLowerCase()) && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  className="btn-luxury btn-luxury-primary w-100"
                  onClick={markAsPaid}
                >
                  ✓ Tôi đã chuyển khoản thành công (Yêu cầu xác nhận)
                </button>
                <div className="small text-muted-soft mt-1">
                  Sau khi bấm, trạng thái sẽ chuyển sang "Đã thanh toán" và admin sẽ được thông báo.
                </div>
              </div>
            )}

            {/* Nút xuất hóa đơn - luôn hiện khi có QR */}
            {qrInfo && (
              <div className="text-center mt-3 border-top pt-3">
                <button
                  type="button"
                  className="btn btn-outline-dark w-100"
                  onClick={async () => {
                    // Tìm booking đầy đủ để xuất
                    const fullBooking = bookings.find(b => (b.code || b.bookingCode) === qrInfo.bookingCode) || { 
                      bookingCode: qrInfo.bookingCode, 
                      guestName: '', 
                      roomName: '',
                      total: qrInfo.amount 
                    };
                    await exportVietQRInvoice(fullBooking, qrInfo);
                  }}
                >
                  <i className="bi bi-printer me-2"></i> Xuất hóa đơn / Biên nhận thanh toán VietQR
                </button>
                <div className="small text-muted-soft mt-1">In hoặc lưu PDF hóa đơn có đầy đủ thông tin chuyển khoản</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </main>
  );
}