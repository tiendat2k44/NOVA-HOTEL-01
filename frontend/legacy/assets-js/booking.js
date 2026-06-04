// Quản lý đặt phòng, form booking và trang lịch sử đặt phòng của khách hàng.
const NovaHotelBooking = (() => {
  const {
    apiCall,
    showToast,
    formatCurrency,
    formatDate,
    formatDateTime,
    getAuthUser,
    setStoredArray,
    NOVA_STORAGE_KEYS
  } = window.NovaHotel;

  // Lưu cache nhẹ trên trình duyệt (không còn là nguồn chính)
  const readBookings = () => {
    const stored = getStoredArray ? getStoredArray(NOVA_STORAGE_KEYS.bookings || 'nova_hotel_bookings_cache') : [];
    return Array.isArray(stored) ? stored : [];
  };

  const saveBookings = (bookings) => {
    const key = NOVA_STORAGE_KEYS.bookings || 'nova_hotel_bookings_cache';
    setStoredArray(key, bookings);
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      cancelled: 'Đã hủy',
      completed: 'Hoàn tất'
    };
    return labels[status] || status || 'Không rõ';
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      cancelled: 'status-cancelled',
      completed: 'status-completed'
    };
    return classes[status] || 'status-pending';
  };

  const getSelectedRoom = () => {
    try {
      return JSON.parse(localStorage.getItem('nova_hotel_selected_room') || 'null');
    } catch {
      return null;
    }
  };

  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  };

  const buildBookingCode = () => `BK-${String(new Date().getFullYear()).slice(2)}${String(Date.now()).slice(-6)}`;

  const renderBookingSummary = (room) => {
    const target = document.querySelector('[data-booking-summary]');
    if (!target || !room) return;
    target.innerHTML = `
      <div class="booking-summary mb-4">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div class="badge-soft mb-2">Thông tin đặt phòng</div>
            <h3 class="h4 mb-1" data-book-room-name>${room.name}</h3>
            <div class="text-muted-soft">${room.code} • ${room.type} • ${room.floor}</div>
          </div>
          <div class="price-highlight" data-book-room-price>${formatCurrency(room.price)}</div>
        </div>
        <div class="inline-divider"></div>
        <div class="d-grid gap-2 text-muted-soft">
          <div><strong class="text-dark">Diện tích:</strong> ${room.area}m²</div>
          <div><strong class="text-dark">Sức chứa:</strong> ${room.capacity} khách</div>
          <div><strong class="text-dark">Đánh giá:</strong> ★ ${room.rating} (${room.reviews})</div>
        </div>
      </div>
    `;
  };

  const renderBookingsTable = (bookings) => {
    const target = document.querySelector('[data-booking-table]');
    const emptyState = document.querySelector('[data-booking-empty]');
    if (!target) return;

    target.innerHTML = bookings.map((booking) => `
      <tr>
        <td>
          <div class="fw-semibold">${booking.code}</div>
          <small class="text-muted-soft">${formatDateTime(booking.createdAt)}</small>
        </td>
        <td>
          <div class="fw-semibold">${booking.roomName}</div>
          <small class="text-muted-soft">${booking.roomCode || ''}</small>
        </td>
        <td>${formatDate(booking.checkIn)}<br><small class="text-muted-soft">đến ${formatDate(booking.checkOut)}</small></td>
        <td>${booking.adults || 1} người</td>
        <td>${formatCurrency(booking.total)}</td>
        <td><span class="status-badge ${getStatusClass(booking.status)}">${getStatusLabel(booking.status)}</span></td>
        <td>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-sm btn-outline-dark" type="button" data-booking-detail="${booking.id}">Chi tiết</button>
            ${booking.status !== 'cancelled' ? `<button class="btn btn-sm btn-outline-danger" type="button" data-booking-cancel="${booking.id}">Hủy</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    if (emptyState) {
      emptyState.classList.toggle('d-none', bookings.length > 0);
    }

    target.querySelectorAll('[data-booking-detail]').forEach((button) => {
      button.addEventListener('click', () => {
        const booking = bookings.find((item) => item.id === button.getAttribute('data-booking-detail'));
        if (!booking) return;
        showToast(`Đơn ${booking.code}: ${booking.roomName} • ${getStatusLabel(booking.status)}`, 'success');
      });
    });

    target.querySelectorAll('[data-booking-cancel]').forEach((button) => {
      button.addEventListener('click', () => cancelBooking(button.getAttribute('data-booking-cancel')));
    });
  };

  const getFilteredBookings = (bookings) => {
    const status = document.querySelector('[data-booking-status-filter]')?.value || 'all';
    const keyword = (document.querySelector('[data-booking-keyword]')?.value || '').toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus = status === 'all' || booking.status === status;
      const matchesKeyword = !keyword || [booking.code, booking.roomName, booking.guestName, booking.roomCode]
        .some((value) => (value || '').toLowerCase().includes(keyword));
      return matchesStatus && matchesKeyword;
    });
  };

  const refreshBookingTable = () => {
    const bookings = getFilteredBookings(readBookings());
    renderBookingsTable(bookings);
    const countTarget = document.querySelector('[data-booking-count]');
    if (countTarget) {
      countTarget.textContent = `${bookings.length} đơn đặt phòng`;
    }
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const room = getSelectedRoom();
    const user = getAuthUser();

    if (!user || !user.id) {
      showToast('Bạn cần đăng nhập để đặt phòng.', 'danger');
      window.location.href = window.NovaHotel.resolveAssetPath('login.html');
      return;
    }

    const checkIn = formData.get('checkIn');
    const checkOut = formData.get('checkOut');
    const nights = calculateNights(checkIn, checkOut);
    const total = room ? (room.price || room.basePrice || 0) * nights : Number(formData.get('total') || 0);

    // Payload phù hợp với BookingRequest của backend
    const payload = {
      roomId: room?.id || room?.roomId || room?.code,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: Number(formData.get('adults') || 1) + Number(formData.get('children') || 0),
      notes: formData.get('notes') || formData.get('specialRequests') || '',
      contactName: formData.get('guestName') || user?.fullName || user?.name,
      contactEmail: formData.get('email') || user?.email,
      contactPhone: formData.get('phone') || user?.phone
    };

    try {
      const response = await apiCall('/bookings', 'POST', payload);
      showToast('Đặt phòng thành công! Đang chuyển đến trang lịch sử...', 'success');
      // Xóa cache cũ
      saveBookings([]);
      setTimeout(() => {
        window.location.href = window.NovaHotel.resolveAssetPath('user/my-bookings.html');
      }, 800);
    } catch (error) {
      console.error('Đặt phòng thất bại:', error);
      showToast(error.message || 'Không thể đặt phòng. Vui lòng kiểm tra đăng nhập và kết nối backend.', 'danger');
    }
  };

  const cancelBooking = (bookingId) => {
    const bookings = readBookings();
    const index = bookings.findIndex((booking) => booking.id === bookingId);
    if (index === -1) return;

    bookings[index].status = 'cancelled';
    saveBookings(bookings);
    refreshBookingTable();
    showToast('Đã cập nhật trạng thái hủy booking.', 'warning');
  };

  const initBookingForm = () => {
    const form = document.querySelector('[data-booking-form]');
    if (!form) return;

    const room = getSelectedRoom();
    if (!room) {
      showToast('Vui lòng chọn phòng trước khi đặt.', 'warning');
    }
    renderBookingSummary(room);

    const checkInInput = form.querySelector('[name="checkIn"]');
    const checkOutInput = form.querySelector('[name="checkOut"]');
    const totalDisplay = form.querySelector('[data-estimated-total]');

    const updateEstimate = () => {
      const nights = calculateNights(checkInInput?.value, checkOutInput?.value);
      const total = room.price * nights;
      if (totalDisplay) {
        totalDisplay.textContent = `${formatCurrency(total)} (${nights} đêm)`;
      }
    };

    checkInInput?.addEventListener('change', updateEstimate);
    checkOutInput?.addEventListener('change', updateEstimate);
    updateEstimate();

    form.addEventListener('submit', submitBooking);
  };

  const initMyBookingsPage = async () => {
    const bookingTable = document.querySelector('[data-booking-table]');
    if (!bookingTable) return;

    const user = getAuthUser();
    if (!user) {
      showToast('Vui lòng đăng nhập để xem lịch sử đặt phòng.', 'warning');
      return;
    }

    try {
      const response = await apiCall('/bookings/my-bookings', 'GET');
      const data = response?.data || response?.content || response;
      const bookings = Array.isArray(data) ? data : [];
      // Cập nhật cache
      saveBookings(bookings);
      renderBookingsTable(bookings);
    } catch (err) {
      console.warn('Lỗi khi tải booking từ API:', err);
      const cached = readBookings();
      renderBookingsTable(cached);
      if (cached.length === 0) {
        showToast('Không tải được lịch sử đặt phòng từ máy chủ.', 'warning');
      }
    }

    document.querySelectorAll('[data-booking-filter]').forEach((control) => {
      control.addEventListener('input', refreshBookingTable);
      control.addEventListener('change', refreshBookingTable);
    });
  };

  return {
    initBookingForm,
    initMyBookingsPage,
    refreshBookingTable
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  NovaHotelBooking.initBookingForm();
  NovaHotelBooking.initMyBookingsPage();
});
