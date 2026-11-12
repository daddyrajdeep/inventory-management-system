import { ChevronLeft, ChevronRight } from 'lucide-react';
import IconButton from './IconButton';

export default function Pagination({ page, pageSize, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  const window = [];
  for (let p = Math.max(1, current - 2); p <= Math.min(totalPages, current + 2); p++) window.push(p);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-xs text-ink-soft">
      <span className="num">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <IconButton label="Previous page" disabled={current <= 1} onClick={() => onPage(current - 1)}>
          <ChevronLeft size={16} />
        </IconButton>
        {window[0] > 1 && <span className="px-1">…</span>}
        {window.map((p) => (
          <button
            key={p}
            type="button"
            aria-current={p === current ? 'page' : undefined}
            onClick={() => onPage(p)}
            className={`num h-8 min-w-8 rounded-sm px-2 text-[13px] font-medium transition-colors ${
              p === current ? 'bg-ink text-on-ink' : 'text-ink-soft hover:bg-paper hover:text-ink'
            }`}
          >
            {p}
          </button>
        ))}
        {window[window.length - 1] < totalPages && <span className="px-1">…</span>}
        <IconButton label="Next page" disabled={current >= totalPages} onClick={() => onPage(current + 1)}>
          <ChevronRight size={16} />
        </IconButton>
      </div>
    </div>
  );
}
