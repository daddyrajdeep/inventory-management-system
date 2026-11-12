export default function EmptyState({ icon: Icon, title, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {Icon && <Icon size={20} className="text-ink-soft" aria-hidden="true" />}
      <p className="text-base text-ink-soft">{title}</p>
      {action}
    </div>
  );
}
