import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { apiCall } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token || !newPassword) {
      showToast('Vui lòng nhập token và mật khẩu mới.', 'warning');
      return;
    }
    if (newPassword !== confirm) {
      showToast('Mật khẩu xác nhận không khớp.', 'danger');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự.', 'warning');
      return;
    }
    setLoading(true);
    try {
      await apiCall('/auth/reset-password', 'POST', { token, newPassword });
      showToast('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.message || 'Đặt lại mật khẩu thất bại.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <Reveal>
                <div className="auth-card p-4 p-md-5">
                  <div className="room-chip mb-2">Reset Password</div>
                  <h1 className="h3 mb-4">Đặt lại mật khẩu</h1>

                  <form className="form-luxury" onSubmit={onSubmit}>
                    <div className="mb-3">
                      <label className="form-label text-dark">Token (từ email/demo link)</label>
                      <input
                        className="form-control"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Dán token từ console demo"
                        required
                      />
                      <div className="form-text">Token có hiệu lực trong 1 giờ.</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-dark">Mật khẩu mới</label>
                      <input
                        className="form-control"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-dark">Xác nhận mật khẩu mới</label>
                      <input
                        className="form-control"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                      />
                    </div>
                    <button className="btn-luxury btn-luxury-primary w-100" type="submit" disabled={loading}>
                      {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                    </button>
                  </form>

                  <p className="mt-3 mb-0 text-muted-soft">
                    <Link to="/login">Quay lại đăng nhập</Link> • <Link to="/forgot-password">Gửi lại yêu cầu</Link>
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
