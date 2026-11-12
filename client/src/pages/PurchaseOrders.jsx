import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, ClipboardList, Plus, Send, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Drawer from '../components/ui/Drawer';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CopyButton from '../components/ui/CopyButton';
import Stamp from '../components/ui/Stamp';
import NumberStepper from '../components/ui/NumberStepper';
import { getProducts } from '../services/productService';
import { getSuppliers } from '../services/supplierService';
import { getOrders, createOrder, updateOrderStatus, receiveOrder, cancelOrder } from '../services/orderService';
import { formatINR, formatDate } from '../utils/format';

// OWNER: Shilpa (Purchase Orders: list, create order, mark received)

const statusTone = { draft: 'neutral', ordered: 'info', received: 'ok', cancelled: 'out' };
const emptyItem = () => ({ product: '', quantity: 1, unitCost: '' });
const emptyForm = () => ({ supplier: '', expectedDate: '', notes: '', items: [emptyItem()] });
const today = () => new Date().toISOString().slice(0, 10);
const isOverdue = (o) => o.status === 'ordered' && o.expectedDate && o.expectedDate.slice(0, 10) < today();

export default function PurchaseOrders() {
  const [params, setParams] = useSearchParams();
  const statusFilter = params.get('status') || 'all';

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'receive'|'cancel', order }
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    let active = true;
    Promise.all([getOrders(), getSuppliers({ active: 'true' }), getProducts()])
      .then(([o, s, p]) => { if (active) { setOrders(o); setSuppliers(s); setProducts(p); setLoadError(''); } })
      .catch((err) => { if (active) { setLoadError(err.message); toast.error(err.message); } })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  // Deep links: ?new=1 opens create; ?order=<id> opens detail
  const newParam = params.get('new');
  const orderParam = params.get('order');
  const [consumed, setConsumed] = useState(null);
  const deepKey = `${newParam}|${orderParam}`;
  if (orders.length && deepKey !== consumed && (newParam || orderParam)) {
    setConsumed(deepKey);
    if (newParam) { setForm(emptyForm()); setErrors({}); setCreateOpen(true); }
    const o = orders.find((x) => x.id === orderParam);
    if (o) setViewing(o);
  }

  const counts = useMemo(() => {
    const c = { all: orders.length, draft: 0, ordered: 0, received: 0, cancelled: 0 };
    orders.forEach((o) => { c[o.status] += 1; });
    return c;
  }, [orders]);

  const rows = useMemo(() => (statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)), [orders, statusFilter]);
  const formTotal = form.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0);

  const setField = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })); };
  const setItem = (index, key, value) => {
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === index ? { ...it, [key]: value } : it)) }));
    setErrors((e) => ({ ...e, items: undefined }));
  };
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (index) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  const validate = () => {
    const e = {};
    if (!form.supplier) e.supplier = 'Choose a supplier';
    if (!form.items.length) e.items = 'Add at least one item';
    else {
      const picked = form.items.map((i) => i.product);
      for (const it of form.items) {
        const qty = Number(it.quantity); const cost = Number(it.unitCost);
        if (!it.product) e.items = 'Choose a product for every row';
        else if (picked.filter((p) => p === it.product).length > 1) e.items = 'Each product can appear only once';
        else if (!Number.isInteger(qty) || qty < 1) e.items = 'Quantity must be a whole number of at least 1';
        else if (it.unitCost === '' || Number.isNaN(cost) || cost < 0) e.items = 'Unit cost must be 0 or more';
        if (e.items) break;
      }
    }
    return e;
  };

  const handleCreate = async (status) => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length || saving) return;
    setSaving(true);
    try {
      const order = await createOrder({ ...form, status });
      toast.success(status === 'ordered' ? `Order placed — ${order.orderNumber}` : `Draft saved — ${order.orderNumber}`);
      setSaving(false);
      setCreateOpen(false);
      setParam('new', '');
      refresh();
    } catch (err) {
      setSaving(false);
      toast.error(err.message);
    }
  };

  const runAction = async (order, fn, successText) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const updated = await fn();
      toast.success(successText);
      if (updated && viewing?.id === order.id) setViewing(updated);
      refresh();
    } catch (err) {
      toast.error(err.message);
      refresh();
    } finally {
      inFlight.current = false;
      setBusy(false);
      setConfirm(null);
    }
  };

  const place = (o) => runAction(o, () => updateOrderStatus(o.id, 'ordered'), `Order placed — ${o.orderNumber}`);
  const doConfirm = () => {
    const { type, order } = confirm;
    if (type === 'receive') runAction(order, () => receiveOrder(order.id), `Order received — stock updated`);
    if (type === 'cancel') runAction(order, () => cancelOrder(order.id), `Order cancelled — ${order.orderNumber}`);
  };

  const rowActions = (o) => (
    <div className="flex justify-end gap-0.5">
      {o.status === 'draft' && <IconButton label={`Place ${o.orderNumber}`} onClick={() => place(o)}><Send size={16} /></IconButton>}
      {o.status === 'ordered' && <IconButton label={`Receive ${o.orderNumber}`} className="text-ok" onClick={() => setConfirm({ type: 'receive', order: o })}><CheckCircle2 size={16} /></IconButton>}
      {(o.status === 'draft' || o.status === 'ordered') && <IconButton label={`Cancel ${o.orderNumber}`} className="text-out" onClick={() => setConfirm({ type: 'cancel', order: o })}><X size={16} /></IconButton>}
    </div>
  );

  const columns = [
    { key: 'orderNumber', label: 'Order #', render: (r) => <span className="inline-flex items-center gap-1"><span className="mono">{r.orderNumber}</span><CopyButton value={r.orderNumber} /></span> },
    { key: 'supplierName', label: 'Supplier', render: (r) => r.supplierName || '—' },
    { key: 'items', label: 'Items', align: 'right', num: true, render: (r) => r.items.length },
    { key: 'totalAmount', label: 'Total', align: 'right', num: true, render: (r) => formatINR(r.totalAmount) },
    { key: 'expectedDate', label: 'Expected', render: (r) => r.expectedDate ? <span className={isOverdue(r) ? 'text-low' : ''}>{formatDate(r.expectedDate)}{isOverdue(r) && ' · Overdue'}</span> : '—' },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={statusTone[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</Badge> },
    { key: 'actions', label: '', align: 'right', render: rowActions },
  ];

  const tabs = ['all', 'draft', 'ordered', 'received', 'cancelled'].map((s) => ({ value: s, label: s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1), count: counts[s] }));

  return (
    <>
      <PageHeader title="Purchase Orders" subtitle="Order stock from suppliers and receive it into inventory." action={<Button onClick={() => { setForm(emptyForm()); setErrors({}); setCreateOpen(true); }}><Plus size={16} /> Create order</Button>} />

      <div className="mb-4"><Tabs value={statusFilter} onChange={(v) => setParam('status', v === 'all' ? '' : v)} tabs={tabs} /></div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={(r) => { setViewing(r); setParam('order', r.id); }}
        empty={loadError ? <EmptyState title={loadError} action={<Button size="sm" variant="secondary" onClick={refresh}>Retry</Button>} /> : <EmptyState icon={ClipboardList} title={statusFilter === 'all' ? 'No purchase orders yet.' : `No ${statusFilter} orders.`} action={statusFilter === 'all' ? <Button size="sm" onClick={() => setCreateOpen(true)}>Create order</Button> : undefined} />}
      />

      {/* Create drawer */}
      <Drawer
        open={createOpen}
        title="Create purchase order"
        width="min(560px, 100vw)"
        onClose={() => !saving && (setCreateOpen(false), setParam('new', ''))}
        footer={
          <div className="flex items-center justify-between gap-2">
            <span className="num text-sm text-ink-soft">Total <span className="text-base font-semibold text-ink">{formatINR(formTotal)}</span></span>
            <div className="flex gap-2">
              <Button variant="secondary" loading={saving} onClick={() => handleCreate('draft')}>Save draft</Button>
              <Button loading={saving} onClick={() => handleCreate('ordered')}>Place order</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Supplier" error={errors.supplier}>
            <Select value={form.supplier} onChange={(e) => setField('supplier', e.target.value)}>
              <option value="">Select supplier…</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Expected delivery date">
            <Input type="date" min={today()} value={form.expectedDate} onChange={(e) => setField('expectedDate', e.target.value)} />
          </FormField>
          <FormField label="Items" error={errors.items}>
            <div className="space-y-2">
              {form.items.map((it, index) => (
                <div key={index} className="rounded-sm border border-line p-2.5">
                  <Select value={it.product} onChange={(e) => setItem(index, 'product', e.target.value)} aria-label="Product">
                    <option value="">Select product…</option>
                    {products.map((p) => <option key={p.id} value={p.id} disabled={!p.isActive}>{p.name} ({p.sku}){!p.isActive ? ' — inactive' : ''}</option>)}
                  </Select>
                  <div className="mt-2 flex items-center gap-2">
                    <NumberStepper value={it.quantity} onChange={(v) => setItem(index, 'quantity', v)} min={1} ariaLabel="Quantity" />
                    <Input type="number" min="0" step="0.01" value={it.unitCost} onChange={(e) => setItem(index, 'unitCost', e.target.value)} placeholder="Unit cost" aria-label="Unit cost" className="w-28" />
                    <span className="num ml-auto text-sm text-ink-soft">{formatINR((Number(it.quantity) || 0) * (Number(it.unitCost) || 0))}</span>
                    <IconButton label="Remove item" className="text-out" onClick={() => removeItem(index)}><Trash2 size={15} /></IconButton>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addItem}><Plus size={14} /> Add item</Button>
            </div>
          </FormField>
          <FormField label="Notes (optional)">
            <Textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={2} />
          </FormField>
        </div>
      </Drawer>

      {/* Detail drawer */}
      <Drawer
        open={!!viewing}
        title={viewing?.orderNumber || ''}
        width="min(520px, 100vw)"
        onClose={() => { setViewing(null); setParam('order', ''); }}
        footer={viewing && (viewing.status === 'draft' || viewing.status === 'ordered') ? (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="text-out" onClick={() => setConfirm({ type: 'cancel', order: viewing })}>Cancel order</Button>
            {viewing.status === 'draft' && <Button variant="secondary" onClick={() => place(viewing)}>Place order</Button>}
            {viewing.status === 'ordered' && <Button onClick={() => setConfirm({ type: 'receive', order: viewing })}>Receive order</Button>}
          </div>
        ) : null}
      >
        {viewing && (
          <div className="space-y-5">
            <div className="relative flex items-center justify-between">
              <Badge tone={statusTone[viewing.status]}>{viewing.status[0].toUpperCase() + viewing.status.slice(1)}</Badge>
              {viewing.status === 'received' && <Stamp />}
            </div>

            <Lifecycle status={viewing.status} />

            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <Meta label="Supplier" value={viewing.supplierName || '—'} />
              <Meta label="Created by" value={viewing.createdBy || '—'} />
              <Meta label="Created" value={formatDate(viewing.createdAt)} />
              <Meta label="Expected" value={viewing.expectedDate ? formatDate(viewing.expectedDate) : '—'} />
              {viewing.receivedDate && <Meta label="Received" value={formatDate(viewing.receivedDate)} />}
            </dl>

            <div className="overflow-hidden rounded-md border border-line">
              <table className="min-w-full text-[13px]">
                <thead><tr className="border-b border-line text-xs text-ink-soft"><th className="px-3 py-2 text-left font-semibold">Product</th><th className="px-3 py-2 text-right font-semibold">Qty</th><th className="px-3 py-2 text-right font-semibold">Unit cost</th><th className="px-3 py-2 text-right font-semibold">Total</th></tr></thead>
                <tbody>
                  {viewing.items.map((i) => (
                    <tr key={i.product} className="border-b border-line last:border-0">
                      <td className="px-3 py-2"><p className="font-medium text-ink">{i.productName || 'Deleted product'}</p><p className="mono text-xs text-ink-soft">{i.sku || '—'}</p></td>
                      <td className="num px-3 py-2 text-right">{i.quantity}</td>
                      <td className="num px-3 py-2 text-right">{formatINR(i.unitCost)}</td>
                      <td className="num px-3 py-2 text-right">{formatINR(i.quantity * i.unitCost)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan={3} className="px-3 py-2 text-right text-xs font-medium text-ink-soft">Total</td><td className="num px-3 py-2 text-right text-base font-semibold text-ink">{formatINR(viewing.totalAmount)}</td></tr></tfoot>
              </table>
            </div>

            {viewing.notes && <p className="text-[13px] text-ink-soft">Notes: {viewing.notes}</p>}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'receive' ? `Receive ${confirm.order.orderNumber}` : `Cancel ${confirm?.order.orderNumber}`}
        body={confirm?.type === 'receive'
          ? `This adds ${confirm.order.items.map((i) => `${i.quantity} × ${i.productName || 'item'}`).join(', ')} to stock.`
          : 'This order will be cancelled. This cannot be undone.'}
        confirmLabel={confirm?.type === 'receive' ? 'Receive order' : 'Cancel order'}
        danger={confirm?.type === 'cancel'}
        loading={busy}
        onConfirm={doConfirm}
        onClose={() => !busy && setConfirm(null)}
      />
    </>
  );
}

function Meta({ label, value }) {
  return <div><dt className="text-xs text-ink-soft">{label}</dt><dd className="text-ink">{value}</dd></div>;
}

function Lifecycle({ status }) {
  if (status === 'cancelled') return <Badge tone="out">Cancelled</Badge>;
  const steps = ['draft', 'ordered', 'received'];
  const idx = steps.indexOf(status);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-medium ${i <= idx ? 'text-ink' : 'text-ink-soft'}`}>
            <span className={`h-2 w-2 rounded-full ${i < idx ? 'bg-ok' : i === idx ? 'bg-ink' : 'bg-line'}`} />
            {s[0].toUpperCase() + s.slice(1)}
          </span>
          {i < steps.length - 1 && <span className="h-px w-6 bg-line" />}
        </div>
      ))}
    </div>
  );
}
