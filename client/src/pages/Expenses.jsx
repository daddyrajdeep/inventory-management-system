import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Eye, Pencil, Plus, Receipt, Trash2 } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import SearchInput from '../components/ui/SearchInput';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense as apiDeleteExpense,
} from '../services/expenseService';
import { downloadCsv } from '../utils/csv';
import { formatINR, formatDate } from '../utils/format';

// Category colors are status tokens only: office→info, salaries→ok, professional→low, other→ink-soft.
const CATEGORIES = [
  { value: 'office', label: 'Office & Rent', tone: 'info', dot: 'bg-info', fill: 'var(--info)' },
  { value: 'salaries', label: 'Salaries & Wages', tone: 'ok', dot: 'bg-ok', fill: 'var(--ok)' },
  { value: 'professional', label: 'Professional Services', tone: 'low', dot: 'bg-low', fill: 'var(--low)' },
  { value: 'other', label: 'Other Expenses', tone: 'neutral', dot: 'bg-ink-soft', fill: 'var(--ink-soft)' },
];
const categoryOf = (value) => CATEGORIES.find((c) => c.value === value);
const categoryLabel = (value) => categoryOf(value)?.label ?? value;
const categoryTone = (value) => categoryOf(value)?.tone ?? 'neutral';

const PAGE_SIZE = 10;

const pad = (n) => String(n).padStart(2, '0');
// YYYY-MM-DD in local time, for <input type="date">
const toDayString = (value) => {
  const d = value ? new Date(value) : new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
// Local midnight as ISO 8601 so the chosen day doesn't shift across time zones
const dayToISO = (day) => new Date(`${day}T00:00:00`).toISOString();

const emptyForm = () => ({ title: '', category: 'office', amount: '', note: '', date: toDayString() });

export default function Expenses() {
  const [params, setParams] = useSearchParams();

  const search = params.get('search') ?? '';
  const category = params.get('category') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(''); // '' | 'add' | 'edit' | 'view' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };

  // Date range filters server-side; search and category filter client-side below.
  useEffect(() => {
    let active = true;
    const q = {};
    if (from) q.from = from;
    if (to) q.to = to;
    getExpenses(q)
      .then((list) => { if (active) { setExpenses(list); setLoadError(''); } })
      .catch((err) => { if (active) setLoadError(err.message); })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [from, to, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  // ?new=1 opens the add form once (render-time tracker, same idiom as Sales)
  const newParam = params.get('new');
  const [consumed, setConsumed] = useState(null);
  if (newParam && newParam !== consumed) {
    setConsumed(newParam);
    setSelected(null);
    setForm(emptyForm());
    setErrors({});
    setModal('add');
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      const matchesQuery = !q || (e.title ?? '').toLowerCase().includes(q) || (e.note ?? '').toLowerCase().includes(q);
      const matchesCategory = !category || e.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [expenses, search, category]);

  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
    const byCategory = CATEGORIES.map((c) => ({
      ...c,
      amount: expenses.filter((e) => e.category === c.value).reduce((s, e) => s + Number(e.amount ?? 0), 0),
    }));
    const top = byCategory.reduce((best, c) => (c.amount > best.amount ? c : best), byCategory[0]);
    return { total, byCategory, top };
  }, [expenses]);

  const slices = stats.byCategory.filter((c) => c.amount > 0);
  const maxCategory = Math.max(...stats.byCategory.map((c) => c.amount), 1);
  const share = (amount) => (stats.total > 0 ? Math.round((amount / stats.total) * 100) : 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp so a delete that empties the last page doesn't leave us out of range
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = Boolean(search || category || from || to);

  const openAdd = () => { setSelected(null); setForm(emptyForm()); setErrors({}); setModal('add'); };
  const openView = (expense) => { setSelected(expense); setModal('view'); };
  const openEdit = (expense) => {
    setSelected(expense);
    setForm({
      title: expense.title ?? '',
      category: expense.category ?? 'office',
      amount: expense.amount ?? '',
      note: expense.note ?? '',
      date: toDayString(expense.date ?? expense.createdAt),
    });
    setErrors({});
    setModal('edit');
  };
  const closeModal = () => {
    if (saving || deleting) return;
    setModal('');
    if (newParam) setParam('new', '');
  };

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '', form: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    const amount = Number(form.amount);
    if (form.amount === '' || !Number.isFinite(amount) || amount <= 0) next.amount = 'Enter an amount greater than 0.';
    if (!form.date) next.date = 'Date is required.';
    return next;
  };

  const saveExpense = async (event) => {
    event.preventDefault();
    const problems = validate();
    if (Object.keys(problems).length) { setErrors(problems); return; }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount),
      note: form.note,
    };
    setSaving(true);
    try {
      if (modal === 'edit' && selected) {
        // Only send the date if it changed, so the original timestamp is kept
        if (form.date !== toDayString(selected.date ?? selected.createdAt)) payload.date = dayToISO(form.date);
        await updateExpense(selected.id, payload);
        toast.success('Changes saved');
      } else {
        payload.date = form.date === toDayString() ? new Date().toISOString() : dayToISO(form.date);
        await createExpense(payload);
        toast.success('Expense added');
      }
      setSaving(false);
      setModal('');
      if (newParam) setParam('new', '');
      setPage(1);
      refresh();
    } catch (err) {
      setSaving(false);
      setErrors({ form: err.message });
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await apiDeleteExpense(selected.id);
      setExpenses((prev) => prev.filter((e) => e.id !== selected.id));
      setDeleting(false);
      setModal('');
      toast.success('Expense deleted');
    } catch (err) {
      setDeleting(false);
      toast.error(err.message);
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Date', 'Title', 'Category', 'Amount', 'Note', 'Logged by'],
      ...filtered.map((e) => [
        formatDate(e.date ?? e.createdAt),
        e.title ?? '',
        categoryLabel(e.category),
        e.amount ?? '',
        e.note ?? '',
        e.createdBy ?? '',
      ]),
    ];
    downloadCsv(`stockflow-expenses-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const columns = [
    { key: 'date', label: 'Date', render: (e) => <span className="text-ink-soft">{formatDate(e.date ?? e.createdAt)}</span> },
    { key: 'title', label: 'Title', render: (e) => (
      <div>
        <p className="font-medium text-ink">{e.title}</p>
        {e.note && <p className="max-w-72 truncate text-xs text-ink-soft">{e.note}</p>}
      </div>
    ) },
    { key: 'category', label: 'Category', render: (e) => <Badge tone={categoryTone(e.category)} dot>{categoryLabel(e.category)}</Badge> },
    { key: 'amount', label: 'Amount', align: 'right', num: true, render: (e) => formatINR(e.amount) },
    { key: 'createdBy', label: 'Logged by', render: (e) => e.createdBy ?? '—' },
    { key: 'actions', label: '', align: 'right', render: (e) => (
      <div className="flex justify-end gap-0.5">
        <IconButton label={`View ${e.title}`} onClick={() => openView(e)}><Eye size={16} /></IconButton>
        <IconButton label={`Edit ${e.title}`} onClick={() => openEdit(e)}><Pencil size={16} /></IconButton>
        <IconButton label={`Delete ${e.title}`} className="text-out" onClick={() => { setSelected(e); setModal('delete'); }}><Trash2 size={16} /></IconButton>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="What the business spends."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportCsv} disabled={!filtered.length} title="Exports the filtered records currently loaded (max 500)">
              <Download size={16} /> Export CSV
            </Button>
            <Button onClick={openAdd}><Plus size={16} /> Add expense</Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total expenses" value={formatINR(stats.total)} footnote="Latest 500 records" />
        <StatCard label="Records" value={expenses.length} />
        <StatCard
          label="Top category"
          value={expenses.length ? stats.top.label : '—'}
          footnote={expenses.length ? formatINR(stats.top.amount) : 'No expenses yet'}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-ink">Spend by category</h3>
          {slices.length === 0 ? (
            <EmptyState icon={Receipt} title="No expenses to break down yet." />
          ) : (
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={slices}
                      dataKey="amount"
                      nameKey="label"
                      innerRadius={56}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="var(--surface)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {slices.map((c) => <Cell key={c.value} fill={c.fill} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 12 }}
                      formatter={(v) => formatINR(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="num text-sm font-semibold text-ink">{formatINR(stats.total)}</span>
                  <span className="text-xs text-ink-soft">Total</span>
                </div>
              </div>
              <ul className="min-w-48 flex-1 space-y-2.5">
                {slices.map((c) => (
                  <li key={c.value} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="flex items-center gap-2 text-ink">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.dot}`} aria-hidden="true" />
                      {c.label}
                    </span>
                    <span className="num text-ink">{formatINR(c.amount)} <span className="text-ink-soft">({share(c.amount)}%)</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-ink">Category totals</h3>
          <div className="space-y-3">
            {stats.byCategory.map((c) => (
              <div key={c.value}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-ink">{c.label}</span>
                  <span className="num text-ink">{formatINR(c.amount)} <span className="text-ink-soft">({share(c.amount)}%)</span></span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-paper">
                  <div className={`h-full rounded-full ${c.dot}`} style={{ width: `${(c.amount / maxCategory) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(v) => setParam('search', v)} placeholder="Search by title or note..." className="min-w-50 flex-1" />
        <Select value={category} onChange={(e) => setParam('category', e.target.value)} aria-label="Filter by category" className="w-52">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
        <Input type="date" value={from} onChange={(e) => setParam('from', e.target.value)} aria-label="From date" className="w-40" />
        <Input type="date" value={to} onChange={(e) => setParam('to', e.target.value)} aria-label="To date" className="w-40" />
      </div>

      <DataTable
        columns={columns}
        rows={visible}
        loading={loading}
        onRowClick={openView}
        empty={
          loadError ? (
            <EmptyState title={loadError} action={<Button size="sm" variant="secondary" onClick={refresh}>Retry</Button>} />
          ) : (
            <EmptyState
              icon={Receipt}
              title={hasFilters ? 'No expenses match these filters.' : 'No expenses yet.'}
              action={!hasFilters ? <Button size="sm" onClick={openAdd}>Add your first expense</Button> : undefined}
            />
          )
        }
      />
      {filtered.length > PAGE_SIZE && <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />}

      {/* View */}
      <Modal open={modal === 'view'} title="Expense details" onClose={closeModal}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Badge tone={categoryTone(selected.category)} dot>{categoryLabel(selected.category)}</Badge>
              <span className="num text-lg font-semibold text-ink">{formatINR(selected.amount)}</span>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="col-span-2">
                <dt className="text-xs text-ink-soft">Title</dt>
                <dd className="font-medium text-ink">{selected.title}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">Date</dt>
                <dd className="text-ink">{formatDate(selected.date ?? selected.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">Logged by</dt>
                <dd className="text-ink">{selected.createdBy ?? '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-ink-soft">Note</dt>
                <dd className="text-ink">{selected.note ? selected.note : '—'}</dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      {/* Add / edit */}
      <Modal open={modal === 'add' || modal === 'edit'} title={modal === 'edit' ? 'Edit expense' : 'Add expense'} onClose={closeModal}>
        <form onSubmit={saveExpense} className="space-y-4" noValidate>
          <FormField label="Title" error={errors.title}>
            <Input value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g. Office electricity bill" />
          </FormField>
          <FormField label="Category">
            <Select value={form.category} onChange={(e) => setField('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Amount (₹)" error={errors.amount}>
            <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setField('amount', e.target.value)} placeholder="Enter amount" />
          </FormField>
          <FormField label="Date" error={errors.date}>
            <Input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} />
          </FormField>
          <FormField label="Note (optional)">
            <Textarea rows={2} value={form.note} onChange={(e) => setField('note', e.target.value)} placeholder="Reference number or details" />
          </FormField>
          {errors.form && <p className="text-[13px] text-out" role="alert">{errors.form}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={saving}>{modal === 'edit' ? 'Save changes' : 'Add expense'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete */}
      <ConfirmDialog
        open={modal === 'delete'}
        title="Delete expense"
        body={selected ? `Delete “${selected.title}” (${formatINR(selected.amount)})? This cannot be undone.` : ''}
        confirmLabel="Delete expense"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={closeModal}
      />
    </>
  );
}