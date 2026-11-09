import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField, { inputClass } from '../components/FormField';
import { getSuppliers } from '../services/supplierService';

// OWNER: Soham (Categories and Suppliers)
// Add and delete only change local state for now, so they reset on refresh.
// Backend phase: add addSupplier / deleteSupplier to your own supplierService.js and call them here.
const emptyForm = { name: '', email: '', phone: '', address: '' };

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
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let active = true;
    getSuppliers().then((list) => {
      if (!active) return;
      setSuppliers(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const openModal = () => {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addSupplier = (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const supplier = {
      id: Date.now().toString(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };
    setSuppliers([...suppliers, supplier]);
    setModalOpen(false);
    toast.success(`${supplier.name} added`);
  };

  const deleteSupplier = (supplier) => {
    if (!window.confirm(`Delete ${supplier.name}?`)) return;
    setSuppliers(suppliers.filter((s) => s.id !== supplier.id));
    toast.success(`${supplier.name} deleted`);
  };

  const filteredSuppliers = useMemo(() => {
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q)
    );
  }, [suppliers, search]);

  const dash = (value) => value || <span className="text-gray-400">-</span>;

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'email', label: 'Email', render: (r) => dash(r.email) },
    { key: 'phone', label: 'Phone', render: (r) => dash(r.phone) },
    { key: 'address', label: 'Address', render: (r) => dash(r.address) },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex justify-end">
          <button
            onClick={() => deleteSupplier(row)}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle={`${suppliers.length} suppliers you order stock from`}
        action={
          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> Add Supplier
          </button>
        }
      />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      <DataTable
        columns={columns}
        rows={filteredSuppliers}
        loading={loading}
        emptyText={search ? 'No suppliers match your search' : 'No suppliers yet. Click Add Supplier to create one.'}
      />

      <Modal open={modalOpen} title="Add supplier" onClose={() => setModalOpen(false)}>
        <form onSubmit={addSupplier} className="space-y-4" noValidate>
          <FormField label="Supplier name" error={errors.name}>
            <input name="name" className={inputClass} value={form.name} onChange={handleChange} />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <input name="email" type="email" className={inputClass} value={form.email} onChange={handleChange} />
          </FormField>
          <FormField label="Phone" error={errors.phone}>
            <input name="phone" className={inputClass} value={form.phone} onChange={handleChange} />
          </FormField>
          <FormField label="Address">
            <textarea
              name="address"
              rows={2}
              className={inputClass}
              value={form.address}
              onChange={handleChange}
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add supplier
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
