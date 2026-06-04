import { createContext, useCallback, useContext, useMemo } from 'react';
import { toast } from 'react-toastify';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const showToast = useCallback((message, type = 'success') => {
    const options = {
      position: 'top-right',
      autoClose: 3000,
    };

    if (type === 'danger' || type === 'error') {
      toast.error(message, options);
    } else if (type === 'warning') {
      toast.warn(message, options);
    } else {
      toast.success(message, options);
    }
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};