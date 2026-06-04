// Xử lý danh sách phòng và trang chi tiết phòng.
const NovaHotelRooms = (() => {
  const {
    apiCall,
    showToast,
    formatCurrency,
    formatDate,
    getQueryParams,
    resolveAssetPath
  } = window.NovaHotel;

  const state = {
    rooms: []
  };

  const getRooms = async () => {
    try {
      const response = await apiCall('/rooms', 'GET');
      const data = Array.isArray(response) ? response : response?.data || response?.content || [];
      state.rooms = data.length ? data : [];
      if (data.length === 0) {
        showToast('Không có phòng nào từ máy chủ.', 'warning');
      }
    } catch (err) {
      console.error('Không thể tải danh sách phòng từ backend:', err);
      showToast('Không thể kết nối máy chủ. Vui lòng kiểm tra backend và MongoDB.', 'danger');
      state.rooms = [];
    }
    return state.rooms;
  };

  const getRoomTypeLabel = (roomType) => {
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

  const getStatusBadge = (status) => {
    const map = {
      available: 'status-active',
      reserved: 'status-pending',
      maintenance: 'status-cancelled'
    };
    const textMap = {
      available: 'Còn phòng',
      reserved: 'Đã giữ chỗ',
      maintenance: 'Bảo trì'
    };
    return `<span class="status-badge ${map[status] || 'status-pending'}">${textMap[status] || 'Không rõ'}</span>`;
  };

  const createRoomCard = (room) => `
    <div class="col-lg-4 col-md-6" data-reveal>
      <article class="room-card h-100">
        <div class="room-media">
          <img src="${room.image}" alt="${room.name}" loading="lazy">
        </div>
        <div class="p-4">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <div class="room-chip mb-2">${getRoomTypeLabel(room.type)}</div>
              <h3 class="h4 mb-2">${room.name}</h3>
              <div class="text-muted-soft small">${room.code} • ${room.floor} • ${room.area}m²</div>
            </div>
            ${getStatusBadge(room.status)}
          </div>
          <p class="text-muted-soft mb-3">${room.description}</p>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div class="room-price">${formatCurrency(room.price)}</div>
              <small class="text-muted-soft">/ đêm</small>
            </div>
            <div class="text-end">
              <div class="rating-stars">★ ${room.rating}</div>
              <small class="text-muted-soft">${room.reviews} đánh giá</small>
            </div>
          </div>
          <div class="d-grid gap-2">
            <button class="room-btn" type="button" data-room-open="${room.id}">Xem chi tiết</button>
          </div>
        </div>
      </article>
    </div>
  `;

  const renderRoomList = (rooms) => {
    const grid = document.querySelector('[data-room-grid]');
    const emptyState = document.querySelector('[data-room-empty]');
    if (!grid) return;

    grid.innerHTML = rooms.map(createRoomCard).join('');
    if (emptyState) {
      emptyState.classList.toggle('d-none', rooms.length > 0);
    }

    grid.querySelectorAll('[data-room-open]').forEach((button) => {
      button.addEventListener('click', () => {
        openRoomDetail(button.getAttribute('data-room-open'));
      });
    });
  };

  const matchRoom = (room, filters) => {
    const keyword = filters.keyword.toLowerCase();
    const matchesKeyword = !keyword || [room.name, room.code, room.type, room.description].some((value) => (value || '').toLowerCase().includes(keyword));
    const matchesType = filters.type === 'all' || room.type === filters.type;
    const matchesPrice = !filters.price || room.price <= Number(filters.price);
    const matchesStatus = filters.status === 'all' || room.status === filters.status;
    return matchesKeyword && matchesType && matchesPrice && matchesStatus;
  };

  const fetchAvailableRooms = async (checkIn, checkOut) => {
    if (!checkIn || !checkOut) {
      return state.rooms;
    }
    try {
      const response = await apiCall(`/rooms/available?checkInDate=${checkIn}&checkOutDate=${checkOut}`, 'GET');
      const data = Array.isArray(response) ? response : response?.data || response?.content || [];
      return data.length ? data : [];
    } catch (err) {
      console.error('Lỗi khi tìm phòng trống:', err);
      showToast('Không thể kiểm tra phòng trống từ máy chủ.', 'danger');
      return [];
    }
  };

  const applyFilters = async () => {
    const keyword = document.querySelector('[data-room-keyword]')?.value || '';
    const type = document.querySelector('[data-room-type]')?.value || 'all';
    const price = document.querySelector('[data-room-price]')?.value || '';
    const status = document.querySelector('[data-room-status]')?.value || 'all';
    const checkIn = document.querySelector('[data-room-checkin]')?.value || '';
    const checkOut = document.querySelector('[data-room-checkout]')?.value || '';

    const availableRooms = await fetchAvailableRooms(checkIn, checkOut);
    const filteredRooms = availableRooms.filter((room) => matchRoom(room, { keyword, type, price, status }));
    renderRoomList(filteredRooms);
    document.querySelector('[data-room-count]').textContent = `${filteredRooms.length} phòng phù hợp`;
  };

  const bindRoomFilters = () => {
    document.querySelectorAll('[data-room-filter]').forEach((control) => {
      control.addEventListener('input', () => applyFilters());
      control.addEventListener('change', () => applyFilters());
    });

    const filterForm = document.querySelector('[data-room-filter-form]');
    if (filterForm) {
      filterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        applyFilters();
      });
    }

    const clearButton = document.querySelector('[data-room-clear]');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        document.querySelectorAll('[data-room-filter]').forEach((control) => {
          if (control.tagName === 'SELECT') {
            control.value = control.getAttribute('data-default') || 'all';
          } else {
            control.value = '';
          }
        });
        applyFilters();
      });
    }
  };

  const openRoomDetail = (roomId) => {
    const selectedRoom = state.rooms.find((room) => room.id === roomId) || state.rooms[0];
    if (!selectedRoom) {
      showToast('Không tìm thấy thông tin phòng.', 'danger');
      return;
    }

    localStorage.setItem('nova_hotel_selected_room', JSON.stringify(selectedRoom));
    window.location.href = resolveAssetPath(`rooms/room-detail.html?id=${encodeURIComponent(selectedRoom.id)}`);
  };

  const renderRoomDetail = (room) => {
    const detailTarget = document.querySelector('[data-room-detail]');
    const summaryTarget = document.querySelector('[data-room-summary]');
    if (!detailTarget || !room) return;

    localStorage.setItem('nova_hotel_selected_room', JSON.stringify(room));

    detailTarget.innerHTML = `
      <div class="room-detail-image mb-4" style="background-image: linear-gradient(145deg, rgba(26,26,26,0.25), rgba(26,26,26,0.38)), url('${room.image}'); background-size: cover; background-position: center;"></div>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <span class="badge-soft">${getRoomTypeLabel(room.type)}</span>
        <span class="badge-soft">${room.code}</span>
        <span class="badge-soft">${room.area}m²</span>
        <span class="badge-soft">${room.capacity} khách</span>
      </div>
      <h1 class="display-luxury mb-3">${room.name}</h1>
      <div class="d-flex align-items-center gap-3 mb-3">
        <div class="rating-stars fs-5">★ ${room.rating}</div>
        <span class="text-muted-soft">${room.reviews} đánh giá</span>
        ${getStatusBadge(room.status)}
      </div>
      <div class="inline-divider"></div>
      <p class="lead mb-4">${room.description}</p>
      <div class="row g-3 mb-4">
        <div class="col-sm-4"><div class="mini-stat"><small class="text-muted-soft d-block">Diện tích</small><strong>${room.area}m²</strong></div></div>
        <div class="col-sm-4"><div class="mini-stat"><small class="text-muted-soft d-block">Giường</small><strong>${room.bed}</strong></div></div>
        <div class="col-sm-4"><div class="mini-stat"><small class="text-muted-soft d-block">Tầng</small><strong>${room.floor}</strong></div></div>
      </div>
      <div class="content-card mb-4">
        <h3 class="h5 mb-3">Tiện nghi nổi bật</h3>
        <div class="amenity-list">
          ${room.amenities.map((item) => `<div class="item"><i class="bi bi-check2-circle"></i><span>${item}</span></div>`).join('')}
        </div>
      </div>
      <div class="content-card">
        <h3 class="h5 mb-3">Điểm nhấn</h3>
        <p class="mb-0">${room.highlight}</p>
      </div>
    `;

    if (summaryTarget) {
      summaryTarget.innerHTML = `
        <div class="booking-summary">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div class="badge-soft mb-2">Tóm tắt phòng</div>
              <h3 class="h4 mb-1">${room.name}</h3>
              <div class="text-muted-soft">${room.code} • ${room.type}</div>
            </div>
            <div class="price-highlight">${formatCurrency(room.price)}</div>
          </div>
          <div class="d-grid gap-2 text-muted-soft">
            <div><strong class="text-dark">Diện tích:</strong> ${room.area}m²</div>
            <div><strong class="text-dark">Sức chứa:</strong> ${room.capacity} khách</div>
            <div><strong class="text-dark">Tầng:</strong> ${room.floor}</div>
          </div>
        </div>
      `;
    }

    document.querySelectorAll('[data-book-room-name]').forEach((node) => {
      node.textContent = room.name;
    });
    document.querySelectorAll('[data-book-room-price]').forEach((node) => {
      node.textContent = formatCurrency(room.price);
    });
  };

  const initRoomsPage = async () => {
    const roomsPage = document.querySelector('[data-room-page]');
    const detailPage = document.querySelector('[data-room-detail-page]');
    if (!roomsPage && !detailPage) return;

    await getRooms();

    if (roomsPage) {
      renderRoomList(state.rooms);
      bindRoomFilters();
      document.querySelector('[data-room-count]').textContent = `${state.rooms.length} phòng đang hiển thị`;
    }

    if (detailPage) {
      const params = getQueryParams();
      let room = state.rooms.find((item) => item.id === params.id);
      if (!room) {
        try {
          room = JSON.parse(localStorage.getItem('nova_hotel_selected_room') || 'null');
        } catch {
          room = null;
        }
      }
      if (!room) {
        room = state.rooms[0];
      }
      renderRoomDetail(room);

      const detailGallery = document.querySelector('[data-room-gallery]');
      if (detailGallery) {
        detailGallery.innerHTML = state.rooms
          .filter((item) => item.id !== room.id)
          .slice(0, 3)
          .map((item) => `
            <div class="gallery-thumb" style="background-image:url('${item.image}'); background-size:cover; background-position:center;"></div>
          `)
          .join('');
      }

      const relatedTarget = document.querySelector('[data-related-rooms]');
      if (relatedTarget) {
        relatedTarget.innerHTML = state.rooms
          .filter((item) => item.id !== room.id)
          .slice(0, 3)
          .map((item) => `
            <div class="col-md-4" data-reveal>
              <article class="room-card h-100">
                <div class="room-media"><img src="${item.image}" alt="${item.name}" loading="lazy"></div>
                <div class="p-4">
                  <div class="room-chip mb-2">${getRoomTypeLabel(item.type)}</div>
                  <h4 class="h5">${item.name}</h4>
                  <p class="text-muted-soft">${item.description}</p>
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="room-price fs-4">${formatCurrency(item.price)}</div>
                    <button class="room-btn w-auto px-3" type="button" data-room-open="${item.id}">Xem</button>
                  </div>
                </div>
              </article>
            </div>
          `)
          .join('');

        relatedTarget.querySelectorAll('[data-room-open]').forEach((button) => {
          button.addEventListener('click', () => openRoomDetail(button.getAttribute('data-room-open')));
        });
      }

      const bookingJump = document.querySelector('[data-booking-jump]');
      if (bookingJump) {
        bookingJump.addEventListener('click', () => {
          document.querySelector('[data-booking-form]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
  };

  return { initRoomsPage, openRoomDetail };
})();

document.addEventListener('DOMContentLoaded', () => {
  NovaHotelRooms.initRoomsPage();
});
