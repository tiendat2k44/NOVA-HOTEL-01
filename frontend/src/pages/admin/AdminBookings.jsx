import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiCall, getBookingPaymentQr, unwrap } from '../../api/client';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';
import { exportVietQRInvoice } from '../../utils/exportInvoice';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';

const STATUS_META = {
  pending: { label: 'Chờ xác nhận', badge: 'warning', color: '#f59e0b' },
  confirmed: { label: 'Đã xác nhận', badge: 'primary', color: '#3b82f6' },
  'checked-in': { label: 'Đang lưu trú', badge: 'info', color: '#8b5cf6' },
  'checked-out': { label: 'Đã trả phòng', badge: 'success', color: '#10b981' },
  completed: { label: 'Hoàn tất', badge: 'success', color: '#059669' },
  cancelled: { label: 'Đã hủy', badge: 'danger', color: '#ef4444' },
  paid: { label: 'Đã thanh toán', badge: 'info', color: '#0ea5e9' },
};

const statusLabel = (status) => STATUS_META[status]?.label ?? status ?? '—';
const statusBadge = (status) => STATUS_META[status]?.badge ?? 'secondary';

const calcNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = (new Date(checkOut) - new Date(checkIn)) / 86_400_000;
  return diff > 0 ? Math.round(diff) : 0;
};

function StatsCards({ bookings }) {
  const total = bookings.length;
  const checkedIn = bookings.filter((booking) => booking.status === 'checked-in').length;
  const pending = bookings.filter((booking) => booking.status === 'pending').length;
  const cancelled = bookings.filter((booking) => booking.status === 'cancelled').length;
  const revenue = bookings
    .filter((booking) => booking.status !== 'cancelled')
    .reduce((sum, booking) => sum + Number(booking.totalPrice || booking.total || 0), 0);

  const items = [
    { label: 'Tổng đặt phòng', value: total, icon: 'bi-calendar-check', color: '#1e293b' },
    { label: 'Đang lưu trú', value: checkedIn, icon: 'bi-door-open', color: '#8b5cf6' },
    { label: 'Chờ xác nhận', value: pending, icon: 'bi-hourglass-split', color: '#f59e0b' },
    { label: 'Đã hủy', value: cancelled, icon: 'bi-x-circle', color: '#ef4444' },
    { label: 'Doanh thu', value: formatCurrency(revenue), icon: 'bi-cash-stack', color: '#059669' },
  ];

  return (
    <div className="row g-3 mb-4">
      {items.map((item) => (
        <div className="col-6 col-md" key={item.label}>
          <div className="stat-card h-100 d-flex align-items-center gap-3 px-3 py-3">
            <i className={`bi ${item.icon} fs-3`} style={{ color: item.color }} />
            <div>
              <div className="text-muted-soft small text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>{item.label}</div>
              <div className="fw-bold" style={{ fontSize: '1.05rem', color: item.color }}>{item.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function exportCSV(bookings) {
  const headers = ['Mã booking', 'Khách', 'Email', 'SĐT', 'Phòng', 'Số phòng', 'Check-in', 'Check-out', 'Đêm', 'Tổng tiền', 'Trạng thái', 'Ngày tạo', 'Ghi chú'];
  const rows = bookings.map((booking) => [
    booking.bookingCode || booking.code || booking.bookingId || '',
    booking.guestName || '',
    booking.contactEmail || '',
    booking.contactPhone || '',
    booking.roomName || '',
    booking.roomNumber || '',
    formatDate(booking.checkIn),
    formatDate(booking.checkOut),
    calcNights(booking.checkIn, booking.checkOut),
    booking.totalPrice || booking.total || 0,
    statusLabel(booking.status),
    formatDate(booking.createdAt),
    booking.specialRequests || '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `bookings_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminBookings() {
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [qrInfo, setQrInfo] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const response = await apiCall('/bookings?size=500', 'GET');
      const data = unwrap(response);
      setAllBookings(Array.isArray(data) ? data : data?.content ?? []);
    } catch {
      setAllBookings([]);
    }
  }, []);

  const load = useCallback(async (page = currentPage, size = pageSize) => {
    try {
      const response = await apiCall(`/bookings?page=${page}&size=${size}`, 'GET');
      const data = unwrap(response);
      console.log("Check data",data);
      

      let rows = [];
      let total = 0;
      let pages = 0;

      if (Array.isArray(data)) {
        rows = data;
        total = data.length;
        pages = 1;
      } else if (data && typeof data === 'object') {
        rows = Array.isArray(data.content) ? data.content : [];
        total = data.totalElements ?? rows.length;
        pages = data.totalPages ?? 1;
        page = data.number ?? page;
      }

      setBookings(rows);
      setTotalItems(total);
      setTotalPages(pages);
      setCurrentPage(page);
    } catch (error) {
      showToast(error.message || 'Không tải được booking.', 'danger');
      setBookings([]);
    }
  }, [currentPage, pageSize, showToast]);

  useEffect(() => {
    load();
    loadAll();
  }, [load, loadAll]);

  const updateStatus = async (bookingId, newStatus) => {
    if (!bookingId || !newStatus) return;
    try {
      await apiCall(`/bookings/${bookingId}/status`, 'PATCH', { status: newStatus });
      showToast('Đã cập nhật trạng thái.', 'success');
      load(currentPage, pageSize);
      loadAll();
    } catch (error) {
      showToast(error.message || 'Cập nhật trạng thái thất bại.', 'danger');
    }
  };

  const cancelBooking = async (bookingId, code) => {
    if (!window.confirm(`Hủy booking ${code || bookingId}?`)) return;
    try {
      await apiCall(`/bookings/${bookingId}`, 'DELETE');
      showToast('Đã hủy booking.', 'success');
      load(currentPage, pageSize);
      loadAll();
    } catch (error) {
      showToast(error.message || 'Hủy booking thất bại.', 'danger');
    }
  };

  const filtered = useMemo(() => bookings.filter((booking) => {
    const keyword = search.trim().toLowerCase();
    const matchSearch = !keyword || [
      booking.bookingCode,
      booking.code,
      booking.bookingId,
      booking.guestName,
      booking.roomName,
      booking.roomNumber,
      booking.contactEmail,
      booking.contactPhone,
    ].some((value) => String(value || '').toLowerCase().includes(keyword));

    const matchStatus = !statusFilter || booking.status === statusFilter;
    const checkInDate = booking.checkIn ? new Date(booking.checkIn) : null;
    const matchFrom = !dateFrom || (checkInDate && checkInDate >= new Date(dateFrom));
    const matchTo = !dateTo || (checkInDate && checkInDate <= new Date(`${dateTo}T23:59:59`));

    return matchSearch && matchStatus && matchFrom && matchTo;
  }), [bookings, search, statusFilter, dateFrom, dateTo]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    load(page, pageSize);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(0);
    load(0, size);
  };

  const openAdminQR = async (booking, bankKey = null) => {
    // Ưu tiên mongo id, fallback sang các field mã booking (phòng trường hợp serialization khác nhau)
    const bookingId = booking.id || booking._id || booking.bookingId || booking.code || booking.bookingCode;
    setShowQR(true);
    setQrInfo(null);
    setQrLoading(true);

    if (banks.length === 0) {
      try {
        const response = await apiCall('/bookings/banks', 'GET');
        const list = unwrap(response) || [];
        setBanks(list);
        if (!selectedBank && list[0]) setSelectedBank(list[0].key);
      } catch {
        setBanks([]);
      }
    }

    try {
      const response = await getBookingPaymentQr(bookingId, bankKey || selectedBank || '');
      setQrInfo(unwrap(response));
    } catch (error) {
      showToast(error.message || 'Không tải QR.', 'danger');
      setShowQR(false);
    } finally {
      setQrLoading(false);
    }
  };

  const changeAdminBank = (newKey) => {
    setSelectedBank(newKey);
    if (qrInfo?.bookingCode) {
      const currentBooking = bookings.find((booking) => (booking.code || booking.bookingCode) === qrInfo.bookingCode);
      if (currentBooking) openAdminQR(currentBooking, newKey);
    }
  };

  return (
    <div>
      <StatsCards bookings={allBookings} />

      <div className="content-card p-3 mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label small fw-semibold mb-1">Tìm kiếm</label>
            <input
              className="form-control form-control-sm"
              placeholder="Mã, tên khách, phòng, SĐT, email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold mb-1">Trạng thái</label>
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Tất cả</option>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold mb-1">Check-in từ</label>
            <input type="date" className="form-control form-control-sm" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold mb-1">Đến</label>
            <input type="date" className="form-control form-control-sm" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
          <div className="col-md-2 d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-secondary flex-fill"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setDateFrom('');
                setDateTo('');
              }}
            >
              <i className="bi bi-x-circle me-1" />Xóa lọc
            </button>
            <button className="btn btn-sm btn-outline-success" title="Xuất CSV" onClick={() => exportCSV(filtered)}>
              <i className="bi bi-download" />
            </button>
          </div>
        </div>
        <div className="mt-2 small text-muted">Hiển thị {filtered.length} / {totalItems} đặt phòng</div>
      </div>

      <div className="content-card">
        <div className="table-responsive">
          <table className="table table-luxury table-hover mb-0" style={{ fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th style={{ width: 28 }} />
                <th>Mã booking</th>
                <th>Khách hàng</th>
                <th>Liên hệ</th>
                <th>Phòng</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th className="text-center">Đêm</th>
                <th className="text-end">Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center text-muted py-4">Không tìm thấy booking nào.</td>
                </tr>
              )}

              {filtered.flatMap((booking) => {
                const bookingId = booking.id || booking._id;
                const code = booking.bookingCode || booking.code || booking.bookingId || '—';
                const nights = calcNights(booking.checkIn, booking.checkOut);
                const isExpanded = expandedRow === bookingId;

                return [
                  <tr
                    key={bookingId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpandedRow(isExpanded ? null : bookingId)}
                  >
                    <td className="text-center">
                      <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-muted`} style={{ fontSize: '0.68rem' }} />
                    </td>
                    <td className="fw-semibold text-nowrap" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{code}</td>
                    <td><div className="fw-medium">{booking.guestName || '—'}</div></td>
                    <td>
                      {booking.contactPhone && (
                        <div className="text-nowrap">
                          <i className="bi bi-telephone me-1 text-muted" style={{ fontSize: '0.68rem' }} />
                          {booking.contactPhone}
                        </div>
                      )}
                      {booking.contactEmail && (
                        <div className="text-muted text-truncate" style={{ maxWidth: 150, fontSize: '0.72rem' }}>{booking.contactEmail}</div>
                      )}
                    </td>
                    <td>
                      <div className="fw-medium">{booking.roomName || '—'}</div>
                      {booking.roomNumber && <span className="badge bg-light text-dark border" style={{ fontSize: '0.68rem' }}>P.{booking.roomNumber}</span>}
                    </td>
                    <td className="text-nowrap">{formatDate(booking.checkIn)}</td>
                    <td className="text-nowrap">{formatDate(booking.checkOut)}</td>
                    <td className="text-center"><span className="badge bg-secondary bg-opacity-10 text-secondary fw-semibold">{nights > 0 ? nights : '—'}</span></td>
                    <td className="text-end fw-semibold text-nowrap">{formatCurrency(booking.totalPrice || booking.total)}</td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <select
                        className="form-select form-select-sm"
                        style={{ minWidth: 140, fontSize: '0.78rem' }}
                        value={booking.status || 'pending'}
                        onChange={(event) => updateStatus(bookingId, event.target.value)}
                      >
                        {Object.entries(STATUS_META).map(([key, meta]) => (
                          <option key={key} value={key}>{meta.label}</option>
                        ))}
                      </select>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className="d-flex gap-1">
                        <Link to={`/admin/bookings/${bookingId}`} className="btn btn-sm btn-outline-dark" title="Chi tiết">
                          <i className="bi bi-eye" />
                        </Link>
                        <button type="button" className="btn btn-sm btn-outline-primary" title="QR thanh toán" onClick={() => openAdminQR(booking)}>
                          <i className="bi bi-qr-code" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Hủy booking"
                          disabled={booking.status === 'cancelled'}
                          onClick={() => cancelBooking(bookingId, code)}
                        >
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>,

                  isExpanded && (
                    <tr key={`${bookingId}-detail`} className="table-light">
                      <td />
                      <td colSpan={10} className="py-3">
                        <div className="row g-3 ps-2">
                          <div className="col-md-4">
                            <div className="small fw-semibold text-uppercase text-muted mb-2">Thông tin đặt phòng</div>
                            <table className="table table-sm table-borderless mb-0" style={{ fontSize: '0.8rem' }}>
                              <tbody>
                                <tr>
                                  <td className="text-muted pe-3">Mã booking</td>
                                  <td className="fw-medium" style={{ fontFamily: 'monospace' }}>{code}</td>
                                </tr>
                                <tr>
                                  <td className="text-muted pe-3">Ngày đặt</td>
                                  <td>{formatDateTime(booking.createdAt)}</td>
                                </tr>
                                <tr>
                                  <td className="text-muted pe-3">Số đêm</td>
                                  <td>{nights > 0 ? `${nights} đêm` : '—'}</td>
                                </tr>
                                <tr>
                                  <td className="text-muted pe-3">Trạng thái</td>
                                  <td><span className={`badge bg-${statusBadge(booking.status)}`}>{statusLabel(booking.status)}</span></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="col-md-4">
                            <div className="small fw-semibold text-uppercase text-muted mb-2">Khách hàng</div>
                            <table className="table table-sm table-borderless mb-0" style={{ fontSize: '0.8rem' }}>
                              <tbody>
                                <tr>
                                  <td className="text-muted pe-3">Tên khách</td>
                                  <td className="fw-medium">{booking.guestName || '—'}</td>
                                </tr>
                                <tr>
                                  <td className="text-muted pe-3">Email</td>
                                  <td>{booking.contactEmail || '—'}</td>
                                </tr>
                                <tr>
                                  <td className="text-muted pe-3">Điện thoại</td>
                                  <td>{booking.contactPhone || '—'}</td>
                                </tr>
                                <tr>
                                  <td className="text-muted pe-3">Số phòng</td>
                                  <td>{booking.roomNumber ? `P.${booking.roomNumber}` : '—'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="col-md-4">
                            <div className="small fw-semibold text-uppercase text-muted mb-2">Tài chính</div>
                            <table className="table table-sm table-borderless mb-0" style={{ fontSize: '0.8rem' }}>
                              <tbody>
                                <tr>
                                  <td className="text-muted pe-3">Tổng tiền</td>
                                  <td className="fw-bold text-success">{formatCurrency(booking.totalPrice || booking.total)}</td>
                                </tr>
                                {nights > 0 && (
                                  <tr>
                                    <td className="text-muted pe-3">Giá/đêm TB</td>
                                    <td>{formatCurrency(Math.round((booking.totalPrice || booking.total || 0) / nights))}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                            {booking.specialRequests && (
                              <div className="mt-2">
                                <div className="small fw-semibold text-uppercase text-muted mb-1">Yêu cầu đặc biệt</div>
                                <div className="bg-warning bg-opacity-10 border border-warning rounded p-2 small" style={{ whiteSpace: 'pre-wrap' }}>
                                  {booking.specialRequests}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>

        <div className="px-3 pb-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>

      <Modal
        show={showQR}
        onClose={() => { setShowQR(false); setQrInfo(null); }}
        title={qrInfo ? `QR - ${qrInfo.bookingCode}` : 'QR thanh toán'}
        size="xl"
      >
        {qrLoading && <div className="text-center py-4">Đang tạo QR...</div>}

        {!qrLoading && qrInfo && (
          <div className="row g-4 align-items-start">
            <div className="col-md-5 text-center">
              {qrInfo.qrUrl || qrInfo.qrImageUrl || qrInfo.qrImage ? (
                <img
                  src={qrInfo.qrUrl || qrInfo.qrImageUrl || qrInfo.qrImage}
                  alt="QR thanh toán"
                  style={{ maxWidth: '100%', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}
                />
              ) : (
                <div className="alert alert-warning mb-0">Không có mã QR để hiển thị.</div>
              )}

              <div className="mt-3 d-flex flex-wrap gap-2 justify-content-center">
                <button
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => exportVietQRInvoice(qrInfo.booking || qrInfo, qrInfo)}
                >
                  <i className="bi bi-printer me-1" />Xuất hóa đơn
                </button>
              </div>
            </div>

            <div className="col-md-7">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold mb-1">Ngân hàng</label>
                  <select className="form-select form-select-sm" value={selectedBank} onChange={(event) => changeAdminBank(event.target.value)}>
                    {banks.map((bank) => (
                      <option key={bank.key || bank.code} value={bank.key || bank.code}>{bank.name || bank.label || bank.key || bank.code}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold mb-1">Mã booking</label>
                  <input className="form-control form-control-sm" readOnly value={qrInfo.bookingCode || ''} />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold mb-1">Khách</label>
                  <input className="form-control form-control-sm" readOnly value={qrInfo.guestName || qrInfo.customerName || ''} />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold mb-1">Số tiền</label>
                  <input className="form-control form-control-sm" readOnly value={formatCurrency(qrInfo.amount || qrInfo.total || qrInfo.totalPrice || 0)} />
                </div>

                <div className="col-md-12">
                  <label className="form-label small fw-semibold mb-1">Nội dung chuyển khoản</label>
                  <textarea className="form-control form-control-sm" rows={3} readOnly value={qrInfo.transferContent || qrInfo.description || ''} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}