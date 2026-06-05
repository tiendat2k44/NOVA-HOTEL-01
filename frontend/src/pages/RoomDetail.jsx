import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiCall, STORAGE_KEYS, unwrap, unwrapList } from '../api/client';
import Reveal from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';
import {
  getRoomTypeLabel,
  getStatusBadgeClass,
  getStatusLabel,
  toDisplayRoom
} from '../utils/rooms';

function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const diff = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
}

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [room, setRoom] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [form, setForm] = useState({
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    guestName: '',
    email: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        let current = null;
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.selectedRoom) || 'null');
          if (saved?.id === id) current = saved;
        } catch {
          /* ignore */
        }
        if (!current) {
          const res = await apiCall(`/rooms/${id}`, 'GET');
          current = toDisplayRoom(unwrap(res));
        }
        setRoom(current);
        localStorage.setItem(STORAGE_KEYS.selectedRoom, JSON.stringify(current));

        const allRes = await apiCall('/rooms?size=100', 'GET');
        const all = unwrapList(allRes).map(toDisplayRoom);
        setRelated(all.filter((r) => r.id !== current.id).slice(0, 3));

        try {
          const revRes = await apiCall(`/reviews/room/${id}?page=0&size=20`, 'GET');
          setReviews(unwrapList(revRes));
        } catch {
          setReviews([]);
        }
      } catch {
        showToast('Không tải được thông tin phòng.', 'danger');
      }
    };
    load();
  }, [id, showToast]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        guestName: user.fullName || user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  // Load user's bookings to determine if they can review (must have completed booking for this room)
  useEffect(() => {
    if (!isLoggedIn) {
      setMyBookings([]);
      return;
    }
    apiCall('/bookings/my-bookings?size=100', 'GET')
      .then((res) => setMyBookings(unwrapList(res) || []))
      .catch(() => setMyBookings([]));
  }, [isLoggedIn]);

  const nights = useMemo(() => calculateNights(form.checkIn, form.checkOut), [form.checkIn, form.checkOut]);
  const total = room ? room.price * nights : 0;

  const canReview = useMemo(() => {
    if (!isLoggedIn || !id) return false;
    return myBookings.some((b) => {
      const bRoomId = b.roomId || b.roomNumber || '';
      const roomIdMatch = bRoomId === id ||
        bRoomId === room?.id ||
        bRoomId === room?.code ||
        (room?.name && b.roomName === room.name);
      const isCompleted = String(b.status || '').toLowerCase() === 'completed';
      return roomIdMatch && isCompleted;
    });
  }, [myBookings, id, room, isLoggedIn]);

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      showToast('Bạn cần đăng nhập để đặt phòng.', 'danger');
      navigate('/login');
      return;
    }

    // Client-side: user chỉ được 1 booking active (pending/paid/confirmed) tại 1 thời điểm
    const hasActiveBooking = myBookings.some((b) => {
      const st = String(b.status || '').toLowerCase();
      return !['cancelled', 'completed'].includes(st);
    });
    if (hasActiveBooking) {
      showToast('Bạn chỉ có thể đặt phòng tại một thời điểm. Vui lòng hoàn tất hoặc hủy đơn đặt phòng hiện tại trước khi đặt phòng mới.', 'warning');
      return;
    }

    try {
      await apiCall('/bookings', 'POST', {
        roomId: room.id,
        checkInDate: form.checkIn,
        checkOutDate: form.checkOut,
        numberOfGuests: Number(form.adults) + Number(form.children),
        notes: form.notes,
        contactName: form.guestName,
        contactEmail: form.email,
        contactPhone: form.phone
      });
      showToast('Đặt phòng thành công! Email xác nhận đã gửi. Vui lòng kiểm tra email và thanh toán QR VietQR tại Lịch sử đặt phòng.', 'success');
      navigate('/my-bookings');
    } catch (err) {
      showToast(err.message || 'Không thể đặt phòng.', 'danger');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      showToast('Đăng nhập để gửi đánh giá.', 'warning');
      return;
    }
    if (!canReview) {
      showToast('Bạn chỉ có thể gửi đánh giá sau khi đã hoàn thành đặt phòng cho phòng này.', 'warning');
      return;
    }
    const fd = new FormData(e.target);
    try {
      await apiCall('/reviews', 'POST', {
        roomId: id,
        rating: Number(fd.get('rating')),
        comment: fd.get('comment')
      });
      showToast('Đã gửi đánh giá.', 'success');
      const revRes = await apiCall(`/reviews/room/${id}?page=0&size=20`, 'GET');
      setReviews(unwrapList(revRes));
      e.target.reset();
    } catch (err) {
      showToast(err.message || 'Không gửi được đánh giá.', 'danger');
    }
  };

  if (!room) {
    return (
      <main className="section-pad">
        <div className="container text-center">Đang tải...</div>
      </main>
    );
  }

  return (
    <main>
      <section className="section-pad">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-8">
              <Reveal>
                <div
                  className="room-detail-image mb-4"
                  style={{
                    backgroundImage: `linear-gradient(145deg, rgba(26,26,26,0.25), rgba(26,26,26,0.38)), url('${room.image}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: 320,
                    borderRadius: 16
                  }}
                />
                <h1 className="display-luxury mb-3">{room.name}</h1>
                <span className={`status-badge ${getStatusBadgeClass(room.status)}`}>
                  {getStatusLabel(room.status)}
                </span>
                <p className="lead mt-3">{room.description}</p>
                <div className="content-card mt-4">
                  <h3 className="h5 mb-3">Tiện nghi</h3>
                  <div className="amenity-list">
                    {room.amenities.map((item) => (
                      <div className="item" key={item}>
                        <i className="bi bi-check2-circle" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
            <div className="col-lg-4">
              <Reveal delay={90}>
                <div className="booking-summary mb-4">
                  <div className="price-highlight">{formatCurrency(room.price)}</div>
                  <div className="text-muted-soft">/ đêm • {getRoomTypeLabel(room.type)}</div>
                </div>
                <form className="form-luxury" onSubmit={submitBooking}>
                  <div className="mb-3">
                    <label className="form-label">Check-in</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={form.checkIn}
                      onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Check-out</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={form.checkOut}
                      onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3 text-muted-soft">
                    Tổng ước tính: <strong>{formatCurrency(total)}</strong> ({nights} đêm)
                  </div>
                  <button className="btn-luxury btn-luxury-primary w-100" type="submit">
                    Đặt phòng
                  </button>
                </form>
              </Reveal>
            </div>
          </div>

          <div className="row g-4 mt-5">
            {related.map((item) => (
              <div className="col-md-4" key={item.id}>
                <Link to={`/rooms/${item.id}`} className="text-decoration-none text-dark">
                  <article className="room-card h-100">
                    <div className="room-media">
                      <img src={item.image} alt={item.name} loading="lazy" />
                    </div>
                    <div className="p-4">
                      <h4 className="h5">{item.name}</h4>
                      <div className="room-price">{formatCurrency(item.price)}</div>
                    </div>
                  </article>
                </Link>
              </div>
            ))}
          </div>

          <section className="mt-5">
            <h3 className="h4 mb-3">Đánh giá ({reviews.length})</h3>
            {reviews.map((r) => (
              <div className="content-card mb-3" key={r.id || r._id}>
                <strong>★ {r.rating}</strong> — {r.comment || r.content}
              </div>
            ))}
            {canReview ? (
              <form className="form-luxury mt-3" onSubmit={submitReview}>
                <div className="mb-2">
                  <select name="rating" className="form-select" defaultValue={5}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} sao
                      </option>
                    ))}
                  </select>
                </div>
                <textarea name="comment" className="form-control mb-2" rows={3} required />
                <button type="submit" className="btn-luxury btn-luxury-outline">
                  Gửi đánh giá
                </button>
              </form>
            ) : isLoggedIn ? (
              <div className="alert alert-light small mt-3">
                Bạn chỉ có thể gửi đánh giá sau khi đã hoàn thành (completed) ít nhất một đặt phòng cho phòng này.
                <div className="mt-1">
                  <Link to="/my-bookings" className="text-decoration-underline">Xem lịch sử đặt phòng của bạn</Link>
                </div>
              </div>
            ) : (
              <p className="text-muted-soft small mt-2">Vui lòng đăng nhập và hoàn thành đặt phòng để có thể gửi đánh giá.</p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}