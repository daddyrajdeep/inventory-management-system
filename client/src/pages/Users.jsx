import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Eye, EyeOff, Plus, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SearchInput from '../components/ui/SearchInput';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CopyButton from '../components/ui/CopyButton';
import Pagination from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, updateUserRole, setUserActive } from '../services/userService';
import { downloadCsv } from '../utils/csv';
import { passwordError } from '../utils/password';
import { formatDate } from '../utils/format';

const ROLES = ['staff', 'manager', 'admin'];
const roleTone = { admin: 'ok', manager: 'info', staff: 'neutral' };
const roleLabel = (role) => (role ? role.charAt(0).toUpperCase() + role.slice(1) : '—');
const roleHint = {
  staff: 'Can record sales and manage day-to-day stock.',
  manager: 'Adds purchase orders, expenses, and stock adjustments.',
  admin: 'Full access, including users and roles.',
};
const initials = (name) => (name ?? '').split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const PAGE_SIZE = 10;

function ActiveSwitch({ checked, onChange, disabled, label, title }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-[120ms] disabled:cursor-not-allowed disabled:opacity-40 ${checked ? 'bg-ink' : 'bg-line'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full border border-line bg-surface transition-all duration-[120ms] ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

// Forwards FormField's cloned id/aria props to the real input.
function PasswordInput({ show, onToggle, ...rest }) {
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} className="pr-10" {...rest} />
      <IconButton
        label={show ? 'Hide password' : 'Show password'}
        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
        onClick={onToggle}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </IconButton>
    </div>
  );
}

function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'staff', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const strength = [form.password.length >= 8, /[A-Za-z]/.test(form.password), /\d/.test(form.password)].filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.name.trim()) found.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = 'Enter a valid email';
    const problem = passwordError(form.password);
    if (problem) found.password = problem;
    if (form.confirm !== form.password) found.confirm = 'Passwords do not match';
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const created = await createUser({ name: form.name.trim(), email: form.email.trim(), role: form.role, password: form.password });
      toast.success('User created');
      onCreated(created, form.password);
    } catch (err) {
      toast.error(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal open title="Add user" maxWidth="max-w-lg" onClose={() => !saving && onClose()}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Full name" error={errors.name}>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" autoComplete="email" />
        </FormField>
        <FormField label="Role" hint={roleHint[form.role]}>
          <Select value={form.role} onChange={(e) => set('role', e.target.value)}>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
        </FormField>
        <div>
          <FormField label="Password" error={errors.password} hint="At least 8 characters, with a letter and a number">
            <PasswordInput
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              autoComplete="new-password"
            />
          </FormField>
          {form.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1" aria-hidden="true">
                {[0, 1, 2].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${i < strength ? 'bg-ink' : 'bg-line'}`} />)}
              </div>
              <span className="text-xs text-ink-soft">{strength === 3 ? 'Strong' : strength === 2 ? 'Fair' : 'Weak'}</span>
            </div>
          )}
        </div>
        <FormField label="Confirm password" error={errors.confirm}>
          <Input type={showPassword ? 'text' : 'password'} value={form.confirm} onChange={(e) => set('confirm', e.target.value)} autoComplete="new-password" />
        </FormField>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>Create user</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const roleParam = params.get('role');
  const statusParam = params.get('status');
  const roleFilter = ROLES.includes(roleParam) ? roleParam : 'all';
  const statusFilter = statusParam === 'active' || statusParam === 'deactivated' ? statusParam : 'all';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [created, setCreated] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmError, setConfirmError] = useState('');
  const [pendingId, setPendingId] = useState(null);

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    let active = true;
    getUsers()
      .then((list) => { if (active) { setUsers(list); setLoadError(''); } })
      .catch((err) => { if (active) { setLoadError(err.message); toast.error(err.message); } })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [refreshKey]);

  const counts = useMemo(() => ({
    active: users.filter((u) => u.isActive).length,
    admins: users.filter((u) => u.role === 'admin').length,
    managers: users.filter((u) => u.role === 'manager').length,
  }), [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) =>
      (roleFilter === 'all' || u.role === roleFilter) &&
      (statusFilter === 'all' || (statusFilter === 'active') === u.isActive) &&
      (!q || (u.name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q))
    );
  }, [users, query, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtersActive = query.trim() !== '' || roleFilter !== 'all' || statusFilter !== 'all';

  const refresh = () => setRefreshKey((k) => k + 1);
  const replaceUser = (updated) => setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

  const clearFilters = () => {
    setQuery('');
    setPage(1);
    setParams({}, { replace: true });
  };

  const applyRole = async (target, role) => {
    setPendingId(target.id);
    setConfirmError('');
    try {
      const updated = await updateUserRole(target.id, role);
      replaceUser(updated);
      toast.success(`Role updated — ${updated.name} is now ${roleLabel(updated.role)}`);
      setConfirm(null);
    } catch (err) {
      toast.error(err.message);
      setConfirmError(err.message);
    } finally {
      setPendingId(null);
    }
  };

  const applyActive = async (target, isActive) => {
    setPendingId(target.id);
    setConfirmError('');
    try {
      const updated = await setUserActive(target.id, isActive);
      replaceUser(updated);
      toast.success(`${updated.name} ${updated.isActive ? 'activated' : 'deactivated'}`);
      setConfirm(null);
    } catch (err) {
      toast.error(err.message);
      setConfirmError(err.message);
    } finally {
      setPendingId(null);
    }
  };

  const requestRole = (target, role) => {
    if (role === target.role) return;
    if (role === 'admin') {
      setConfirmError('');
      setConfirm({ kind: 'role', user: target, role });
      return;
    }
    applyRole(target, role);
  };

  const requestActive = (target) => {
    if (target.isActive) {
      setConfirmError('');
      setConfirm({ kind: 'active', user: target });
      return;
    }
    applyActive(target, true);
  };

  const handleCreated = (user, password) => {
    setAddOpen(false);
    setCreated({ name: user.name, email: user.email, password });
    refresh();
  };

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Role', 'Status', 'Joined'];
    const rows = filtered.map((u) => [u.name, u.email, roleLabel(u.role), u.isActive ? 'Active' : 'Deactivated', u.createdAt ? formatDate(u.createdAt) : '']);
    downloadCsv('stockflow-users.csv', [header, ...rows]);
  };

  const columns = [
    { key: 'name', label: 'User', render: (u) => (
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-xs font-semibold text-ink">{initials(u.name)}</span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium text-ink">
            {u.name}
            {u.id === currentUser?.id && <Badge tone="neutral">You</Badge>}
          </p>
          <p className="flex items-center gap-1 text-xs text-ink-soft">
            {u.email}
            <CopyButton value={u.email} label={`Copy email for ${u.name}`} />
          </p>
        </div>
      </div>
    ) },
    { key: 'role', label: 'Role', render: (u) => <Badge tone={roleTone[u.role] ?? 'neutral'}>{roleLabel(u.role)}</Badge> },
    { key: 'isActive', label: 'Status', render: (u) => <Badge tone={u.isActive ? 'ok' : 'neutral'} dot>{u.isActive ? 'Active' : 'Deactivated'}</Badge> },
    { key: 'createdAt', label: 'Joined', render: (u) => <span className="text-ink-soft">{formatDate(u.createdAt)}</span> },
    { key: 'actions', label: 'Actions', align: 'right', render: (u) => {
      const self = u.id === currentUser?.id;
      const busy = pendingId === u.id;
      return (
        <div className="flex items-center justify-end gap-3">
          <Select
            value={u.role}
            onChange={(e) => requestRole(u, e.target.value)}
            disabled={self || busy}
            aria-label={`Role for ${u.name}`}
            title={self ? 'You cannot change your own role' : `Change role for ${u.name}`}
            className="w-32"
          >
            {ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
          </Select>
          <ActiveSwitch
            checked={u.isActive}
            onChange={() => requestActive(u)}
            disabled={self || busy}
            label={`${u.isActive ? 'Deactivate' : 'Activate'} ${u.name}`}
            title={self ? 'You cannot deactivate your own account' : u.isActive ? `Deactivate ${u.name}` : `Activate ${u.name}`}
          />
        </div>
      );
    } },
  ];

  return (
    <>
      <PageHeader
        title="Users & roles"
        subtitle="Who can access StockFlow, and what they can do."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportCsv} disabled={filtered.length === 0}><Download size={16} /> Export CSV</Button>
            <Button onClick={() => setAddOpen(true)}><Plus size={16} /> Add user</Button>
          </div>
        }
      />

      {!loading && !loadError && (
        <p className="mb-4 text-sm text-ink-soft">
          <span className="num font-medium text-ink">{users.length}</span> {users.length === 1 ? 'user' : 'users'} · <span className="num font-medium text-ink">{counts.active}</span> active · <span className="num font-medium text-ink">{counts.admins}</span> {counts.admins === 1 ? 'admin' : 'admins'} · <span className="num font-medium text-ink">{counts.managers}</span> {counts.managers === 1 ? 'manager' : 'managers'}
        </p>
      )}

      {created && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-ink">Credentials for {created.name}</h2>
              <p className="mt-1 text-xs text-ink-soft">Share these credentials securely. The password won't be shown again.</p>
              <div className="mt-3 space-y-1.5 text-[13px]">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-ink-soft">Email</span>
                  <span className="mono text-ink">{created.email}</span>
                  <CopyButton value={created.email} label="Copy email" />
                </p>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-ink-soft">Password</span>
                  <span className="mono text-ink">{created.password}</span>
                  <CopyButton value={created.password} label="Copy password" />
                </p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setCreated(null)}>Done</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Tabs
          value={roleFilter}
          onChange={(v) => { setParam('role', v === 'all' ? '' : v); setPage(1); }}
          ariaLabel="Filter by role"
          tabs={[{ value: 'all', label: 'All' }, { value: 'admin', label: 'Admins' }, { value: 'manager', label: 'Managers' }, { value: 'staff', label: 'Staff' }]}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name or email…" className="min-w-50 flex-1" />
        <Select
          value={statusFilter}
          onChange={(e) => { setParam('status', e.target.value === 'all' ? '' : e.target.value); setPage(1); }}
          aria-label="Filter by status"
          className="w-44"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={visible}
        loading={loading}
        empty={loadError
          ? <EmptyState title={loadError} action={<Button size="sm" variant="secondary" onClick={refresh}>Retry</Button>} />
          : (
            <EmptyState
              icon={UsersIcon}
              title={filtersActive ? 'No users match these filters.' : 'No users yet.'}
              action={filtersActive
                ? <Button size="sm" variant="secondary" onClick={clearFilters}>Clear filters</Button>
                : <Button size="sm" onClick={() => setAddOpen(true)}>Add user</Button>}
            />
          )}
      />
      {filtered.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />}

      {addOpen && <AddUserModal onClose={() => setAddOpen(false)} onCreated={handleCreated} />}

      <ConfirmDialog
        open={!!confirm}
        title={confirm ? (confirm.kind === 'role' ? `Make ${confirm.user.name} an admin?` : `Deactivate ${confirm.user.name}?`) : ''}
        body={confirm ? (
          <div className="space-y-3">
            {confirmError && <p className="text-out">{confirmError}</p>}
            <p>
              {confirm.kind === 'role'
                ? `${confirm.user.name} will get full access to StockFlow, including managing users and roles.`
                : `${confirm.user.name} will be signed out and unable to log in until reactivated.`}
            </p>
          </div>
        ) : ''}
        confirmLabel={confirm?.kind === 'role' ? 'Make admin' : 'Deactivate'}
        danger={confirm?.kind === 'active'}
        loading={!!confirm && pendingId === confirm.user.id}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === 'role') applyRole(confirm.user, confirm.role);
          else applyActive(confirm.user, false);
        }}
        onClose={() => { if (pendingId == null) { setConfirm(null); setConfirmError(''); } }}
      />
    </>
  );
}