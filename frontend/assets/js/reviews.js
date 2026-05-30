// Quản lý đánh giá phòng: hiển thị danh sách và gửi đánh giá.
const NovaHotelReviews = (() => {
  const {
    apiCall,
    showToast,
    formatDateTime,
    setStoredArray,
    NOVA_STORAGE_KEYS,
    getAuthUser,
    getQueryParams
  } = window.NovaHotel;

  const state = {
    roomId: null,
    reviews: []
  };

  const getSelectedRoomId = () => {
    const params = getQueryParams();
    if (params?.id) return params.id;
    try {
      const saved = JSON.parse(localStorage.getItem('nova_hotel_selected_room') || 'null');
      return saved?.id || saved?.roomId || null;
    } catch {
      return null;
    }
  };

  const readReviews = () => {
    const key = NOVA_STORAGE_KEYS.reviews || 'nova_hotel_reviews_cache';
    const raw = localStorage.getItem(key);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveReviews = (reviews) => {
    const key = NOVA_STORAGE_KEYS.reviews || 'nova_hotel_reviews_cache';
    setStoredArray(key, reviews);
  };

  const normalizeApiReviews = (response) => {
    const data = response?.data || response?.content || response?.reviews || response;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    return [];
  };

  const loadReviews = async () => {
    if (!state.roomId) return [];
    try {
      const response = await apiCall(`/reviews/room/${state.roomId}?page=0&size=20`, 'GET');
      state.reviews = normalizeApiReviews(response)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return state.reviews;
    } catch (err) {
      console.warn('Không tải được review từ backend:', err);
      state.reviews = readReviews()
        .filter((review) => review.roomId === state.roomId || review.roomId === state.roomId)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      if (state.reviews.length === 0) {
        showToast('Không thể tải đánh giá từ máy chủ.', 'warning');
      }
      return state.reviews;
    }
  };

  const renderReviews = (reviews) => {
    const list = document.querySelector('[data-review-list]');
    const empty = document.querySelector('[data-review-empty]');
    const count = document.querySelector('[data-review-count]');
    if (!list) return;

    list.innerHTML = reviews.map((review) => {
      const rating = Number(review.rating || 0);
      const author = review.userName || review.userFullName || review.fullName || review.email || review.userId || 'Khách lưu trú';
      const comment = review.comment || review.content || 'Chưa có nhận xét.';
      return `
        <div class="timeline-entry">
          <div class="timeline-index">${rating || 0}</div>
          <div>
            <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
              <strong>${author}</strong>
              <small class="text-muted-soft">${formatDateTime(review.createdAt)}</small>
            </div>
            <p class="mb-0 text-muted-soft">${comment}</p>
          </div>
        </div>
      `;
    }).join('');

    if (empty) {
      empty.classList.toggle('d-none', reviews.length > 0);
    }
    if (count) {
      count.textContent = `${reviews.length} đánh giá`;
    }
  };

  const initReviewForm = () => {
    const form = document.querySelector('[data-review-form]');
    const resetButton = document.querySelector('[data-review-reset]');
    const hint = document.querySelector('[data-review-hint]');
    if (!form) return;

    const user = getAuthUser();
    const isLoggedIn = Boolean(user);
    if (hint) {
      hint.textContent = isLoggedIn ? 'Đánh giá sẽ được gửi lên hệ thống nếu backend sẵn sàng.' : 'Vui lòng đăng nhập để gửi đánh giá.';
    }

    form.querySelectorAll('input, textarea, select, button').forEach((el) => {
      if (el.getAttribute('type') === 'button') return;
      el.disabled = !isLoggedIn;
    });

    resetButton?.addEventListener('click', () => form.reset());

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!isLoggedIn) {
        showToast('Vui lòng đăng nhập để gửi đánh giá.', 'warning');
        return;
      }

      const formData = new FormData(form);
      const payload = {
        roomId: state.roomId,
        rating: Number(formData.get('rating')),
        comment: formData.get('comment')
      };

      if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
        showToast('Vui lòng chọn điểm đánh giá từ 1 đến 5.', 'warning');
        return;
      }

      if (!payload.comment || payload.comment.trim().length < 5) {
        showToast('Vui lòng nhập nhận xét tối thiểu 5 ký tự.', 'warning');
        return;
      }

      const demoReview = {
        id: `review-${Date.now()}`,
        roomId: payload.roomId,
        userId: user?.id,
        rating: payload.rating,
        comment: payload.comment,
        createdAt: new Date().toISOString(),
        userName: user?.fullName || user?.name || user?.email
      };

      try {
        const response = await apiCall('/reviews', 'POST', payload);
        const created = response?.data || response || demoReview;
        const reviews = readReviews();
        reviews.unshift({ ...demoReview, ...created });
        saveReviews(reviews);
        showToast('Cảm ơn bạn đã đánh giá phòng.', 'success');
      } catch (error) {
        const reviews = readReviews();
        reviews.unshift(demoReview);
        saveReviews(reviews);
        showToast(error.message || 'Đã lưu đánh giá demo trên trình duyệt.', 'warning');
      }

      form.reset();
      await loadReviews();
      renderReviews(state.reviews);
    });
  };

  const initReviews = async () => {
    state.roomId = getSelectedRoomId();
    if (!state.roomId) return;
    await loadReviews();
    renderReviews(state.reviews);
    initReviewForm();
  };

  return { initReviews };
})();

document.addEventListener('DOMContentLoaded', () => {
  NovaHotelReviews.initReviews();
});
