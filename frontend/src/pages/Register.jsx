import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register, googleLogin } = useAuth();
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

  // Google Sign Up / Login (phiên bản thật - không có demo)
  // Yêu cầu giống Login: Client ID khớp + Authorized JavaScript origins (localhost:5173) phải được cấu hình trong Google Cloud Console cho Web Client ID.
  const handleGoogleRegister = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Debug helper - check browser console (F12)
    console.log('[Google Register] VITE_GOOGLE_CLIENT_ID =', clientId);

    if (!clientId || clientId.includes('demo') || clientId.startsWith('your-') || clientId === 'demo-google-client-id') {
      const actualValue = clientId || '(không có)';
      showToast(
        `Google đăng ký chưa được cấu hình (giá trị hiện tại: ${actualValue}). ` +
        'Vui lòng đặt VITE_GOOGLE_CLIENT_ID trong frontend/.env bằng Client ID thật từ Google Cloud Console. ' +
        'Sau đó dừng frontend (Ctrl+C) và chạy lại "npm run dev".',
        'warning'
      );
      return;
    }

    setLoading(true);

    try {
      const user = await startGoogleSignIn(clientId);
      showToast('Đăng ký / Đăng nhập Google thành công!', 'success');
      navigate(user ? '/' : '/login');
    } catch (err) {
      const msg = err.message || 'Đăng ký bằng Google thất bại.';
      showToast(msg + ' (Kiểm tra: Client ID khớp giữa .env và backend, và origin http://localhost:5173 đã được authorize trong Google Console)', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Khởi tạo GIS thật và trả promise user
  const startGoogleSignIn = (clientId) => {
    return new Promise((resolve, reject) => {
      const scriptId = 'google-gis';

      const init = () => {
        if (!window.google?.accounts?.id) {
          reject(new Error('Google Sign-In chưa sẵn sàng'));
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const cred = response?.credential;
              if (!cred) throw new Error('Không nhận được credential từ Google');
              const user = await googleLogin(cred);
              resolve(user);
            } catch (e) {
              reject(e);
            }
          },
        });

        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;background:#fff;padding:10px 16px;border-radius:12px;box-shadow:0 8px 25px rgba(0,0,0,0.12)';
        document.body.appendChild(container);

        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
          shape: 'pill',
        });

        setTimeout(() => {
          if (container.parentNode) container.parentNode.removeChild(container);
        }, 20000);
      };

      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.id = scriptId;
        script.async = true;
        script.onload = init;
        document.head.appendChild(script);
      } else {
        init();
      }
    });
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

                    <div className="text-center my-3 text-muted-soft small">hoặc</div>

                    <button
                      type="button"
                      className="btn-luxury btn-luxury-outline w-100 d-flex align-items-center justify-content-center gap-2"
                      onClick={handleGoogleRegister}
                      disabled={loading}
                    >
                      <i className="bi bi-google" /> Đăng ký bằng Google
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