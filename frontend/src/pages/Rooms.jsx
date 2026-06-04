import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiCall, STORAGE_KEYS, unwrapList } from '../api/client';
import Reveal from '../components/Reveal';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';
import {
  getRoomTypeLabel,
  getStatusBadgeClass,
  getStatusLabel,
  toDisplayRoom
} from '../utils/rooms';

export default function Rooms() {
  const { showToast } = useToast();
  const [baseRooms, setBaseRooms] = useState([]);
  const [displayed, setDisplayed] = useState([]);
  const [countLabel, setCountLabel] = useState('Đang tải...');
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    type: 'all',
    price: '',
    status: 'all',
    checkIn: '',
    checkOut: ''
  });

  const loadBaseRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/rooms?size=100', 'GET');
      const list = unwrapList(response).map(toDisplayRoom);
      setBaseRooms(list);
    } catch (err) {
      showToast('Không thể tải danh sách phòng từ máy chủ.', 'danger');
      setBaseRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Load rooms only once on mount
  useEffect(() => {
    loadBaseRooms();
  }, [loadBaseRooms]);

  // Recompute displayed + count when base or filters change (client-side filter + optional available fetch)
  useEffect(() => {
    const computeDisplayed = async () => {
      let available = baseRooms;
      if (filters.checkIn && filters.checkOut) {
        try {
          const res = await apiCall(
            `/rooms/available?checkInDate=${filters.checkIn}&checkOutDate=${filters.checkOut}`,
            'GET'
          );
          available = unwrapList(res).map(toDisplayRoom);
        } catch {
          showToast('Không thể kiểm tra phòng trống.', 'danger');
          available = [];
        }
      }

      const keyword = filters.keyword.toLowerCase();
      const filtered = available.filter((room) => {
        const matchesKeyword =
          !keyword ||
          [room.name, room.code, room.type, room.description].some((v) =>
            (v || '').toLowerCase().includes(keyword)
          );
        const matchesType = filters.type === 'all' || room.type === filters.type;
        const matchesPrice = !filters.price || room.price <= Number(filters.price);
        const matchesStatus = filters.status === 'all' || room.status === filters.status;
        return matchesKeyword && matchesType && matchesPrice && matchesStatus;
      });

      setDisplayed(filtered);

      const label = isLoading
        ? 'Đang tải...'
        : (filters.checkIn && filters.checkOut)
          ? `${filtered.length} phòng phù hợp`
          : `${filtered.length} phòng đang hiển thị`;
      setCountLabel(label);
    };

    computeDisplayed();
  }, [baseRooms, filters, showToast, isLoading]);

  const openRoom = (room) => {
    localStorage.setItem(STORAGE_KEYS.selectedRoom, JSON.stringify(room));
  };

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <span className="kicker">Phòng nghỉ</span>
            <h1 className="section-title mt-3">Danh sách phòng Nova Hotel</h1>
            <p className="section-subtitle ms-0">{countLabel}</p>
          </Reveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <form
            className="filter-panel mb-4"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="row g-3">
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Tìm theo tên, mã..."
                  value={filters.keyword}
                  onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                />
              </div>
              <div className="col-md-2">
                <select
                  className="form-select"
                  value={filters.type}
                  onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="all">Tất cả loại</option>
                  <option value="Standard">Standard</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                  <option value="Family">Family</option>
                  <option value="Premium">Premium</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  type="number"
                  placeholder="Giá tối đa"
                  value={filters.price}
                  onChange={(e) => setFilters((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  type="date"
                  value={filters.checkIn}
                  onChange={(e) => setFilters((f) => ({ ...f, checkIn: e.target.value }))}
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  type="date"
                  value={filters.checkOut}
                  onChange={(e) => setFilters((f) => ({ ...f, checkOut: e.target.value }))}
                />
              </div>
            </div>
          </form>

          <div className="row g-4">
            {displayed.map((room, i) => (
              <div className="col-lg-4 col-md-6" key={room.id}>
                <Reveal delay={i * 60}>
                  <article className="room-card h-100">
                    <div className="room-media">
                      <img src={room.image} alt={room.name} loading="lazy" />
                    </div>
                    <div className="p-4">
                      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                        <div>
                          <div className="room-chip mb-2">{getRoomTypeLabel(room.type)}</div>
                          <h3 className="h4 mb-2">{room.name}</h3>
                          <div className="text-muted-soft small">
                            {room.code} • {room.floor} • {room.area}m²
                          </div>
                        </div>
                        <span className={`status-badge ${getStatusBadgeClass(room.status)}`}>
                          {getStatusLabel(room.status)}
                        </span>
                      </div>
                      <p className="text-muted-soft mb-3">{room.description}</p>
                      <div className="room-price mb-3">{formatCurrency(room.price)}</div>
                      <Link
                        className="room-btn d-block text-center text-decoration-none"
                        to={`/rooms/${room.id}`}
                        onClick={() => openRoom(room)}
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </article>
                </Reveal>
              </div>
            ))}
          </div>
          {displayed.length === 0 && !isLoading && (
            baseRooms.length === 0 ? (
              <div className="text-center text-muted-soft py-5">
                Chưa có phòng trong hệ thống. 
              </div>
            ) : (
              <div className="text-center text-muted-soft py-5">Không có phòng phù hợp với bộ lọc hiện tại.</div>
            )
          )}
        </div>
      </section>
    </main>
  );
}