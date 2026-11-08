import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import FormField, { inputClass } from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, updateUserRole, setUserActive } from '../services/userService';

// OWNER: Leader (admin only)
// Features: search, role filter, add user, change role, activate / deactivate
const roleTone = { admin: 'red', manager: 'blue', staff: 'gray' };
const emptyForm = { name: '', email: '', role: 'staff', password: '' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email';
  if (form.password.length < 6) errors.password = 'At least 6 characters';
  return errors;
}

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getUsers().then((list) => {
      if (!active) return;
      setUsers(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = async () => setUsers(await getUsers());

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === 'all' || u.role === roleFilter) &&
        (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [users, query, roleFilter]);

  const openModal = () => {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await createUser(form);
      await refresh();
      setModalOpen(false);
      toast.success(`${form.name} was added`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (target, role) => {
    await updateUserRole(target.id, role);
    await refresh();
    toast.success(`${target.name} is now ${role}`);
  };

  const handleToggleActive = async (target) => {
    if (target.isActive && !window.confirm(`Deactivate ${target.name}? They will not be able to log in.`)) return;
    await setUserActive(target.id, !target.isActive);
    await refresh();
    toast.success(`${target.name} was ${target.isActive ? 'deactivated' : 'activated'}`);
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (r) =>
        r.email === me.email ? (
          <Badge tone={roleTone[r.role]}>{r.role} (you)</Badge>
        ) : (
          <select
            value={r.role}
            onChange={(e) => handleRoleChange(r, e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-sm outline-none focus:border-indigo-400"
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge tone={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: (r) =>
        r.email === me.email ? null : (
          <button
            onClick={() => handleToggleActive(r)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            {r.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
            {r.isActive ? 'Deactivate' : 'Activate'}
          </button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${users.length} users, ${users.filter((u) => u.isActive).length} active`}
        action={
          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> Add User
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      <DataTable columns={columns} rows={visible} loading={loading} emptyText="No users match your filters" />

      <Modal open={modalOpen} title="Add user" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4" noValidate>
          <FormField label="Full name" error={errors.name}>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>
          <FormField label="Role">
            <select
              className={inputClass}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </FormField>
          <FormField label="Temporary password" error={errors.password}>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Adding...' : 'Add user'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
