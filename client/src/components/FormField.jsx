import { Children, cloneElement, isValidElement, useId } from 'react';

// Shared input style so every form in the app looks the same
export const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400';

// Usage:
// <FormField label="Name" error={errors.name}>
//   <input className={inputClass} value={name} onChange={...} />
// </FormField>
// The label is tied to a single child input (clicking it focuses the input; screen readers announce it).
export default function FormField({ label, error, children }) {
  const autoId = useId();
  const only = Children.count(children) === 1 && isValidElement(children) ? children : null;
  const id = only?.props.id ?? autoId;
  const errorId = `${id}-error`;
  const field = only
    ? cloneElement(only, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })
    : children;

  return (
    <div>
      <label htmlFor={only ? id : undefined} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {field}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
