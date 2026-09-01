import { useEffect, useRef } from 'react';

const DEFAULT_THRESHOLD = 0.12;

/**
 * Shared observer factory. Adds the `in` class to each target the
 * first time it enters the viewport, then stops watching it.
 */
function observeTargets(targets, threshold, rootMargin) {
  if (!targets.length) return () => {};

  // No IntersectionObserver (very old browser): show content immediately
  // rather than leaving it permanently invisible.
  if (typeof IntersectionObserver === 'undefined') {
    targets.forEach((t) => t.classList.add('in'));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold, rootMargin }
  );

  targets.forEach((t) => observer.observe(t));
  return () => observer.disconnect();
}

/**
 * Reveals the element the ref is attached to.
 *
 *   const ref = useReveal();
 *   <div ref={ref} className="rv">…</div>
 */
export function useReveal(threshold = DEFAULT_THRESHOLD, rootMargin = '0px') {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    return observeTargets([el], threshold, rootMargin);
  }, [threshold, rootMargin]);

  return ref;
}

/**
 * Reveals every `.rv` descendant of the element the ref is attached to,
 * each one independently as it scrolls into view.
 *
 *   const ref = useRevealGroup();
 *   <section ref={ref}> <div className="rv">…</div> </section>
 */
export function useRevealGroup(threshold = DEFAULT_THRESHOLD, rootMargin = '0px') {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    return observeTargets(Array.from(root.querySelectorAll('.rv')), threshold, rootMargin);
  }, [threshold, rootMargin]);

  return ref;
}
