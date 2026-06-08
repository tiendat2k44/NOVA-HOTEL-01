import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  apiCall,
  clearAuthData,
  extractAuthPayload,
  getAuthUser,
  setAuthToken,
  setAuthUser
} from '../api/client';
import { isAdmin, isReceptionist, isStaff } from '../utils/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getAuthUser());

  const login = useCallback(async ({ email, password }) => {
    // Clear stale token before public auth call (interceptor also protects these endpoints)
    clearAuthData();
    const response = await apiCall('/auth/login', 'POST', { email, password });
    const { token, user: authUser } = extractAuthPayload(response);
    if (!token || !authUser) throw new Error('Phản hồi từ máy chủ không hợp lệ.');
    setAuthToken(token);
    setAuthUser(authUser);
    setUser(authUser);
    return authUser;
  }, []);

  const register = useCallback(async (payload) => {
    clearAuthData();
    const response = await apiCall('/auth/register', 'POST', payload);
    const { token, user: authUser } = extractAuthPayload(response);
    if (token && authUser) {
      setAuthToken(token);
      setAuthUser(authUser);
      setUser(authUser);
    }
    return authUser;
  }, []);

  // Google login support (completes the Google sign-in feature)
  const googleLogin = useCallback(async (credential) => {
    if (!credential) throw new Error('Thiếu Google credential.');
    // Clear any stale token before calling the public /auth/google endpoint.
    // This is a defensive measure (the axios interceptor also strips the header for auth endpoints).
    clearAuthData();
    const response = await apiCall('/auth/google', 'POST', { credential });
    const { token, user: authUser } = extractAuthPayload(response);
    if (!token || !authUser) throw new Error('Phản hồi từ máy chủ không hợp lệ sau khi đăng nhập Google.');
    setAuthToken(token);
    setAuthUser(authUser);
    setUser(authUser);
    return authUser;
  }, []);

  const logout = useCallback(() => {
    clearAuthData();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      isAdmin: isAdmin(user),
      isReceptionist: isReceptionist(user),
      isStaff: isStaff(user),
      login,
      register,
      googleLogin,
      logout,
      setUser: (nextUser) => {
        setAuthUser(nextUser);
        setUser(nextUser);
      }
    }),
    [user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};