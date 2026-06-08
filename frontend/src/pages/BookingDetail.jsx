import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiCall, getBookingPaymentQr, unwrap } from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportVietQRInvoice } from '../utils/exportInvoice';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { getRoleLabel } from '../utils/roles';

const statusLabel = {
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán (chờ xác nhận)',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy'
};

const statusClass = {
  pending: 'status-pending',
  paid: 'status-paid',
  confirmed: 'status-confirmed',
  completed: 'status-completed',
  cancelled: 'status-cancelled'
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // QR states (integrated from previous logic)
  const [showQR, setShowQR] = useState(false);
  const [qrInfo, setQrInfo] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');

  const loadBooking = async () => {
    setLoading(true);
    try {
      const res = await apiCall(`/bookings/${id}`, 'GET');
      const data = unwrap(res);
      setBooking(data);
    } catch (err) {
      showToast(err.message || 'Không tải được chi tiết đơn đặt phòng.', 'danger');
      navigate(isAdmin ? '/admin/bookings' : '/my-bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadBooking();
  }, [id]);

  // Load banks once
  const loadBanks = async () => {
    if (banks.length > 0) return;
    try {
      const res = await apiCall('/bookings/banks', 'GET');
      const list = unwrap(res) || [];
      setBanks(list);
      if (list[0]) setSelectedBank(list[0].key);
    } catch {}
  };

  const openQR = async (bankKey = null) => {
    setQrLoading(true);
    setShowQR(true);
    setQrInfo(null);
    await loadBanks();

    try {
      const bank = (bankKey || selectedBank || '').trim();
      const res = await getBookingPaymentQr(id, bank);
      setQrInfo(unwrap(res));
    } catch (e) {
      showToast(e.message || 'Không tải được QR', 'danger');
    } finally {
      setQrLoading(false);
    }
  };

  const changeBank = (key) => {
    setSelectedBank(key);
    openQR(key);
  };

  const closeQR = () => {
    setShowQR(false);
    setQrInfo(null);
  };

  const markAsPaid = async () => {
    if (!window.confirm('Xác nhận bạn đã chuyển khoản thành công?')) return;
    try {
      await apiCall(`/bookings/${id}/status`, 'PATCH', { status: 'paid' });
      showToast('Đã ghi nhận thanh toán. Admin sẽ xác nhận sớm!', 'success');
      closeQR();
      loadBooking();
    } catch (e) {
      showToast(e.message || 'Cập nhật thất bại', 'danger');
    }
  };

  const cancelBooking = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn này?')) return;
    try {
      await apiCall(`/bookings/${id}`, 'DELETE');
      showToast('Đã hủy đơn đặt phòng.', 'success');
      navigate(isAdmin ? '/admin/bookings' : '/my-bookings');
    } catch (e) {
      showToast(e.message || 'Hủy thất bại', 'danger');
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await apiCall(`/bookings/${id}/status`, 'PATCH', { status: newStatus });
      showToast('Cập nhật trạng thái thành công.', 'success');
      loadBooking();
    } catch (e) {
      showToast(e.message || 'Cập nhật thất bại', 'danger');
    }
  };

  if (loading || !booking) {
    return (
      <main className={isAdmin ? 'py-4' : 'section-pad'}>
        <div className="container text-center py-5">
          <div className="spinner-border" /> <span className="ms-2">Đang tải chi tiết...</span>
        </div>
      </main>
    );
  }

  const b = booking;
  const canManage = isAdmin || (user && b.userId === user.id);

  return (
    <main>
      <section className={isAdmin ? 'py-3' : 'page-hero'}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Link to={isAdmin ? '/admin/bookings' : '/my-bookings'} className="text-muted-soft small">
                ← Quay lại danh sách
              </Link>
              <h1 className="section-title mt-2 mb-1">Chi tiết đơn đặt phòng</h1>
              <div className="text-muted-soft">Mã đơn: <strong>{b.bookingCode || b.bookingId}</strong></div>
            </div>
            <span className={`status-badge ${statusClass[b.status] || 'status-pending'}`}>
              {statusLabel[b.status] || b.status}
            </span>
          </div>
        </div>
      </section>

      <section className={isAdmin ? 'py-2' : 'section-pad'}>
        <div className="container">
          <div className="row g-4">
            {/* Thông tin chính */}
            <div className="col-lg-7">
              <div className="content-card p-4 mb-4">
                <h5 className="mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-calendar-check fs-5" /> Thông tin đặt phòng
                </h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="text-muted-soft small">Phòng</div>
                    <div className="fw-semibold">{b.roomName} {b.roomNumber ? `(${b.roomNumber})` : ''}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted-soft small">Khách hàng</div>
                    <div className="fw-semibold">{b.guestName || '—'}</div>
                  </div>

                  <div className="col-md-6">
                    <div className="text-muted-soft small"><i className="bi bi-calendar3 me-1" />Nhận phòng</div>
                    <div className="fw-semibold">{formatDate(b.checkIn || b.checkInDate)}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted-soft small"><i className="bi bi-calendar3 me-1" />Trả phòng</div>
                    <div className="fw-semibold">{formatDate(b.checkOut || b.checkOutDate)}</div>
                  </div>

                  <div className="col-md-6">
                    <div className="text-muted-soft small"><i className="bi bi-clock me-1" />Ngày tạo</div>
                    <div>{formatDateTime(b.createdAt)}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted-soft small"><i className="bi bi-currency-dollar me-1" />Tổng tiền</div>
                    <div className="fw-bold text-danger fs-5">{formatCurrency(b.total || b.totalPrice)}</div>
                  </div>
                </div>

                {b.specialRequests && (
                  <div className="mt-3">
                    <div className="text-muted-soft small"><i className="bi bi-chat-left-text me-1" />Yêu cầu đặc biệt</div>
                    <div className="p-2 bg-light rounded">{b.specialRequests}</div>
                  </div>
                )}
              </div>

              {/* Thông tin liên hệ */}
              <div className="content-card p-4">
                <h5 className="mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-person-lines-fill fs-5" /> Thông tin liên hệ
                </h5>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-muted-soft small">Họ tên</div>
                    <div>{b.guestName || '—'}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted-soft small">Email</div>
                    <div>{b.contactEmail || '—'}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted-soft small">Điện thoại</div>
                    <div>{b.contactPhone || '—'}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted-soft small">Vai trò người đặt</div>
                    <div><span className="badge bg-secondary-subtle">{getRoleLabel(user?.role)}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hành động + QR */}
            <div className="col-lg-5">
              <div className="content-card p-4 mb-4">
                <h5 className="mb-3"><i className="bi bi-gear me-2" />Thao tác</h5>

                <div className="d-grid gap-2">
                  <button 
                    className="btn-luxury btn-luxury-primary" 
                    onClick={() => openQR()}
                  >
                    <i className="bi bi-qr-code-scan me-2" /> Xem QR Thanh toán VietQR
                  </button>

                  {canManage && ['pending', 'paid', 'confirmed'].includes((b.status || '').toLowerCase()) && (
                    <button className="btn btn-outline-danger" onClick={cancelBooking}>
                      <i className="bi bi-x-circle me-2" /> Hủy đơn đặt phòng
                    </button>
                  )}

                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="mt-2">
                      <label className="small text-muted-soft">Cập nhật trạng thái (Admin)</label>
                      <select 
                        className="form-select mt-1" 
                        value={b.status} 
                        onChange={(e) => updateStatus(e.target.value)}
                      >
                        <option value="pending">Chờ xác nhận</option>
                        <option value="paid">Đã thanh toán (chờ xác nhận)</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="completed">Hoàn tất</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick status info */}
              <div className="content-card p-3">
                <div className="small text-muted-soft">Trạng thái hiện tại</div>
                <div className={`status-badge mt-1 ${statusClass[b.status]}`}>
                  {statusLabel[b.status] || b.status}
                </div>
                <div className="mt-2 small text-muted">
                  {b.status === 'paid' && 'Khách đã báo thanh toán. Vui lòng kiểm tra và xác nhận.'}
                  {b.status === 'pending' && 'Đang chờ khách thanh toán hoặc xác nhận.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QR Modal (full featured with bank select + mark paid) */}
      <Modal 
        show={showQR} 
        onClose={closeQR} 
        title={`QR VietQR - ${b.bookingCode || b.bookingId}`} 
        size="xl"
      >
        {qrLoading && <div className="text-center p-4"><div className="spinner-border" /><div>Đang tạo QR...</div></div>}

        {qrInfo && !qrLoading && (
          <>
            <div className="text-center">
              <img 
                src={qrInfo.qrUrl} 
                alt="VietQR" 
                style={{maxWidth: '100%', maxHeight: 420, border: '1px solid #eee', borderRadius: 12}} 
              />
            </div>

            {banks.length > 0 && (
              <div className="my-3 text-center">
                <label className="form-label small d-block">Chọn ngân hàng:</label>
                <select className="form-select mx-auto" style={{ maxWidth: '260px' }} value={selectedBank} onChange={e => changeBank(e.target.value)}>
                  {banks.map(bk => (
                    <option key={bk.key} value={bk.key}>{bk.name} ({bk.bin})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="bg-light p-3 rounded small mt-2 text-center">
              <div><strong>Ngân hàng:</strong> {qrInfo.bankName}</div>
              <div className="mt-1"><strong>Số TK:</strong> {qrInfo.accountNo} <button className="btn btn-sm btn-link p-0" onClick={() => navigator.clipboard.writeText(qrInfo.accountNo)}>copy</button></div>
              <div className="mt-1"><strong>Chủ TK:</strong> {qrInfo.accountName}</div>
              <div className="mt-1 fw-bold text-danger"><strong>Số tiền cần chuyển:</strong> {formatCurrency(qrInfo.amount)}</div>
              {qrInfo.roomAmount > 0 && qrInfo.surchargeAmount > 0 && (
                <div className="small text-muted mt-1">
                  (Tiền phòng: {formatCurrency(qrInfo.roomAmount)} + Phụ phí QR: {formatCurrency(qrInfo.surchargeAmount)})
                </div>
              )}
              <div className="mt-1"><strong>Nội dung CK:</strong> {qrInfo.description} <button className="btn btn-sm btn-link p-0" onClick={() => navigator.clipboard.writeText(qrInfo.description)}>copy</button></div>
            </div>

            <div className="alert alert-info small mt-3">{qrInfo.instructions}</div>

            {['pending', 'confirmed'].includes((b.status || '').toLowerCase()) && (
              <button className="btn-luxury btn-luxury-primary w-100 mt-2" onClick={markAsPaid}>
                ✓ Tôi đã chuyển khoản thành công
              </button>
            )}

            {/* Xuất hóa đơn */}
            <div className="text-center mt-3 border-top pt-3">
              <button
                type="button"
                className="btn btn-outline-dark w-100"
                onClick={async () => { await exportVietQRInvoice(b, qrInfo); }}
              >
                <i className="bi bi-printer me-2"></i> Xuất hóa đơn / Biên nhận thanh toán VietQR
              </button>
              <div className="small text-muted-soft mt-1">In hoặc lưu thành PDF (có đầy đủ thông tin ngân hàng)</div>
            </div>
          </>
        )}
      </Modal>
    </main>
  );
}
