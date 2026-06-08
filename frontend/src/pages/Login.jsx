import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAdmin } from '../utils/roles';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    try {
      const user = await login({
        email: form.email.value,
        password: form.password.value
      });
      showToast('Đăng nhập thành công. Đang chuyển hướng...', 'success');
      navigate(isAdmin(user) ? '/admin' : '/');
    } catch (err) {
      showToast(err.message || 'Đăng nhập thất bại.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ==================== GOOGLE LOGIN (phiên bản thật - không demo) ====================
  // Yêu cầu BẮT BUỘC:
  // 1. Đặt VITE_GOOGLE_CLIENT_ID trong frontend/.env (phải giống hệt google.client-id ở backend)
  // 2. Trong Google Cloud Console > Credentials > Web application Client ID:
  //    - Thêm http://localhost:5173 VÀ http://127.0.0.1:5173 vào "Authorized JavaScript origins"
  // 3. Sau khi sửa .env phải Ctrl+C frontend rồi chạy lại "npm run dev" (Vite không hot-reload env)
  // 4. Sau khi sửa Google Console có thể cần đợi 1-2 phút + clear cache trình duyệt / incognito

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Debug helper - check browser console (F12)
    console.log('[Google Login] VITE_GOOGLE_CLIENT_ID =', clientId);

    if (!clientId || clientId.includes('demo') || clientId.startsWith('your-') || clientId === 'demo-google-client-id') {
      const actualValue = clientId || '(không có)';
      showToast(
        `Google login chưa được cấu hình (giá trị hiện tại: ${actualValue}). ` +
        'Vui lòng đặt VITE_GOOGLE_CLIENT_ID trong frontend/.env bằng Client ID thật từ Google Cloud Console. ' +
        'Sau đó dừng frontend (Ctrl+C) và chạy lại "npm run dev".',
        'warning'
      );
      return;
    }

    setLoading(true);

    const scriptId = 'google-gis';
    const loadAndInit = () => initGoogleSignIn(clientId);

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      script.onload = loadAndInit;
      script.onerror = () => {
        setLoading(false);
        showToast('Không tải được Google Sign-In script.', 'danger');
      };
      document.head.appendChild(script);
    } else {
      loadAndInit();
    }
  };

  const initGoogleSignIn = (clientId) => {
    if (!window.google?.accounts?.id) {
      setLoading(false);
      showToast('Google Sign-In chưa sẵn sàng. Thử lại sau.', 'danger');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Ưu tiên hiển thị nút Google rõ ràng (renderButton) thay vì One Tap (dễ bị chặn)
      // Tạo container tạm và render nút
      showGoogleSignInButton();
    } catch (err) {
      setLoading(false);
      showToast('Không khởi tạo được Google Sign-In. Kiểm tra lại Client ID.', 'danger');
    }
  };

  // Hiển thị nút đăng nhập Google chính thức (rất đáng tin cậy)
  const showGoogleSignInButton = () => {
    setLoading(false); // Giải phóng nút gốc

    let container = document.getElementById('google-signin-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'google-signin-container';
      container.style.cssText = 
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;' +
        'background:#fff;padding:10px 16px;border-radius:12px;box-shadow:0 8px 25px rgba(0,0,0,0.12);';
      document.body.appendChild(container);

      const close = document.createElement('button');
      close.textContent = '×';
      close.style.cssText = 'position:absolute;top:2px;right:8px;font-size:20px;border:none;background:none;cursor:pointer;line-height:1';
      close.onclick = () => container.remove();
      container.appendChild(close);
    }

    // Render nút Google chính thức
    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 280,
    });
  };

  const handleGoogleCredentialResponse = async (response) => {
    const credential = response?.credential;
    if (!credential) {
      showToast('Google credential không hợp lệ.', 'danger');
      return;
    }

    setLoading(true);
    try {
      const authUser = await googleLogin(credential);
      showToast('Đăng nhập Google thành công!', 'success');
      const target = isAdmin(authUser) ? '/admin' : '/';
      navigate(target, { replace: true });
    } catch (err) {
      const msg = err.message || 'Đăng nhập Google thất bại.';
      // Hiển thị message chi tiết từ backend (thường sẽ nhắc về Client ID / Authorized origins)
      showToast(msg + ' (Kiểm tra: 1) VITE_GOOGLE_CLIENT_ID == google.client-id, 2) http://localhost:5173 đã được thêm vào Authorized JavaScript origins trong Google Cloud Console)', 'danger');
    } finally {
      setLoading(false);
      // Dọn container nút Google nếu còn
      const c = document.getElementById('google-signin-container');
      if (c) c.remove();
    }
  };

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <Reveal>
                <span className="kicker">Tài khoản</span>
                <h1 className="section-title mt-3">Đăng nhập vào hệ thống NOVA HOTEL</h1>
                <p className="section-subtitle ms-0">
                  Sử dụng tài khoản khách hàng hoặc quản trị viên để quản lý đặt phòng qua REST API.
                </p>
              </Reveal>
            </div>
            <div className="col-lg-6">
              <Reveal delay={90}>
                <div className="auth-card p-4 p-md-5">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <div className="room-chip mb-2">Login</div>
                      <h2 className="h3 mb-0">Chào mừng trở lại</h2>
                    </div>
                    <Link className="btn-luxury btn-luxury-outline btn-sm" to="/register">
                      Tạo tài khoản
                    </Link>
                  </div>
                  <form className="form-luxury" id="loginForm" onSubmit={onSubmit}>
                    <div className="mb-3">
                      <label className="form-label text-dark">Email</label>
                      <input className="form-control" type="email" name="email" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-dark">Mật khẩu</label>
                      <input className="form-control" type="password" name="password" required />
                    </div>
                    <div className="d-flex justify-content-end mb-2">
                      <Link to="/forgot-password" className="small text-muted-soft text-decoration-none">
                        Quên mật khẩu?
                      </Link>
                    </div>
                    <button className="btn-luxury btn-luxury-primary w-100" type="submit" disabled={loading}>
                      {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>

                    <div className="text-center my-3 text-muted-soft small">hoặc</div>

                    <button
                      type="button"
                      className="btn-luxury btn-luxury-outline w-100 d-flex align-items-center justify-content-center gap-2"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                    >
                      <i className="bi bi-google" /> Đăng nhập bằng Google
                    </button>
                  </form>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}