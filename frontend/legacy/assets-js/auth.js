// Xử lý đăng nhập và đăng ký.
// Chỉ dùng dữ liệu thật từ backend + MongoDB. Không còn chế độ demo.
const NovaHotelAuth = (() => {
  const { apiCall, showToast, setAuthUser, setAuthToken, resolveAssetPath } = window.NovaHotel;

  const extractAuthPayload = (response) => {
    const token = response?.token || response?.accessToken || response?.jwt || response?.data?.token;
    const user = response?.user || response?.data?.user || response?.data;
    return { token, user };
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    try {
      const response = await apiCall('/auth/login', 'POST', payload);
      const { token, user } = extractAuthPayload(response);
      if (!token || !user) {
        throw new Error('Phản hồi từ máy chủ không hợp lệ.');
      }
      setAuthToken(token);
      setAuthUser(user);
      showToast('Đăng nhập thành công. Đang chuyển hướng...', 'success');
      window.location.href = resolveAssetPath(user?.role === 'admin' || user?.role === 'ADMIN' ? 'admin/dashboard.html' : 'index.html');
    } catch (error) {
      console.error('Đăng nhập thất bại:', error);
      showToast(error.message || 'Đăng nhập thất bại. Kiểm tra email/mật khẩu và đảm bảo backend đang chạy.', 'danger');
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      password: formData.get('password'),
      role: formData.get('role') || 'customer'
    };

    try {
      const response = await apiCall('/auth/register', 'POST', payload);
      const { token, user } = extractAuthPayload(response);
      if (token && user) {
        setAuthToken(token);
        setAuthUser(user);
      }
      showToast('Tạo tài khoản thành công. Vui lòng đăng nhập.', 'success');
      window.location.href = resolveAssetPath('login.html');
    } catch (error) {
      console.error('Đăng ký thất bại:', error);
      showToast(error.message || 'Đăng ký thất bại. Email có thể đã tồn tại hoặc backend chưa sẵn sàng.', 'danger');
    }
  };

  const bindAuthForms = () => {
    document.querySelectorAll('[data-login-form]').forEach((form) => {
      form.addEventListener('submit', submitLogin);
    });

    document.querySelectorAll('[data-register-form]').forEach((form) => {
      form.addEventListener('submit', submitRegister);
    });

    document.querySelectorAll('[data-fill-demo]').forEach((button) => {
      button.addEventListener('click', () => {
        const target = button.getAttribute('data-fill-demo');
        const form = document.querySelector(target);
        if (!form) return;
        form.querySelector('[name="email"]').value = button.getAttribute('data-email') || 'admin@novahotel.vn';
        form.querySelector('[name="password"]').value = button.getAttribute('data-password') || '123456';
        const roleField = form.querySelector('[name="role"]');
        if (roleField && button.getAttribute('data-role')) {
          roleField.value = button.getAttribute('data-role');
        }
      });
    });
  };

  return { bindAuthForms };
})();

document.addEventListener('DOMContentLoaded', () => {
  NovaHotelAuth.bindAuthForms();
});
