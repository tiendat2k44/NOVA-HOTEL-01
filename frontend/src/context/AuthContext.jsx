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
    const response = await apiCall('/auth/login', 'POST', { email, password });
    const { token, user: authUser } = extractAuthPayload(response);
    if (!token || !authUser) throw new Error('Phản hồi từ máy chủ không hợp lệ.');
    setAuthToken(token);
    setAuthUser(authUser);
    setUser(authUser);
    return authUser;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await apiCall('/auth/register', 'POST', payload);
    const { token, user: authUser } = extractAuthPayload(response);
    if (token && authUser) {
      setAuthToken(token);
      setAuthUser(authUser);
      setUser(authUser);
    }
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