import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useEffect } from 'react';

export function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoggedIn) showToast('Vui lòng đăng nhập để tiếp tục.', 'warning');
  }, [isLoggedIn, showToast]);

  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { isLoggedIn, isAdmin } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoggedIn) showToast('Vui lòng đăng nhập để tiếp tục.', 'warning');
    else if (!isAdmin) showToast('Bạn không có quyền truy cập khu vực quản trị.', 'danger');
  }, [isLoggedIn, isAdmin, showToast]);

  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export function GuestOnly({ children }) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (isLoggedIn) return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  return children;
}