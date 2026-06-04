// Xử lý các trang admin: dashboard, quản lý phòng, đặt phòng và người dùng.
const NovaHotelAdmin = (() => {
  const {
    apiCall,
    showToast,
    formatCurrency,
    formatDate,
    formatDateTime,
    setStoredArray,
    NOVA_STORAGE_KEYS
  } = window.NovaHotel;

  const loadRooms = async () => {
    try {
      const response = await apiCall('/rooms', 'GET');
      const data = Array.isArray(response) ? response : response?.data || response?.content || [];
      return data.length ? data : [];
    } catch (err) {
      console.error('Không tải được danh sách phòng:', err);
      showToast('Không thể tải dữ liệu phòng từ máy chủ.', 'danger');
      return [];
    }
  };

  // Chuẩn hóa dữ liệu phòng từ API/demo cho UI.
  const toDisplayRoom = (room) => {
    const priceValue = room?.price?.basePrice ?? room?.price ?? room?.basePrice ?? 0;
    const amenities = Array.isArray(room?.amenities)
      ? room.amenities
      : Array.isArray(room?.facilities)
        ? room.facilities
        : [];
    const images = Array.isArray(room?.images) ? room.images : [];

    return {
      id: String(room?.id || room?._id || room?.roomId || room?.roomNumber || `room-${Date.now()}`),
      code: room?.code || room?.roomNumber || room?.roomId || '---',
      name: room?.name || room?.roomId || room?.roomNumber || '---',
      type: room?.type || room?.roomType || '---',
      price: Number(priceValue || 0),
      area: Number(room?.area || 0),
      bed: room?.bed || room?.bedType || '',
      capacity: Number(room?.capacity || room?.maxGuests || 0),
      status: room?.status || 'available',
      floor: room?.floor || '',
      description: room?.description || '',
      amenities,
      image: room?.image || images[0] || ''
    };
  };

  const loadBookings = async () => {
    try {
      const response = await apiCall('/bookings', 'GET');
      const data = Array.isArray(response) ? response : response?.data || response?.content || [];
      return data.length ? data : [];
    } catch (err) {
      console.error('Không tải được danh sách booking:', err);
      showToast('Không thể tải dữ liệu booking từ máy chủ.', 'danger');
      return [];
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiCall('/users', 'GET');
      const data = Array.isArray(response) ? response : response?.data || response?.content || [];
      return data.length ? data : [];
    } catch (err) {
      console.error('Không tải được danh sách người dùng:', err);
      showToast('Không thể tải dữ liệu người dùng từ máy chủ.', 'danger');
      return [];
    }
  };

  // Chuẩn hóa vai trò về dạng front-end sử dụng.
  const normalizeUserRole = (role) => {
    const raw = String(role || '').toLowerCase();
    if (raw.includes('admin')) return 'admin';
    return 'customer';
  };

  // Ưu tiên status, fallback sang isActive khi có.
  const normalizeUserStatus = (user) => {
    if (user?.status) return user.status;
    if (typeof user?.isActive === 'boolean') return user.isActive ? 'active' : 'inactive';
    return 'active';
  };

  // Chuẩn hóa dữ liệu user từ API/demo cho UI.
  const toDisplayUser = (user) => ({
    id: String(user?.id || user?._id || user?.userId || user?.username || `user-${Date.now()}`),
    name: user?.fullName || user?.name || user?.username || '---',
    email: user?.email || '',
    phone: user?.phone || user?.phoneNumber || '',
    role: normalizeUserRole(user?.role),
    status: normalizeUserStatus(user)
  });

  const getRoleLabel = (role) => (normalizeUserRole(role) === 'admin' ? 'Admin' : 'Khách hàng');

  const getStatusBadge = (status) => {
    const map = {
      available: ['status-active', 'Còn phòng'],
      reserved: ['status-pending', 'Đã giữ chỗ'],
      maintenance: ['status-cancelled', 'Bảo trì'],
      pending: ['status-pending', 'Chờ xác nhận'],
      confirmed: ['status-confirmed', 'Đã xác nhận'],
      cancelled: ['status-cancelled', 'Đã hủy'],
      completed: ['status-completed', 'Hoàn tất'],
      active: ['status-active', 'Đang hoạt động'],
      inactive: ['status-inactive', 'Ngưng hoạt động']
    };
    const [cssClass, label] = map[status] || ['status-pending', status || 'Không rõ'];
    return `<span class="status-badge ${cssClass}">${label}</span>`;
  };

  const renderMetric = (target, value, title, subtitle) => {
    if (!target) return;
    target.innerHTML = `
      <div class="stat-card h-100">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <div class="text-muted-soft small text-uppercase fw-semibold">${title}</div>
            <h3 class="display-6 mb-0">${value}</h3>
          </div>
          <div class="stat-chip">${subtitle}</div>
        </div>
      </div>
    `;
  };

  const renderDashboard = async () => {
    const root = document.querySelector('[data-admin-dashboard]');
    if (!root) return;

    const [rooms, bookings, users] = await Promise.all([loadRooms(), loadBookings(), loadUsers()]);
    const revenue = bookings.reduce((sum, booking) => sum + Number(booking.total || 0), 0);
    const occupancyRate = rooms.length ? Math.round((rooms.filter((room) => room.status === 'available').length / rooms.length) * 100) : 0;

    renderMetric(document.querySelector('[data-metric-revenue]'), formatCurrency(revenue), 'Doanh thu', 'VND');
    renderMetric(document.querySelector('[data-metric-bookings]'), bookings.length, 'Đặt phòng', 'Tổng số');
    renderMetric(document.querySelector('[data-metric-rooms]'), rooms.length, 'Phòng', 'Đang quản lý');
    renderMetric(document.querySelector('[data-metric-users]'), users.length, 'Người dùng', 'Tài khoản');

    const chart = document.querySelector('[data-revenue-bars]');
    if (chart) {
      const monthlyLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
      const monthlyValues = [24, 31, 27, 42, 38, 46];
      chart.innerHTML = monthlyLabels.map((label, index) => `
        <div>
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-semibold">${label}</span>
            <span class="text-muted-soft">${monthlyValues[index]}%</span>
          </div>
          <div class="progress progress-luxury">
            <div class="progress-bar" style="width: ${monthlyValues[index]}%"></div>
          </div>
        </div>
      `).join('');
    }

    const bookingTable = document.querySelector('[data-admin-latest-bookings]');
    if (bookingTable) {
      bookingTable.innerHTML = bookings.slice(0, 5).map((booking) => `
        <tr>
          <td>${booking.code}</td>
          <td>${booking.roomName}</td>
          <td>${booking.guestName}</td>
          <td>${formatDate(booking.checkIn)}</td>
          <td>${formatCurrency(booking.total)}</td>
          <td>${getStatusBadge(booking.status)}</td>
        </tr>
      `).join('');
    }

    const occupancyTarget = document.querySelector('[data-admin-occupancy]');
    if (occupancyTarget) {
      occupancyTarget.textContent = `${occupancyRate}%`;
    }
  };

  // Gom booking co doanh thu (uu tien confirmed/completed).
  const getRevenueBookings = (bookings) => bookings.filter((booking) => {
    const status = String(booking?.status || '').toLowerCase();
    if (status === 'cancelled') return false;
    if (status === 'confirmed' || status === 'completed') return true;
    const payment = String(booking?.payment || '').toLowerCase();
    return payment === 'paid';
  });

  const getBookingDate = (booking) => {
    const raw = booking?.checkIn || booking?.createdAt || booking?.createdDate || '';
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const buildMonthlyRevenue = (bookings, monthsCount = 6) => {
    const now = new Date();
    const months = [];
    for (let i = monthsCount - 1; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: `T${date.getMonth() + 1}`,
        total: 0
      });
    }

    bookings.forEach((booking) => {
      const date = getBookingDate(booking);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find((item) => item.key === key);
      if (bucket) {
        bucket.total += Number(booking.total || 0);
      }
    });

    return months;
  };

  // Render module doanh thu (bao cao rieng).
  const renderRevenueModule = async () => {
    const root = document.querySelector('[data-admin-revenue]');
    if (!root) return;

    const bookings = await loadBookings();
    const revenueBookings = getRevenueBookings(bookings);
    const totalRevenue = revenueBookings.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const avgRevenue = revenueBookings.length ? totalRevenue / revenueBookings.length : 0;

    const summaryTarget = document.querySelector('[data-revenue-summary]');
    if (summaryTarget) {
      summaryTarget.innerHTML = [
        { title: 'Tong doanh thu', value: formatCurrency(totalRevenue), subtitle: 'VND' },
        { title: 'Booking co doanh thu', value: revenueBookings.length, subtitle: 'Don hang' },
        { title: 'Gia tri trung binh', value: formatCurrency(Math.round(avgRevenue)), subtitle: 'VND/booking' }
      ].map((item) => `
        <div class="col-md-4 metric-card">
          <div class="stat-card h-100">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div class="text-muted-soft small text-uppercase fw-semibold">${item.title}</div>
                <h3 class="display-6 mb-0">${item.value}</h3>
              </div>
              <div class="stat-chip">${item.subtitle}</div>
            </div>
          </div>
        </div>
      `).join('');
    }

    const monthlyTarget = document.querySelector('[data-revenue-monthly]');
    if (monthlyTarget) {
      const months = buildMonthlyRevenue(revenueBookings, 6);
      const maxValue = Math.max(...months.map((item) => item.total), 1);
      monthlyTarget.innerHTML = months.map((item) => {
        const percent = Math.round((item.total / maxValue) * 100);
        return `
          <div>
            <div class="d-flex justify-content-between mb-2">
              <span class="fw-semibold">${item.label}</span>
              <span class="text-muted-soft">${formatCurrency(item.total)}</span>
            </div>
            <div class="progress progress-luxury">
              <div class="progress-bar" style="width: ${percent}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    const topRoomsTarget = document.querySelector('[data-revenue-top-rooms]');
    if (topRoomsTarget) {
      const roomMap = new Map();
      revenueBookings.forEach((booking) => {
        const key = booking.roomName || booking.roomCode || '---';
        const current = roomMap.get(key) || { count: 0, total: 0 };
        roomMap.set(key, {
          count: current.count + 1,
          total: current.total + Number(booking.total || 0)
        });
      });

      const rows = [...roomMap.entries()]
        .map(([room, stats]) => ({ room, ...stats }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      topRoomsTarget.innerHTML = rows.map((row) => `
        <tr>
          <td>${row.room}</td>
          <td>${row.count}</td>
          <td>${formatCurrency(row.total)}</td>
        </tr>
      `).join('');
    }

    const statusTarget = document.querySelector('[data-revenue-status]');
    if (statusTarget) {
      const statusMap = new Map();
      revenueBookings.forEach((booking) => {
        const status = String(booking.status || 'unknown').toLowerCase();
        statusMap.set(status, (statusMap.get(status) || 0) + Number(booking.total || 0));
      });
      const total = Math.max(totalRevenue, 1);
      statusTarget.innerHTML = [...statusMap.entries()].map(([status, value]) => {
        const percent = Math.round((value / total) * 100);
        return `
          <div>
            <div class="d-flex justify-content-between mb-2">
              <span class="fw-semibold">${status}</span>
              <span class="text-muted-soft">${formatCurrency(value)}</span>
            </div>
            <div class="progress progress-luxury">
              <div class="progress-bar" style="width: ${percent}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    const recentTarget = document.querySelector('[data-revenue-recent]');
    if (recentTarget) {
      const recent = [...revenueBookings]
        .sort((a, b) => getBookingDate(b) - getBookingDate(a))
        .slice(0, 6);
      recentTarget.innerHTML = recent.map((booking) => `
        <tr>
          <td>${booking.code}</td>
          <td>${booking.guestName}</td>
          <td>${formatDate(getBookingDate(booking))}</td>
          <td>${formatCurrency(Number(booking.total || 0))}</td>
        </tr>
      `).join('');
    }
  };

  const renderRoomsManager = async () => {
    const target = document.querySelector('[data-admin-room-table]');
    if (!target) return;
    const rooms = (await loadRooms()).map(toDisplayRoom);

    // Hàm render bảng phòng với danh sách đã được lọc
    const render = (list) => {
      target.innerHTML = list.map((room) => `
        <tr>
          <td>
            <div class="fw-semibold">${room.name}</div>
            <small class="text-muted-soft">${room.code}</small>
          </td>
          <td>${room.type}</td>
          <td>${room.area}m²</td>
          <td>${formatCurrency(room.price)}</td>
          <td>${getStatusBadge(room.status)}</td>
          <td>${room.floor}</td>
          <td>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-dark" type="button" data-room-edit="${room.id}">Chỉnh sửa</button>
              <button class="btn btn-sm btn-outline-dark" type="button" data-room-toggle="${room.id}">Đổi trạng thái</button>
              <button class="btn btn-sm btn-outline-danger" type="button" data-room-remove="${room.id}">Xóa</button>
            </div>
          </td>
        </tr>
      `).join('');

      target.querySelectorAll('[data-room-edit]').forEach((button) => {
        button.addEventListener('click', () => editRoom(button.getAttribute('data-room-edit')));
      });

      target.querySelectorAll('[data-room-toggle]').forEach((button) => {
        button.addEventListener('click', () => toggleRoomStatus(button.getAttribute('data-room-toggle')));
      });

      target.querySelectorAll('[data-room-remove]').forEach((button) => {
        button.addEventListener('click', () => deleteRoom(button.getAttribute('data-room-remove')));
      });
    };

    // Hàm áp dụng cả bộ lọc tìm kiếm và bộ lọc trạng thái phòng
    const applyRoomFilters = () => {
      const searchKeyword = (document.querySelector('[data-admin-room-search]')?.value || '').toLowerCase();
      const statusFilter = document.querySelector('[data-admin-room-filter-status]')?.value || '';

      const filteredRooms = rooms.filter((room) => {
        // Lọc theo tìm kiếm: tên phòng, mã phòng, loại phòng
        const matchesSearch = [room.name, room.code, room.type].some(
          (value) => (value || '').toLowerCase().includes(searchKeyword)
        );

        // Lọc theo trạng thái phòng nếu được chọn
        const matchesStatus = !statusFilter || room.status === statusFilter;

        return matchesSearch && matchesStatus;
      });

      render(filteredRooms);
    };

    // Gắn sự kiện cho ô tìm kiếm
    const roomSearchInput = document.querySelector('[data-admin-room-search]');
    if (roomSearchInput && !roomSearchInput.dataset.bound) {
      roomSearchInput.addEventListener('input', applyRoomFilters);
      roomSearchInput.dataset.bound = 'true';
    }

    // Gắn sự kiện cho dropdown lọc trạng thái
    const roomFilterSelect = document.querySelector('[data-admin-room-filter-status]');
    if (roomFilterSelect && !roomFilterSelect.dataset.bound) {
      roomFilterSelect.addEventListener('change', applyRoomFilters);
      roomFilterSelect.dataset.bound = 'true';
    }

    render(rooms);
  };

  const renderBookingsManager = async () => {
    const target = document.querySelector('[data-admin-booking-table]');
    if (!target) return;
    const bookings = await loadBookings();

    // Hàm render bảng booking với danh sách đã được lọc
    const render = (list) => {
      target.innerHTML = list.map((booking) => `
        <tr>
          <td>${booking.code}</td>
          <td>${booking.guestName}</td>
          <td>${booking.roomName}</td>
          <td>${formatDate(booking.checkIn)}</td>
          <td>${formatDate(booking.checkOut)}</td>
          <td>${formatCurrency(booking.total)}</td>
          <td>${getStatusBadge(booking.status)}</td>
          <td>
            <select class="form-select form-select-sm" data-booking-status="${booking.id}">
              <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Chờ xác nhận</option>
              <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
              <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Hoàn tất</option>
              <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
            </select>
          </td>
        </tr>
      `).join('');

      target.querySelectorAll('[data-booking-status]').forEach((select) => {
        select.addEventListener('change', () => updateBookingStatus(select.getAttribute('data-booking-status'), select.value));
      });
    };

    // Hàm áp dụng cả bộ lọc tìm kiếm và bộ lọc trạng thái
    const applyBookingFilters = () => {
      const searchKeyword = (document.querySelector('[data-admin-booking-search]')?.value || '').toLowerCase();
      const statusFilter = document.querySelector('[data-admin-booking-filter-status]')?.value || '';

      const filteredBookings = bookings.filter((booking) => {
        // Lọc theo tìm kiếm: mã booking, tên khách, tên phòng
        const matchesSearch = [booking.code, booking.guestName, booking.roomName].some(
          (value) => (value || '').toLowerCase().includes(searchKeyword)
        );

        // Lọc theo trạng thái nếu được chọn
        const matchesStatus = !statusFilter || booking.status === statusFilter;

        return matchesSearch && matchesStatus;
      });

      render(filteredBookings);
    };

    // Gắn sự kiện cho ô tìm kiếm
    const bookingSearchInput = document.querySelector('[data-admin-booking-search]');
    if (bookingSearchInput && !bookingSearchInput.dataset.bound) {
      bookingSearchInput.addEventListener('input', applyBookingFilters);
      bookingSearchInput.dataset.bound = 'true';
    }

    // Gắn sự kiện cho dropdown lọc trạng thái
    const bookingFilterSelect = document.querySelector('[data-admin-booking-filter-status]');
    if (bookingFilterSelect && !bookingFilterSelect.dataset.bound) {
      bookingFilterSelect.addEventListener('change', applyBookingFilters);
      bookingFilterSelect.dataset.bound = 'true';
    }

    render(bookings);
  };

  // Render bảng người dùng + hành động CRUD.
  const renderUsersManager = async () => {
    const target = document.querySelector('[data-admin-user-table]');
    if (!target) return;
    const users = (await loadUsers()).map(toDisplayUser);

    const render = (list) => {
      target.innerHTML = list.map((user) => `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.phone}</td>
          <td>${getRoleLabel(user.role)}</td>
          <td>${getStatusBadge(user.status)}</td>
          <td>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-dark" type="button" data-user-edit="${user.id}">Chỉnh sửa</button>
              <button class="btn btn-sm btn-outline-dark" type="button" data-user-toggle="${user.id}">Đổi trạng thái</button>
              <button class="btn btn-sm btn-outline-danger" type="button" data-user-remove="${user.id}">Xóa</button>
            </div>
          </td>
        </tr>
      `).join('');

      target.querySelectorAll('[data-user-edit]').forEach((button) => {
        button.addEventListener('click', () => editUser(button.getAttribute('data-user-edit')));
      });

      target.querySelectorAll('[data-user-toggle]').forEach((button) => {
        button.addEventListener('click', () => toggleUserStatus(button.getAttribute('data-user-toggle')));
      });

      target.querySelectorAll('[data-user-remove]').forEach((button) => {
        button.addEventListener('click', () => deleteUser(button.getAttribute('data-user-remove')));
      });
    };

    const userSearchInput = document.querySelector('[data-admin-user-search]');
    if (userSearchInput && !userSearchInput.dataset.bound) {
      userSearchInput.addEventListener('input', () => {
        const keyword = (userSearchInput?.value || '').toLowerCase();
        render(users.filter((user) => [user.name, user.email, user.role].some((value) => (value || '').toLowerCase().includes(keyword))));
      });
      userSearchInput.dataset.bound = 'true';
    }

    render(users);
  };

  // Không còn dùng persist demo nữa - mọi thay đổi phải đi qua API thật

  const toggleRoomStatus = async (roomId) => {
    const rooms = (await loadRooms()).map(toDisplayRoom);
    const room = rooms.find((item) => item.id === roomId);
    if (!room) return;
    const nextStatus = room.status === 'available' ? 'maintenance' : 'available';
    await updateRoom(roomId, { status: nextStatus });
  };

  // Hàm hiển thị dialog xác nhận xóa phòng
  // Tham số: title (tiêu đề), message (tin nhắn), onConfirm (callback xác nhận), onCancel (callback hủy)
  const showConfirmDialog = (title, message, onConfirm, onCancel = null) => {
    // Tạo overlay/backdrop cho dialog
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;

    // Tạo container dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      min-width: 320px;
      max-width: 480px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      font-family: inherit;
    `;

    // Nội dung dialog: tiêu đề, tin nhắn, các nút
    dialog.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #333;">
          ${title}
        </h3>
        <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">
          ${message}
        </p>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 24px;">
        <button class="btn-cancel" style="
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          transition: all 0.2s;
        ">Hủy</button>
        <button class="btn-confirm" style="
          padding: 8px 16px;
          border: none;
          background: #dc3545;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        ">Xác nhận xóa</button>
      </div>
    `;

    // Gắn sự kiện cho nút Hủy
    const cancelBtn = dialog.querySelector('.btn-cancel');
    cancelBtn.addEventListener('mouseover', () => {
      cancelBtn.style.background = '#f5f5f5';
    });
    cancelBtn.addEventListener('mouseout', () => {
      cancelBtn.style.background = 'white';
    });
    cancelBtn.addEventListener('click', () => {
      backdrop.remove();
      if (onCancel) onCancel();
    });

    // Gắn sự kiện cho nút Xác nhận xóa
    const confirmBtn = dialog.querySelector('.btn-confirm');
    confirmBtn.addEventListener('mouseover', () => {
      confirmBtn.style.background = '#c82333';
    });
    confirmBtn.addEventListener('mouseout', () => {
      confirmBtn.style.background = '#dc3545';
    });
    confirmBtn.addEventListener('click', () => {
      backdrop.remove();
      onConfirm();
    });

    // Đóng dialog khi click vào backdrop
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        backdrop.remove();
        if (onCancel) onCancel();
      }
    });

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
  };

  const deleteRoom = async (roomId) => {
    // Lấy thông tin phòng để hiển thị trong dialog
    const rooms = (await loadRooms()).map(toDisplayRoom);
    const room = rooms.find((item) => item.id === roomId);
    const roomName = room?.name || 'phòng này';

    // Hiển thị dialog xác nhận trước khi xóa
    showConfirmDialog(
      'Xác nhận xóa phòng',
      `Bạn có chắc chắn muốn xóa phòng <strong>${roomName}</strong>? Hành động này không thể hoàn tác.`,
      async () => {
        // Callback xác nhận: thực hiện xóa phòng
        try {
          await apiCall(`/rooms/admin/${roomId}`, 'DELETE');
          showToast('Đã xóa phòng thành công.', 'success');
          renderRoomsManager();
        } catch (error) {
          const allRooms = (await loadRooms()).map(toDisplayRoom);
          const nextRooms = allRooms.filter((room) => room.id !== roomId);
          await persistRooms(nextRooms);
          showToast(error?.message || 'Không thể xóa từ API, đã lưu bản demo.', 'warning');
          renderRoomsManager();
        }
      },
      () => {
        // Callback hủy: không làm gì cả
        showToast('Đã hủy xóa phòng.', 'info');
      }
    );
  };

  // Reset form phòng về chế độ tạo mới.
  const resetRoomForm = () => {
    const form = document.querySelector('[data-admin-room-form]');
    if (!form) return;
    form.reset();
    form.querySelector('[name="roomId"]').value = '';
    const title = document.querySelector('[data-admin-room-form-title]');
    const mode = document.querySelector('[data-admin-room-form-mode]');
    const submit = document.querySelector('[data-admin-room-submit]');
    if (title) title.textContent = 'Thêm phòng mới';
    if (mode) mode.textContent = 'CREATE';
    if (submit) submit.textContent = 'Lưu phòng';
  };

  // Đổ dữ liệu phòng lên form để chỉnh sửa.
  const editRoom = async (roomId) => {
    const rooms = (await loadRooms()).map(toDisplayRoom);
    const room = rooms.find((item) => item.id === roomId);
    if (!room) return;
    const form = document.querySelector('[data-admin-room-form]');
    if (!form) return;
    form.querySelector('[name="roomId"]').value = room.id;
    form.querySelector('[name="code"]').value = room.code;
    form.querySelector('[name="name"]').value = room.name;
    form.querySelector('[name="type"]').value = room.type;
    form.querySelector('[name="price"]').value = room.price;
    form.querySelector('[name="area"]').value = room.area;
    form.querySelector('[name="bed"]').value = room.bed;
    form.querySelector('[name="capacity"]').value = room.capacity;
    form.querySelector('[name="status"]').value = room.status;
    form.querySelector('[name="floor"]').value = room.floor;
    form.querySelector('[name="description"]').value = room.description;
    form.querySelector('[name="amenities"]').value = room.amenities.join(', ');
    const title = document.querySelector('[data-admin-room-form-title]');
    const mode = document.querySelector('[data-admin-room-form-mode]');
    const submit = document.querySelector('[data-admin-room-submit]');
    if (title) title.textContent = 'Cập nhật phòng';
    if (mode) mode.textContent = 'EDIT';
    if (submit) submit.textContent = 'Cập nhật';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Tạo mới phòng - chỉ dùng API thật
  const createRoom = async (payload) => {
    const apiPayload = {
      name: payload.name,
      roomId: payload.code,
      roomNumber: payload.code,
      roomType: payload.type,
      price: { basePrice: Number(payload.price || 0) },
      status: payload.status,
      facilities: payload.amenities,
      description: payload.description,
      maxGuests: Number(payload.capacity || 0)
    };
    try {
      await apiCall('/rooms/admin', 'POST', apiPayload);
      showToast('Đã tạo phòng mới thành công.', 'success');
      renderRoomsManager();
    } catch (error) {
      console.error('Tạo phòng thất bại:', error);
      showToast(error?.message || 'Không thể tạo phòng. Kiểm tra backend và quyền admin.', 'danger');
    }
  };

  // Cập nhật phòng - chỉ dùng API thật
  const updateRoom = async (roomId, payload) => {
    const apiPayload = {};
    if (payload.name || payload.code) {
      apiPayload.name = payload.name;
      apiPayload.roomId = payload.code || payload.name;
      apiPayload.roomNumber = payload.code || payload.name;
    }
    if (payload.type) apiPayload.roomType = payload.type;
    if (typeof payload.price === 'number') {
      apiPayload.price = { basePrice: Number(payload.price || 0) };
    }
    if (payload.status) apiPayload.status = payload.status;
    if (payload.amenities?.length) apiPayload.facilities = payload.amenities;
    if (payload.description) apiPayload.description = payload.description;
    if (typeof payload.capacity === 'number') {
      apiPayload.maxGuests = Number(payload.capacity || 0);
    }
    try {
      await apiCall(`/rooms/admin/${roomId}`, 'PUT', apiPayload);
      showToast('Đã cập nhật phòng thành công.', 'success');
      renderRoomsManager();
    } catch (error) {
      console.error('Cập nhật phòng thất bại:', error);
      showToast(error?.message || 'Không thể cập nhật phòng. Kiểm tra backend và quyền admin.', 'danger');
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      // Backend hiện tại chưa có endpoint cập nhật trạng thái booking đơn giản từ admin.
      // Tạm thời chỉ reload để người dùng thấy thay đổi sau khi xử lý thủ công ở backend.
      showToast('Chức năng cập nhật trạng thái booking cần API riêng (chưa triển khai đầy đủ).', 'warning');
      renderBookingsManager();
    } catch (err) {
      showToast('Không thể cập nhật trạng thái booking.', 'danger');
    }
  };

  // Đổi trạng thái kích hoạt (ưu tiên API, fallback demo).
  const toggleUserStatus = async (userId) => {
    const users = (await loadUsers()).map(toDisplayUser);
    const user = users.find((item) => item.id === userId);
    if (!user) return;
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    await updateUser(userId, { status: nextStatus, isActive: nextStatus === 'active' });
  };

  // Xóa người dùng - chỉ dùng API thật
  const deleteUser = async (userId) => {
    try {
      await apiCall(`/users/admin/${userId}`, 'DELETE');
      showToast('Đã xóa người dùng thành công.', 'success');
      renderUsersManager();
    } catch (error) {
      console.error('Xóa người dùng thất bại:', error);
      showToast(error?.message || 'Không thể xóa người dùng. Kiểm tra backend và quyền admin.', 'danger');
    }
  };

  // Reset form về chế độ tạo mới.
  const resetUserForm = () => {
    const form = document.querySelector('[data-admin-user-form]');
    if (!form) return;
    form.reset();
    form.querySelector('[name="userId"]').value = '';
    const title = document.querySelector('[data-admin-user-form-title]');
    const mode = document.querySelector('[data-admin-user-form-mode]');
    const submit = document.querySelector('[data-admin-user-submit]');
    if (title) title.textContent = 'Thêm người dùng';
    if (mode) mode.textContent = 'CREATE';
    if (submit) submit.textContent = 'Lưu người dùng';
  };

  // Đổ dữ liệu lên form để chỉnh sửa.
  const editUser = async (userId) => {
    const users = (await loadUsers()).map(toDisplayUser);
    const user = users.find((item) => item.id === userId);
    if (!user) return;
    const form = document.querySelector('[data-admin-user-form]');
    if (!form) return;
    form.querySelector('[name="userId"]').value = user.id;
    form.querySelector('[name="fullName"]').value = user.name;
    form.querySelector('[name="email"]').value = user.email;
    form.querySelector('[name="phone"]').value = user.phone;
    form.querySelector('[name="role"]').value = normalizeUserRole(user.role);
    form.querySelector('[name="status"]').value = user.status;
    form.querySelector('[name="password"]').value = '';
    const title = document.querySelector('[data-admin-user-form-title]');
    const mode = document.querySelector('[data-admin-user-form-mode]');
    const submit = document.querySelector('[data-admin-user-submit]');
    if (title) title.textContent = 'Cập nhật người dùng';
    if (mode) mode.textContent = 'EDIT';
    if (submit) submit.textContent = 'Cập nhật';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Cập nhật người dùng - chỉ dùng API thật
  const updateUser = async (userId, payload) => {
    const body = {};
    if (payload.fullName) body.fullName = payload.fullName;
    if (payload.email) body.email = payload.email;
    if (payload.phone) body.phone = payload.phone;
    if (payload.role) body.role = normalizeUserRole(payload.role);
    if (typeof payload.isActive === 'boolean' || payload.status) {
      body.isActive = typeof payload.isActive === 'boolean' ? payload.isActive : payload.status === 'active';
    }
    if (payload.password) body.password = payload.password;
    try {
      await apiCall(`/users/admin/${userId}`, 'PUT', body);
      showToast('Đã cập nhật người dùng thành công.', 'success');
      renderUsersManager();
    } catch (error) {
      console.error('Cập nhật người dùng thất bại:', error);
      showToast(error?.message || 'Không thể cập nhật người dùng. Kiểm tra backend và quyền admin.', 'danger');
    }
  };

  // Tạo mới người dùng - chỉ dùng API thật
  const createUser = async (payload) => {
    const body = {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      role: normalizeUserRole(payload.role),
      password: payload.password || 'NovaHotel@123',
      isActive: payload.status === 'active'
    };
    try {
      await apiCall('/users/admin', 'POST', body);
      showToast('Đã tạo người dùng mới thành công.', 'success');
      renderUsersManager();
    } catch (error) {
      console.error('Tạo người dùng thất bại:', error);
      showToast(error?.message || 'Không thể tạo người dùng. Kiểm tra backend và quyền admin.', 'danger');
    }
  };

  const initAdminForms = () => {
    const roomForm = document.querySelector('[data-admin-room-form]');
    if (roomForm) {
      const resetButton = roomForm.querySelector('[data-admin-room-reset]');
      if (resetButton && !resetButton.dataset.bound) {
        resetButton.addEventListener('click', () => resetRoomForm());
        resetButton.dataset.bound = 'true';
      }

      roomForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(roomForm);
        const payload = {
          code: formData.get('code'),
          name: formData.get('name'),
          type: formData.get('type'),
          price: Number(formData.get('price')),
          area: Number(formData.get('area')),
          bed: formData.get('bed'),
          capacity: Number(formData.get('capacity')),
          status: formData.get('status'),
          floor: formData.get('floor'),
          description: formData.get('description'),
          amenities: (formData.get('amenities') || '').split(',').map((item) => item.trim()).filter(Boolean)
        };
        const roomId = formData.get('roomId');
        if (roomId) {
          await updateRoom(roomId, payload);
        } else {
          await createRoom(payload);
        }
        resetRoomForm();
      });
    }

    // Form CRUD người dùng.
    const userForm = document.querySelector('[data-admin-user-form]');
    if (userForm) {
      const resetButton = userForm.querySelector('[data-admin-user-reset]');
      if (resetButton && !resetButton.dataset.bound) {
        resetButton.addEventListener('click', () => resetUserForm());
        resetButton.dataset.bound = 'true';
      }

      userForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(userForm);
        const payload = {
          fullName: formData.get('fullName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          role: formData.get('role'),
          status: formData.get('status'),
          password: formData.get('password')
        };
        const userId = formData.get('userId');
        if (userId) {
          await updateUser(userId, payload);
        } else {
          await createUser(payload);
        }
        resetUserForm();
      });
    }
  };

  const initAdminPage = async () => {
    if (document.querySelector('[data-admin-dashboard]')) {
      await renderDashboard();
    }
    if (document.querySelector('[data-admin-room-table]')) {
      await renderRoomsManager();
      initAdminForms();
    }
    if (document.querySelector('[data-admin-booking-table]')) {
      await renderBookingsManager();
    }
    if (document.querySelector('[data-admin-user-table]')) {
      await renderUsersManager();
      initAdminForms();
    }
    if (document.querySelector('[data-admin-revenue]')) {
      await renderRevenueModule();
    }
  };

  return { initAdminPage };
})();

document.addEventListener('DOMContentLoaded', () => {
  const user = window.NovaHotel.getAuthUser();
  const role = String(user?.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'role_admin';
  if (!user || !isAdmin) {
    window.NovaHotel.showToast('Bạn không có quyền truy cập khu vực quản trị.', 'danger');
    window.location.href = window.NovaHotel.resolveAssetPath('login.html');
    return;
  }
  NovaHotelAdmin.initAdminPage();
});
