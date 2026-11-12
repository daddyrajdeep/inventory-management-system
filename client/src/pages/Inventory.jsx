import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Package, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SearchInput from '../components/ui/SearchInput';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import NumberStepper from '../components/ui/NumberStepper';
import { useAuth } from '../context/AuthContext';
import { getStock, getMovements, stockIn, stockOut, adjustStock } from '../services/stockService';
import { formatDateTime } from '../utils/format';
import { animateNumber } from '../utils/motion';

// OWNER: Brijesh (Inventory: stock table, stock in / out / adjust)

const ACTIONS = {
  IN: { title: 'Stock in', button: 'Add stock', toast: 'Stock added' },
  OUT: { title: 'Stock out', button: 'Remove stock', toast: 'Stock removed' },
  ADJUST: { title: 'Adjust stock', button: 'Save adjustment', toast: 'Adjustment saved' },
};
const moveTone = { IN: 'ok', OUT: 'out', ADJUST: 'info' };
const statusTone = { ok: 'ok', low: 'low', out: 'out' };
const statusLabel = { ok: 'In stock', low: 'Low', out: 'Out' };

const statusOf = (p) => p.stockStatus || (p.quantity === 0 ? 'out' : p.quantity <= p.reorderLevel ? 'low' : 'ok');

export default function Inventory() {
  const { user } = useAuth();
  const canAdjust = user.role === 'admin' || user.role === 'manager';
  const [params, setParams] = useSearchParams();

  const tab = params.get('tab') === 'history' ? 'history' : 'stock';
  const statusFilter = params.get('status') || 'all';
  const hProduct = params.get('hProduct') || '';
  const hType = params.get('hType') || '';
  const hLimit = Math.min(Number(params.get('hLimit')) || 200, 1000);

  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState('');

  const [dialog, setDialog] = useState(null);
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(null);

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    let active = true;
    getStock()
      .then((stock) => { if (active) { setProducts(stock); setLoadError(''); } })
      .catch((err) => { if (active) { setLoadError(err.message); toast.error(err.message); } })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    let active = true;
    getMovements({ product: hProduct || undefined, type: hType || undefined, limit: hLimit })
      .then((m) => active && setMovements(m))
      .catch(() => {});
    return () => { active = false; };
  }, [hProduct, hType, hLimit, refreshKey]);

  // Deep link ?action=&product= opens the matching dialog once products are loaded
  const actionParam = params.get('action');
  const productParam = params.get('product');
  const [consumed, setConsumed] = useState(null);
  const deepKey = `${actionParam}|${productParam}`;
  if (products.length && deepKey !== consumed && (actionParam || productParam)) {
    setConsumed(deepKey);
    const p = products.find((x) => x.id === productParam);
    if (p && ['in', 'out', 'adjust'].includes(actionParam)) {
      const type = actionParam.toUpperCase();
      if (type !== 'ADJUST' || canAdjust) {
        setDialog({ product: p, type });
        setValue(type === 'ADJUST' ? String(p.quantity) : '');
        setReason('');
        setError('');
      }
    }
  }

  useEffect(() => {
    if (productParam && tab === 'stock') {
      document.querySelector(`[data-row-id="${productParam}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [productParam, tab, products]);

  useEffect(() => {
    if (!tick) return;
    const el = document.querySelector(`[data-qty-id="${tick.id}"]`);
    animateNumber(el, tick.from, tick.to);
  }, [tick, products]);

  const counts = useMemo(() => ({
    total: products.length,
    low: products.filter((p) => statusOf(p) === 'low').length,
    out: products.filter((p) => statusOf(p) === 'out').length,
  }), [products]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) => (statusFilter === 'all' || statusOf(p) === statusFilter) && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    );
  }, [products, query, statusFilter]);

  const openDialog = (product, type) => {
    setDialog({ product, type });
    setValue(type === 'ADJUST' ? String(product.quantity) : '');
    setReason('');
    setError('');
  };

  const preview = useMemo(() => {
    if (!dialog) return null;
    const n = Number(value);
    if (!Number.isInteger(n)) return null;
    const cur = dialog.product.quantity;
    const next = dialog.type === 'IN' ? cur + n : dialog.type === 'OUT' ? cur - n : n;
    return { cur, next };
  }, [dialog, value]);

  const validate = () => {
    const { product, type } = dialog;
    const n = Number(value);
    if (value === '' || !Number.isInteger(n)) return 'Enter a whole number';
    if (type !== 'ADJUST' && n < 1) return 'Quantity must be at least 1';
    if (type === 'OUT' && n > product.quantity) return `Only ${product.quantity} in stock`;
    if (type === 'ADJUST') {
      if (n < 0) return 'Quantity cannot be negative';
      if (n === product.quantity) return 'Stock is already at that quantity';
      if (!reason.trim()) return 'A reason is required for an adjustment';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    const { product, type } = dialog;
    setSaving(true);
    try {
      const args = { productId: product.id, quantity: value, reason };
      if (type === 'IN') await stockIn(args);
      if (type === 'OUT') await stockOut(args);
      if (type === 'ADJUST') await adjustStock({ productId: product.id, newQty: value, reason });
      toast.success(`${ACTIONS[type].toast} — ${product.name}`);
      setTick({ id: product.id, from: product.quantity, to: preview.next });
      setSaving(false);
      setDialog(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setSaving(false);
      setError(err.message);
      toast.error(err.message);
      setRefreshKey((k) => k + 1);
    }
  };

  const stockColumns = [
    { key: 'name', label: 'Product', render: (r) => (
      <div data-row-id={r.id}>
        <p className="font-medium text-ink">{r.name}</p>
        <p className="mono text-xs text-ink-soft">{r.sku}</p>
      </div>
    ) },
    { key: 'category', label: 'Category', render: (r) => r.category || '—' },
    { key: 'quantity', label: 'In stock', align: 'right', render: (r) => (
      <span><span className="num" data-qty-id={r.id}>{r.quantity}</span> <span className="text-ink-soft">{r.unit || 'pcs'}</span></span>
    ) },
    { key: 'reorderLevel', label: 'Reorder', align: 'right', num: true },
    { key: 'status', label: 'Status', render: (r) => { const s = statusOf(r); return <Badge tone={statusTone[s]} dot>{s === 'low' ? `Low: ${r.quantity}` : statusLabel[s]}</Badge>; } },
    { key: 'actions', label: '', align: 'right', render: (r) => (
      <div className="flex justify-end gap-0.5">
        <IconButton label={`Stock in ${r.name}`} className="text-ok" onClick={() => openDialog(r, 'IN')}><ArrowDownToLine size={16} /></IconButton>
        <IconButton label={`Stock out ${r.name}`} className="text-out" disabled={r.quantity === 0} onClick={() => openDialog(r, 'OUT')}><ArrowUpFromLine size={16} /></IconButton>
        {canAdjust && <IconButton label={`Adjust ${r.name}`} className="text-info" onClick={() => openDialog(r, 'ADJUST')}><SlidersHorizontal size={16} /></IconButton>}
      </div>
    ) },
  ];

  const historyColumns = [
    { key: 'createdAt', label: 'When', render: (r) => <span className="text-ink-soft">{formatDateTime(r.createdAt)}</span> },
    { key: 'productName', label: 'Product', render: (r) => r.productName ? <div><p className="font-medium text-ink">{r.productName}</p><p className="mono text-xs text-ink-soft">{r.sku}</p></div> : 'Unknown product' },
    { key: 'type', label: 'Type', render: (r) => <Badge tone={moveTone[r.type]}>{r.type}</Badge> },
    { key: 'change', label: 'Change', mono: true, render: (r) => `${r.previousQty} → ${r.newQty}` },
    { key: 'quantity', label: 'Qty', align: 'right', num: true },
    { key: 'reason', label: 'Reason', render: (r) => r.reason || '—' },
    { key: 'performedBy', label: 'By', render: (r) => r.performedBy || '—' },
    { key: 'ref', label: 'Ref', render: (r) => {
      if (r.referenceModel === 'Sale') return <a className="text-ink underline-offset-2 hover:underline" href={`/sales?sale=${r.referenceId}`}>Sale</a>;
      if (r.referenceModel === 'PurchaseOrder') return <a className="text-ink underline-offset-2 hover:underline" href={`/orders?order=${r.referenceId}`}>PO</a>;
      return <span className="text-ink-soft">Manual</span>;
    } },
  ];

  const action = dialog ? ACTIONS[dialog.type] : null;

  return (
    <>
      <PageHeader title="Inventory" subtitle="Stock levels and every movement, in one ledger." />

      <div className="mb-5 flex flex-wrap gap-6">
        {[['Products', counts.total, 'all'], ['Low stock', counts.low, 'low'], ['Out of stock', counts.out, 'out']].map(([label, n, filter]) => (
          <button key={label} type="button" onClick={() => { setParam('tab', ''); setParam('status', filter === 'all' ? '' : filter); }} className="text-left">
            <p className="num text-xl font-semibold text-ink">{n}</p>
            <p className="text-xs text-ink-soft">{label}</p>
          </button>
        ))}
      </div>

      <div className="mb-4">
        <Tabs value={tab} onChange={(v) => setParam('tab', v === 'stock' ? '' : v)} tabs={[{ value: 'stock', label: 'Stock levels' }, { value: 'history', label: 'Stock history' }]} />
      </div>

      {tab === 'stock' ? (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <SearchInput value={query} onChange={setQuery} placeholder="Search by name or SKU…" className="min-w-60 flex-1" />
            <Select value={statusFilter} onChange={(e) => setParam('status', e.target.value === 'all' ? '' : e.target.value)} aria-label="Filter by status" className="w-44">
              <option value="all">All stock</option>
              <option value="ok">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </Select>
          </div>
          <DataTable
            columns={stockColumns}
            rows={rows}
            loading={loading}
            empty={loadError ? <EmptyState title={loadError} action={<Button size="sm" variant="secondary" onClick={() => setRefreshKey((k) => k + 1)}>Retry</Button>} /> : <EmptyState icon={Package} title={query || statusFilter !== 'all' ? 'No products match these filters.' : 'No products yet.'} />}
          />
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <Select value={hProduct} onChange={(e) => setParam('hProduct', e.target.value)} aria-label="Filter by product" className="w-56">
              <option value="">All products</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Select value={hType} onChange={(e) => setParam('hType', e.target.value)} aria-label="Filter by type" className="w-40">
              <option value="">All types</option>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
              <option value="ADJUST">ADJUST</option>
            </Select>
          </div>
          <DataTable columns={historyColumns} rows={movements} loading={loading} empty={<EmptyState title="No movements yet." />} />
          {movements.length >= hLimit && hLimit < 1000 && (
            <div className="mt-3 flex justify-center">
              <Button variant="secondary" size="sm" onClick={() => setParam('hLimit', String(Math.min(hLimit + 200, 1000)))}>Load more</Button>
            </div>
          )}
          {hLimit >= 1000 && movements.length >= 1000 && <p className="mt-3 text-center text-xs text-ink-soft">Showing the latest 1000 movements.</p>}
        </>
      )}

      <Modal open={!!dialog} title={action ? `${action.title} — ${dialog.product.name}` : ''} onClose={() => !saving && setDialog(null)}>
        {dialog && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <p className="text-sm text-ink-soft">Current: <span className="num font-medium text-ink">{dialog.product.quantity}</span> {dialog.product.unit || 'pcs'}</p>
            <FormField label={dialog.type === 'ADJUST' ? 'New counted quantity' : 'Quantity'}>
              <NumberStepper
                value={value}
                onChange={(v) => { setValue(v); setError(''); }}
                min={dialog.type === 'ADJUST' ? 0 : 1}
                max={dialog.type === 'OUT' ? dialog.product.quantity : Infinity}
                ariaLabel="Quantity"
              />
            </FormField>
            {preview && (
              <p className="mono num text-sm text-ink-soft">{preview.cur} → <span className="font-medium text-ink">{preview.next}</span></p>
            )}
            <FormField label={dialog.type === 'ADJUST' ? 'Reason (required)' : 'Reason (optional)'} error={error} hint={dialog.type === 'ADJUST' ? 'Why is the count changing? e.g. Stock take, damage' : undefined}>
              <Input value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} placeholder={dialog.type === 'ADJUST' ? 'Stock take correction' : 'e.g. Supplier delivery'} />
            </FormField>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" loading={saving}>{action.button}</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
