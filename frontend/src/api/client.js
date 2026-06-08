import axios from 'axios';

/**
 * Base URL API backend.
 * - Dev mặc định: /api (Vite proxy -> http://localhost:8080, không lỗi CORS)
 * - Override bằng VITE_API_BASE trong frontend/.env nếu cần gọi thẳng 8080
 */
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const getApiBaseUrl = () => API_BASE.replace(/\/$/, '');

const STORAGE_KEYS = {
  token: 'nova_hotel_token',
  user: 'nova_hotel_user',
  selectedRoom: 'nova_hotel_selected_room'
};

export { STORAGE_KEYS };

export const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.token) || '';

export const setAuthToken = (token) => {
  localStorage.setItem(STORAGE_KEYS.token, token || '');
};

export const setAuthUser = (user) => {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
};

export const getAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null');
  } catch {
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
};

// Offline banner support (kept for compatibility)
let offlineListeners = new Set();

export const onOfflineChange = (listener) => {
  offlineListeners.add(listener);
  return () => offlineListeners.delete(listener);
};

const notifyOffline = (isOffline, message) => {
  offlineListeners.forEach((fn) => fn(isOffline, message));
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add auth token + debug logging (you will now SEE the calls in console)
api.interceptors.request.use(
  (config) => {
    const url = config.url || '';

    // Do NOT attach Authorization token for public auth endpoints.
    // This prevents stale/expired tokens from causing 401 on /auth/login, /auth/register, /auth/google, etc.
    const isPublicAuthEndpoint =
      url.startsWith('/auth/login') ||
      url.startsWith('/auth/register') ||
      url.startsWith('/auth/google') ||
      url.startsWith('/auth/forgot-password') ||
      url.startsWith('/auth/reset-password');

    if (!isPublicAuthEndpoint) {
      const token = getAuthToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      // Ensure we never send a stale token to auth endpoints (defensive)
      if (config.headers && config.headers.Authorization) {
        delete config.headers.Authorization;
      }
    }

    const base = (config.baseURL || '').replace(/\/$/, '');
    const path = config.url || '';
    const fullUrl = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
    console.log(`[Axios API] ${config.method?.toUpperCase()} ${fullUrl}`, config.data || config.params || '');
    return config;
  },
  (error) => {
    console.error('[Axios API] Request error', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[Axios API] Response from ${response.config.url}`, response.data);
    notifyOffline(false);
    return response.data; // return payload directly (unwrap/unwrapList still work)
  },
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;
    const message = payload?.message || payload?.error || error.message || 'Yêu cầu thất bại';

    if (!error.response || status >= 500) {
      notifyOffline(true, status >= 500 ? 'Máy chủ đang gặp sự cố' : 'Không thể kết nối đến backend');
    } else {
      notifyOffline(false);
    }

    console.error('[Axios API] Error', { url: error.config?.url, status, message, payload });

    // Global handling for auth errors: clear bad token so user has to log in again
    if (status === 401) {
      try {
        clearAuthData();
      } catch (e) { /* ignore */ }
    }

    const err = new Error(typeof message === 'string' ? message : 'Yêu cầu thất bại');
    err.status = status;
    err.payload = payload;
    return Promise.reject(err);
  }
);

export const unwrap = (payload) => {
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data;
  }
  return payload;
};

/**
 * Lấy mảng dữ liệu từ response, hỗ trợ cả 2 kiểu backend hay dùng:
 * - data: [...] (list thẳng)
 * - data: { content: [...] } (Spring Page)
 */
export const unwrapList = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

export async function apiCall(url, method = 'GET', data = null) {
  const config = {
    method: method.toLowerCase(),
    url,
  };

  if (data) {
    if (['get', 'delete'].includes(method.toLowerCase())) {
      config.params = data;
    } else {
      config.data = data;
    }
  }

  return api(config);
}

export async function getBookingPaymentQr(bookingId, bankKey = '') {
  if (!bookingId) throw new Error('Thiếu mã booking để tạo QR.');

  const query = bankKey ? `?bank=${encodeURIComponent(bankKey)}` : '';
  try {
    return await apiCall(`/bookings/${bookingId}/payment-qr${query}`, 'GET');
  } catch (err) {
    if (err?.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi thử mở QR.');
    }
    if (err?.status === 404) {
      throw new Error('Không tìm thấy booking hoặc endpoint QR. Hãy restart backend và thử lại.');
    }
    if (err?.status >= 500) {
      throw new Error('Backend lỗi khi tạo QR. Hãy restart backend (port 8080) rồi thử lại.');
    }
    throw err;
  }
}

export const extractAuthPayload = (response) => {
  const body = unwrap(response) || response;
  const token = body?.token || body?.accessToken || body?.jwt;

  // Handle flat AuthResponse from /auth/login and /auth/register (and /auth/google)
  // Backend returns { userId, email, fullName, role, token } inside data
  let user = body?.user;
  if (!user && (body?.email || body?.userId)) {
    const rawRole = (body.role || '').toLowerCase().replace(/^role_/, '');
    user = {
      id: body.userId || body.id,
      userId: body.userId || body.id,
      email: body.email,
      fullName: body.fullName,
      name: body.fullName,
      role: rawRole,  // clean: 'user' or 'admin' etc. for frontend isAdmin and display
      phone: body.phone || '',
    };
  }

  return { token, user };
};

/**
 * Upload ảnh phòng (dành cho admin). Sử dụng FormData.
 *
 * QUAN TRỌNG: Không dùng instance `api` (có default Content-Type: application/json).
 * Phải dùng axios trực tiếp để browser tự đặt Content-Type: multipart/form-data; boundary=...
 * Nếu dùng `api`, header application/json sẽ không bị ghi đè đúng cách và controller
 * backend (consumes = MULTIPART_FORM_DATA) sẽ không khớp → 500 NoResourceFoundException.
 *
 * Trả về: body của ApiResponse (đã unwrap bởi interceptor response của `api` sẽ không chạy,
 * nên trả thẳng response.data từ axios raw).
 */
export async function uploadRoomImage(file) {
  if (!file) throw new Error('Không có file để upload');

  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const uploadBase = import.meta.env.VITE_UPLOAD_BASE || getApiBaseUrl();

  // Dùng axios global (không phải instance `api`) để tránh default Content-Type: application/json.
  // Browser sẽ tự đặt Content-Type: multipart/form-data; boundary=xxx cho FormData.
  const response = await axios.post(`${uploadBase}/uploads/rooms`, formData, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Không đặt Content-Type ở đây — để browser tự set với boundary đúng
    },
  });

  const payload = response.data;
  const rawUrl = payload?.data?.url || payload?.url;

  if (typeof rawUrl === 'string' && rawUrl.length > 0) {
    const baseUrl = new URL(uploadBase, window.location.origin);
    const normalizedUrl = new URL(rawUrl, baseUrl).toString();

    if (payload?.data && typeof payload.data === 'object') {
      payload.data.url = normalizedUrl;
    } else if (payload && typeof payload === 'object') {
      payload.url = normalizedUrl;
    }
  }

  // axios global không qua interceptor của `api`, nên trả response.data trực tiếp
  return payload;
}