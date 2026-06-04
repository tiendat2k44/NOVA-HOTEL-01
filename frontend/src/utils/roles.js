export const normalizeRole = (role) => String(role || '').toLowerCase();

export const isAdmin = (user) => {
  const role = normalizeRole(user?.role);
  return role === 'admin' || role.includes('admin');
};