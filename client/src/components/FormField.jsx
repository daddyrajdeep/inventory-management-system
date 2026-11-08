// Shared input style so every form in the app looks the same
export const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400';

// Usage:
// <FormField label="Name" error={errors.name}>
//   <input className={inputClass} value={name} onChange={...} />
// </FormField>
export default function FormField({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
