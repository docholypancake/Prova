import { useEffect, useRef } from 'react';

// Adds `is-visible` to elements with class `reveal` when they scroll into view.
// Usage: const ref = useReveal(); <section ref={ref}>…<div className="reveal" />…</section>
export default function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.classList?.contains('reveal') ? [root] : [...root.querySelectorAll('.reveal')];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}
