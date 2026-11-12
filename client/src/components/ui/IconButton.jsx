export default function IconButton({ label, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`icon-btn inline-flex h-9 w-9 items-center justify-center rounded-sm text-ink-soft transition-colors duration-[120ms] hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
