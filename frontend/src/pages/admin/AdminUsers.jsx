import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, unwrap } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole, getRoleLabel, roleOptions } from '../../utils/roles';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';

const emptyForm = {
  userId: '',
  fullName: '',
  email: '',
  phone: '',
  role: 'customer',
  status: 'active',
  password: ''
};

const toDisplayUser = (user) => ({
  id: String(user?.id || user?._id || ''),
  name: user?.fullName || user?.name || '---',
  email: user?.email || '',
  phone: user?.phone || user?.phoneNumber || '',
  role: normalizeRole(user?.role),
  roleLabel: getRoleLabel(user?.role),
  status: user?.status || (user?.isActive === false ? 'inactive' : 'active')
});

export default function AdminUsers() {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      showToast('Chỉ quản trị viên mới được quản lý người dùng.', 'danger');
      navigate('/admin/bookings', { replace: true });
    }
  }, [isAdmin, navigate, showToast]);

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async (page = currentPage, size = pageSize) => {
    try {
      const res = await apiCall(`/users?page=${page}&size=${size}`, 'GET');
      const unwrapped = unwrap(res);

      // Backend có thể trả về 2 kiểu:
      // 1. ApiResponse.data = Page object { content: [...], totalElements, totalPages, number }
      // 2. ApiResponse.data = mảng trực tiếp [user1, user2, ...]  (như log bạn thấy)
      let listRaw = [];
      let totalElements = 0;
      let totalPagesCalc = 0;
      let currentPageNum = page;

      if (Array.isArray(unwrapped)) {
        // Trường hợp backend trả list thẳng trong data
        listRaw = unwrapped;
        totalElements = unwrapped.length;
        totalPagesCalc = totalElements > 0 ? 1 : 0;
      } else if (unwrapped && typeof unwrapped === 'object') {
        // Trường hợp chuẩn Spring Page
        listRaw = Array.isArray(unwrapped.content) ? unwrapped.content : [];
        totalElements = unwrapped.totalElements ?? listRaw.length;
        totalPagesCalc = unwrapped.totalPages ?? (totalElements > 0 ? 1 : 0);
        currentPageNum = unwrapped.number ?? page;
      }

      setUsers(listRaw.map(toDisplayUser));
      setTotalItems(totalElements);
      setTotalPages(totalPagesCalc);
      setCurrentPage(currentPageNum);
    } catch (err) {
      showToast(err.message || 'Không tải users.', 'danger');
      setUsers([]);
      setTotalItems(0);
      setTotalPages(0);
    }
  }, [showToast, currentPage, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const body = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      role: form.role,
      password: form.password || 'NovaHotel@123',
      isActive: form.status === 'active'
    };
    try {
      if (form.userId) {
        if (form.password) body.password = form.password;
        await apiCall(`/users/admin/${form.userId}`, 'PUT', body);
        showToast('Đã cập nhật người dùng.', 'success');
      } else {
        await apiCall('/users/admin', 'POST', body);
        showToast('Đã tạo người dùng.', 'success');
      }
      closeModal();
      load();
    } catch (err) {
      showToast(err.message || 'Thao tác thất bại.', 'danger');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Xóa người dùng này?')) return;
    try {
      await apiCall(`/users/admin/${id}`, 'DELETE');
      showToast('Đã xóa.', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Không xóa được.', 'danger');
    }
  };

  const toggleStatus = async (user) => {
    const next = user.status === 'active' ? 'inactive' : 'active';
    try {
      await apiCall(`/users/admin/${user.id}`, 'PUT', {
        isActive: next === 'active'
      });
      load();
    } catch (err) {
      showToast(err.message || 'Không đổi trạng thái.', 'danger');
    }
  };

  const filtered = users.filter((u) => {
    const kw = search.toLowerCase();
    return !kw || [u.name, u.email, u.role, u.roleLabel].some((v) => (v || '').toLowerCase().includes(kw));
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

  const openModal = (user = null) => {
    if (user) {
      setForm({
        userId: user.id,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'customer',
        status: user.status || 'active',
        password: ''
      });
    } else {
      setForm(emptyForm);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">Quản lý người dùng</h3>
        <button 
          className="btn-luxury btn-luxury-primary btn-sm" 
          onClick={() => openModal()}
        >
          <i className="bi bi-plus-lg me-1" /> Thêm người dùng
        </button>
      </div>

      <Modal 
        show={showModal} 
        onClose={closeModal} 
        title={form.userId ? 'Cập nhật người dùng' : 'Thêm người dùng'}
        size="lg"
        footer={
          <>
            <button className="btn-luxury btn-luxury-primary" type="button" onClick={() => {
              const f = document.getElementById('userForm');
              if (f) f.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
            }}>Lưu</button>
            <button className="btn-luxury btn-luxury-outline" type="button" onClick={closeModal}>Hủy</button>
          </>
        }
      >
        <form id="userForm" className="form-luxury" onSubmit={onSubmit}>
          <div className="row g-3">
            {['fullName', 'email', 'phone', 'password'].map((field) => (
              <div className="col-md-4" key={field}>
                <label className="form-label text-dark small">
                  {field === 'fullName' ? 'Họ tên' : field === 'email' ? 'Email' : field === 'phone' ? 'Số điện thoại' : 'Mật khẩu (để trống nếu không đổi)'}
                </label>
                <input
                  className="form-control"
                  placeholder={field}
                  type={field === 'password' ? 'password' : 'text'}
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  required={field === 'email' || field === 'fullName'}
                />
              </div>
            ))}
            {/* Vai trò với label tiếng Việt */}
            <div className="col-md-4">
              <label className="form-label text-dark small">Vai trò</label>
              <select className="form-select" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {roleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      <input
        className="form-control mb-3"
        placeholder="Tìm người dùng..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-responsive">
        <table className="table table-luxury">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className="badge bg-secondary-subtle text-dark">{u.roleLabel}</span>
                </td>
                <td>
                  <div className="d-flex gap-1">
                    <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => openModal(u)}>
                      <i className="bi bi-pencil me-1" /> Sửa
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => toggleStatus(u)}>
                      <i className="bi bi-toggle-on me-1" /> TT
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(u.id)}>
                      <i className="bi bi-trash me-1" /> Xóa
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
    </div>
  );
}