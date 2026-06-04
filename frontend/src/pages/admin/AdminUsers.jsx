import { useCallback, useEffect, useState } from 'react';
import { apiCall, unwrap } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { normalizeRole } from '../../utils/roles';
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
  status: user?.status || (user?.isActive === false ? 'inactive' : 'active')
});

export default function AdminUsers() {
  const { showToast } = useToast();
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
      const pageData = unwrap(res);
      const list = (pageData?.content || []).map(toDisplayUser);
      setUsers(list);
      setTotalItems(pageData?.totalElements || 0);
      setTotalPages(pageData?.totalPages || 0);
      setCurrentPage(pageData?.number || 0);
    } catch (err) {
      showToast(err.message || 'Không tải users.', 'danger');
      setUsers([]);
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
      setForm(emptyForm);
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
    return !kw || [u.name, u.email, u.role].some((v) => (v || '').toLowerCase().includes(kw));
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">Quản lý người dùng</h3>
        <button 
          className="btn-luxury btn-luxury-primary btn-sm" 
          onClick={() => openModal()}
        >
          + Thêm người dùng
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
            {['fullName', 'email', 'phone', 'role', 'password'].map((field) => (
              <div className="col-md-4" key={field}>
                <label className="form-label text-dark small">{field}</label>
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
                <td>{u.role}</td>
                <td>
                  <div className="d-flex gap-1">
                    <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => openModal(u)}>
                      Sửa
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => toggleStatus(u)}>
                      TT
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(u.id)}>
                      Xóa
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