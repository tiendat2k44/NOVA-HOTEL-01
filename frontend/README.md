# Nova Hotel Frontend

Frontend React + Vite cho hệ thống đặt phòng Nova Hotel.

## Chạy dự án

```bash
npm install
npm run dev
```

## Kiểm tra chất lượng

```bash
npm run lint
npm run build
```

## Cấu trúc chính

- `src/App.jsx`: wrapper ứng dụng, router, navbar, footer
- `src/routes/AppRouter.jsx`: khai báo route public, customer, admin
- `src/context/AuthContext.jsx`: quản lý xác thực và token
- `src/services/api.js`: lớp gọi API Axios

## Ghi chú

- Giao diện dùng React Router, Tailwind CSS và react-hot-toast.
- Backend mặc định chạy tại `http://localhost:8080/api`, có thể đổi bằng biến môi trường `VITE_API_BASE_URL`.
