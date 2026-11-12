import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  CalendarDays,
  FileText,
  Download,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  ShoppingBag,
  Building2,
  Briefcase,
  Receipt,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { downloadCsv } from "../utils/csv";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense as apiDeleteExpense,
} from "../services/expenseService";

const categories = ["office", "salaries", "professional", "other"];

const categoryLabels = {
  office: "Office & Rent",
  salaries: "Salaries & Wages",
  professional: "Professional Services",
  other: "Other Expenses",
};

const categoryStyle = {
  office: "bg-blue-700 text-white",
  salaries: "bg-teal-700 text-white",
  professional: "bg-purple-700 text-white",
  other: "bg-pink-700 text-white",
};

const categoryIcon = {
  office: Building2,
  salaries: Briefcase,
  professional: Receipt,
  other: ShoppingBag,
};

const money = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN")}`;

const pad = (n) => String(n).padStart(2, "0");
// YYYY-MM-DD in local time, for <input type="date">
const toDayString = (value) => {
  const d = value ? new Date(value) : new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
// Local midnight as ISO 8601 so the chosen day doesn't shift across time zones
const dayToISO = (day) => new Date(`${day}T00:00:00`).toISOString();

const emptyForm = () => ({
  title: "",
  category: "office",
  amount: "",
  note: "",
  date: toDayString(),
});

function Metric({ title, value, caption, icon: Icon, color }) {
  const themes = {
    purple: "border-purple-500/50 from-purple-950 to-purple-800/60 text-purple-300",
    blue: "border-blue-500/50 from-blue-950 to-blue-800/60 text-blue-300",
    green: "border-green-500/50 from-green-950 to-emerald-900/60 text-green-300",
  };

  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-2xl border bg-gradient-to-br p-4 shadow-lg ${themes[color]}`}>
      <div className="rounded-xl bg-white/10 p-3">
        <Icon size={24} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white/80">{title}</p>
        <h3 className="mt-1 truncate text-xl font-extrabold text-white">{value}</h3>
        {caption && <p className="mt-1 text-xs font-semibold text-white/60">{caption}</p>}
      </div>
    </div>
  );
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const pageSize = 10;

  useEffect(() => {
    let active = true;
    getExpenses()
      .then((data) => {
        if (active) setExpenses(data);
      })
      .catch((err) => toast.error(err.message || "Failed to load expenses"))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      expenses.filter((e) => {
        const q = search.toLowerCase();
        const matchesQuery =
          (e.title || "").toLowerCase().includes(q) ||
          (e.note || "").toLowerCase().includes(q) ||
          (e.id || "").toLowerCase().includes(q);
        const matchesCat =
          categoryFilter === "All Categories" || e.category === categoryFilter;
        return matchesQuery && matchesCat;
      }),
    [expenses, search, categoryFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Clamp so a delete that empties the last page doesn't leave us out of range
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const now = new Date();
  const thisMonthTotal = expenses
    .filter((e) => {
      const d = new Date(e.date || e.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const categoryTotals = categories
    .map((category) => ({
      category,
      label: categoryLabels[category],
      amount: expenses
        .filter((e) => e.category === category)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    }))
    .filter((entry) => entry.amount > 0);

  const addExpense = () => {
    setSelected(null);
    setForm(emptyForm());
    setModal("add");
  };

  const editExpense = (expense) => {
    setSelected(expense);
    setForm({
      title: expense.title || "",
      category: expense.category || "office",
      amount: expense.amount || "",
      note: expense.note || "",
      date: toDayString(expense.date || expense.createdAt),
    });
    setModal("edit");
  };

  const saveExpense = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || Number(form.amount) <= 0 || !form.date) return;

    const payload = {
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount),
      note: form.note,
    };

    try {
      setSaving(true);
      if (modal === "edit" && selected) {
        // Only send the date if it changed, so the original timestamp is kept
        if (form.date !== toDayString(selected.date || selected.createdAt)) {
          payload.date = dayToISO(form.date);
        }
        const updated = await updateExpense(selected.id, payload);
        setExpenses((prev) =>
          prev.map((e) => (e.id === selected.id ? updated : e))
        );
        toast.success("Expense updated successfully");
      } else {
        payload.date = form.date === toDayString() ? new Date().toISOString() : dayToISO(form.date);
        const created = await createExpense(payload);
        setExpenses((prev) => [created, ...prev]);
        toast.success("Expense added successfully");
      }
      setModal("");
      setPage(1);
    } catch (err) {
      toast.error(err.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await apiDeleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      const remaining = filtered.filter((e) => e.id !== id).length;
      setPage((p) => Math.min(p, Math.max(1, Math.ceil(remaining / pageSize))));
      toast.success("Expense deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete expense");
    }
  };

  const exportCSV = () => {
    const rows = [
      ["ID", "Title", "Category", "Amount", "Date", "Created By"],
      ...filtered.map((e) => [
        e.id,
        e.title,
        categoryLabels[e.category] || e.category,
        e.amount,
        new Date(e.date || e.createdAt).toLocaleDateString(),
        e.createdBy || "System",
      ]),
    ];

    downloadCsv("StockFlow-Expenses.csv", rows);
  };

  const metrics = [
    { title: "Total Expenses", value: money(total), caption: "All recorded expenses", icon: Wallet, color: "purple" },
    {
      title: "This Month",
      value: money(thisMonthTotal),
      caption: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      icon: CalendarDays,
      color: "blue",
    },
    { title: "Expense Records", value: expenses.length, caption: "Entries in database", icon: FileText, color: "green" },
  ];

  const pieColors = ["#a855f7", "#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];
  let cumulative = 0;
  const gradient = categoryTotals
    .map((item, index) => {
      const start = cumulative;
      cumulative += total ? (item.amount / total) * 100 : 0;
      return `${pieColors[index % pieColors.length]} ${start}% ${cumulative}%`;
    })
    .join(", ");

  return (
    <div className="w-full min-w-0 space-y-4 text-gray-900 dark:text-white">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Dashboard <span className="mx-2 text-purple-500">›</span> Expenses
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 p-3 text-white shadow-lg shadow-purple-500/30">
            <Wallet size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Expenses</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track and categorise business expenses.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-900"
          >
            <Download size={16} /> Export
          </button>
          <button
            onClick={addExpense}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/30 hover:brightness-110"
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metrics.map((item) => (
          <Metric key={item.title} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-indigo-900 dark:bg-[#0c1230]">
          <h3 className="font-extrabold">Expenses by Category</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Share of total spend by category</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
            <div
              className="relative h-44 w-44 shrink-0 rounded-full"
              style={{ background: categoryTotals.length ? `conic-gradient(${gradient})` : "#64748b" }}
            >
              <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center dark:bg-[#101a3b]">
                <strong className="text-lg">{money(total)}</strong>
                <span className="text-xs text-gray-500">Total</span>
              </div>
            </div>

            <div className="min-w-[190px] flex-1 space-y-3">
              {categoryTotals.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <i className="h-3 w-3 rounded-sm" style={{ background: pieColors[index % pieColors.length] }} />
                    <span>{item.label}</span>
                  </span>
                  <strong>{money(item.amount)}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-indigo-900 dark:bg-[#0c1230]">
          <h3 className="font-extrabold text-gray-900 dark:text-white">Recent Category Breakdown</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Total amounts per category</p>

          <div className="mt-4 space-y-4">
            {categories.map((cat) => {
              const catAmount = expenses
                .filter((e) => e.category === cat)
                .reduce((s, e) => s + (Number(e.amount) || 0), 0);
              const pct = total ? Math.round((catAmount / total) * 100) : 0;
              const Icon = categoryIcon[cat] || Receipt;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold">
                      <Icon size={16} className="text-purple-500" />
                      {categoryLabels[cat]}
                    </span>
                    <span className="font-bold">{money(catAmount)} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-indigo-900 dark:bg-[#0c1230]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold">Expense Records</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Permanently saved in database.</p>
          </div>
          <button
            onClick={addExpense}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white"
          >
            <Plus size={17} /> Add Expense
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex h-10 min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-gray-300 px-3 dark:border-slate-700 dark:bg-[#080e25]">
            <Search size={17} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title or note..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#080e25]"
          >
            <option>All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </select>

          <div className="flex rounded-xl border border-gray-300 p-1 dark:border-slate-700">
            <button
              onClick={() => setView("list")}
              className={`rounded-lg p-2 ${view === "list" ? "bg-purple-600 text-white" : "text-gray-500"}`}
            >
              <List size={17} />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`rounded-lg p-2 ${view === "grid" ? "bg-purple-600 text-white" : "text-gray-500"}`}
            >
              <LayoutGrid size={17} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="animate-spin mr-2" size={24} /> Loading expenses...
          </div>
        ) : view === "list" ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-100 text-xs font-bold uppercase text-gray-600 dark:bg-[#17234b] dark:text-gray-200">
                <tr>
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Title</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Logged By</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e, index) => {
                  const Icon = categoryIcon[e.category] || Receipt;
                  return (
                    <tr key={e.id} className="border-t border-gray-100 hover:bg-purple-50/60 dark:border-slate-800 dark:hover:bg-indigo-950/50">
                      <td className="px-3 py-3 text-gray-500">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="rounded-xl bg-purple-100 p-2.5 text-purple-700 dark:bg-purple-600/30 dark:text-purple-300">
                            <Icon size={19} />
                          </span>
                          <div>
                            <p className="font-bold">{e.title}</p>
                            {e.note && <p className="text-xs text-gray-500">{e.note}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${categoryStyle[e.category] || 'bg-gray-700 text-white'}`}>
                          {categoryLabels[e.category] || e.category}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-bold">{money(e.amount)}</td>
                      <td className="px-3 py-3 text-gray-500 dark:text-gray-300">
                        {new Date(e.date || e.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{e.createdBy || "Admin"}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button title="View" onClick={() => { setSelected(e); setModal("view"); }} className="rounded-lg bg-blue-500/15 p-2 text-blue-500"><Eye size={16} /></button>
                          <button title="Edit" onClick={() => editExpense(e)} className="rounded-lg bg-purple-500/15 p-2 text-purple-500"><Pencil size={16} /></button>
                          <button title="Delete" onClick={() => handleDeleteExpense(e.id)} className="rounded-lg bg-red-500/15 p-2 text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr><td colSpan="7" className="py-10 text-center text-gray-500">No expenses found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((e) => {
              const Icon = categoryIcon[e.category] || Receipt;
              return (
                <article key={e.id} className="rounded-xl border border-gray-200 p-4 dark:border-slate-700 dark:bg-[#080e25]">
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-purple-100 p-3 text-purple-600 dark:bg-purple-600/30 dark:text-purple-300">
                      <Icon size={22} />
                    </span>
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${categoryStyle[e.category] || 'bg-gray-700 text-white'}`}>
                      {categoryLabels[e.category] || e.category}
                    </span>
                  </div>
                  <h4 className="mt-4 font-bold">{e.title}</h4>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(e.date || e.createdAt).toLocaleDateString()}
                  </p>
                  <strong className="mt-3 block text-xl">{money(e.amount)}</strong>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => { setSelected(e); setModal("view"); }} className="rounded-lg bg-blue-500/15 p-2 text-blue-500"><Eye size={16} /></button>
                    <button onClick={() => editExpense(e)} className="rounded-lg bg-purple-500/15 p-2 text-purple-500"><Pencil size={16} /></button>
                    <button onClick={() => handleDeleteExpense(e.id)} className="rounded-lg bg-red-500/15 p-2 text-red-500"><Trash2 size={16} /></button>
                  </div>
                </article>
              );
            })}
            {visible.length === 0 && <p className="text-sm text-gray-500">No expenses found.</p>}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-300">
          <span>
            Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}
            {' – '}{Math.min(currentPage * pageSize, filtered.length)}
            {' of '}{filtered.length} expenses
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-lg border border-gray-300 p-2 disabled:opacity-30 dark:border-slate-700"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="rounded-lg bg-purple-600 px-3 py-2 font-bold text-white">{currentPage}</span>
            <span>of {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-lg border border-gray-300 p-2 disabled:opacity-30 dark:border-slate-700"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setModal("")}>
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-purple-500/30 bg-white p-6 shadow-2xl dark:bg-[#101832]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModal("")} className="absolute right-4 top-4 rounded-lg bg-gray-100 p-2 dark:bg-slate-800">
              <X size={17} />
            </button>

            {modal === "view" ? (
              <>
                <h2 className="text-xl font-extrabold">Expense Details</h2>
                <p className="mt-1 text-sm text-gray-500">Transaction information</p>
                <div className="mt-6 space-y-4">
                  {[
                    ["Title", selected?.title],
                    ["Category", categoryLabels[selected?.category] || selected?.category],
                    ["Amount", money(selected?.amount || 0)],
                    ["Date", new Date(selected?.date || selected?.createdAt).toLocaleDateString()],
                    ["Note", selected?.note || "-"],
                    ["Created By", selected?.createdBy || "Admin"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 border-b border-gray-200 pb-3 text-sm dark:border-slate-700">
                      <span className="text-gray-500">{label}</span>
                      <strong className="text-right">{value}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-extrabold">{modal === "edit" ? "Edit Expense" : "Add New Expense"}</h2>
                <p className="mb-5 mt-1 text-sm text-gray-500">All fields except the note are required.</p>
                <form onSubmit={saveExpense} className="space-y-4">
                  <label className="block text-sm font-semibold">
                    Expense Title
                    <input
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Office electricity bill"
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-[#080e25]"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Category
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-[#080e25]"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {categoryLabels[c]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">
                    Amount (₹)
                    <input
                      required
                      min="1"
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="Enter amount"
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-[#080e25]"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Date
                    <input
                      required
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-[#080e25]"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Note (Optional)
                    <input
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="Optional notes or reference number"
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-[#080e25]"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3 font-bold text-white shadow-lg shadow-purple-500/20 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : modal === "edit" ? "Save Changes" : "Add Expense"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
