import { useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { inputClass } from './Input';

export default function NumberStepper({ value, onChange, min = 0, max = Infinity, step = 1, id, ariaLabel }) {
  const holdRef = useRef(null);
  const clamp = (n) => Math.min(max, Math.max(min, n));

  const nudge = (dir) => onChange(clamp(Number(value || 0) + dir * step));

  const startHold = (dir) => {
    nudge(dir);
    let delay = 400;
    const tick = () => {
      nudge(dir);
      delay = Math.max(60, delay * 0.8);
      holdRef.current = setTimeout(tick, delay);
    };
    holdRef.current = setTimeout(tick, delay);
  };
  const stopHold = () => clearTimeout(holdRef.current);
  useEffect(() => stopHold, []);

  return (
    <div className="inline-flex h-[38px] items-stretch overflow-hidden rounded-sm border border-line bg-surface">
      <button
        type="button"
        aria-label="Decrease"
        disabled={Number(value) <= min}
        onMouseDown={() => startHold(-1)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        className="flex w-9 items-center justify-center text-ink-soft hover:bg-paper disabled:opacity-40"
      >
        <Minus size={14} />
      </button>
      <input
        id={id}
        aria-label={ariaLabel}
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = e.target.value.replace(/[^\d-]/g, '');
          onChange(n === '' ? '' : clamp(Number(n)));
        }}
        className={`${inputClass} h-full w-16 rounded-none border-0 text-center focus:border-0`}
      />
      <button
        type="button"
        aria-label="Increase"
        disabled={Number(value) >= max}
        onMouseDown={() => startHold(1)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        className="flex w-9 items-center justify-center text-ink-soft hover:bg-paper disabled:opacity-40"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
