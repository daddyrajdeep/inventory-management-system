import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  Wallet,
  BadgeIndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  CalendarDays,
  MoreHorizontal,
} from "lucide-react";
import "./Dashboard.css";

const monthlyData = [
  { month: "Jan", sales: 42000, purchase: 28000, expense: 9000 },
  { month: "Feb", sales: 48000, purchase: 32000, expense: 10500 },
  { month: "Mar", sales: 39000, purchase: 27000, expense: 8500 },
  { month: "Apr", sales: 55000, purchase: 36000, expense: 12000 },
  { month: "May", sales: 61000, purchase: 41000, expense: 11000 },
  { month: "Jun", sales: 54000, purchase: 43000, expense: 12800 },
];

const products = [
  { name: "Wireless Mouse", sold: 320, revenue: 48000, percent: 88 },
  { name: "USB-C Cable", sold: 280, revenue: 22400, percent: 76 },
  { name: "Keyboard", sold: 210, revenue: 52500, percent: 64 },
  { name: "Headphones", sold: 165, revenue: 66000, percent: 52 },
  { name: "Webcam", sold: 120, revenue: 36000, percent: 38 },
];

const transactions = [
  { id: "INV-2026-1042", customer: "Rahul Sharma", date: "10 Jun 2026", type: "Sale", amount: 12500, status: "Completed" },
  { id: "PUR-2026-0088", customer: "Tech Distributors", date: "09 Jun 2026", type: "Purchase", amount: 8200, status: "Pending" },
  { id: "INV-2026-1041", customer: "Priya Das", date: "08 Jun 2026", type: "Sale", amount: 6400, status: "Completed" },
  { id: "EXP-2026-0026", customer: "Store Utilities", date: "07 Jun 2026", type: "Expense", amount: 2100, status: "Completed" },
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const total = (key) => monthlyData.reduce((sum, item) => sum + item[key], 0);
const salesTotal = total("sales");
const purchaseTotal = total("purchase");
const expenseTotal = total("expense");
const netProfit = salesTotal - purchaseTotal - expenseTotal;

const StatCard = ({ title, value, note, icon: Icon, tone, trend }) => (
  <article className="sf-stat-card">
    <div className="sf-stat-top">
      <span className={`sf-stat-icon ${tone}`}><Icon size={20} /></span>
      <span className={`sf-trend ${trend === "down" ? "negative" : ""}`}>
        {trend === "down" ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
        {note}
      </span>
    </div>
    <p className="sf-stat-label">{title}</p>
    <h2>{money(value)}</h2>
    <span className="sf-stat-foot">Compared to previous 6 months</span>
  </article>
);

const Dashboard = () => {
  return (
    <main className="sf-dashboard">
      <div className="sf-page-heading">
        <div>
          <p className="sf-eyebrow">OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="sf-subtitle">Welcome back! Here's what's happening with your store.</p>
        </div>
        <div className="sf-heading-actions">
          <button className="sf-date-button" type="button"><CalendarDays size={16} /> Last 6 months</button>
          <button className="sf-export-button" type="button" onClick={() => window.print()}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <section className="sf-stats-grid">
        <StatCard title="Total Sales" value={salesTotal} note="12.8%" icon={TrendingUp} tone="purple" />
        <StatCard title="Total Purchase" value={purchaseTotal} note="8.4%" icon={ShoppingCart} tone="blue" />
        <StatCard title="Total Expenses" value={expenseTotal} note="3.2%" icon={Wallet} tone="orange" trend="down" />
        <StatCard title="Net Profit" value={netProfit} note="10.6%" icon={BadgeIndianRupee} tone="green" />
      </section>

      <section className="sf-charts-grid">
        <article className="sf-panel sf-sales-panel">
          <div className="sf-panel-heading">
            <div><h3>Sales Trend</h3><p>Monthly sales performance</p></div>
            <button className="sf-icon-button" aria-label="More sales chart options" type="button"><MoreHorizontal size={20} /></button>
          </div>
          <div className="sf-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#edf0f5" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9299a8", fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fill: "#9299a8", fontSize: 12 }} width={42} />
                <Tooltip formatter={(v) => money(v)} />
                <Line type="monotone" dataKey="sales" name="Sales" stroke="#7656e8" strokeWidth={3} dot={{ r: 4, fill: "#7656e8", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="sf-panel">
          <div className="sf-panel-heading">
            <div><h3>Purchase vs Expense</h3><p>Monthly cost breakdown</p></div>
            <button className="sf-icon-button" aria-label="More cost chart options" type="button"><MoreHorizontal size={20} /></button>
          </div>
          <div className="sf-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barGap={7}>
                <CartesianGrid stroke="#edf0f5" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9299a8", fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fill: "#9299a8", fontSize: 12 }} width={42} />
                <Tooltip formatter={(v) => money(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="purchase" name="Purchase" fill="#5795ed" radius={[5, 5, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#f29a65" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="sf-bottom-grid">
        <article className="sf-panel">
          <div className="sf-panel-heading">
            <div><h3>Top-Selling Products</h3><p>Best performers this period</p></div>
            <button className="sf-text-button" type="button">View all</button>
          </div>
          <div className="sf-product-list">
            {products.map((product, index) => (
              <div className="sf-product-row" key={product.name}>
                <span className="sf-product-rank">{String(index + 1).padStart(2, "0")}</span>
                <div className="sf-product-info">
                  <div className="sf-product-meta"><strong>{product.name}</strong><span>{product.sold} sold</span></div>
                  <div className="sf-progress"><span style={{ width: `${product.percent}%` }} /></div>
                </div>
                <strong className="sf-product-revenue">{money(product.revenue)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="sf-panel sf-transactions-panel">
          <div className="sf-panel-heading">
            <div><h3>Recent Transactions</h3><p>Your latest business activity</p></div>
            <button className="sf-text-button" type="button">View all</button>
          </div>
          <div className="sf-table-wrap">
            <table className="sf-transactions-table">
              <thead><tr><th>Transaction</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {transactions.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.customer}</strong><span>{item.id} · {item.date}</span></td>
                    <td>{item.type}</td>
                    <td className="sf-amount">{money(item.amount)}</td>
                    <td><span className={`sf-status ${item.status.toLowerCase()}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
      <p className="sf-demo-note">Demo data is shown for UI preview. Connect your backend/API to display live inventory and transaction data.</p>
    </main>
  );
};

export default Dashboard;
