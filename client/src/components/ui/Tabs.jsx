import { useRef } from 'react';

export default function Tabs({ tabs, value, onChange, ariaLabel = 'Tabs' }) {
  const ref = useRef(null);
  const onKey = (e) => {
    const idx = tabs.findIndex((t) => t.value === value);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
      onChange(tabs[next].value);
      ref.current?.querySelectorAll('[role="tab"]')[next]?.focus();
    }
  };
  return (
    <div role="tablist" aria-label={ariaLabel} ref={ref} onKeyDown={onKey} className="flex gap-1 border-b border-line">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-[120ms] ${
              active ? 'border-ink text-ink' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
            {t.count != null && <span className="num text-xs text-ink-soft">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
