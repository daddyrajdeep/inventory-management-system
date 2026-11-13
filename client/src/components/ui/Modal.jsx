import { X } from 'lucide-react';
import useOverlay from './useOverlay';
import IconButton from './IconButton';

export default function Modal({ open, title, onClose, children, maxWidth = 'max-w-md' }) {
  const ref = useOverlay(open, onClose);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(20,19,15,0.45)', animation: 'fade 200ms var(--ease) both' }}
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} rounded-lg border border-line bg-surface p-6 shadow-float`}
        style={{ animation: 'rise 200ms var(--ease) both' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}
