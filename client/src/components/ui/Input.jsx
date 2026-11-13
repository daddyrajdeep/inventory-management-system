export const inputClass =
  'w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors duration-[120ms] placeholder:text-ink-soft/70 focus:border-ink disabled:opacity-50';

export default function Input({ className = '', ...rest }) {
  return <input className={`${inputClass} h-[38px] ${className}`} {...rest} />;
}
