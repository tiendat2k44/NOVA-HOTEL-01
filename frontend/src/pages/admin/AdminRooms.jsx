import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, unwrap, uploadRoomImage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { getStatusBadgeClass, getStatusLabel, toDisplayRoom } from '../../utils/rooms';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';

const emptyForm = {
  roomId: '',
  code: '',
  name: '',
  type: 'Deluxe',
  price: '',
  area: 28,
  bed: 'King',
  capacity: 2,
  status: 'available',
  floor: '',
  description: '',
  amenities: '',
  images: []
};

export default function AdminRooms() {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Lễ tân không được truy cập trang này
  useEffect(() => {
    if (!isAdmin) {
      showToast('Chỉ quản trị viên mới được quản lý phòng.', 'danger');
      navigate('/admin/bookings', { replace: true });
    }
  }, [isAdmin, navigate, showToast]);

  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async (page = currentPage, size = pageSize) => {
    try {
      const res = await apiCall(`/rooms?page=${page}&size=${size}`, 'GET');
      const pageData = unwrap(res); // the Spring Page object
      const list = (pageData?.content || []).map(toDisplayRoom);
      setRooms(list);
      setTotalItems(pageData?.totalElements || 0);
      setTotalPages(pageData?.totalPages || 0);
      setCurrentPage(pageData?.number || 0);
    } catch (err) {
      showToast(err.message || 'Không tải được phòng.', 'danger');
      setRooms([]);
      setTotalItems(0);
      setTotalPages(0);
    }
  }, [showToast, currentPage, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rooms.filter((r) => {
    const kw = search.toLowerCase();
    const matchSearch = !kw || [r.name, r.code, r.type].some((v) => (v || '').toLowerCase().includes(kw));
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const resetForm = () => setForm(emptyForm);

  const openModal = (room = null) => {
    if (room) {
      setForm({
        roomId: room.id,
        code: room.code,
        name: room.name,
        type: room.type,
        price: room.price,
        area: room.area,
        bed: room.bed,
        capacity: room.capacity,
        status: room.status,
        floor: room.floor,
        description: room.description,
        amenities: room.amenities.join(', '),
        images: Array.isArray(room.images) ? room.images : []
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleImageFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    const added = [];
    try {
      for (const file of fileList) {
        if (file.size > 8 * 1024 * 1024) { // ~8MB client check
          showToast(`Ảnh "${file.name}" quá lớn (giới hạn ~8MB)`, 'danger');
          continue;
        }
        const payload = await uploadRoomImage(file);
        const body = unwrap(payload) || payload;
        const url = body?.url || body?.data?.url;
        if (url && !form.images.includes(url) && !added.includes(url)) {
          added.push(url);
        }
      }
      if (added.length > 0) {
        setForm((f) => ({ ...f, images: [...f.images, ...added] }));
        showToast(`Đã tải lên ${added.length} ảnh.`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Tải ảnh thất bại. Kiểm tra backend đang chạy và bạn là ADMIN.', 'danger');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== index)
    }));
  };

  const editRoom = (room) => {
    openModal(room);
  };

  const buildApiPayload = () => ({
    name: form.name,
    roomId: form.code,
    roomNumber: form.code,
    roomType: form.type,
    price: { basePrice: Number(form.price || 0) },
    status: form.status,
    facilities: (form.amenities || '').split(',').map((s) => s.trim()).filter(Boolean),
    description: form.description,
    maxGuests: Number(form.capacity || 0),
    floor: Number(form.floor || 0),
    images: Array.isArray(form.images) ? form.images : []
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = buildApiPayload();
    try {
      if (form.roomId) {
        await apiCall(`/rooms/admin/${form.roomId}`, 'PUT', payload);
        showToast('Đã cập nhật phòng.', 'success');
      } else {
        await apiCall('/rooms/admin', 'POST', payload);
        showToast('Đã tạo phòng mới.', 'success');
      }
      closeModal();
      load(0); // reset to first page after change
    } catch (err) {
      showToast(err.message || 'Thao tác thất bại.', 'danger');
    }
  };

  const deleteRoom = async (id, name) => {
    if (!window.confirm(`Xóa phòng ${name}?`)) return;
    try {
      await apiCall(`/rooms/admin/${id}`, 'DELETE');
      showToast('Đã xóa phòng.', 'success');
      load(currentPage, pageSize);
    } catch (err) {
      showToast(err.message || 'Không xóa được phòng.', 'danger');
    }
  };

  const toggleStatus = async (room) => {
    const next = room.status === 'available' ? 'maintenance' : 'available';
    try {
      await apiCall(`/rooms/admin/${room.id}`, 'PUT', { status: next });
      load(currentPage, pageSize);
    } catch (err) {
      showToast(err.message || 'Không đổi trạng thái.', 'danger');
    }
  };

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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">Quản lý phòng</h3>
        <button 
          className="btn-luxury btn-luxury-primary btn-sm" 
          onClick={() => openModal()}
        >
          + Thêm phòng mới
        </button>
      </div>

      {/* Modal for Add/Edit Form */}
      <Modal 
        show={showModal} 
        onClose={closeModal} 
        title={form.roomId ? 'Cập nhật phòng' : 'Thêm phòng mới'}
        size="lg"
        footer={
          <div className="d-flex gap-2">
            <button 
              className="btn-luxury btn-luxury-primary" 
              type="button" 
              onClick={(e) => {
                // trigger submit of the form inside
                const formEl = document.getElementById('roomForm');
                if (formEl) formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }}
            >
              {form.roomId ? 'Cập nhật' : 'Lưu phòng'}
            </button>
            <button 
              className="btn-luxury btn-luxury-outline" 
              type="button" 
              onClick={closeModal}
            >
              Hủy
            </button>
          </div>
        }
      >
        <form id="roomForm" className="form-luxury" onSubmit={onSubmit}>
          <div className="row g-3">
            {/* Row 1: code, name, type, price */}
            <div className="col-md-3">
              <label className="form-label text-dark small">Mã phòng</label>
              <input
                className="form-control"
                placeholder="RM001"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-dark small">Tên phòng</label>
              <input
                className="form-control"
                placeholder="Phòng Deluxe View Núi"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-dark small">Loại phòng</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
                <option value="Family">Family</option>
                <option value="Premium">Premium</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label text-dark small">Giá cơ bản (VNĐ)</label>
              <input
                className="form-control"
                placeholder="1250000"
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>

            {/* Row 2: floor, area, bed, capacity, status */}
            <div className="col-md-2">
              <label className="form-label text-dark small">Tầng</label>
              <input
                className="form-control"
                placeholder="2"
                type="number"
                value={form.floor}
                onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label text-dark small">Diện tích (m²)</label>
              <input
                className="form-control"
                placeholder="28"
                type="number"
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label text-dark small">Loại giường</label>
              <input
                className="form-control"
                placeholder="King"
                value={form.bed}
                onChange={(e) => setForm((f) => ({ ...f, bed: e.target.value }))}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label text-dark small">Sức chứa</label>
              <input
                className="form-control"
                placeholder="2"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label text-dark small">Trạng thái</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="available">Còn phòng (available)</option>
                <option value="maintenance">Bảo trì (maintenance)</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label text-dark small">Mô tả</label>
              <textarea
                className="form-control"
                placeholder="Mô tả phòng..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="col-12">
              <label className="form-label text-dark small">Tiện nghi (phân cách bằng dấu phẩy)</label>
              <input
                className="form-control"
                placeholder="WiFi, Điều hòa, Tivi Smart, Ban công"
                value={form.amenities}
                onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value }))}
              />
            </div>

            {/* Images: upload from device (file) instead of manual URL entry */}
            <div className="col-12">
              <label className="form-label text-dark small">Hình ảnh phòng</label>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <input
                  type="file"
                  id="roomImageFileInput"
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    handleImageFiles(e.target.files);
                    // reset để chọn lại cùng file được
                    e.target.value = '';
                  }}
                  disabled={uploading}
                />
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => {
                    const inp = document.getElementById('roomImageFileInput');
                    if (inp) inp.click();
                  }}
                  disabled={uploading}
                >
                  {uploading ? 'Đang tải ảnh...' : '📁 Chọn ảnh từ thiết bị'}
                </button>
                <small className="text-muted">Chọn nhiều ảnh cùng lúc • JPG/PNG/WEBP/GIF • &lt;10MB</small>
              </div>

              {form.images && form.images.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {form.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="position-relative border rounded overflow-hidden"
                      style={{ width: 96, height: 64, background: '#f8f9fa' }}
                    >
                      <img
                        src={imgUrl}
                        alt={`Ảnh ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.opacity = '0.3';
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute"
                        style={{ top: 2, right: 2, padding: '0 4px', lineHeight: 1, fontSize: '10px' }}
                        onClick={() => removeImage(idx)}
                        title="Xóa ảnh"
                      >
                        ×
                      </button>
                      <div
                        className="position-absolute text-white small px-1"
                        style={{ bottom: 0, left: 0, background: 'rgba(0,0,0,0.5)', fontSize: '9px' }}
                      >
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(!form.images || form.images.length === 0) && (
                <div className="text-muted small mt-1">Chưa có ảnh. Chọn ảnh từ thiết bị (upload) để hiển thị cho khách.</div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Filters */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Tìm phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="available">Còn phòng</option>
            <option value="maintenance">Bảo trì</option>
          </select>
        </div>
        <div className="col-md-3 text-end">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => load(0)}>
            Tải lại
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-luxury">
          <thead>
            <tr>
              <th>Phòng</th>
              <th>Loại</th>
              <th>Giá</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((room) => (
              <tr key={room.id}>
                <td>
                  <div className="fw-semibold">{room.name}</div>
                  <small>{room.code}</small>
                </td>
                <td>{room.type}</td>
                <td>{formatCurrency(room.price)}</td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(room.status)}`}>
                    {getStatusLabel(room.status)}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-1 flex-wrap">
                    <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => editRoom(room)}>
                      Sửa
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => toggleStatus(room)}>
                      Đổi TT
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteRoom(room.id, room.name)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted-soft py-4">Không có phòng.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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