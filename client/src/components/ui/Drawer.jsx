import { X } from 'lucide-react';
import useOverlay from './useOverlay';
import IconButton from './IconButton';

export default function Drawer({ open, title, onClose, children, width = 'min(480px, 100vw)', footer }) {
  const ref = useOverlay(open, onClose);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      style={{ backgroundColor: 'rgba(20,19,15,0.45)', animation: 'fade 200ms var(--ease) both' }}
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{ width, animation: 'slidein 320ms var(--ease) both' }}
        className="flex h-full flex-col border-l border-line bg-surface shadow-float"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
        <style>{`@keyframes slidein { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      </div>
    </div>
  );
}
