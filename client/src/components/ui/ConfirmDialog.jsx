import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ open, title, body, confirmLabel = 'Confirm', danger = false, loading = false, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="text-sm text-ink-soft">{body}</div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
