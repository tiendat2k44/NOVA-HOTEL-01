export const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

export const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('vi-VN');
};

export const formatDateTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('vi-VN');
};