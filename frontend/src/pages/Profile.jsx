import { useEffect, useState } from 'react';
import { apiCall, unwrap } from '../api/client';
import Reveal from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAdmin } from '../utils/roles';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiCall('/users/profile', 'GET');
        const profile = unwrap(res);
        setForm((f) => ({
          ...f,
          fullName: profile.fullName || profile.name || '',
          email: profile.email || '',
          phone: profile.phone || profile.phoneNumber || ''
        }));
        setUser(profile);
      } catch {
        if (user) {
          setForm((f) => ({
            ...f,
            fullName: user.fullName || user.name || '',
            email: user.email || '',
            phone: user.phone || ''
          }));
        }
      }
    };
    load();
  }, [setUser, user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await apiCall('/users/profile', 'PUT', {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone
      });
      const updated = unwrap(res);
      setUser(updated);
      showToast('Đã cập nhật hồ sơ.', 'success');
    } catch (err) {
      showToast(err.message || 'Không cập nhật được hồ sơ.', 'danger');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword) {
      showToast('Nhập đủ mật khẩu hiện tại và mới.', 'warning');
      return;
    }
    try {
      await apiCall('/users/change-password', 'PUT', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      showToast('Đã đổi mật khẩu.', 'success');
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
    } catch (err) {
      showToast(err.message || 'Đổi mật khẩu thất bại.', 'danger');
    }
  };

  return (
    <main>
      <section className="section-pad">
        <div className="container">
          <Reveal>
            <div className="profile-card p-4 mb-4">
              <h2 className="h3">{form.fullName || 'Người dùng'}</h2>
              <span className="badge-soft">{isAdmin(user) ? 'Admin' : 'Customer'}</span>
            </div>
            <form className="form-luxury content-card p-4 mb-4" onSubmit={saveProfile}>
              <h3 className="h5 mb-3">Thông tin cá nhân</h3>
              <div className="mb-3">
                <label className="form-label">Họ tên</label>
                <input
                  className="form-control"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Số điện thoại</label>
                <input
                  className="form-control"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <button className="btn-luxury btn-luxury-primary" type="submit">
                Lưu hồ sơ
              </button>
            </form>
            <form className="form-luxury content-card p-4" onSubmit={changePassword}>
              <h3 className="h5 mb-3">Đổi mật khẩu</h3>
              <div className="mb-3">
                <input
                  className="form-control"
                  type="password"
                  placeholder="Mật khẩu hiện tại"
                  value={form.currentPassword}
                  onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <input
                  className="form-control"
                  type="password"
                  placeholder="Mật khẩu mới"
                  value={form.newPassword}
                  onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                />
              </div>
              <button className="btn-luxury btn-luxury-outline" type="submit">
                Đổi mật khẩu
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </main>
  );
}