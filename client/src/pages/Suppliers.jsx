import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Trash2, Pencil, Eye, Download, Upload, Users,
  Building2, Package, TrendingUp, Mail, Phone, MapPin, X, Truck,
  ChevronLeft, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSuppliers } from '../services/supplierService';
import './Suppliers.css';

const emptyForm = { name: '', email: '', phone: '', address: '' };
const demoExtras = [
  { id: 's4', name: 'Tech World Distributors', email: 'sales@techworld.in', phone: '+91 98765 43213', address: 'Salt Lake, Kolkata' },
  { id: 's5', name: 'Digital Accessories Hub', email: 'contact@dah.in', phone: '+91 98765 43214', address: 'Howrah' },
  { id: 's6', name: 'Prime Office Supplies', email: 'hello@primeoffice.in', phone: '+91 98765 43215', address: 'New Town, Kolkata' },
];

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Supplier name is required';
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email';
  if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone)) errors.phone = 'Enter a valid phone number';
  return errors;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Status');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    let active = true;
    getSuppliers().then((list) => {
      if (!active) return;
      setSuppliers([...list, ...demoExtras]);
      setLoading(false);
    }).catch(() => {
      if (active) { setSuppliers(demoExtras); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => suppliers.filter((s) => {
    const q = search.toLowerCase();
    const matches = [s.name, s.email, s.phone, s.address].some((v) => (v || '').toLowerCase().includes(q));
    const active = s.status ? s.status === 'Active' : true;
    return matches && (status === 'All Status' || (status === 'Active' ? active : !active));
  }), [suppliers, search, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (supplier) => { setEditing(supplier); setForm({ name: supplier.name || '', email: supplier.email || '', phone: supplier.phone || '', address: supplier.address || '' }); setErrors({}); setModalOpen(true); };
  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validate(form); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (editing) {
      setSuppliers((current) => current.map((s) => s.id === editing.id ? { ...s, ...form } : s));
      toast.success('Supplier updated');
    } else {
      setSuppliers((current) => [...current, { ...form, id: `local-${Date.now()}`, status: 'Active' }]);
      toast.success('Supplier added');
    }
    setModalOpen(false);
  };
  const remove = (supplier) => {
    if (!window.confirm(`Delete ${supplier.name}?`)) return;
    setSuppliers((current) => current.filter((s) => s.id !== supplier.id));
    toast.success('Supplier deleted');
  };
  const exportCsv = () => {
    const rows = [['Supplier', 'Email', 'Phone', 'Address'], ...filtered.map((s) => [s.name, s.email, s.phone, s.address])];
    const csv = rows.map((r) => r.map((v) => `"${String(v || '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'stockflow-suppliers.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="sf-suppliers">
      <div className="sf-sup-breadcrumb">Dashboard <span>›</span> Suppliers</div>
      <div className="sf-sup-heading">
        <div className="sf-sup-title-wrap"><div className="sf-sup-title-icon"><Truck size={25} /></div><div><h1>Suppliers</h1><p>Manage supplier relationships, contact details and supply performance.</p></div></div>
        <div className="sf-sup-actions"><button className="sf-sup-secondary" onClick={exportCsv}><Download size={16}/> Export</button><button className="sf-sup-primary" onClick={openAdd}><Plus size={18}/> Add Supplier</button></div>
      </div>

      <section className="sf-sup-stats">
        <div className="sf-sup-stat purple"><div className="sf-sup-stat-icon"><Users/></div><div><span>Total Suppliers</span><strong>{suppliers.length}</strong><small className="up">↗ +8.2% <em>vs last month</em></small></div><Building2 className="sf-sup-watermark"/></div>
        <div className="sf-sup-stat blue"><div className="sf-sup-stat-icon"><Building2/></div><div><span>Active Suppliers</span><strong>{suppliers.filter(s => s.status !== 'Inactive').length}</strong><small className="up">↗ +5.4% <em>vs last month</em></small></div><Building2 className="sf-sup-watermark"/></div>
        <div className="sf-sup-stat orange"><div className="sf-sup-stat-icon"><Package/></div><div><span>Inactive Suppliers</span><strong>{suppliers.filter(s => s.status === 'Inactive').length}</strong><small className="down">↘ 0.0% <em>vs last month</em></small></div><Package className="sf-sup-watermark"/></div>
        <div className="sf-sup-stat green"><div className="sf-sup-stat-icon"><TrendingUp/></div><div><span>Products Supplied</span><strong>1,248</strong><small className="up">↗ +12.6% <em>vs last month</em></small></div><Package className="sf-sup-watermark"/></div>
      </section>

      <section className="sf-sup-table-panel">
        <div className="sf-sup-toolbar"><label className="sf-sup-search"><Search size={18}/><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search suppliers by name, email, phone..."/><kbd>⌕</kbd></label><label className="sf-sup-filter"><SlidersHorizontal size={16}/><select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option>All Status</option><option>Active</option><option>Inactive</option></select></label><div className="sf-sup-view-toggle"><button className="selected" aria-label="List view">☷</button><button aria-label="Grid view" onClick={() => toast('List view is currently selected')}>▦</button></div></div>
        <div className="sf-sup-table-scroll"><table className="sf-sup-table"><thead><tr><th className="check-col"><input type="checkbox" aria-label="Select all"/></th><th>#</th><th>Supplier</th><th>Contact Email</th><th>Phone</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {loading ? <tr><td colSpan="8" className="sf-sup-empty">Loading suppliers...</td></tr> : visible.length === 0 ? <tr><td colSpan="8" className="sf-sup-empty">No suppliers found. Try another search or add a supplier.</td></tr> : visible.map((s, i) => <tr key={s.id}><td><input type="checkbox" aria-label={`Select ${s.name}`}/></td><td>{(page - 1) * pageSize + i + 1}</td><td><div className="sf-sup-name"><span className="sf-sup-avatar">{s.name?.slice(0, 1).toUpperCase()}</span><div><strong>{s.name}</strong><small>SUP-{String(i + 1001).padStart(4, '0')}</small></div></div></td><td><span className="sf-sup-contact"><Mail size={14}/>{s.email || '—'}</span></td><td><span className="sf-sup-contact"><Phone size={14}/>{s.phone || '—'}</span></td><td><span className="sf-sup-contact"><MapPin size={14}/>{s.address || '—'}</span></td><td><span className={`sf-sup-status ${s.status === 'Inactive' ? 'inactive' : 'active'}`}>{s.status || 'Active'}</span></td><td><div className="sf-sup-row-actions"><button title="View" onClick={() => setViewItem(s)}><Eye size={16}/></button><button title="Edit" onClick={() => openEdit(s)}><Pencil size={16}/></button><button className="delete" title="Delete" onClick={() => remove(s)}><Trash2 size={16}/></button></div></td></tr>)}
        </tbody></table></div>
        <div className="sf-sup-pagination"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} suppliers</span><div><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={17}/></button><strong>{page}</strong><span>of {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage(p => p + 1)}><ChevronRight size={17}/></button></div></div>
      </section>

      {(modalOpen || viewItem) && <div className="sf-sup-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) { setModalOpen(false); setViewItem(null); } }}>
        <section className="sf-sup-modal"><button className="sf-sup-close" onClick={() => { setModalOpen(false); setViewItem(null); }}><X size={18}/></button>
          {viewItem ? <><div className="sf-sup-modal-icon"><Building2/></div><h2>{viewItem.name}</h2><p className="sf-sup-modal-sub">Supplier details</p><div className="sf-sup-detail"><span>Email</span><strong>{viewItem.email || '—'}</strong></div><div className="sf-sup-detail"><span>Phone</span><strong>{viewItem.phone || '—'}</strong></div><div className="sf-sup-detail"><span>Address</span><strong>{viewItem.address || '—'}</strong></div><button className="sf-sup-primary full" onClick={() => setViewItem(null)}>Close</button></> : <><div className="sf-sup-modal-icon"><Plus/></div><h2>{editing ? 'Edit Supplier' : 'Add New Supplier'}</h2><p className="sf-sup-modal-sub">Enter supplier information below.</p><form onSubmit={handleSubmit} className="sf-sup-form" noValidate><label>Supplier Name<input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Enter supplier name"/>{errors.name && <small>{errors.name}</small>}</label><label>Email Address<input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="supplier@example.com"/>{errors.email && <small>{errors.email}</small>}</label><label>Phone Number<input value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="+91 98765 43210"/>{errors.phone && <small>{errors.phone}</small>}</label><label>Address<textarea rows="2" value={form.address} onChange={e => setForm({...form, address:e.target.value})} placeholder="Supplier location"/></label><div className="sf-sup-modal-actions"><button type="button" className="sf-sup-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="sf-sup-primary">{editing ? 'Save Changes' : 'Add Supplier'}</button></div></form></>}
        </section></div>}
    </div>
  );
}
