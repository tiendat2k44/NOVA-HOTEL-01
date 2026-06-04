// Cấu hình API gốc của Spring Boot.
// Mặc định dùng localhost. Nếu bạn mở frontend bằng 127.0.0.1 thì vẫn hoạt động nhờ CORS đã cấu hình cả 2.
// Nếu backend chạy khác port/host → chỉ cần sửa dòng dưới.
const NOVA_HOTEL_API_BASE = 'http://localhost:8080/api';

// Tên key dùng chung để lưu trạng thái đăng nhập trên trình duyệt.
const NOVA_STORAGE_KEYS = {
  token: 'nova_hotel_token',
  user: 'nova_hotel_user'
};

const getAssetPrefix = () => {
  const path = window.location.pathname;
  
  // TRƯỚC TIÊN: Kiểm tra nếu đang trong thư mục con (rooms/, user/, admin/)
  if (path.match(/\/(rooms|user|admin)\//)) {
    return '../';
  }
  
  // SAU ĐÓ: Kiểm tra nếu pathname bắt đầu bằng /frontend/
  // (server serve từ root, không serve từ folder frontend/)
  if (path.startsWith('/frontend/')) {
    return '/frontend/';
  }
  
  // MẶC ĐỊNH: Server serve từ thư mục frontend/
  // → pathname là /index.html, /login.html, etc. → không cần prefix
  return '';
};

const resolveAssetPath = (path) => `${getAssetPrefix()}${path}`;

const getAuthToken = () => localStorage.getItem(NOVA_STORAGE_KEYS.token) || '';

const setAuthToken = (token) => {
  localStorage.setItem(NOVA_STORAGE_KEYS.token, token || '');
};

const setAuthUser = (user) => localStorage.setItem(NOVA_STORAGE_KEYS.user, JSON.stringify(user));

const getAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem(NOVA_STORAGE_KEYS.user) || 'null');
  } catch {
    return null;
  }
};

const clearAuthData = () => {
  localStorage.removeItem(NOVA_STORAGE_KEYS.token);
  localStorage.removeItem(NOVA_STORAGE_KEYS.user);
};

// Các hàm tiện ích localStorage
const getStoredArray = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const setStoredArray = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// ================== BACKEND OFFLINE DETECTION ==================
let isBackendOffline = false;
let offlineBannerElement = null;

const createOfflineBanner = () => {
  if (offlineBannerElement) return offlineBannerElement;

  const banner = document.createElement('div');
  banner.id = 'nova-offline-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: linear-gradient(90deg, #b91c1c, #dc2626);
    color: white;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    display: none;
    align-items: center;
    justify-content: center;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;
  banner.innerHTML = `
    <span>⚠️ <strong>Không thể kết nối đến máy chủ</strong> — Dữ liệu có thể không chính xác. Backend hoặc MongoDB có thể đang tắt.</span>
    <button id="nova-retry-btn" style="
      background: white;
      color: #b91c1c;
      border: none;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    ">Thử lại</button>
    <button id="nova-dismiss-banner" style="
      background: transparent;
      color: white;
      border: 1px solid rgba(255,255,255,0.6);
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
    ">Đóng</button>
  `;
  document.body.appendChild(banner);

  // Retry button
  banner.querySelector('#nova-retry-btn').addEventListener('click', async () => {
    const btn = banner.querySelector('#nova-retry-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Đang thử...';
    btn.disabled = true;

    try {
      await apiCall('/rooms?size=1', 'GET'); // Lightweight ping
      hideOfflineBanner();
    } catch {
      btn.textContent = 'Vẫn lỗi';
      setTimeout(() => {
        if (btn) btn.textContent = originalText;
        btn.disabled = false;
      }, 1500);
    }
  });

  // Dismiss button
  banner.querySelector('#nova-dismiss-banner').addEventListener('click', () => {
    hideOfflineBanner(true); // temporary dismiss
  });

  offlineBannerElement = banner;
  return banner;
};

const showOfflineBanner = (message) => {
  const banner = createOfflineBanner();
  if (message) {
    const span = banner.querySelector('span');
    if (span) span.innerHTML = `⚠️ <strong>${message}</strong>`;
  }
  banner.style.display = 'flex';
  isBackendOffline = true;
  document.body.style.paddingTop = '48px'; // avoid content overlap
};

const hideOfflineBanner = (temporary = false) => {
  if (offlineBannerElement) {
    offlineBannerElement.style.display = 'none';
  }
  if (!temporary) {
    isBackendOffline = false;
  }
  // Luôn reset padding khi banner bị ẩn (tránh nội dung bị đẩy xuống vĩnh viễn)
  document.body.style.paddingTop = '';
};

// ================== ENHANCED API CALL ==================
const apiCall = async (url, method = 'GET', data = null) => {
  const headers = { 'Content-Type': 'application/json' };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${NOVA_HOTEL_API_BASE}${url}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      const message = payload?.message || payload?.error || payload || 'Không thể kết nối đến máy chủ';
      // If we get 5xx or certain errors, consider backend unhealthy
      if (response.status >= 500) {
        showOfflineBanner('Máy chủ đang gặp sự cố');
      }
      throw new Error(message);
    }

    // Success → hide banner if it was showing
    if (isBackendOffline) {
      hideOfflineBanner();
    }

    return payload;

  } catch (error) {
    // Network error (backend completely down, CORS, etc.)
    if (error instanceof TypeError || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      showOfflineBanner('Không thể kết nối đến backend');
    }
    throw error;
  }
};

const loadPartial = async (selector, filePath) => {
  const target = document.querySelector(selector);
  if (!target) {
    return;
  }

  try {
    const response = await fetch(filePath);
    target.innerHTML = await response.text();
  } catch {
    // Ignore partial load errors (e.g., file:// restrictions) to keep auth checks running.
  }
};

const ensureToastContainer = () => {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1080';
    document.body.appendChild(container);
  }
  return container;
};

const showToast = (message, type = 'success') => {
  const container = ensureToastContainer();
  const toastId = `toast-${Date.now()}`;
  const bgClass = type === 'danger' ? 'text-bg-danger' : type === 'warning' ? 'text-bg-warning' : 'text-bg-dark';

  container.insertAdjacentHTML(
    'beforeend',
    `
      <div id="${toastId}" class="toast toast-luxury ${bgClass}" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex align-items-center">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Đóng"></button>
        </div>
      </div>
    `
  );

  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();
  toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
}).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('vi-VN');
};

const formatDateTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('vi-VN');
};

const getQueryParams = () => Object.fromEntries(new URLSearchParams(window.location.search).entries());

const setActiveNavigation = () => {
  const currentPath = window.location.pathname;
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const route = link.getAttribute('data-route') || link.getAttribute('href') || '';
    const normalizedRoute = route.replace(/^\.\//, '').replace(/^\//, '');
    const isHome = normalizedRoute === 'index.html';
    const isActive = isHome
      ? (currentPath.endsWith('/') || currentPath.endsWith('/index.html'))
      : currentPath.endsWith(normalizedRoute);
    link.classList.toggle('active', isActive);
  });
};

const normalizeRole = (role) => String(role || '').toLowerCase();

const updateAuthLinks = () => {
  const user = getAuthUser();
  const isLoggedIn = Boolean(user);
  const role = normalizeRole(user?.role);
  const isAdmin = role === 'admin' || role === 'role_admin';
  document.querySelectorAll('[data-auth-login]').forEach((node) => {
    node.classList.toggle('d-none', isLoggedIn);
  });
  document.querySelectorAll('[data-auth-user]').forEach((node) => {
    if (!isLoggedIn) {
      node.classList.add('d-none');
      node.classList.remove('d-flex');
      return;
    }
    node.classList.remove('d-none');
    node.classList.add('d-flex'); // đảm bảo hiển thị dạng flex rõ ràng
    const nameNode = node.querySelector('[data-user-name]');
    if (nameNode) {
      nameNode.textContent = user.fullName || user.name || 'Người dùng';
    }
    const roleNode = node.querySelector('[data-user-role]');
    if (roleNode) {
      roleNode.textContent = isAdmin ? 'Admin' : 'Customer';
      // Thêm màu sắc cho badge role
      if (isAdmin) {
        roleNode.style.background = '#d4af37';
        roleNode.style.color = '#1a1a1a';
      } else {
        roleNode.style.background = '#e5e5e5';
        roleNode.style.color = '#333';
      }
    }
  });
  document.querySelectorAll('[data-auth-required]').forEach((node) => {
    node.classList.toggle('d-none', !isLoggedIn);
  });
  document.querySelectorAll('[data-role="admin"]').forEach((node) => {
    node.classList.toggle('d-none', !isAdmin);
  });
};

const enforceAccess = () => {
  const user = getAuthUser();
  const isLoggedIn = Boolean(user);
  const role = normalizeRole(user?.role);
  const isAdmin = role === 'admin' || role === 'role_admin';
  const path = window.location.pathname;
  const currentFile = path.split('/').pop() || '';

  if ((currentFile === 'login.html' || currentFile === 'register.html') && isLoggedIn) {
    window.location.href = resolveAssetPath(isAdmin ? 'admin/dashboard.html' : 'index.html');
    return;
  }

  if (path.includes('/admin/')) {
    if (!isLoggedIn) {
      showToast('Vui lòng đăng nhập để tiếp tục.', 'warning');
      window.location.href = resolveAssetPath('login.html');
      return;
    }
    if (!isAdmin) {
      showToast('Bạn không có quyền truy cập khu vực quản trị.', 'danger');
      window.location.href = resolveAssetPath('index.html');
      return;
    }
  }

  if (path.includes('/user/') && !isLoggedIn) {
    showToast('Vui lòng đăng nhập để tiếp tục.', 'warning');
    window.location.href = resolveAssetPath('login.html');
  }
};

const resolveLinkedPaths = () => {
  const root = getAssetPrefix();
  document.querySelectorAll('[data-route]').forEach((link) => {
    const route = link.getAttribute('data-route');
    if (route) {
      link.setAttribute('href', `${root}${route}`);
    }
  });
};
 
const initLayout = async () => {
  enforceAccess();
  const root = getAssetPrefix();
  await Promise.all([
    loadPartial('[data-component="header"]', `${root}components/header.html`),
    loadPartial('[data-component="footer"]', `${root}components/footer.html`)
  ]);

  resolveLinkedPaths();
  setActiveNavigation();
  updateAuthLinks();

  document.querySelectorAll('[data-current-year]').forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', () => {
      clearAuthData();
      updateAuthLinks();
      showToast('Đã đăng xuất khỏi hệ thống', 'warning');
      window.location.href = resolveAssetPath('index.html');
    });
  });
};

const bindCommonUI = () => {
  const revealTargets = document.querySelectorAll('[data-reveal]');
  revealTargets.forEach((element, index) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(16px)';
    element.style.transition = 'all 0.6s ease';

    window.setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, index * 90);
  });
};

window.NovaHotel = {
  apiCall,
  showToast,
  formatCurrency,
  formatDate,
  formatDateTime,
  getAuthUser,
  setAuthUser,
  setAuthToken,
  clearAuthData,
  getAuthToken,
  getQueryParams,
  getStoredArray,
  setStoredArray,
  resolveAssetPath,
  NOVA_STORAGE_KEYS,
  // Offline banner controls
  showOfflineBanner,
  hideOfflineBanner,
  checkBackendConnection: async () => {
    try {
      await apiCall('/rooms?size=1', 'GET');
      hideOfflineBanner();
      return true;
    } catch {
      return false;
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await initLayout();
  bindCommonUI();

  // Tự động kiểm tra kết nối backend sau khi load (chỉ 1 lần)
  setTimeout(async () => {
    try {
      await apiCall('/rooms?size=1', 'GET');
    } catch {
      if (!isBackendOffline) {
        showOfflineBanner('Không thể kết nối đến máy chủ (backend hoặc MongoDB có thể đang tắt)');
      }
    }
  }, 1400);
});