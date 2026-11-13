import { Children, cloneElement, isValidElement, useId } from 'react';

export const inputClass =
  'w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors duration-[120ms] placeholder:text-ink-soft/70 focus:border-ink disabled:opacity-50';

// Binds the label to a single child input via useId; links error text with aria-describedby.
export default function FormField({ label, error, hint, children }) {
  const autoId = useId();
  const only = Children.count(children) === 1 && isValidElement(children) ? children : null;
  const id = only?.props.id ?? autoId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const field = only
    ? cloneElement(only, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined,
      })
    : children;

  return (
    <div>
      <label htmlFor={only ? id : undefined} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {field}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-out">
          {error}
        </p>
      )}
    </div>
  );
}
