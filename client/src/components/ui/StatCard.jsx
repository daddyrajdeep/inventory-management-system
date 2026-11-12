import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

// No default delta: a trend renders ONLY when real comparison data is passed.
export default function StatCard({ label, value, delta, spark, footnote }) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="num text-[26px] font-semibold leading-8 text-ink">{value}</p>
        {Array.isArray(spark) && spark.length > 1 && <Spark data={spark} />}
      </div>
      {delta ? (
        <p
          className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${
            delta.direction === 'down' ? 'text-out' : 'text-ok'
          }`}
        >
          {delta.direction === 'down' ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
          {Math.abs(delta.value)}% vs previous period
        </p>
      ) : (
        footnote && <p className="mt-1 text-xs text-ink-soft">{footnote}</p>
      )}
    </div>
  );
}

function Spark({ data }) {
  const max = Math.max(...data, 1);
  const w = 72;
  const h = 28;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 2) - 1}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <polyline points={points} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
    </svg>
  );
}
