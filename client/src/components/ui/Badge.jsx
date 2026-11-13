const tones = {
  ok: 'bg-ok-soft text-ok',
  low: 'bg-low-soft text-low',
  out: 'bg-out-soft text-out',
  info: 'bg-info-soft text-info',
  neutral: 'bg-paper text-ink-soft border border-line',
};

const dots = {
  ok: 'bg-ok',
  low: 'bg-low',
  out: 'bg-out',
  info: 'bg-info',
  neutral: 'bg-ink-soft',
};

export default function Badge({ tone = 'neutral', dot = false, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone] || tones.neutral}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[tone] || dots.neutral}`} aria-hidden="true" />}
      {children}
    </span>
  );
}
