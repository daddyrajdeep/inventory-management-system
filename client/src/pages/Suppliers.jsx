import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Trash2, Pencil, Eye, Download, Users,
  Building2, Package, Mail, Phone, MapPin, X, Truck,
  ChevronLeft, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/supplierService';
import { useAuth } from '../context/AuthContext';
import { downloadCsv } from '../utils/csv';
import './Suppliers.css';

const emptyForm = { name: '', contactPerson: '', email: '', phone: '', address: '', isActive: true };
const WRITE_ROLES = ['admin', 'manager'];

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Supplier name is required';
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email';
  if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone)) errors.phone = 'Enter a valid phone number';
  return errors;
}

export default function Suppliers() {
  const { user } = useAuth();
  const canWrite = WRITE_ROLES.includes(user?.role);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Status');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const refresh = useCallback(() => getSuppliers()
    .then((list) => { setSuppliers(list); setLoadError(''); })
    .catch((err) => setLoadError(err.message || 'Could not load suppliers'))
    .finally(() => setLoading(false)), []);

  useEffect(() => { refresh(); }, [refresh]);

  const retry = () => { setLoading(true); refresh(); };

  const filtered = useMemo(() => suppliers.filter((s) => {
    const q = search.toLowerCase();
    const matches = [s.name, s.contactPerson, s.email, s.phone, s.address].some((v) => (v || '').toLowerCase().includes(q));
    return matches && (status === 'All Status' || (status === 'Active' ? s.isActive : !s.isActive));
  }), [suppliers, search, status]);
  const activeCount = suppliers.filter((s) => s.isActive).length;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const statValue = (n) => (loading || loadError ? '—' : n);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (supplier) => {
    setEditing(supplier);
    setForm({ name: supplier.name || '', contactPerson: supplier.contactPerson || '', email: supplier.email || '', phone: supplier.phone || '', address: supplier.address || '', isActive: supplier.isActive !== false });
    setErrors({}); setModalOpen(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate(form); setErrors(nextErrors);
    if (Object.keys(nextErrors).length || saving) return;
    const payload = { name: form.name.trim(), contactPerson: form.contactPerson.trim(), email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim() };
    setSaving(true);
    try {
      if (editing) {
        await updateSupplier(editing.id, { ...payload, isActive: form.isActive });
        toast.success('Supplier updated');
      } else {
        await createSupplier(payload);
        toast.success('Supplier added');
      }
      setModalOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (supplier) => {
    if (!window.confirm(`Delete ${supplier.name}?`)) return;
    try {
      await deleteSupplier(supplier.id);
      toast.success('Supplier deleted');
      await refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const exportCsv = () => {
    const rows = [['Supplier', 'Contact Person', 'Email', 'Phone', 'Address', 'Status'], ...filtered.map((s) => [s.name, s.contactPerson, s.email, s.phone, s.address, s.isActive ? 'Active' : 'Inactive'])];
    downloadCsv('stockflow-suppliers.csv', rows);
  };

  return (
    <div className="sf-suppliers">
      <div className="sf-sup-breadcrumb">Dashboard <span>›</span> Suppliers</div>
      <div className="sf-sup-heading">
        <div className="sf-sup-title-wrap"><div className="sf-sup-title-icon"><Truck size={25} /></div><div><h1>Suppliers</h1><p>Manage supplier relationships and contact details.</p></div></div>
        <div className="sf-sup-actions"><button className="sf-sup-secondary" onClick={exportCsv} disabled={!filtered.length}><Download size={16}/> Export</button>{canWrite && <button className="sf-sup-primary" onClick={openAdd}><Plus size={18}/> Add Supplier</button>}</div>
      </div>

      <section className="sf-sup-stats">
        <div className="sf-sup-stat purple"><div className="sf-sup-stat-icon"><Users/></div><div><span>Total Suppliers</span><strong>{statValue(suppliers.length)}</strong></div><Building2 className="sf-sup-watermark"/></div>
        <div className="sf-sup-stat blue"><div className="sf-sup-stat-icon"><Building2/></div><div><span>Active Suppliers</span><strong>{statValue(activeCount)}</strong></div><Building2 className="sf-sup-watermark"/></div>
        <div className="sf-sup-stat orange"><div className="sf-sup-stat-icon"><Package/></div><div><span>Inactive Suppliers</span><strong>{statValue(suppliers.length - activeCount)}</strong></div><Package className="sf-sup-watermark"/></div>
      </section>

      <section className="sf-sup-table-panel">
        <div className="sf-sup-toolbar"><label className="sf-sup-search"><Search size={18}/><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search suppliers by name, email, phone..."/><kbd>⌕</kbd></label><label className="sf-sup-filter"><SlidersHorizontal size={16}/><select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option>All Status</option><option>Active</option><option>Inactive</option></select></label></div>
        <div className="sf-sup-table-scroll"><table className="sf-sup-table"><thead><tr><th>#</th><th>Supplier</th><th>Contact Email</th><th>Phone</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {loading ? <tr><td colSpan="7" className="sf-sup-empty">Loading suppliers...</td></tr>
            : loadError ? <tr><td colSpan="7" className="sf-sup-empty sf-sup-error"><p>Could not load suppliers: {loadError}</p><button className="sf-sup-secondary" onClick={retry}>Retry</button></td></tr>
            : visible.length === 0 ? <tr><td colSpan="7" className="sf-sup-empty">{suppliers.length ? 'No suppliers match your search or filter.' : 'No suppliers yet.'}</td></tr>
            : visible.map((s, i) => <tr key={s.id}><td>{(currentPage - 1) * pageSize + i + 1}</td><td><div className="sf-sup-name"><span className="sf-sup-avatar">{s.name?.slice(0, 1).toUpperCase()}</span><div><strong>{s.name}</strong>{s.contactPerson && <small>{s.contactPerson}</small>}</div></div></td><td><span className="sf-sup-contact"><Mail size={14}/>{s.email || '—'}</span></td><td><span className="sf-sup-contact"><Phone size={14}/>{s.phone || '—'}</span></td><td><span className="sf-sup-contact"><MapPin size={14}/>{s.address || '—'}</span></td><td><span className={`sf-sup-status ${s.isActive ? 'active' : 'inactive'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td><td><div className="sf-sup-row-actions"><button title="View" aria-label={`View ${s.name}`} onClick={() => setViewItem(s)}><Eye size={16}/></button>{canWrite && <><button title="Edit" aria-label={`Edit ${s.name}`} onClick={() => openEdit(s)}><Pencil size={16}/></button><button className="delete" title="Delete" aria-label={`Delete ${s.name}`} onClick={() => remove(s)}><Trash2 size={16}/></button></>}</div></td></tr>)}
        </tbody></table></div>
        <div className="sf-sup-pagination"><span>Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} suppliers</span><div><button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={17}/></button><strong>{currentPage}</strong><span>of {pageCount}</span><button disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={17}/></button></div></div>
      </section>

      {(modalOpen || viewItem) && <div className="sf-sup-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) { setModalOpen(false); setViewItem(null); } }}>
        <section className="sf-sup-modal"><button className="sf-sup-close" onClick={() => { setModalOpen(false); setViewItem(null); }}><X size={18}/></button>
          {viewItem ? <><div className="sf-sup-modal-icon"><Building2/></div><h2>{viewItem.name}</h2><p className="sf-sup-modal-sub">Supplier details</p><div className="sf-sup-detail"><span>Contact Person</span><strong>{viewItem.contactPerson || '—'}</strong></div><div className="sf-sup-detail"><span>Email</span><strong>{viewItem.email || '—'}</strong></div><div className="sf-sup-detail"><span>Phone</span><strong>{viewItem.phone || '—'}</strong></div><div className="sf-sup-detail"><span>Address</span><strong>{viewItem.address || '—'}</strong></div><div className="sf-sup-detail"><span>Status</span><strong>{viewItem.isActive ? 'Active' : 'Inactive'}</strong></div><button className="sf-sup-primary full" onClick={() => setViewItem(null)}>Close</button></> : <><div className="sf-sup-modal-icon"><Plus/></div><h2>{editing ? 'Edit Supplier' : 'Add New Supplier'}</h2><p className="sf-sup-modal-sub">Enter supplier information below.</p><form onSubmit={handleSubmit} className="sf-sup-form" noValidate><label>Supplier Name<input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Enter supplier name"/>{errors.name && <small>{errors.name}</small>}</label><label>Contact Person<input value={form.contactPerson} onChange={e => setForm({...form, contactPerson:e.target.value})} placeholder="Enter contact name"/></label><label>Email Address<input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="supplier@example.com"/>{errors.email && <small>{errors.email}</small>}</label><label>Phone Number<input value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="+91 98765 43210"/>{errors.phone && <small>{errors.phone}</small>}</label><label>Address<textarea rows="2" value={form.address} onChange={e => setForm({...form, address:e.target.value})} placeholder="Supplier location"/></label>{editing && <label className="sf-sup-check"><input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive:e.target.checked})}/>Active</label>}<div className="sf-sup-modal-actions"><button type="button" className="sf-sup-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="sf-sup-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Supplier'}</button></div></form></>}
        </section></div>}
    </div>
  );
}
