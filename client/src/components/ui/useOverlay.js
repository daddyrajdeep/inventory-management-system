import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Shared overlay contract: focus trap, scroll lock, Escape, focus restore.
export default function useOverlay(open, onClose) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const node = ref.current;
    const items = () => [...(node?.querySelectorAll(FOCUSABLE) || [])];
    const first = items().find((el) => el.getAttribute('aria-label') !== 'Close') || items()[0];
    first?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key !== 'Tab') return;
      const list = items();
      if (!list.length) return;
      const [start, end] = [list[0], list[list.length - 1]];
      if (e.shiftKey && document.activeElement === start) {
        e.preventDefault();
        end.focus();
      } else if (!e.shiftKey && document.activeElement === end) {
        e.preventDefault();
        start.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  return ref;
}
