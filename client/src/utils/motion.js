// Signature motion helpers. CSS + WAAPI only; no animation libraries.

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tick a tabular-nums element from one integer to another (ledger quantity feel).
export function animateNumber(el, from, to, ms = 300) {
  if (!el) return;
  if (reduced() || from === to) {
    el.textContent = String(Math.round(to));
    return;
  }
  const start = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms);
    el.textContent = String(Math.round(from + (to - from) * ease(t)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export const prefersReducedMotion = reduced;
