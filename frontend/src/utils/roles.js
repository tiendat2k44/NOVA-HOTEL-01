export const normalizeRole = (role) => String(role || '').toLowerCase();

export const isAdmin = (user) => {
  const role = normalizeRole(user?.role);
  return role === 'admin' || role.includes('admin');
};

export const isReceptionist = (user) => {
  const role = normalizeRole(user?.role);
  return role === 'receptionist' || role.includes('receptionist');
};

export const isStaff = (user) => {
  return isAdmin(user) || isReceptionist(user);
};

// Vietnamese labels for roles (used in UI everywhere)
export const roleLabels = {
  admin: 'Quản trị viên',
  customer: 'Khách hàng',
  user: 'Người dùng',
  receptionist: 'Lễ tân',
};

export const getRoleLabel = (role) => {
  const key = normalizeRole(role);
  return roleLabels[key] || key || '—';
};

export const roleOptions = [
  { value: 'customer', label: 'Khách hàng' },
  { value: 'receptionist', label: 'Lễ tân' },
  { value: 'admin', label: 'Quản trị viên' },
];