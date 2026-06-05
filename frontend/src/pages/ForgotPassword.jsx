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
      showToast('Yêu cầu đã được gửi. Vui lòng kiểm tra email của bạn.', 'success');
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
                        Nhập email của bạn. Chúng tôi sẽ gửi link đặt lại mật khẩu đến hộp thư của bạn (kiểm tra cả Spam nếu không thấy).
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
                    <div className="text-center">
                      <div style={{ fontSize: '3rem', color: '#166534', marginBottom: '12px' }}>
                        ✓
                      </div>
                      <h2 className="h4 mb-2 text-success">Yêu cầu đã gửi thành công!</h2>
                      <p className="text-muted-soft mb-3">
                        Nếu email của bạn tồn tại trong hệ thống, chúng tôi đã gửi email chứa link đặt lại mật khẩu.
                      </p>

                      <div className="content-card bg-light p-3 mb-3 text-start" style={{ fontSize: '0.9rem' }}>
                        <strong className="d-block mb-1">Lưu ý:</strong>
                        <ul className="mb-0 ps-3">
                          <li>Kiểm tra hộp thư đến (và cả thư mục <strong>Spam / Junk</strong>).</li>
                          <li>Link đặt lại chỉ có hiệu lực trong <strong>1 giờ</strong>.</li>
                          <li>Nếu không nhận được email, vui lòng thử lại hoặc liên hệ hỗ trợ.</li>
                        </ul>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        <Link 
                          to="/reset-password" 
                          className="btn-luxury btn-luxury-primary w-100"
                        >
                          Tôi đã nhận email — Đặt lại mật khẩu
                        </Link>
                        <Link to="/login" className="btn-luxury btn-luxury-outline w-100">
                          Quay lại trang đăng nhập
                        </Link>
                      </div>
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
