import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { inputClass } from './Input';

// eslint-disable-next-line react-refresh/only-export-components -- shared debounce helper lives with the input
export function useDebounced(value, ms = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function SearchInput({ value, onChange, placeholder = 'Search…', className = '', ariaLabel }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
      <input
        type="search"
        value={value}
        aria-label={ariaLabel || placeholder}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} h-[38px] pl-9 pr-9`}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-ink-soft hover:bg-paper hover:text-ink"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
