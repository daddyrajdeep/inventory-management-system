import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyButton({ value, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied' : label}
      className="inline-flex h-6 w-6 items-center justify-center rounded text-ink-soft transition-colors hover:bg-paper hover:text-ink"
    >
      {copied ? <Check size={13} className="text-ok" /> : <Copy size={13} />}
      <span className="sr-only" aria-live="polite">
        {copied ? 'Copied' : ''}
      </span>
    </button>
  );
}
