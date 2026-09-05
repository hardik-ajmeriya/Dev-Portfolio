import { useEffect, useRef, useState } from 'react';
import { stats } from '../../data/projects';

function CountUp({ target, suffix = '', duration = 1400 }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return undefined;
    }

    let frame;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        let start = null;
        const step = (ts) => {
          if (start === null) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          setValue(Math.floor(p * target));
          if (p < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target, duration]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <div className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="border-b border-r border-line p-9 last:border-r-0 lg:border-b-0">
          <div className="display text-[clamp(2.4rem,4.6vw,4rem)]">
            {s.value === null ? s.display : <CountUp target={s.value} suffix={s.suffix} />}
          </div>
          <div className="mt-2.5 text-[13px] text-muted">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
