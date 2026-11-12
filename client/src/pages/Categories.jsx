import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers3, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { formatDate, plural } from '../utils/format';

const emptyForm = { name: '', description: '' };

export default function Categories() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState(null);
  const [del, setDel] = useState(null);
  const [delError, setDelError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((list) => { if (active) { setCategories(list); setLoadError(''); } })
      .catch((err) => { if (active) { setLoadError(err.message); toast.error(err.message); } })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);
  const goToProducts = (name) => navigate(`/products?category=${encodeURIComponent(name)}`);

  const totalProducts = useMemo(() => categories.reduce((sum, c) => sum + (c.productCount ?? 0), 0), [categories]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = categories.filter((c) => !q || `${c.name} ${c.description ?? ''}`.toLowerCase().includes(q));
    const sorted = [...list];
    if (sort === 'products') sorted.sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0) || a.name.localeCompare(b.name));
    else if (sort === 'newest') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [categories, search, sort]);

  // Mirrors the server's case-insensitive exact-name check (excluding the row being edited).
  const nameTaken = useMemo(() => {
    const n = form.name.trim().toLowerCase();
    return !!n && categories.some((c) => c.id !== editing?.id && c.name.trim().toLowerCase() === n);
  }, [form.name, categories, editing]);

  function openForm(category) {
    setEditing(category);
    setForm(category ? { name: category.name ?? '', description: category.description ?? '' } : { ...emptyForm });
    setErrors({});
    setFormOpen(true);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) { setErrors({ name: 'Category name is required' }); return; }
    setErrors({});
    const payload = { name, description: form.description.trim() };
    setSaving(true);
    try {
      if (editing) { await updateCategory(editing.id, payload); toast.success('Changes saved'); }
      else { await createCategory(payload); toast.success('Category created'); }
      setSaving(false);
      setFormOpen(false);
      refresh();
    } catch (err) {
      setSaving(false);
      toast.error(err.message);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    setDelError(null);
    try {
      await deleteCategory(del.id);
      toast.success('Category deleted');
      setDeleting(false);
      setDel(null);
      refresh();
    } catch (err) {
      setDeleting(false);
      setDelError(err);
    }
  };

  const columns = [
    { key: 'name', label: 'Category', render: (c) => (
      <div>
        <p className="font-medium text-ink">{c.name}</p>
        <p className="text-xs text-ink-soft">{c.description || '—'}</p>
      </div>
    ) },
    { key: 'productCount', label: 'Products', align: 'right', num: true, render: (c) => (
      <button type="button" onClick={() => goToProducts(c.name)} className="num font-medium text-ink underline-offset-2 hover:underline">
        {c.productCount ?? 0}
      </button>
    ) },
    { key: 'createdAt', label: 'Created', render: (c) => <span className="text-ink-soft">{formatDate(c.createdAt)}</span> },
    ...(canManage ? [{ key: 'actions', label: '', align: 'right', render: (c) => (
      <div className="flex justify-end gap-0.5">
        <IconButton label={`Edit ${c.name}`} onClick={() => openForm(c)}><Pencil size={16} /></IconButton>
        <IconButton label={`Delete ${c.name}`} className="text-out" onClick={() => { setDel(c); setDelError(null); }}><Trash2 size={16} /></IconButton>
      </div>
    ) }] : []),
  ];

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Organize your catalog."
        action={canManage ? <Button onClick={() => openForm(null)}><Plus size={16} /> New category</Button> : undefined}
      />

      <p className="num mb-4 text-sm text-ink-soft">{plural(categories.length, 'category')} · {plural(totalProducts, 'product')}</p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or description…" className="min-w-50 flex-1" />
        <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className="w-44">
          <option value="name">Name A–Z</option>
          <option value="products">Most products</option>
          <option value="newest">Newest</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={(c) => (canManage ? openForm(c) : setDetail(c))}
        empty={loadError
          ? <EmptyState title={loadError} action={<Button size="sm" variant="secondary" onClick={refresh}>Retry</Button>} />
          : <EmptyState
              icon={Layers3}
              title={search ? 'No categories match your search.' : 'No categories yet.'}
              action={search
                ? <Button size="sm" variant="secondary" onClick={() => setSearch('')}>Clear search</Button>
                : canManage ? <Button size="sm" onClick={() => openForm(null)}>Create your first category</Button> : undefined}
            />}
      />

      {/* Read-only detail (staff) */}
      <Modal open={!!detail} title={detail?.name || ''} onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">{detail.description || 'No description provided.'}</p>
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <div><dt className="text-xs text-ink-soft">Products</dt><dd className="num text-ink">{detail.productCount ?? 0}</dd></div>
              <div><dt className="text-xs text-ink-soft">Created</dt><dd className="text-ink">{formatDate(detail.createdAt)}</dd></div>
            </dl>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => goToProducts(detail.name)}>View products</Button>
              <Button variant="ghost" onClick={() => setDetail(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / edit */}
      <Modal open={formOpen} title={editing ? 'Edit category' : 'New category'} onClose={() => { if (!saving) setFormOpen(false); }}>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Name" error={errors.name} hint={nameTaken ? 'A category with this name already exists' : undefined}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Accessories" autoFocus />
          </FormField>
          <FormField label="Description">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Briefly describe this category" />
          </FormField>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create category'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!del}
        title={`Delete ${del?.name}`}
        body={delError
          ? <div className="space-y-3">
              <p className="text-out">{delError.message}</p>
              {delError.response?.status === 409 && <Button size="sm" variant="secondary" onClick={() => goToProducts(del.name)}>View products</Button>}
            </div>
          : 'This cannot be undone. Categories used by products cannot be deleted.'}
        confirmLabel="Delete category"
        danger
        loading={deleting}
        onConfirm={doDelete}
        onClose={() => { if (!deleting) { setDel(null); setDelError(null); } }}
      />
    </>
  );
}