import { useEffect, useRef } from 'react';

/**
 * Custom cursor: a small dot that tracks the pointer exactly, and a
 * ring that trails behind it and swells over interactive elements.
 *
 * Renders nothing on touch devices or when the user has asked for
 * reduced motion.
 */
export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reduced) return undefined;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return undefined;

    dot.style.opacity = '1';
    ring.style.opacity = '1';

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let frame;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    };

    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      frame = requestAnimationFrame(loop);
    };

    const grow = () => ring.classList.add('is-big');
    const shrink = () => ring.classList.remove('is-big');

    // Delegated hover detection, so elements added later still work.
    const onOver = (e) => {
      if (e.target.closest('a, button, [data-cursor-grow]')) grow();
    };
    const onOut = (e) => {
      if (e.target.closest('a, button, [data-cursor-grow]')) shrink();
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    frame = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[70] -ml-1 -mt-1 h-2 w-2
                   rounded-full bg-white opacity-0 mix-blend-difference"
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[70]
                   -ml-[19px] -mt-[19px] h-[38px] w-[38px] rounded-full
                   border border-white opacity-0 mix-blend-difference
                   transition-[width,height,margin] duration-300"
      />
    </>
  );
}
