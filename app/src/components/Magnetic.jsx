import { useRef } from 'react';

/**
 * Wraps a child element so it drifts toward the cursor on hover.
 * Disabled automatically on touch devices (no mousemove fires) and
 * when the user prefers reduced motion.
 */
export default function Magnetic({ children, strength = 0.25, className = '' }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * (strength * 1.4);
    el.style.transform = `translate(${x}px, ${y}px)`;
  };

  const handleLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = '';
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`inline-block transition-transform duration-300 ease-smooth ${className}`}
    >
      {children}
    </div>
  );
}
