import { useEffect, useRef } from 'react';

export default function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'all 0.6s ease';
    const t = setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div ref={ref} className={className} data-reveal>
      {children}
    </div>
  );
}