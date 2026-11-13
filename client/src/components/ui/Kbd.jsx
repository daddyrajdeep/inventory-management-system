export default function Kbd({ children }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-paper px-1.5 font-mono text-[11px] font-medium text-ink-soft">
      {children}
    </kbd>
  );
}
