import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-ink text-on-ink hover:opacity-90 border border-ink',
  secondary: 'bg-surface text-ink border border-line hover:border-ink-soft',
  ghost: 'bg-transparent text-ink-soft hover:bg-paper hover:text-ink border border-transparent',
  danger: 'bg-out text-on-ink hover:opacity-90 border border-out',
};

const sizes = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-[38px] px-4 text-sm gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-sm font-medium transition-[opacity,background-color,border-color,transform] duration-[120ms] active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
