import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// If you build for production without reverse proxy, set VITE_API_BASE=http://your-backend:8080/api
// In dev, Vite proxy in vite.config.js handles /api -> localhost:8080

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
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[Axios API] ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params || '');
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
 * Trả về payload (đã qua interceptor -> body của ApiResponse)
 * Sử dụng cùng với unwrap() ở phía gọi: const body = unwrap(res) || res; const url = body?.url || body?.data?.url;
 */
export async function uploadRoomImage(file) {
  if (!file) throw new Error('Không có file để upload');
  const formData = new FormData();
  formData.append('file', file);
  const token = getAuthToken();
  
  const requestConfig = {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Setting Content-Type to undefined removes the global default 'application/json'
      // This allows axios + browser to automatically set the correct 
      // 'multipart/form-data; boundary=----WebKitFormBoundary...' for Spring's MultipartFile
      'Content-Type': undefined
    }
  };
  
  return api.post('/uploads/rooms', formData, requestConfig);
}