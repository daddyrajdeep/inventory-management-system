import React, { useMemo, useState } from "react";
import {
  Search, Plus, Download, CalendarDays, ChevronDown, MoreHorizontal,
  ReceiptText, CircleDollarSign, ShoppingCart, TrendingUp, X,
  CheckCircle2, Clock3, AlertCircle, Eye, Printer
} from "lucide-react";
import "./SalesExpenses.css";

const initialInvoices = [
  { id: "INV-1052", customer: "Alicia Tran", email: "alicia.tran@email.com", items: "Wireless Mouse × 2", amount: 240, date: "Jul 08, 2026", payment: "Paid", status: "Completed" },
  { id: "INV-1051", customer: "Mohamed El-Sayed", email: "mohamed@email.com", items: "USB Keyboard × 3", amount: 375, date: "Jul 08, 2026", payment: "Pending", status: "Pending" },
  { id: "INV-1050", customer: "Sofia Meyers", email: "sofia@email.com", items: "Headphones × 2", amount: 520, date: "Jul 07, 2026", payment: "Paid", status: "Completed" },
  { id: "INV-1049", customer: "Carlos Ramirez", email: "carlos@email.com", items: "USB-C Hub × 1", amount: 180, date: "Jul 07, 2026", payment: "Refunded", status: "Cancelled" },
  { id: "INV-1048", customer: "Nina Patel", email: "nina@email.com", items: "Laptop Stand × 4", amount: 340, date: "Jul 06, 2026", payment: "Paid", status: "Completed" },
];

const money = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Status({ status }) {
  const Icon = status === "Completed" || status === "Paid" ? CheckCircle2 : status === "Pending" ? Clock3 : AlertCircle;
  return <span className={`se-status ${status.toLowerCase()}`}><Icon size={12}/>{status}</span>;
}

export default function Sales() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ customer: "", item: "", amount: "", payment: "Paid" });

  const filtered = useMemo(() => invoices.filter((invoice) => {
    const matchesSearch = `${invoice.id} ${invoice.customer} ${invoice.items}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || invoice.status === filter;
    return matchesSearch && matchesFilter;
  }), [invoices, search, filter]);

  const totalSales = invoices.reduce((sum, invoice) => sum + (invoice.status !== "Cancelled" ? invoice.amount : 0), 0);
  const paid = invoices.filter((invoice) => invoice.payment === "Paid").reduce((sum, invoice) => sum + invoice.amount, 0);
  const pending = invoices.filter((invoice) => invoice.payment === "Pending").reduce((sum, invoice) => sum + invoice.amount, 0);

  function createSale(e) {
    e.preventDefault();
    if (!form.customer.trim() || !form.item.trim() || Number(form.amount) <= 0) return;
    const newInvoice = {
      id: `INV-${1053 + invoices.length - initialInvoices.length}`,
      customer: form.customer.trim(),
      email: "New customer",
      items: form.item.trim(),
      amount: Number(form.amount),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      payment: form.payment,
      status: form.payment === "Paid" ? "Completed" : "Pending",
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    setForm({ customer: "", item: "", amount: "", payment: "Paid" });
    setModalOpen(false);
  }

  return (
    <div className="se-page">
      <div className="se-heading">
        <div><div className="se-eyebrow">COMMERCE / SALES</div><h1>Sales & Invoices</h1><p>Manage sales, track payments, and create customer invoices.</p></div>
        <div className="se-heading-actions">
          <button className="se-secondary"><CalendarDays size={15}/> This Month <ChevronDown size={14}/></button>
          <button className="se-primary" onClick={() => setModalOpen(true)}><Plus size={17}/> New Sale</button>
        </div>
      </div>

      <div className="se-stats">
        <div className="se-stat"><div className="se-stat-icon violet"><CircleDollarSign size={19}/></div><span>Total Sales</span><strong>{money(totalSales)}</strong><small className="positive">↗ 12.8% <em>vs. last month</em></small></div>
        <div className="se-stat"><div className="se-stat-icon green"><CheckCircle2 size={19}/></div><span>Paid Invoices</span><strong>{money(paid)}</strong><small className="positive">↗ 8.4% <em>collected</em></small></div>
        <div className="se-stat"><div className="se-stat-icon orange"><Clock3 size={19}/></div><span>Pending Payments</span><strong>{money(pending)}</strong><small className="neutral">{invoices.filter((x) => x.payment === "Pending").length} invoice(s) awaiting</small></div>
        <div className="se-stat"><div className="se-stat-icon blue"><ReceiptText size={19}/></div><span>Total Invoices</span><strong>{invoices.length.toString().padStart(2, "0")}</strong><small className="positive"><TrendingUp size={12}/> Sales records</small></div>
      </div>

      <section className="se-card">
        <div className="se-card-header">
          <div><h2>All Invoices</h2><p>Review and manage customer sales</p></div>
          <button className="se-secondary small"><Download size={15}/> Export</button>
        </div>
        <div className="se-toolbar">
          <div className="se-search"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice, customer, product..." /></div>
          <div className="se-tabs">{["All", "Completed", "Pending", "Cancelled"].map((tab) => <button key={tab} className={filter === tab ? "selected" : ""} onClick={() => setFilter(tab)}>{tab}</button>)}</div>
        </div>
        <div className="se-table-scroll">
          <table className="se-table">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Product / Items</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>{filtered.map((invoice) => <tr key={invoice.id}>
              <td><strong className="se-invoice-id">{invoice.id}</strong></td>
              <td><strong className="se-customer">{invoice.customer}</strong><span className="se-sub">{invoice.email}</span></td>
              <td>{invoice.items}</td><td className="se-amount">{money(invoice.amount)}</td>
              <td><Status status={invoice.payment}/></td><td><Status status={invoice.status}/></td><td>{invoice.date}</td>
              <td><button className="se-row-action" title="Invoice actions"><MoreHorizontal size={17}/></button></td>
            </tr>)}
            {filtered.length === 0 && <tr><td colSpan="8" className="se-empty">No invoices found.</td></tr>}</tbody>
          </table>
        </div>
        <div className="se-table-footer"><span>Showing {filtered.length} of {invoices.length} invoices</span><div><button disabled>‹</button><button className="current">1</button><button disabled>›</button></div></div>
      </section>

      {modalOpen && <div className="se-modal-backdrop" onClick={() => setModalOpen(false)}>
        <form className="se-modal" onSubmit={createSale} onClick={(e) => e.stopPropagation()}>
          <div className="se-modal-head"><div><h2>Create New Sale</h2><p>Enter sale details to generate an invoice.</p></div><button type="button" className="se-row-action" onClick={() => setModalOpen(false)}><X size={18}/></button></div>
          <label>Customer name<input required value={form.customer} onChange={(e) => setForm({...form, customer: e.target.value})} placeholder="e.g. Alex Johnson"/></label>
          <label>Product / items<input required value={form.item} onChange={(e) => setForm({...form, item: e.target.value})} placeholder="e.g. Wireless Mouse × 2"/></label>
          <label>Sale amount ($)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} placeholder="0.00"/></label>
          <label>Payment status<select value={form.payment} onChange={(e) => setForm({...form, payment: e.target.value})}><option>Paid</option><option>Pending</option></select></label>
          <div className="se-modal-actions"><button type="button" className="se-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="se-primary"><Plus size={15}/> Create Sale</button></div>
        </form>
      </div>}
    </div>
  );
}
