import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Layers3, Package, PauseCircle, ShoppingBag, Search, Plus, Download,
  Upload, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Grid2X2,
  List, X, Headphones, Monitor, Keyboard, Laptop, Boxes, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';
import { downloadCsv } from '../utils/csv';
import './Categories.css';

const PAGE_SIZE = 5;
const MAX_PAGE_BUTTONS = 5;
const iconSet = [Headphones, Monitor, Keyboard, Laptop, Boxes];
const colors = ['violet', 'blue', 'pink', 'cyan', 'purple'];
const MANAGER_ROLES = ['admin', 'manager'];

const showDate = (value) => (value ? formatDate(value) : '—');

// Quote-aware CSV parser: handles "a, b", escaped "" quotes and newlines inside quotes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.map((r) => r.map((v) => v.trim())).filter((r) => r.some(Boolean));
}

export default function Categories() {
  const { user } = useAuth();
  const canManage = MANAGER_ROLES.includes(user?.role);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('list');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    let alive = true;
    getCategories().then((items) => {
      if (alive) setCategories(items);
    }).catch((err) => {
      if (!alive) return;
      setLoadError(err.message || 'Unable to load categories');
      toast.error(err.message || 'Unable to load categories');
    }).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const reload = async () => {
    try {
      setCategories(await getCategories());
      setLoadError('');
    } catch (err) {
      toast.error(err.message || 'Unable to reload categories');
    }
  };

  const inUseCount = categories.filter((c) => c.productCount > 0).length;
  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
  const filtered = useMemo(() => categories.filter((c) => {
    const q = search.trim().toLowerCase();
    return !q || `${c.name} ${c.description || ''}`.toLowerCase().includes(q);
  }), [categories, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(offset, offset + PAGE_SIZE);
  const firstButton = Math.max(1, Math.min(currentPage - Math.floor(MAX_PAGE_BUTTONS / 2), pages - MAX_PAGE_BUTTONS + 1));
  const pageButtons = Array.from({ length: Math.min(MAX_PAGE_BUTTONS, pages) }, (_, i) => firstButton + i);
  const statValue = (value) => (loading || loadError ? '—' : value);
  const emptyMessage = loading ? 'Loading categories...' : loadError ? `Could not load categories: ${loadError}` : 'No categories found.';

  const openAdd = () => { setSelected(null); setForm({ name: '', description: '' }); setModal('form'); };
  const openEdit = (category) => { setSelected(category); setForm({ name: category.name, description: category.description || '' }); setModal('form'); };
  const saveCategory = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return toast.error('Category name is required');
    const payload = { name, description: form.description.trim() };
    setSaving(true);
    try {
      if (selected) {
        await updateCategory(selected.id, payload);
        toast.success('Category updated');
      } else {
        await createCategory(payload);
        toast.success('Category added');
      }
      setModal(null);
      await reload();
    } catch (err) {
      toast.error(err.message || 'Unable to save category');
    } finally {
      setSaving(false);
    }
  };
  const removeCategory = async (category) => {
    if (!window.confirm(`Delete category “${category.name}”?`)) return;
    try {
      await deleteCategory(category.id);
      toast.success('Category deleted');
      await reload();
    } catch (err) {
      toast.error(err.message || 'Unable to delete category');
    }
  };
  const exportCsv = () => {
    const rows = [['Category', 'Description', 'Products', 'Created At'], ...categories.map((c) => [c.name, c.description || '', c.productCount || 0, c.createdAt ? formatDate(c.createdAt) : ''])];
    downloadCsv('stockflow-categories.csv', rows);
  };
  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const rows = parseCsv((await file.text()).replace(/^\uFEFF/, ''));
    const hasHeader = ['category', 'name'].includes(rows[0]?.[0]?.toLowerCase());
    const dataRows = hasHeader ? rows.slice(1) : rows;
    if (!dataRows.length) return toast.error('The CSV file has no category rows');
    setImporting(true);
    let imported = 0;
    let failed = 0;
    let firstFailure = '';
    for (const [index, [name = '', description = '']] of dataRows.entries()) {
      try {
        if (!name) throw new Error('Category name is required');
        await createCategory({ name, description });
        imported += 1;
      } catch (err) {
        failed += 1;
        if (!firstFailure) firstFailure = `Row ${index + (hasHeader ? 2 : 1)}${name ? ` (“${name}”)` : ''}: ${err.message}`;
      }
    }
    setImporting(false);
    const summary = `${imported} imported, ${failed} failed`;
    if (failed) toast.error(`${summary}. ${firstFailure}`, { duration: 6000 });
    else toast.success(summary);
    if (imported) await reload();
  };

  return (
    <div className="sf-categories-page">
      <div className="sf-cat-heading">
        <div className="sf-cat-title-wrap">
          <div className="sf-cat-title-icon"><Layers3 size={28} /></div>
          <div><div className="sf-cat-breadcrumb">Dashboard <span>›</span> Categories</div><h1>Categories</h1><p>Manage product categories, organize inventory and track stock.</p></div>
        </div>
        <div className="sf-cat-actions">
          {canManage && <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={importCsv} />}
          {canManage && <button className="sf-cat-secondary" disabled={importing} onClick={() => fileRef.current?.click()} title="CSV columns: Category, Description"><Upload size={17} /> {importing ? 'Importing...' : 'Import (CSV)'}</button>}
          <button className="sf-cat-secondary" onClick={exportCsv} disabled={!categories.length}><Download size={17} /> Export</button>
          {canManage && <button className="sf-cat-primary" onClick={openAdd}><Plus size={19} /> Add Category</button>}
        </div>
      </div>

      <section className="sf-cat-stats">
        <Stat icon={Layers3} title="Total Categories" value={statValue(categories.length)} tone="purple" />
        <Stat icon={Package} title="Categories in Use" value={statValue(inUseCount)} tone="blue" />
        <Stat icon={PauseCircle} title="Empty Categories" value={statValue(categories.length - inUseCount)} tone="orange" />
        <Stat icon={ShoppingBag} title="Total Products" value={statValue(totalProducts.toLocaleString('en-IN'))} tone="green" />
      </section>

      <section className="sf-cat-table-panel">
        <div className="sf-cat-toolbar">
          <label className="sf-cat-search"><Search size={19} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search categories by name or description..." /></label>
          <div className="sf-cat-view-toggle"><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')} aria-label="List view"><List size={19} /></button><button className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')} aria-label="Grid view"><Grid2X2 size={18} /></button></div>
        </div>

        {view === 'list' ? <div className="sf-cat-table-scroll"><table className="sf-cat-table"><thead><tr><th>#</th><th>Category</th><th>Description</th><th>Products</th><th>Created At</th><th>Actions</th></tr></thead><tbody>
          {loading || loadError || visible.length === 0 ? <tr><td colSpan="6" className="sf-cat-empty">{emptyMessage}</td></tr> : visible.map((category, index) => {
            const Icon = iconSet[(index + offset) % iconSet.length]; const tone = colors[(index + offset) % colors.length];
            return <tr key={category.id}><td>{offset + index + 1}</td><td><div className="sf-cat-name"><span className={`sf-cat-product-icon ${tone}`}><Icon size={21} /></span><strong>{category.name}</strong></div></td><td>{category.description || '—'}</td><td className="sf-cat-count">{category.productCount ?? '—'}</td><td>{showDate(category.createdAt)}</td><td><div className="sf-cat-row-actions">{canManage && <button title="Edit" aria-label={`Edit ${category.name}`} onClick={() => openEdit(category)}><Pencil size={16} /></button>}{canManage && <button title="Delete" aria-label={`Delete ${category.name}`} className="danger" onClick={() => removeCategory(category)}><Trash2 size={16} /></button>}<button title="View" aria-label={`View ${category.name}`} onClick={() => { setSelected(category); setModal('view'); }}><Eye size={17} /></button></div></td></tr>;
          })}
        </tbody></table></div> : loading || loadError || visible.length === 0 ? <p className="sf-cat-empty">{emptyMessage}</p> : <div className="sf-cat-grid">{visible.map((category, index) => { const Icon = iconSet[(index + offset) % iconSet.length]; return <article className="sf-cat-card" key={category.id}><span className={`sf-cat-product-icon ${colors[(index + offset) % colors.length]}`}><Icon size={24} /></span><h3>{category.name}</h3><p>{category.description || 'No description'}</p><div><b>{category.productCount ?? '—'}</b><small>Products</small></div><footer>{canManage ? <><button onClick={() => openEdit(category)}><Pencil size={15} /> Edit</button><button onClick={() => removeCategory(category)}><Trash2 size={15} /> Delete</button></> : <button onClick={() => { setSelected(category); setModal('view'); }}><Eye size={15} /> View</button>}</footer></article>; })}</div>}

        <div className="sf-cat-pagination"><span>Showing {filtered.length ? offset + 1 : 0} – {Math.min(offset + PAGE_SIZE, filtered.length)} of {filtered.length} categories</span><div><button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page"><ChevronLeft size={18} /></button>{pageButtons.map((n) => <button key={n} className={currentPage === n ? 'current' : ''} aria-current={currentPage === n ? 'page' : undefined} onClick={() => setPage(n)}>{n}</button>)}<button disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)} aria-label="Next page"><ChevronRight size={18} /></button></div></div>
      </section>

      {modal && <div className="sf-cat-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && setModal(null)}><div className="sf-cat-modal" role="dialog" aria-modal="true"><header><h2>{modal === 'view' ? 'Category details' : selected ? 'Edit category' : 'Add new category'}</h2><button onClick={() => setModal(null)} disabled={saving} aria-label="Close"><X size={20} /></button></header>{modal === 'view' ? <div className="sf-cat-view-details"><h3>{selected?.name}</h3><p>{selected?.description || 'No description provided.'}</p><p>Products: {selected?.productCount ?? '—'}</p><p>Created: {showDate(selected?.createdAt)}</p><button className="sf-cat-primary" onClick={() => setModal(null)}>Close</button></div> : <form onSubmit={saveCategory}><label>Category name<input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Accessories" /></label><label>Description<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Briefly describe this category" /></label><footer><button type="button" className="sf-cat-secondary" disabled={saving} onClick={() => setModal(null)}>Cancel</button><button type="submit" className="sf-cat-primary" disabled={saving}><CheckCircle2 size={17} /> {saving ? 'Saving...' : 'Save Category'}</button></footer></form>}</div></div>}
    </div>
  );
}

function Stat({ icon: Icon, title, value, tone }) {
  return <article className={`sf-cat-stat ${tone}`}><div className="sf-cat-stat-icon"><Icon size={24} /></div><div><p>{title}</p><strong>{value}</strong></div><Layers3 className="sf-cat-stat-watermark" size={42} /></article>;
}
