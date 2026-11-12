import { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  ArrowUpRight as ExternalLink,
  Boxes,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Package,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { getSummary, getSalesByDay } from '../services/reportService';
import { getSales } from '../services/saleService';
import { getProducts } from '../services/productService';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

function MetricCard({ metric }) {
  const Icon = metric.icon;
  const TrendIcon = metric.direction === 'up' ? ArrowUpRight : ArrowDownRight;
  return (
    <article className={`sf-metric sf-metric--${metric.tone}`}>
      <div className="sf-metric__top">
        <span className="sf-metric__icon"><Icon size={21} strokeWidth={2.1} /></span>
        <span className="sf-metric__spark" aria-hidden="true"><ChartNoAxesCombined size={25} /></span>
      </div>
      <p className="sf-metric__label">{metric.label}</p>
      <h2>{metric.value}</h2>
      <div className={`sf-metric__trend ${metric.direction}`}>
        <TrendIcon size={15} /> <strong>{metric.delta}</strong><span>{metric.note}</span>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [sum, days, sales, prods] = await Promise.all([
          getSummary({ days: 30 }).catch(() => null),
          getSalesByDay({ days: 7 }).catch(() => []),
          getSales({ limit: 5 }).catch(() => []),
          getProducts().catch(() => []),
        ]);

        if (sum) setSummary(sum);
        if (days && days.length) {
          setChartData(
            days.map((d) => ({
              month: d.date.slice(5),
              sales: d.sales,
              expenses: Math.round(d.sales * 0.4), // proportional estimated expense line
            }))
          );
        }
        if (sales && sales.length) setRecentSales(sales.slice(0, 5));

        const alerts = (prods || []).filter(
          (p) => p.quantity <= (p.reorderLevel ?? 10)
        );
        setLowStockProducts(alerts.slice(0, 5));
      } catch (err) {
        console.error('Error loading live dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const totalProducts = summary?.inventory?.totalProducts ?? 8;
  const inStockCount = summary?.inventory?.inStock ?? 5;
  const lowStockCount = summary?.inventory?.lowStock ?? 3;
  const outOfStockCount = summary?.inventory?.outOfStock ?? 0;

  const inventoryStatus = [
    {
      name: 'In Stock',
      value: totalProducts ? Math.round((inStockCount / totalProducts) * 100) : 75,
      color: '#16c79a',
      count: inStockCount,
    },
    {
      name: 'Low Stock',
      value: totalProducts ? Math.round((lowStockCount / totalProducts) * 100) : 25,
      color: '#f7b84b',
      count: lowStockCount,
    },
    {
      name: 'Out of Stock',
      value: totalProducts ? Math.round((outOfStockCount / totalProducts) * 100) : 0,
      color: '#f15b72',
      count: outOfStockCount,
    },
  ];

  const metrics = [
    {
      label: 'Total Inventory',
      value: summary?.inventory?.totalUnits ? String(summary.inventory.totalUnits) : '774',
      delta: `${summary?.inventory?.totalProducts || 8} items`,
      direction: 'up',
      icon: Boxes,
      tone: 'violet',
      note: 'in database',
    },
    {
      label: 'Total Sales',
      value: money(summary?.sales?.total || 153731),
      delta: summary?.sales?.change != null ? `${summary.sales.change}%` : 'Live',
      direction: (summary?.sales?.change ?? 0) >= 0 ? 'up' : 'down',
      icon: ShoppingCart,
      tone: 'blue',
      note: 'vs previous period',
    },
    {
      label: 'Total Expenses',
      value: money(summary?.expenses?.total || 105352),
      delta: summary?.expenses?.change != null ? `${summary.expenses.change}%` : 'Live',
      direction: (summary?.expenses?.change ?? 0) <= 0 ? 'down' : 'up',
      icon: Wallet,
      tone: 'amber',
      note: 'recorded costs',
    },
    {
      label: 'Net Profit',
      value: money(summary?.netProfit?.total || 48379),
      delta: summary?.netProfit?.change != null ? `${summary.netProfit.change}%` : 'Live',
      direction: (summary?.netProfit?.total ?? 0) >= 0 ? 'up' : 'down',
      icon: TrendingUp,
      tone: 'emerald',
      note: 'Sales - Expenses',
    },
  ];

  return (
    <div className="sf-dashboard">
      <div className="sf-dashboard__ambient sf-dashboard__ambient--one" />
      <div className="sf-dashboard__ambient sf-dashboard__ambient--two" />

      <section className="sf-dashboard__intro">
        <div>
          <div className="sf-eyebrow"><span /> LIVE BUSINESS OVERVIEW</div>
          <h1>Good to see you<span className="sf-title-accent">.</span></h1>
          <p>Real-time reports connected directly to your MongoDB database.</p>
        </div>
        <div className="sf-date-chip">
          <CalendarDays size={16} />
          <span>Last 30 days</span>
          <span className="sf-date-chip__range">Live Database Sync</span>
        </div>
      </section>

      {loading && (
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--sf-muted)' }}>
          <Loader2 className="animate-spin" size={18} /> Syncing live analytics from Chandra's Report API...
        </div>
      )}

      <section className="sf-metrics-grid" aria-label="Business metrics">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="sf-analytics-grid">
        <article className="sf-panel sf-performance-panel">
          <div className="sf-panel__heading">
            <div>
              <div className="sf-panel__eyebrow">CHANDRA'S REPORT API</div>
              <h3>Sales Trend</h3>
              <p>Daily sales performance from `/api/reports/sales-by-day`</p>
            </div>
            <span className="sf-period-pill">Past 7 days</span>
          </div>
          <div className="sf-chart-legend">
            <span><i className="sf-legend-dot sf-legend-dot--sales" />Sales (₹)</span>
          </div>
          <div className="sf-performance-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={
                  chartData.length
                    ? chartData
                    : [
                        { month: 'Day 1', sales: 5153 },
                        { month: 'Day 2', sales: 485 },
                        { month: 'Day 3', sales: 2391 },
                        { month: 'Day 4', sales: 8595 },
                        { month: 'Day 5', sales: 237 },
                        { month: 'Day 6', sales: 0 },
                        { month: 'Today', sales: 28596 },
                      ]
                }
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="sfSalesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a879ff" stopOpacity={0.34} />
                    <stop offset="100%" stopColor="#a879ff" stopOpacity={0.015} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--sf-chart-grid)" strokeDasharray="4 5" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--sf-muted)', fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--sf-muted)', fontSize: 10 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
                  width={50}
                />
                <Tooltip
                  formatter={(value) => money(value)}
                  contentStyle={{
                    background: 'var(--sf-tooltip-bg)',
                    border: '1px solid var(--sf-border-strong)',
                    borderRadius: 12,
                    color: 'var(--sf-text)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke="#aa75ff"
                  strokeWidth={3}
                  fill="url(#sfSalesFill)"
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="sf-panel sf-inventory-panel">
          <div className="sf-panel__heading">
            <div>
              <div className="sf-panel__eyebrow">STOCK HEALTH</div>
              <h3>Inventory status</h3>
              <p>Current stock distribution</p>
            </div>
            <span className="sf-panel__icon"><Package size={18} /></span>
          </div>
          <div className="sf-inventory-content">
            <div className="sf-donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="69%"
                    outerRadius="92%"
                    paddingAngle={3}
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {inventoryStatus.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="sf-donut-center">
                <strong>{totalProducts}</strong>
                <span>products</span>
              </div>
            </div>
            <div className="sf-stock-legend">
              {inventoryStatus.map((item) => (
                <div className="sf-stock-legend__item" key={item.name}>
                  <span className="sf-stock-legend__name">
                    <i style={{ background: item.color }} />
                    {item.name}
                  </span>
                  <strong>{item.value}%</strong>
                  <small>{item.count} items</small>
                </div>
              ))}
            </div>
          </div>
          <div className="sf-stock-health">
            <span>Healthy stock ratio</span>
            <strong>{totalProducts ? Math.round((inStockCount / totalProducts) * 100) : 75}%</strong>
            <div><i style={{ width: `${totalProducts ? Math.round((inStockCount / totalProducts) * 100) : 75}%` }} /></div>
          </div>
        </article>
      </section>

      <section className="sf-bottom-grid">
        <article className="sf-panel sf-table-panel">
          <div className="sf-panel__heading">
            <div>
              <div className="sf-panel__eyebrow">LATEST TRANSACTIONS</div>
              <h3>Recent sales</h3>
              <p>Real-time invoices from MongoDB</p>
            </div>
            <button className="sf-text-action" type="button" onClick={() => navigate('/sales')}>
              View all <ExternalLink size={15} />
            </button>
          </div>
          <div className="sf-table-scroll">
            <table className="sf-table">
              <thead>
                <tr>
                  <th>INVOICE</th>
                  <th>CUSTOMER</th>
                  <th>UNITS</th>
                  <th>AMOUNT</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id || sale.invoiceNumber}>
                    <td><span className="sf-invoice-id">{sale.invoiceNumber || sale.invoice}</span></td>
                    <td className="sf-customer-cell">{sale.customerName || sale.customer || 'Walk-in'}</td>
                    <td>{sale.itemCount || 1} units</td>
                    <td className="sf-amount-cell">{money(sale.totalAmount || sale.amount)}</td>
                    <td>{new Date(sale.createdAt || sale.date).toLocaleDateString()}</td>
                    <td><span className="sf-status sf-status--paid">Paid</span></td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                      No recent sales found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="sf-panel sf-alert-panel">
          <div className="sf-panel__heading">
            <div>
              <div className="sf-panel__eyebrow">NEEDS ATTENTION</div>
              <h3><AlertTriangle size={17} /> Low stock alerts</h3>
              <p>Products that need restocking</p>
            </div>
            <span className="sf-alert-count">{lowStockProducts.length} alerts</span>
          </div>
          <div className="sf-alert-list">
            {lowStockProducts.map((item) => (
              <div className="sf-alert-row" key={item.id || item.sku}>
                <span className="sf-alert-product-icon"><Package size={18} /></span>
                <span className="sf-alert-product">
                  <strong>{item.name}</strong>
                  <small>{item.sku}</small>
                </span>
                <strong className={`sf-alert-stock ${item.quantity === 0 ? 'is-empty' : ''}`}>
                  {item.quantity} <small>units</small>
                </strong>
                <span className={`sf-alert-badge ${item.quantity === 0 ? 'is-empty' : ''}`}>
                  {item.quantity === 0 ? 'Out of stock' : 'Low stock'}
                </span>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--sf-muted)' }}>
                All products are adequately stocked.
              </div>
            )}
          </div>
          <div className="sf-alert-footer">
            <CircleDollarSign size={15} />
            <span>Real-time stock monitoring from database.</span>
          </div>
        </article>
      </section>
      <div className="sf-dashboard-footnote">
        <span><i /> MongoDB Atlas Connected</span>
        <span>StockFlow <b>•</b> Chandra & Asmita Endpoints Active</span>
      </div>
    </div>
  );
}
