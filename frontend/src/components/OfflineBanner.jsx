import { useEffect, useState } from 'react';
import { apiCall, onOfflineChange } from '../api/client';

export default function OfflineBanner() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('Không thể kết nối đến máy chủ');

  useEffect(() => {
    return onOfflineChange((isOffline, msg) => {
      if (isOffline) {
        setMessage(msg || 'Không thể kết nối đến máy chủ');
        setVisible(true);
      } else {
        setVisible(false);
        document.body.style.paddingTop = '';
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await apiCall('/rooms?size=1', 'GET');
      } catch {
        setVisible(true);
        setMessage('Không thể kết nối đến máy chủ (backend hoặc MongoDB có thể đang tắt)');
      }
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.paddingTop = visible ? '48px' : '';
  }, [visible]);

  if (!visible) return null;

  const retry = async () => {
    try {
      await apiCall('/rooms?size=1', 'GET');
      setVisible(false);
    } catch {
      setMessage('Vẫn không kết nối được backend');
    }
  };

  return (
    <div
      id="nova-offline-banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(90deg, #b91c1c, #dc2626)',
        color: 'white',
        padding: '10px 16px',
        fontSize: 14,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}
    >
      <span>
        ⚠️ <strong>{message}</strong>
      </span>
      <button
        type="button"
        onClick={retry}
        style={{
          background: 'white',
          color: '#b91c1c',
          border: 'none',
          padding: '4px 12px',
          borderRadius: 4,
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        Thử lại
      </button>
      <button
        type="button"
        onClick={() => setVisible(false)}
        style={{
          background: 'transparent',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.6)',
          padding: '4px 10px',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        Đóng
      </button>
    </div>
  );
}