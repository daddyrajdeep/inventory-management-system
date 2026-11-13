import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Drawer from '../components/ui/Drawer';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import SearchInput, { useDebounced } from '../components/ui/SearchInput';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CopyButton from '../components/ui/CopyButton';
import { useAuth } from '../context/AuthContext';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../services/productService';
import { getCategories } from '../services/categoryService';
import { getSuppliers } from '../services/supplierService';
import { getMovements } from '../services/stockService';
import { formatINR, formatDate, timeAgo } from '../utils/format';

// OWNER: Rudra (Products)
const emptyForm = { name: '', sku: '', category: '', supplier: '', price: '', costPrice: '', reorderLevel: '', unit: '', barcode: '', description: '', isActive: true };
const statusTone = { ok: 'ok', low: 'low', out: 'out' };
const statusOf = (p) => p.stockStatus || (p.quantity === 0 ? 'out' : p.quantity <= p.reorderLevel ? 'low' : 'ok');
const statusText = (p) => { const s = statusOf(p); return s === 'out' ? 'Out' : s === 'low' ? `Low: ${p.quantity}` : 'In stock'; };

function validate(form) {
  const errors = {};
  const price = Number(form.price); const costPrice = Number(form.costPrice); const reorderLevel = Number(form.reorderLevel);
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.sku.trim()) errors.sku = 'SKU is required';
  else if (!/^[A-Za-z0-9-]+$/.test(form.sku.trim())) errors.sku = 'Use letters, numbers, and hyphens only';
  if (!form.category.trim()) errors.category = 'Category is required';
  if (!form.price.trim()) errors.price = 'Price is required';
  else if (!Number.isFinite(price) || price < 0) errors.price = 'Enter a number ≥ 0';
  if (form.costPrice.trim() && (!Number.isFinite(costPrice) || costPrice < 0)) errors.costPrice = 'Enter a number ≥ 0';
  if (form.reorderLevel.trim() && (!Number.isFinite(reorderLevel) || reorderLevel < 0)) errors.reorderLevel = 'Enter a number ≥ 0';
  if (form.costPrice.trim() && Number.isFinite(costPrice) && Number.isFinite(price) && costPrice > price) errors.costPrice = 'Cost price must not exceed price';
  return errors;
}

export default function Products() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';
  const [params, setParams] = useSearchParams();

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const supplier = params.get('supplier') || '';
  const status = params.get('status') || '';
  const inactive = params.get('inactive') === '1';
  const view = params.get('view') || localStorage.getItem('sf.productsView') || 'table';
  const debouncedSearch = useDebounced(search, 200);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [drawer, setDrawer] = useState(null);
  const [moves, setMoves] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);
  const [delError, setDelError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    let active = true;
    const q = {};
    if (debouncedSearch) q.search = debouncedSearch;
    if (category) q.category = category;
    if (supplier) q.supplier = supplier;
    if (status) q.status = status;
    if (inactive) q.includeInactive = true;
    getProducts(q)
      .then((list) => { if (active) { setProducts(list); setLoadError(''); } })
      .catch((err) => active && setLoadError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [debouncedSearch, category, supplier, status, inactive, refreshKey]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getSuppliers().then(setSuppliers).catch(() => {});
  }, []);

  useEffect(() => {
    if (drawer) getMovements({ product: drawer.id, limit: 5 }).then(setMoves).catch(() => setMoves([]));
  }, [drawer]);

  // Deep links (?new=1 opens the form; ?product=<id> opens the drawer once loaded)
  const productParam = params.get('product');
  const newParam = params.get('new');
  const [consumed, setConsumed] = useState(null);
  const deepKey = `${productParam}|${newParam}`;
  const ready = products.length > 0 || !productParam;
  if (ready && deepKey !== consumed && (productParam || newParam)) {
    setConsumed(deepKey);
    if (newParam) openForm(null);
    if (productParam) {
      const p = products.find((x) => x.id === productParam);
      if (p) setDrawer(p);
    }
  }

  const refresh = () => setRefreshKey((k) => k + 1);
  const setView = (v) => { localStorage.setItem('sf.productsView', v); setParam('view', v); };

  function openForm(product) {
    setEditing(product);
    setForm(product ? {
      name: product.name ?? '', sku: product.sku ?? '', category: product.category ?? '', supplier: product.supplier ?? '',
      price: String(product.price ?? ''), costPrice: product.costPrice == null ? '' : String(product.costPrice),
      reorderLevel: product.reorderLevel == null ? '' : String(product.reorderLevel), unit: product.unit ?? '',
      barcode: product.barcode ?? '', description: product.description ?? '', isActive: product.isActive !== false,
    } : { ...emptyForm });
    setErrors({});
    setFormOpen(true);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    const payload = {
      name: form.name.trim(), sku: form.sku.trim().toUpperCase(), category: form.category.trim(),
      supplier: form.supplier || undefined, price: Number(form.price),
      costPrice: form.costPrice.trim() ? Number(form.costPrice) : 0,
      reorderLevel: form.reorderLevel.trim() ? Number(form.reorderLevel) : 10,
      unit: form.unit.trim() || 'pcs', barcode: form.barcode.trim() || undefined, description: form.description.trim(),
      ...(editing ? { isActive: form.isActive } : {}),
    };
    setSaving(true);
    try {
      if (editing) { await updateProduct(editing.id, payload); toast.success('Changes saved'); }
      else { await createProduct(payload); toast.success('Product created'); }
      setSaving(false);
      setFormOpen(false);
      setParam('new', '');
      refresh();
    } catch (err) {
      setSaving(false);
      toast.error(err.message);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    setDelError('');
    try {
      await deleteProduct(del.id);
      toast.success('Product deleted');
      setDeleting(false);
      setDel(null);
      setDrawer(null);
      refresh();
    } catch (err) {
      setDeleting(false);
      setDelError(err.message);
    }
  };

  const deactivateInstead = async () => {
    setDeleting(true);
    try {
      await updateProduct(del.id, { isActive: false });
      toast.success('Product deactivated');
      setDeleting(false);
      setDel(null);
      setDrawer(null);
      refresh();
    } catch (err) {
      setDeleting(false);
      setDelError(err.message);
    }
  };

  const actions = (p) => (
    <div className="flex justify-end gap-0.5">
      <IconButton label={`View ${p.name}`} onClick={() => { setDrawer(p); setParam('product', p.id); }}><Eye size={16} /></IconButton>
      {canManage && <IconButton label={`Edit ${p.name}`} onClick={() => openForm(p)}><Pencil size={16} /></IconButton>}
      {canDelete && <IconButton label={`Delete ${p.name}`} className="text-out" onClick={() => { setDel(p); setDelError(''); }}><Trash2 size={16} /></IconButton>}
    </div>
  );

  const columns = [
    { key: 'name', label: 'Product', render: (p) => <div><p className="font-medium text-ink">{p.name}</p><p className="mono text-xs text-ink-soft">{p.sku}</p></div> },
    { key: 'category', label: 'Category', render: (p) => p.category ? <Badge tone="neutral">{p.category}</Badge> : '—' },
    { key: 'price', label: 'Price', align: 'right', num: true, render: (p) => formatINR(p.price) },
    { key: 'costPrice', label: 'Cost', align: 'right', num: true, render: (p) => <span className="text-ink-soft">{formatINR(p.costPrice || 0)}</span> },
    { key: 'quantity', label: 'Stock', align: 'right', render: (p) => <span className="num">{p.quantity} <span className="text-ink-soft">{p.unit || 'pcs'}</span></span> },
    { key: 'status', label: 'Status', render: (p) => <Badge tone={statusTone[statusOf(p)]} dot>{statusText(p)}</Badge> },
    ...(inactive ? [{ key: 'active', label: 'Active', render: (p) => p.isActive === false ? <Badge tone="neutral">Inactive</Badge> : <span className="text-ink-soft">Active</span> }] : []),
    { key: 'actions', label: '', align: 'right', render: actions },
  ];

  const filteredEmpty = search || category || supplier || status;

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Your catalog and stock status."
        action={
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <Tabs value={view} onChange={setView} ariaLabel="View" tabs={[{ value: 'table', label: 'Table' }, { value: 'grid', label: 'Grid' }]} />
            </div>
            {canManage && <Button onClick={() => openForm(null)}><Plus size={16} /> New product</Button>}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={(v) => setParam('search', v)} placeholder="Search by name or SKU…" className="min-w-50 flex-1" />
        <Select value={category} onChange={(e) => setParam('category', e.target.value)} aria-label="Category" className="w-44">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setParam('status', e.target.value)} aria-label="Stock status" className="w-40">
          <option value="">All stock</option>
          <option value="ok">In stock</option>
          <option value="low">Low</option>
          <option value="out">Out</option>
        </Select>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={inactive} onChange={(e) => setParam('inactive', e.target.checked ? '1' : '')} className="accent-ink" />
          Include inactive
        </label>
      </div>

      {view === 'table' ? (
        <DataTable
          columns={columns}
          rows={products}
          loading={loading}
          onRowClick={(p) => { setDrawer(p); setParam('product', p.id); }}
          empty={loadError ? <EmptyState title={loadError} action={<Button size="sm" variant="secondary" onClick={refresh}>Retry</Button>} /> : <EmptyState icon={Package} title={filteredEmpty ? 'No products match these filters.' : 'No products yet.'} action={filteredEmpty ? <Button size="sm" variant="secondary" onClick={() => setParams({}, { replace: true })}>Clear filters</Button> : canManage ? <Button size="sm" onClick={() => openForm(null)}>Create your first product</Button> : undefined} />}
        />
      ) : loading ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : products.length === 0 ? (
        <Card><EmptyState icon={Package} title={filteredEmpty ? 'No products match these filters.' : 'No products yet.'} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((p) => (
            <Card key={p.id} interactive className="cursor-pointer" onClick={() => { setDrawer(p); setParam('product', p.id); }}>
              <div className="flex items-start justify-between gap-2">
                <div><h3 className="font-medium text-ink">{p.name}</h3><p className="mono text-xs text-ink-soft">{p.sku}</p></div>
                {p.isActive === false && <Badge tone="neutral">Inactive</Badge>}
              </div>
              <p className="mt-2 text-xs text-ink-soft">{p.category || '—'}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="num font-semibold text-ink">{formatINR(p.price)}</span>
                <Badge tone={statusTone[statusOf(p)]} dot>{statusText(p)}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Product drawer */}
      <Drawer
        open={!!drawer}
        title={drawer?.name || ''}
        onClose={() => { setDrawer(null); setParam('product', ''); }}
        footer={drawer && (canManage || canDelete) ? (
          <div className="flex justify-between gap-2">
            {canDelete ? <Button variant="ghost" className="text-out" onClick={() => { setDel(drawer); setDelError(''); }}>Delete</Button> : <span />}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { window.location.href = `/inventory?action=in&product=${drawer.id}`; }}>Stock in</Button>
              {canManage && <Button onClick={() => openForm(drawer)}>Edit product</Button>}
            </div>
          </div>
        ) : null}
      >
        {drawer && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono inline-flex items-center gap-1 text-sm text-ink-soft">{drawer.sku}<CopyButton value={drawer.sku} /></span>
              <Badge tone={statusTone[statusOf(drawer)]} dot>{statusText(drawer)}</Badge>
              {drawer.isActive === false && <Badge tone="neutral">Inactive</Badge>}
            </div>
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <Fact label="Category" value={drawer.category || '—'} />
              <Fact label="Supplier" value={drawer.supplier || '—'} />
              <Fact label="Unit" value={drawer.unit || 'pcs'} />
              <Fact label="Barcode" value={drawer.barcode || '—'} mono />
              <Fact label="Price" value={formatINR(drawer.price)} />
              <Fact label="Cost price" value={formatINR(drawer.costPrice || 0)} />
              <Fact label="Reorder level" value={drawer.reorderLevel} />
              <Fact label="Created" value={formatDate(drawer.createdAt)} />
            </dl>
            <div className="rounded-md border border-line p-4">
              <p className="num text-2xl font-semibold text-ink">{drawer.quantity} <span className="text-sm font-normal text-ink-soft">{drawer.unit || 'pcs'}</span></p>
              <p className="text-xs text-ink-soft">Reorder level {drawer.reorderLevel}</p>
              <div className="mt-3 space-y-1.5">
                {moves.length === 0 ? <p className="text-xs text-ink-soft">No movements yet.</p> : moves.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    <Badge tone={m.type === 'IN' ? 'ok' : m.type === 'OUT' ? 'out' : 'info'}>{m.type}</Badge>
                    <span className="mono num text-ink-soft">{m.previousQty} → {m.newQty}</span>
                    <span className="ml-auto text-ink-soft">{timeAgo(m.createdAt)}</span>
                  </div>
                ))}
              </div>
              <a className="mt-3 inline-block text-xs text-ink underline-offset-2 hover:underline" href={`/inventory?product=${drawer.id}&tab=history`}>View full history</a>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create / edit drawer */}
      <Drawer
        open={formOpen}
        title={editing ? 'Edit product' : 'New product'}
        width="min(520px, 100vw)"
        onClose={() => !saving && (setFormOpen(false), setParam('new', ''))}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setFormOpen(false); setParam('new', ''); }}>Cancel</Button>
            <Button form="product-form" type="submit" loading={saving}>{editing ? 'Save changes' : 'Create product'}</Button>
          </div>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Name" error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="SKU" error={errors.sku}><Input className="mono" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} onBlur={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} /></FormField>
          <FormField label="Category" error={errors.category} hint="New names create a category">
            <Input list="cat-list" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <datalist id="cat-list">{categories.map((c) => <option key={c.id} value={c.name} />)}</datalist>
          </FormField>
          <FormField label="Supplier">
            <Select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
              <option value="">None</option>
              {suppliers.filter((s) => s.isActive).map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Price" error={errors.price}><Input type="number" min="0" step="any" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></FormField>
            <FormField label="Cost price" error={errors.costPrice}><Input type="number" min="0" step="any" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></FormField>
            <FormField label="Reorder level" error={errors.reorderLevel}><Input type="number" min="0" step="1" placeholder="10" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} /></FormField>
            <FormField label="Unit"><Input placeholder="pcs" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></FormField>
          </div>
          <FormField label="Barcode"><Input className="mono" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          {editing && (
            <>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-ink" />
                Active (inactive products are hidden from lists but keep their history)
              </label>
              <p className="rounded-sm bg-paper px-3 py-2 text-[13px] text-ink-soft">Stock is managed from Inventory. Current: <span className="num font-medium text-ink">{editing.quantity}</span> units.</p>
            </>
          )}
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!del}
        title={`Delete ${del?.name}`}
        body={delError ? <div className="space-y-3"><p className="text-out">{delError}</p><Button size="sm" onClick={deactivateInstead} loading={deleting}>Deactivate instead</Button></div> : 'This cannot be undone. Products with stock or sales history cannot be deleted.'}
        confirmLabel="Delete product"
        danger
        loading={deleting}
        onConfirm={doDelete}
        onClose={() => !deleting && (setDel(null), setDelError(''))}
      />
    </>
  );
}

function Fact({ label, value, mono }) {
  return <div><dt className="text-xs text-ink-soft">{label}</dt><dd className={`text-ink ${mono ? 'mono' : ''}`}>{value}</dd></div>;
}
