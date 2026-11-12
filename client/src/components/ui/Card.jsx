export default function Card({ interactive = false, className = '', children, ...rest }) {
  return (
    <div
      className={`min-w-0 rounded-md border border-line bg-surface p-4 sm:p-5 ${
        interactive ? 'transition-colors duration-[120ms] hover:border-ink-soft' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
