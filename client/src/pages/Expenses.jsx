import { useMemo, useState } from "react";
import {
  Search, Plus, Download, CalendarDays, ChevronDown, MoreHorizontal,
  Wallet, Truck, Building2, Megaphone, Package, CheckCircle2,
  Clock3, AlertCircle, X, Receipt
} from "lucide-react";
import "./SalesExpenses.css";

const initialExpenses = [
  { id: "EXP-208", title: "Office Rent", category: "Utilities", vendor: "City Properties", amount: 25000, date: "Jul 08, 2026", status: "Paid", method: "Bank Transfer" },
  { id: "EXP-207", title: "Product Delivery", category: "Shipping", vendor: "FastTrack Logistics", amount: 2850, date: "Jul 07, 2026", status: "Pending", method: "UPI" },
  { id: "EXP-206", title: "Social Media Ads", category: "Marketing", vendor: "Meta Ads", amount: 4500, date: "Jul 06, 2026", status: "Paid", method: "Card" },
  { id: "EXP-205", title: "Packaging Materials", category: "Inventory", vendor: "PackWell Supplies", amount: 3200, date: "Jul 05, 2026", status: "Paid", method: "Bank Transfer" },
  { id: "EXP-204", title: "Internet & Phone", category: "Utilities", vendor: "Broadband Co.", amount: 1499, date: "Jul 04, 2026", status: "Overdue", method: "—" },
];

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

function ExpenseStatus({ status }) {
  const Icon = status === "Paid" ? CheckCircle2 : status === "Pending" ? Clock3 : AlertCircle;
  return <span className={`se-status ${status.toLowerCase()}`}><Icon size={12}/>{status}</span>;
}

const categoryIcon = { Utilities: Building2, Shipping: Truck, Marketing: Megaphone, Inventory: Package, Other: Wallet };

export default function Expenses() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Utilities", vendor: "", amount: "", status: "Paid", method: "Bank Transfer" });

  const filtered = useMemo(() => expenses.filter((expense) => {
    const matchesSearch = `${expense.id} ${expense.title} ${expense.vendor} ${expense.category}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (filter === "All" || expense.status === filter);
  }), [expenses, search, filter]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paid = expenses.filter((expense) => expense.status === "Paid").reduce((sum, expense) => sum + expense.amount, 0);
  const pending = expenses.filter((expense) => expense.status !== "Paid").reduce((sum, expense) => sum + expense.amount, 0);

  function addExpense(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.vendor.trim() || Number(form.amount) <= 0) return;
    const newExpense = {
      ...form, id: `EXP-${209 + expenses.length - initialExpenses.length}`,
      title: form.title.trim(), vendor: form.vendor.trim(), amount: Number(form.amount),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    };
    setExpenses((prev) => [newExpense, ...prev]);
    setForm({ title: "", category: "Utilities", vendor: "", amount: "", status: "Paid", method: "Bank Transfer" });
    setModalOpen(false);
  }

  return (
    <div className="se-page">
      <div className="se-heading">
        <div><div className="se-eyebrow">FINANCE / EXPENSES</div><h1>Expenses</h1><p>Track business costs, manage payments, and stay on budget.</p></div>
        <div className="se-heading-actions">
          <button className="se-secondary"><CalendarDays size={15}/> This Month <ChevronDown size={14}/></button>
          <button className="se-primary" onClick={() => setModalOpen(true)}><Plus size={17}/> Add Expense</button>
        </div>
      </div>

      <div className="se-stats">
        <div className="se-stat"><div className="se-stat-icon violet"><Wallet size={19}/></div><span>Total Expenses</span><strong>{money(total)}</strong><small className="positive">↗ 5.2% <em>vs. last month</em></small></div>
        <div className="se-stat"><div className="se-stat-icon green"><CheckCircle2 size={19}/></div><span>Paid Expenses</span><strong>{money(paid)}</strong><small className="positive">Paid successfully</small></div>
        <div className="se-stat"><div className="se-stat-icon orange"><Clock3 size={19}/></div><span>Due / Pending</span><strong>{money(pending)}</strong><small className="neutral">Needs attention</small></div>
        <div className="se-stat"><div className="se-stat-icon blue"><Receipt size={19}/></div><span>Expense Records</span><strong>{expenses.length.toString().padStart(2, "0")}</strong><small className="neutral">This month</small></div>
      </div>

      <section className="se-card">
        <div className="se-card-header"><div><h2>Expense Records</h2><p>All expenses across your business</p></div><button className="se-secondary small"><Download size={15}/> Export</button></div>
        <div className="se-toolbar">
          <div className="se-search"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expense, vendor, category..." /></div>
          <div className="se-tabs">{["All", "Paid", "Pending", "Overdue"].map((tab) => <button key={tab} className={filter === tab ? "selected" : ""} onClick={() => setFilter(tab)}>{tab}</button>)}</div>
        </div>
        <div className="se-table-scroll">
          <table className="se-table">
            <thead><tr><th>Expense</th><th>Category</th><th>Vendor</th><th>Amount</th><th>Payment Method</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>{filtered.map((expense) => {
              const Icon = categoryIcon[expense.category] || Wallet;
              return <tr key={expense.id}>
                <td><div className="se-expense-title"><span className="se-category-icon"><Icon size={15}/></span><div><strong>{expense.title}</strong><span className="se-sub">{expense.id}</span></div></div></td>
                <td><span className="se-category-label">{expense.category}</span></td><td>{expense.vendor}</td><td className="se-amount">{money(expense.amount)}</td><td>{expense.method}</td><td><ExpenseStatus status={expense.status}/></td><td>{expense.date}</td><td><button className="se-row-action" title="Expense actions"><MoreHorizontal size={17}/></button></td>
              </tr>;
            })}
            {filtered.length === 0 && <tr><td colSpan="8" className="se-empty">No expenses found.</td></tr>}</tbody>
          </table>
        </div>
        <div className="se-table-footer"><span>Showing {filtered.length} of {expenses.length} expenses</span><div><button disabled>‹</button><button className="current">1</button><button disabled>›</button></div></div>
      </section>

      {modalOpen && <div className="se-modal-backdrop" onClick={() => setModalOpen(false)}>
        <form className="se-modal" onSubmit={addExpense} onClick={(e) => e.stopPropagation()}>
          <div className="se-modal-head"><div><h2>Add New Expense</h2><p>Record a business expense.</p></div><button type="button" className="se-row-action" onClick={() => setModalOpen(false)}><X size={18}/></button></div>
          <label>Expense title<input required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="e.g. Office supplies"/></label>
          <label>Category<select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}><option>Utilities</option><option>Shipping</option><option>Marketing</option><option>Inventory</option><option>Other</option></select></label>
          <label>Vendor<input required value={form.vendor} onChange={(e) => setForm({...form, vendor: e.target.value})} placeholder="Vendor / company name"/></label>
          <label>Amount (₹)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} placeholder="0.00"/></label>
          <label>Payment status<select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}><option>Paid</option><option>Pending</option><option>Overdue</option></select></label>
          <label>Payment method<select value={form.method} onChange={(e) => setForm({...form, method: e.target.value})}><option>Bank Transfer</option><option>UPI</option><option>Card</option><option>Cash</option><option>—</option></select></label>
          <div className="se-modal-actions"><button type="button" className="se-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="se-primary"><Plus size={15}/> Save Expense</button></div>
        </form>
      </div>}
    </div>
  );
}
