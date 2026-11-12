import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ClipboardList, Search, ShoppingCart, Wallet } from 'lucide-react';
import useOverlay from './ui/useOverlay';
import Kbd from './ui/Kbd';
import Badge from './ui/Badge';
import { navItems } from '../config/navigation';
import { useAuth } from '../context/AuthContext';
import { getProducts } from '../services/productService';
import { useDebounced } from './ui/SearchInput';

const stockTone = { ok: 'ok', low: 'low', out: 'out' };

export default function CommandPalette({ open, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ref = useOverlay(open, onClose);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState(0);
  const debounced = useDebounced(query, 200);
  const inputRef = useRef(null);

  // Reset on open (render-time, not in an effect)
  const [seenOpen, setSeenOpen] = useState(open);
  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) {
      setQuery('');
      setProducts([]);
      setActive(0);
    }
  }

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || !debounced.trim()) return undefined;
    const controller = new AbortController();
    getProducts({ search: debounced.trim() }, { signal: controller.signal })
      .then((list) => setProducts(list.slice(0, 6)))
      .catch(() => {});
    return () => controller.abort();
  }, [debounced, open]);

  const go = useCallback(
    (path) => {
      onClose();
      navigate(path);
    },
    [onClose, navigate]
  );

  const pages = useMemo(
    () =>
      navItems
        .filter((i) => i.roles.includes(user.role))
        .filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
        .map((i) => ({ id: `page-${i.path}`, group: 'Pages', icon: i.icon, label: i.label, run: () => go(i.path) })),
    [query, user.role, go]
  );

  const actions = useMemo(() => {
    const all = [
      { id: 'a-sale', icon: ShoppingCart, label: 'New sale', roles: ['admin', 'manager', 'staff'], run: () => go('/sales?new=1') },
      { id: 'a-in', icon: Archive, label: 'Stock in', roles: ['admin', 'manager', 'staff'], run: () => go('/inventory?action=in') },
      { id: 'a-po', icon: ClipboardList, label: 'Create purchase order', roles: ['admin', 'manager'], run: () => go('/orders?new=1') },
      { id: 'a-exp', icon: Wallet, label: 'Add expense', roles: ['admin', 'manager'], run: () => go('/expenses?new=1') },
    ];
    return all
      .filter((a) => a.roles.includes(user.role))
      .filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
      .map((a) => ({ ...a, group: 'Actions' }));
  }, [query, user.role, go]);

  const productRows = debounced.trim()
    ? products.map((p) => ({
        id: `prod-${p.id}`,
        group: 'Products',
        label: p.name,
        sku: p.sku,
        status: p.stockStatus,
        run: () => go(`/products?product=${p.id}`),
      }))
    : [];

  const flat = [...pages, ...productRows, ...actions];
  const groups = ['Pages', 'Products', 'Actions'];

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flat[active]?.run();
    }
  };

  if (!open) return null;
  let cursor = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center px-4"
      style={{ backgroundColor: 'rgba(20,19,15,0.45)', animation: 'fade 160ms var(--ease) both' }}
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
        className="mt-[20vh] h-fit w-full max-w-[560px] overflow-hidden rounded-lg border border-line bg-surface shadow-float"
        style={{ animation: 'rise 200ms var(--ease) both' }}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search size={16} className="text-ink-soft" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search products or jump to…"
            aria-label="Search products or jump to"
            className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {flat.length === 0 && <p className="px-3 py-8 text-center text-sm text-ink-soft">No matches for “{query}”.</p>}
          {groups.map((group) => {
            const rows = flat.filter((r) => r.group === group);
            if (!rows.length) return null;
            return (
              <div key={group} className="mb-2">
                <p className="px-3 py-1 text-xs font-medium text-ink-soft">{group}</p>
                {rows.map((row) => {
                  cursor += 1;
                  const idx = cursor;
                  const Icon = row.icon;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onMouseEnter={() => setActive(idx)}
                      onClick={row.run}
                      className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm ${
                        idx === active ? 'bg-paper text-ink' : 'text-ink'
                      }`}
                    >
                      {Icon && <Icon size={16} className="shrink-0 text-ink-soft" />}
                      <span className="flex-1 truncate font-medium">{row.label}</span>
                      {row.sku && <span className="mono text-xs text-ink-soft">{row.sku}</span>}
                      {row.status && <Badge tone={stockTone[row.status]}>{row.status === 'ok' ? 'In stock' : row.status === 'low' ? 'Low' : 'Out'}</Badge>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 border-t border-line px-4 py-2 text-xs text-ink-soft">
          <span className="flex items-center gap-1"><Kbd>↑↓</Kbd> navigate</span>
          <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
          <span className="flex items-center gap-1"><Kbd>esc</Kbd> close</span>
        </div>
      </div>
    </div>
  );
}
