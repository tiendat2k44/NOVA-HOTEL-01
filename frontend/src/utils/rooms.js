const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80';

export const getRoomTypeLabel = (roomType) => {
  const labels = {
    Standard: 'Tiêu chuẩn',
    Deluxe: 'Cao cấp',
    Suite: 'Suite',
    Family: 'Gia đình',
    Premium: 'Premium',
    Executive: 'Executive'
  };
  return labels[roomType] || roomType || 'Phòng';
};

export const toDisplayRoom = (room) => {
  const priceValue = room?.price?.basePrice ?? room?.price ?? room?.basePrice ?? 0;
  const amenities = Array.isArray(room?.amenities)
    ? room.amenities
    : Array.isArray(room?.facilities)
      ? room.facilities
      : [];
  const images = Array.isArray(room?.images) ? room.images : [];

  return {
    id: String(room?.id || room?._id || room?.roomId || room?.roomNumber || ''),
    code: room?.code || room?.roomNumber || room?.roomId || '---',
    name: room?.name || room?.roomId || room?.roomNumber || '---',
    type: room?.type || room?.roomType || '---',
    price: Number(priceValue || 0),
    area: Number(room?.area || 28),
    bed: room?.bed || room?.bedType || 'King',
    capacity: Number(room?.capacity || room?.maxGuests || 2),
    status: room?.status || 'available',
    floor: room?.floor ?? '',
    description: room?.description || '',
    amenities,
    images,
    image: room?.image || images[0] || DEFAULT_IMAGE,
    rating: Number(room?.rating || 4.8),
    reviews: Number(room?.reviews || 0),
    highlight: room?.highlight || 'Không gian nghỉ dưỡng tinh tế, dịch vụ cao cấp.'
  };
};

export const getStatusBadgeClass = (status) => {
  const map = {
    available: 'status-active',
    reserved: 'status-pending',
    maintenance: 'status-maintenance'
  };
  return map[status] || 'status-pending';
};

export const getStatusLabel = (status) => {
  const map = {
    available: 'Còn phòng',
    reserved: 'Đã giữ chỗ',
    maintenance: 'Bảo trì'
  };
  return map[status] || 'Không rõ';
};