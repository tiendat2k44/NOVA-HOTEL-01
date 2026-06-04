import { useCallback, useEffect, useState } from 'react';
import { apiCall, unwrap } from '../../api/client';
import { useToast } from '../../context/ToastContext';
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
  amenities: ''
};

export default function AdminRooms() {
  const { showToast } = useToast();
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
        amenities: room.amenities.join(', ')
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
    maxGuests: Number(form.capacity || 0)
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
            {['code', 'name', 'type', 'price', 'floor', 'status'].map((field) => (
              <div className="col-md-4" key={field}>
                <label className="form-label text-dark small">{field}</label>
                <input
                  className="form-control"
                  placeholder={field}
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  required={field === 'code' || field === 'name'}
                />
              </div>
            ))}
            <div className="col-12">
              <label className="form-label text-dark small">Mô tả</label>
              <textarea
                className="form-control"
                placeholder="Mô tả"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="col-12">
              <label className="form-label text-dark small">Tiện nghi (phân cách bằng dấu phẩy)</label>
              <input
                className="form-control"
                placeholder="Tiện nghi (phân cách bằng dấu phẩy)"
                value={form.amenities}
                onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value }))}
              />
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
            <option value="available">available</option>
            <option value="maintenance">maintenance</option>
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