import { useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { apiCall } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ForgotPassword() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await apiCall('/auth/forgot-password', 'POST', { email });
      setSent(true);
      showToast('Yêu cầu đã được gửi. Kiểm tra console backend (demo) để lấy link reset.', 'success');
    } catch (err) {
      showToast(err.message || 'Không thể gửi yêu cầu.', 'danger');
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
                  <div className="room-chip mb-2">Forgot Password</div>
                  <h1 className="h3 mb-4">Quên mật khẩu</h1>

                  {!sent ? (
                    <form className="form-luxury" onSubmit={onSubmit}>
                      <p className="text-muted-soft mb-3">
                        Nhập email của bạn. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu (demo: link sẽ được in ra console backend).
                      </p>
                      <div className="mb-3">
                        <label className="form-label text-dark">Email</label>
                        <input
                          className="form-control"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <button className="btn-luxury btn-luxury-primary w-100" type="submit" disabled={loading}>
                        {loading ? 'Đang gửi...' : 'Gửi yêu cầu đặt lại'}
                      </button>
                    </form>
                  ) : (
                    <div>
                      <p className="text-success">Yêu cầu đã gửi thành công!</p>
                      <p className="text-muted-soft">
                        Kiểm tra console của backend để lấy link reset (demo). Sau đó dùng link đó để đặt mật khẩu mới.
                      </p>
                    </div>
                  )}

                  <p className="mt-3 mb-0 text-muted-soft">
                    <Link to="/login">Quay lại đăng nhập</Link>
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
