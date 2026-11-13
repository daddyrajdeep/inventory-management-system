import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Eye, Pencil, Plus, Power, Trash2, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Drawer from '../components/ui/Drawer';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import SearchInput, { useDebounced } from '../components/ui/SearchInput';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CopyButton from '../components/ui/CopyButton';
import { useAuth } from '../context/AuthContext';
import { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier } from '../services/supplierService';
import { getProducts } from '../services/productService';
import { getOrders } from '../services/orderService';
import { formatINR, formatDate, plural } from '../utils/format';
import { downloadCsv } from '../utils/csv';

const emptyForm = { name: '', contactPerson: '', email: '', phone: '', address: '', isActive: true };
const orderTone = { draft: 'neutral', ordered: 'info', received: 'ok', cancelled: 'out' };
const isActive = (s) => s.isActive !== false;
const orDash = (value) => (value == null || value === '' ? '—' : value);
const initials = (name) => (name ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const orderLabel = (status) => status[0].toUpperCase() + status.slice(1);

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Supplier name is required';
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email';
  if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone)) errors.phone = 'Enter a valid phone number';
  return errors;
}

export default function Suppliers() {
  const { user } = useAuth();
  const canWrite = user?.role === 'admin' || user?.role === 'manager';
  const [params, setParams] = useSearchParams();

  const search = params.get('search') ?? '';
  const statusParam = params.get('status');
  const status = ['active', 'inactive'].includes(statusParam) ? statusParam : 'all';
  const debouncedSearch = useDebounced(search, 200);

  const [suppliers, setSuppliers] = useState([]);
  const [totals, setTotals] = useState(null);
  const [productCounts, setProductCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [drawer, setDrawer] = useState(null);
  const [supplied, setSupplied] = useState({ id: null, rows: null, error: '' });
  const [poState, setPoState] = useState({ id: null, rows: null, error: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [del, setDel] = useState(null);
  const [delError, setDelError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next, { replace: true });
  };

  // Search and the Active tab are filtered by the server; Inactive is filtered here.
  useEffect(() => {
    let active = true;
    const q = {};
    if (debouncedSearch) q.search = debouncedSearch;
    if (status === 'active') q.active = true;
    getSuppliers(q)
      .then((list) => { if (active) { setSuppliers(list); setLoadError(''); } })
      .catch((err) => active && setLoadError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [debouncedSearch, status, refreshKey]);

  // The summary counts the whole book, so it stays true whatever the filters show.
  useEffect(() => {
    let active = true;
    getSuppliers()
      .then((list) => active && setTotals({ count: list.length, active: list.filter(isActive).length }))
      .catch(() => active && setTotals(null));
    return () => { active = false; };
  }, [refreshKey]);

  // One products fetch feeds every row's real supplied-product count.
  useEffect(() => {
    let active = true;
    getProducts({ includeInactive: true })
      .then((list) => {
        if (!active) return;
        const counts = new Map();
        list.forEach((p) => { if (p.supplierId) counts.set(p.supplierId, (counts.get(p.supplierId) ?? 0) + 1); });
        setProductCounts(counts);
      })
      .catch(() => active && setProductCounts(null));
    return () => { active = false; };
  }, [refreshKey]);

  const drawerId = drawer?.id ?? null;

  useEffect(() => {
    if (!drawerId) return;
    let active = true;
    getProducts({ supplier: drawerId, includeInactive: true })
      .then((list) => active && setSupplied({ id: drawerId, rows: list, error: '' }))
      .catch((err) => active && setSupplied({ id: drawerId, rows: [], error: err.message }));
    return () => { active = false; };
  }, [drawerId, refreshKey]);

  useEffect(() => {
    if (!drawerId || !canWrite) return;
    let active = true;
    getOrders()
      .then((list) => active && setPoState({ id: drawerId, rows: list.filter((o) => o.supplier === drawerId), error: '' }))
      .catch((err) => active && setPoState({ id: drawerId, rows: [], error: err.message }));
    return () => { active = false; };
  }, [drawerId, canWrite, refreshKey]);

  // Deep links (?new=1 opens the form; ?supplier=<id> opens the drawer once loaded)
  const supplierParam = params.get('supplier');
  const newParam = params.get('new');
  const [consumed, setConsumed] = useState(null);
  const deepKey = `${supplierParam}|${newParam}`;
  const ready = suppliers.length > 0 || !supplierParam;
  if (ready && deepKey !== consumed && (supplierParam || newParam)) {
    setConsumed(deepKey);
    if (newParam && canWrite) openForm(null);
    if (supplierParam) {
      const found = suppliers.find((s) => s.id === supplierParam);
      if (found) setDrawer(found);
    }
  }

  // A deep link can point at a supplier the current filters hide, so ask for it directly.
  useEffect(() => {
    if (!supplierParam || suppliers.some((s) => s.id === supplierParam)) return;
    let active = true;
    getSupplierById(supplierParam)
      .then((s) => active && setDrawer(s))
      .catch(() => {});
    return () => { active = false; };
  }, [supplierParam, suppliers]);

  const refresh = () => setRefreshKey((k) => k + 1);
  const rows = useMemo(() => (status === 'inactive' ? suppliers.filter((s) => !isActive(s)) : suppliers), [suppliers, status]);
  const suppliedRows = supplied.id === drawerId ? supplied.rows : null;
  const orderRows = poState.id === drawerId ? poState.rows : null;
  const filtered = search !== '' || status !== 'all';

  const openDrawer = (s) => { setDrawer(s); setParam('supplier', s.id); };
  const closeDrawer = () => { setDrawer(null); setParam('supplier', ''); };
  const closeForm = () => { setFormOpen(false); setParam('new', ''); };

  function openForm(supplier) {
    setEditing(supplier);
    setForm(supplier ? {
      name: supplier.name ?? '', contactPerson: supplier.contactPerson ?? '', email: supplier.email ?? '',
      phone: supplier.phone ?? '', address: supplier.address ?? '', isActive: isActive(supplier),
    } : { ...emptyForm });
    setErrors({});
    setFormError('');
    setFormOpen(true);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length || saving) return;
    const payload = {
      name: form.name.trim(), contactPerson: form.contactPerson.trim(), email: form.email.trim(),
      phone: form.phone.trim(), address: form.address.trim(),
      ...(editing ? { isActive: form.isActive } : {}),
    };
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        const updated = await updateSupplier(editing.id, payload);
        toast.success('Changes saved');
        if (drawer?.id === editing.id) setDrawer(updated);
      } else {
        await createSupplier(payload);
        toast.success('Supplier created');
      }
      setSaving(false);
      closeForm();
      refresh();
    } catch (err) {
      setSaving(false);
      setFormError(err.message);
    }
  };

  const toggleActive = async (s) => {
    setToggling(s.id);
    try {
      const updated = await updateSupplier(s.id, { isActive: !isActive(s) });
      toast.success(isActive(updated) ? 'Supplier activated' : 'Supplier deactivated');
      setToggling(null);
      if (drawer?.id === s.id) setDrawer(updated);
      refresh();
    } catch (err) {
      setToggling(null);
      toast.error(err.message);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    setDelError('');
    try {
      await deleteSupplier(del.id);
      toast.success('Supplier deleted');
      setDeleting(false);
      setDel(null);
      closeDrawer();
      refresh();
    } catch (err) {
      setDeleting(false);
      setDelError(err.message);
    }
  };

  const deactivateInstead = async () => {
    setDeleting(true);
    try {
      await updateSupplier(del.id, { isActive: false });
      toast.success('Supplier deactivated');
      setDeleting(false);
      setDel(null);
      closeDrawer();
      refresh();
    } catch (err) {
      setDeleting(false);
      setDelError(err.message);
    }
  };

  const exportCsv = () => {
    const header = ['Supplier', 'Contact person', 'Email', 'Phone', 'Address', 'Status', 'Products'];
    downloadCsv('stockflow-suppliers.csv', [header, ...rows.map((s) => [
      s.name, s.contactPerson, s.email, s.phone, s.address,
      isActive(s) ? 'Active' : 'Inactive', productCounts?.get(s.id) ?? 0,
    ])]);
  };

  const actions = (s) => (
    <div className="flex justify-end gap-0.5">
      <IconButton label={`View ${s.name}`} onClick={() => openDrawer(s)}><Eye size={16} /></IconButton>
      {canWrite && (
        <>
          <IconButton label={`Edit ${s.name}`} onClick={() => openForm(s)}><Pencil size={16} /></IconButton>
          <IconButton
            label={isActive(s) ? `Deactivate ${s.name}` : `Activate ${s.name}`}
            disabled={toggling === s.id}
            onClick={() => toggleActive(s)}
          >
            <Power size={16} />
          </IconButton>
          <IconButton label={`Delete ${s.name}`} className="text-out" onClick={() => { setDel(s); setDelError(''); }}><Trash2 size={16} /></IconButton>
        </>
      )}
    </div>
  );

  const columns = [
    { key: 'name', label: 'Supplier', render: (s) => (
      <div className="flex items-center gap-3">
        <Avatar name={s.name} className="h-8 w-8 text-xs" />
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{s.name}</p>
          <p className="truncate text-xs text-ink-soft">{orDash(s.contactPerson)}</p>
        </div>
      </div>
    ) },
    { key: 'email', label: 'Email', render: (s) => s.email ? (
      <span className="inline-flex items-center gap-1">
        <a className="text-ink underline-offset-2 hover:underline" href={`mailto:${s.email}`}>{s.email}</a>
        <CopyButton value={s.email} label={`Copy email for ${s.name}`} />
      </span>
    ) : '—' },
    { key: 'phone', label: 'Phone', render: (s) => s.phone ? <a className="num text-ink underline-offset-2 hover:underline" href={`tel:${s.phone}`}>{s.phone}</a> : '—' },
    { key: 'address', label: 'Address', render: (s) => s.address ? <span className="block max-w-56 truncate text-ink-soft" title={s.address}>{s.address}</span> : '—' },
    { key: 'status', label: 'Status', render: (s) => <Badge tone={isActive(s) ? 'ok' : 'neutral'} dot>{isActive(s) ? 'Active' : 'Inactive'}</Badge> },
    { key: 'products', label: 'Products', align: 'right', render: (s) => {
      if (!productCounts) return <span className="text-ink-soft">—</span>;
      const count = productCounts.get(s.id) ?? 0;
      return count === 0
        ? <span className="num text-ink-soft">0</span>
        : <a className="num text-ink underline-offset-2 hover:underline" href={`/products?supplier=${encodeURIComponent(s.name)}`}>{count}</a>;
    } },
    { key: 'actions', label: '', align: 'right', render: actions },
  ];

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="Who you buy from."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportCsv} disabled={!rows.length} title="Exports the suppliers currently listed"><Download size={16} /> Export CSV</Button>
            {canWrite && <Button onClick={() => openForm(null)}><Plus size={16} /> New supplier</Button>}
          </div>
        }
      />

      <p className="mb-4 text-sm text-ink-soft">
        {totals ? <><span className="num">{plural(totals.count, 'supplier')}</span> · <span className="num">{totals.active}</span> active</> : '—'}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={(v) => setParam('search', v)} placeholder="Search by name, contact, email or phone…" className="min-w-50 flex-1" />
      </div>

      <div className="mb-4">
        <Tabs
          value={status}
          onChange={(v) => setParam('status', v === 'all' ? '' : v)}
          ariaLabel="Supplier status"
          tabs={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={openDrawer}
        empty={loadError ? (
          <EmptyState title={loadError} action={<Button size="sm" variant="secondary" onClick={refresh}>Retry</Button>} />
        ) : (
          <EmptyState
            icon={Truck}
            title={filtered ? 'No suppliers match these filters.' : 'No suppliers yet.'}
            action={filtered
              ? <Button size="sm" variant="secondary" onClick={() => setParams({}, { replace: true })}>Clear filters</Button>
              : canWrite ? <Button size="sm" onClick={() => openForm(null)}>Add your first supplier</Button> : undefined}
          />
        )}
      />

      {/* Supplier drawer */}
      <Drawer
        open={!!drawer}
        title={drawer?.name ?? ''}
        onClose={closeDrawer}
        footer={drawer && canWrite ? (
          <div className="flex justify-between gap-2">
            <Button variant="ghost" className="text-out" onClick={() => { setDel(drawer); setDelError(''); }}>Delete</Button>
            <div className="flex gap-2">
              <Button variant="secondary" loading={toggling === drawer.id} onClick={() => toggleActive(drawer)}>{isActive(drawer) ? 'Deactivate' : 'Activate'}</Button>
              <Button onClick={() => openForm(drawer)}>Edit</Button>
            </div>
          </div>
        ) : null}
      >
        {drawer && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={drawer.name} className="h-10 w-10 text-sm" />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{drawer.name}</p>
                <p className="truncate text-xs text-ink-soft">{orDash(drawer.contactPerson)}</p>
              </div>
              <span className="ml-auto shrink-0"><Badge tone={isActive(drawer) ? 'ok' : 'neutral'} dot>{isActive(drawer) ? 'Active' : 'Inactive'}</Badge></span>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <Meta label="Contact person" value={orDash(drawer.contactPerson)} />
              <Meta label="Phone" value={drawer.phone ? <a className="num text-ink underline-offset-2 hover:underline" href={`tel:${drawer.phone}`}>{drawer.phone}</a> : '—'} />
              <Meta
                wide
                label="Email"
                value={drawer.email ? (
                  <span className="inline-flex items-center gap-1">
                    <a className="text-ink underline-offset-2 hover:underline" href={`mailto:${drawer.email}`}>{drawer.email}</a>
                    <CopyButton value={drawer.email} label={`Copy email for ${drawer.name}`} />
                  </span>
                ) : '—'}
              />
              <Meta wide label="Address" value={orDash(drawer.address)} />
              <Meta label="Created" value={formatDate(drawer.createdAt)} />
            </dl>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-ink">Supplied products</h3>
              {suppliedRows === null ? <p className="text-xs text-ink-soft">Loading…</p>
                : supplied.error ? <p className="text-xs text-out">{supplied.error}</p>
                : suppliedRows.length === 0 ? <p className="text-xs text-ink-soft">No products from this supplier yet.</p>
                : (
                  <ul className="overflow-hidden rounded-md border border-line">
                    {suppliedRows.map((p) => (
                      <li key={p.id} className="border-b border-line last:border-0">
                        <a href={`/products?product=${p.id}`} className="flex items-center gap-3 px-3 py-2 transition-colors duration-[120ms] hover:bg-paper">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-ink">{p.name}</span>
                            <span className="mono block truncate text-xs text-ink-soft">{p.sku}</span>
                          </span>
                          {p.isActive === false && <Badge tone="neutral">Inactive</Badge>}
                          <span className="num shrink-0 text-[13px] text-ink-soft">{p.quantity} {p.unit ?? 'pcs'}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
            </section>

            {canWrite && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-ink">Purchase orders</h3>
                {orderRows === null ? <p className="text-xs text-ink-soft">Loading…</p>
                  : poState.error ? <p className="text-xs text-out">{poState.error}</p>
                  : orderRows.length === 0 ? <p className="text-xs text-ink-soft">No purchase orders yet.</p>
                  : (
                    <ul className="overflow-hidden rounded-md border border-line">
                      {orderRows.map((o) => (
                        <li key={o.id} className="border-b border-line last:border-0">
                          <a href={`/orders?order=${o.id}`} className="flex items-center gap-3 px-3 py-2 transition-colors duration-[120ms] hover:bg-paper">
                            <span className="mono text-[13px] text-ink">{o.orderNumber}</span>
                            <Badge tone={orderTone[o.status]}>{orderLabel(o.status)}</Badge>
                            <span className="num ml-auto text-[13px] text-ink">{formatINR(o.totalAmount)}</span>
                            <span className="shrink-0 text-xs text-ink-soft">{formatDate(o.createdAt)}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
              </section>
            )}
          </div>
        )}
      </Drawer>

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        title={editing ? 'Edit supplier' : 'New supplier'}
        maxWidth="max-w-lg"
        onClose={() => !saving && closeForm()}
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Name" error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Contact person"><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Email" error={errors.email}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
            <FormField label="Phone" error={errors.phone}><Input type="tel" className="num" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
          </div>
          <FormField label="Address"><Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></FormField>
          {editing && (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-ink" />
              Active (inactive suppliers stay on file but are left out of new purchase orders)
            </label>
          )}
          {formError && <p className="text-[13px] text-out" role="alert">{formError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={closeForm}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create supplier'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!del}
        title={`Delete ${del?.name ?? ''}`}
        body={delError ? (
          <div className="space-y-3">
            <p className="text-out">{delError}</p>
            <Button size="sm" onClick={deactivateInstead} loading={deleting}>Deactivate instead</Button>
          </div>
        ) : 'This cannot be undone. Suppliers used by products or purchase orders cannot be deleted.'}
        confirmLabel="Delete supplier"
        danger
        loading={deleting}
        onConfirm={doDelete}
        onClose={() => !deleting && (setDel(null), setDelError(''))}
      />
    </>
  );
}

function Avatar({ name, className = '' }) {
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full bg-paper font-semibold text-ink ${className}`}>
      {initials(name)}
    </span>
  );
}

function Meta({ label, value, wide = false }) {
  return <div className={wide ? 'col-span-2' : ''}><dt className="text-xs text-ink-soft">{label}</dt><dd className="text-ink">{value}</dd></div>;
}