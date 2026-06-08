import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy chỉ dùng khi frontend/.env đặt VITE_API_BASE=/api
    // Mặc định frontend gọi thẳng http://localhost:8080/api (xem client.js)
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // Proxy uploads để ảnh preview trong dev (backend static resource handler)
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});