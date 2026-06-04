import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    try {
      const user = await register({
        fullName: form.fullName.value,
        email: form.email.value,
        phone: form.phone.value,
        password: form.password.value,
        role: 'customer'
      });
      showToast('Tạo tài khoản thành công! Đang chuyển hướng...', 'success');
      // Auto login from register response, go to home (or admin if somehow)
      navigate(user ? '/' : '/login');
    } catch (err) {
      showToast(err.message || 'Đăng ký thất bại.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <Reveal>
                <div className="auth-card p-4 p-md-5">
                  <div className="room-chip mb-2">Register</div>
                  <h1 className="h3 mb-4">Tạo tài khoản mới</h1>
                  <form className="form-luxury" onSubmit={onSubmit}>
                    <div className="mb-3">
                      <label className="form-label text-dark">Họ tên</label>
                      <input className="form-control" name="fullName" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-dark">Email</label>
                      <input className="form-control" type="email" name="email" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-dark">Số điện thoại</label>
                      <input className="form-control" name="phone" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-dark">Mật khẩu</label>
                      <input className="form-control" type="password" name="password" required />
                    </div>
                    <button className="btn-luxury btn-luxury-primary w-100" type="submit" disabled={loading}>
                      {loading ? 'Đang xử lý...' : 'Đăng ký'}
                    </button>
                  </form>
                  <p className="mt-3 mb-0 text-muted-soft">
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}