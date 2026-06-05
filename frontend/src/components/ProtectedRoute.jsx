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

/**
 * RequireAdmin / RequireStaff
 * Cho phép cả ADMIN và RECEPTIONIST (lễ tân) truy cập khu vực quản trị.
 * Lễ tân chỉ có quyền hạn chế (chủ yếu xác nhận booking).
 */
export function RequireAdmin({ children }) {
  const { isLoggedIn, isAdmin, isReceptionist, isStaff } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();

  const canAccess = isStaff || isAdmin || isReceptionist;

  useEffect(() => {
    if (!isLoggedIn) showToast('Vui lòng đăng nhập để tiếp tục.', 'warning');
    else if (!canAccess) showToast('Bạn không có quyền truy cập khu vực quản trị.', 'danger');
  }, [isLoggedIn, canAccess, showToast]);

  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!canAccess) return <Navigate to="/" replace />;
  return children;
}

export function GuestOnly({ children }) {
  const { isLoggedIn, isAdmin, isReceptionist } = useAuth();
  if (isLoggedIn) return <Navigate to={(isAdmin || isReceptionist) ? '/admin' : '/'} replace />;
  return children;
}