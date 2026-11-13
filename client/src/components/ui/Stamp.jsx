// The one place uppercase is allowed: a quoted physical stamp.
export default function Stamp({ children = 'RECEIVED' }) {
  return (
    <span
      className="pointer-events-none inline-block rounded border-2 border-ok px-2 py-0.5 text-sm font-bold tracking-[0.08em] text-ok"
      style={{ transform: 'rotate(-8deg)', animation: 'stamp 240ms var(--ease-spring) both' }}
    >
      {children}
      <style>{`@keyframes stamp { from { opacity: 0; transform: rotate(-8deg) scale(1.6); } to { opacity: 1; transform: rotate(-8deg) scale(1); } }
        @media (prefers-reduced-motion: reduce) { span { animation: none !important; } }`}</style>
    </span>
  );
}
