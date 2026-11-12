import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Layers3, Package, PauseCircle, ShoppingBag, Search, Plus, Download,
  Upload, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Grid2X2,
  List, X, Headphones, Monitor, Keyboard, Laptop, Boxes, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCategories } from '../services/categoryService';
import './Categories.css';

const PAGE_SIZE = 5;
const iconSet = [Headphones, Monitor, Keyboard, Laptop, Boxes];
const colors = ['violet', 'blue', 'pink', 'cyan', 'purple'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('list');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'Active' });
  const [selected, setSelected] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    let alive = true;
    getCategories().then((items) => {
      if (alive) setCategories(items.map((item, index) => ({
        ...item,
        description: item.description || 'Product category',
        status: item.status || 'Active',
        createdAt: item.createdAt || `Jan ${10 + index * 2}, 2026`,
      })));
    }).catch(() => toast.error('Unable to load categories')).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const activeCount = categories.filter((c) => c.status === 'Active').length;
  const filtered = useMemo(() => categories.filter((c) => {
    const q = search.trim().toLowerCase();
    const matches = !q || `${c.name} ${c.description || ''}`.toLowerCase().includes(q);
    return matches && (statusFilter === 'all' || c.status.toLowerCase() === statusFilter);
  }), [categories, search, statusFilter]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => { setSelected(null); setForm({ name: '', description: '', status: 'Active' }); setModal('form'); };
  const openEdit = (category) => { setSelected(category); setForm({ name: category.name, description: category.description || '', status: category.status || 'Active' }); setModal('form'); };
  const saveCategory = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return toast.error('Category name is required');
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== selected?.id)) return toast.error('This category already exists');
    if (selected) {
      setCategories((old) => old.map((c) => c.id === selected.id ? { ...c, ...form, name } : c));
      toast.success('Category updated');
    } else {
      setCategories((old) => [...old, { id: `local-${Date.now()}`, ...form, name, createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }]);
      toast.success('Category added');
    }
    setModal(null);
  };
  const deleteCategory = (category) => {
    if (!window.confirm(`Delete category “${category.name}”?`)) return;
    setCategories((old) => old.filter((c) => c.id !== category.id));
    toast.success('Category deleted');
  };
  const exportCsv = () => {
    const rows = [['Category', 'Description', 'Products', 'Status', 'Created At'], ...categories.map((c) => [c.name, c.description || '', c.productCount || 0, c.status, c.createdAt || ''])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'stockflow-categories.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const importCsv = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean).slice(1);
    const imported = lines.map((line, index) => {
      const cells = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      return cells[0] ? { id: `import-${Date.now()}-${index}`, name: cells[0], description: cells[1] || 'Imported category', status: cells[3] || 'Active', createdAt: cells[4] || 'Imported' } : null;
    }).filter(Boolean);
    setCategories((old) => [...old, ...imported]);
    toast.success(`${imported.length} categories imported`);
    event.target.value = '';
  };

  return (
    <div className="sf-categories-page">
      <div className="sf-cat-heading">
        <div className="sf-cat-title-wrap">
          <div className="sf-cat-title-icon"><Layers3 size={28} /></div>
          <div><div className="sf-cat-breadcrumb">Dashboard <span>›</span> Categories</div><h1>Categories</h1><p>Manage product categories, organize inventory and track stock.</p></div>
        </div>
        <div className="sf-cat-actions">
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={importCsv} />
          <button className="sf-cat-secondary" onClick={() => fileRef.current?.click()}><Download size={17} /> Import (CSV)</button>
          <button className="sf-cat-secondary" onClick={exportCsv}><Upload size={17} /> Export</button>
          <button className="sf-cat-primary" onClick={openAdd}><Plus size={19} /> Add Category</button>
        </div>
      </div>

      <section className="sf-cat-stats">
        <Stat icon={Layers3} title="Total Categories" value={categories.length} trend="+6.7%" tone="purple" />
        <Stat icon={Package} title="Active Categories" value={activeCount} trend="+10.0%" tone="blue" />
        <Stat icon={PauseCircle} title="Inactive Categories" value={categories.length - activeCount} trend="-3.3%" tone="orange" />
        <Stat icon={ShoppingBag} title="Total Products" value="1,248" trend="+5.2%" tone="green" />
      </section>

      <section className="sf-cat-table-panel">
        <div className="sf-cat-toolbar">
          <label className="sf-cat-search"><Search size={19} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search categories by name or description..." /></label>
          <select className="sf-cat-filter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <div className="sf-cat-view-toggle"><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')} aria-label="List view"><List size={19} /></button><button className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')} aria-label="Grid view"><Grid2X2 size={18} /></button></div>
        </div>

        {view === 'list' ? <div className="sf-cat-table-scroll"><table className="sf-cat-table"><thead><tr><th className="check-col"></th><th>#</th><th>Category</th><th>Description</th><th>Products</th><th>Status</th><th>Created At</th><th>Actions</th></tr></thead><tbody>
          {loading ? <tr><td colSpan="8" className="sf-cat-empty">Loading categories...</td></tr> : visible.length === 0 ? <tr><td colSpan="8" className="sf-cat-empty">No categories found.</td></tr> : visible.map((category, index) => {
            const Icon = iconSet[(index + (page - 1) * PAGE_SIZE) % iconSet.length]; const tone = colors[(index + (page - 1) * PAGE_SIZE) % colors.length];
            return <tr key={category.id}><td><input type="checkbox" aria-label={`Select ${category.name}`} /></td><td>{(page - 1) * PAGE_SIZE + index + 1}</td><td><div className="sf-cat-name"><span className={`sf-cat-product-icon ${tone}`}><Icon size={21} /></span><strong>{category.name}</strong></div></td><td>{category.description || '—'}</td><td className="sf-cat-count">{category.productCount ?? '—'}</td><td><span className={`sf-cat-status ${category.status === 'Active' ? 'active' : 'inactive'}`}>{category.status}</span></td><td>{category.createdAt || '—'}</td><td><div className="sf-cat-row-actions"><button title="Edit" onClick={() => openEdit(category)}><Pencil size={16} /></button><button title="Delete" className="danger" onClick={() => deleteCategory(category)}><Trash2 size={16} /></button><button title="View" onClick={() => { setSelected(category); setModal('view'); }}><Eye size={17} /></button></div></td></tr>;
          })}
        </tbody></table></div> : <div className="sf-cat-grid">{visible.map((category, index) => { const Icon = iconSet[index % iconSet.length]; return <article className="sf-cat-card" key={category.id}><span className={`sf-cat-product-icon ${colors[index % colors.length]}`}><Icon size={24} /></span><span className={`sf-cat-status ${category.status === 'Active' ? 'active' : 'inactive'}`}>{category.status}</span><h3>{category.name}</h3><p>{category.description || 'Product category'}</p><div><b>{category.productCount ?? '—'}</b><small>Products</small></div><footer><button onClick={() => openEdit(category)}><Pencil size={15} /> Edit</button><button onClick={() => deleteCategory(category)}><Trash2 size={15} /> Delete</button></footer></article>; })}</div>}

        <div className="sf-cat-pagination"><span>Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} – {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} categories</span><div><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft size={18} /></button>{Array.from({ length: pages }, (_, i) => i + 1).slice(0, 5).map((n) => <button key={n} className={page === n ? 'current' : ''} onClick={() => setPage(n)}>{n}</button>)}<button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight size={18} /></button></div></div>
      </section>

      {modal && <div className="sf-cat-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}><div className="sf-cat-modal" role="dialog" aria-modal="true"><header><h2>{modal === 'view' ? 'Category details' : selected ? 'Edit category' : 'Add new category'}</h2><button onClick={() => setModal(null)} aria-label="Close"><X size={20} /></button></header>{modal === 'view' ? <div className="sf-cat-view-details"><h3>{selected?.name}</h3><p>{selected?.description || 'No description provided.'}</p><span className={`sf-cat-status ${selected?.status === 'Active' ? 'active' : 'inactive'}`}>{selected?.status}</span><p>Created: {selected?.createdAt || '—'}</p><button className="sf-cat-primary" onClick={() => setModal(null)}>Close</button></div> : <form onSubmit={saveCategory}><label>Category name<input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Accessories" /></label><label>Description<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Briefly describe this category" /></label><label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option></select></label><footer><button type="button" className="sf-cat-secondary" onClick={() => setModal(null)}>Cancel</button><button type="submit" className="sf-cat-primary"><CheckCircle2 size={17} /> Save Category</button></footer></form>}</div></div>}
    </div>
  );
}

function Stat({ icon: Icon, title, value, trend, tone }) {
  return <article className={`sf-cat-stat ${tone}`}><div className="sf-cat-stat-icon"><Icon size={24} /></div><div><p>{title}</p><strong>{value}</strong><small className={trend.startsWith('-') ? 'down' : ''}>{trend} <span>vs last month</span></small></div><Layers3 className="sf-cat-stat-watermark" size={42} /></article>;
}
