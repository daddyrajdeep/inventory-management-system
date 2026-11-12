import { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Boxes,
  CalendarDays,
  Info,
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
import { useAuth } from '../context/AuthContext';
import { getSummary, getSalesByDay } from '../services/reportService';
import { getSales } from '../services/saleService';
import { getProducts } from '../services/productService';

const money = (value) => {
  const n = Number(value);
  return `${n < 0 ? '-' : ''}₹${Math.abs(n).toLocaleString('en-IN')}`;
};
const plural = (n, word) => `${n.toLocaleString('en-IN')} ${word}${n === 1 ? '' : 's'}`;
const PAYMENT_LABELS = { cash: 'Cash', upi: 'UPI', card: 'Card' };

// Each part loads on its own, so one failing request leaves the rest of the page usable (null = failed)
async function fetchDashboard(canSeeReports) {
  const [summary, trend, sales, products] = await Promise.allSettled([
    canSeeReports ? getSummary({ days: 30 }) : null,
    canSeeReports ? getSalesByDay({ days: 7 }) : null,
    getSales({ limit: 5 }),
    getProducts(),
  ]);
  const value = (result) => (result.status === 'fulfilled' ? result.value : null);
  return { summary: value(summary), trend: value(trend), sales: value(sales), products: value(products) };
}

function MetricCard({ metric }) {
  const Icon = metric.icon;
  const hasChange = typeof metric.change === 'number';
  const TrendIcon = metric.change > 0 ? ArrowUpRight : metric.change < 0 ? ArrowDownRight : null;
  const good = metric.invert ? metric.change <= 0 : metric.change >= 0;
  return (
    <article className={`sf-metric sf-metric--${metric.tone}`}>
      <div className="sf-metric__top">
        <span className="sf-metric__icon"><Icon size={21} strokeWidth={2.1} /></span>
      </div>
      <p className="sf-metric__label">{metric.label}</p>
      <h2>{metric.value}</h2>
      <div className={`sf-metric__trend ${hasChange ? (good ? 'up' : 'down') : ''}`}>
        {hasChange && (
          <>
            {TrendIcon && <TrendIcon size={15} />}
            <strong>{`${metric.change > 0 ? '+' : ''}${metric.change}%`}</strong>
          </>
        )}
        <span>{hasChange ? 'vs previous 30 days' : metric.note}</span>
      </div>
    </article>
  );
}

function PanelState({ message, onRetry }) {
  return (
    <div className="sf-panel-state">
      <span>{message}</span>
      {onRetry && (
        <button className="sf-text-action" type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Reports are admin / manager only on the server, so staff never call them
  const canSeeReports = user?.role === 'admin' || user?.role === 'manager';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetchDashboard(canSeeReports).then((result) => {
      if (!active) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [canSeeReports, reloadKey]);

  const retry = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const summary = data?.summary;
  const products = data?.products;
  const recentSales = data?.sales;
  const trend = data?.trend?.map((d) => ({ day: d.date.slice(5), sales: d.sales })) ?? [];
  const trendHasSales = trend.some((d) => d.sales > 0);

  const countStatus = (status) => products.filter((p) => p.stockStatus === status).length;
  const inventory = products && {
    totalProducts: products.length,
    totalUnits: products.reduce((sum, p) => sum + p.quantity, 0),
    inStock: countStatus('ok'),
    lowStock: countStatus('low'),
    outOfStock: countStatus('out'),
  };
  const percentOf = (count) => (inventory.totalProducts ? Math.round((count / inventory.totalProducts) * 100) : 0);
  const inventoryStatus = inventory
    ? [
        { name: 'In Stock', value: percentOf(inventory.inStock), color: '#16c79a', count: inventory.inStock },
        { name: 'Low Stock', value: percentOf(inventory.lowStock), color: '#f7b84b', count: inventory.lowStock },
        { name: 'Out of Stock', value: percentOf(inventory.outOfStock), color: '#f15b72', count: inventory.outOfStock },
      ]
    : [];
  const lowStockAlerts = products ? products.filter((p) => p.stockStatus !== 'ok') : [];

  const inventoryMetric = {
    label: 'Total Inventory',
    value: inventory ? plural(inventory.totalUnits, 'unit') : '—',
    icon: Boxes,
    tone: 'violet',
    note: inventory ? `across ${plural(inventory.totalProducts, 'product')}` : 'Could not load products',
  };

  const moneyMetrics = summary
    ? [
        {
          label: 'Total Sales',
          value: money(summary.sales.total),
          change: summary.sales.change,
          icon: ShoppingCart,
          tone: 'blue',
          note: plural(summary.sales.count, 'sale'),
        },
        {
          label: 'Total Expenses',
          value: money(summary.expenses.total),
          change: summary.expenses.change,
          invert: true,
          icon: Wallet,
          tone: 'amber',
          note: plural(summary.expenses.count, 'expense'),
        },
        {
          label: 'Net Profit',
          value: money(summary.netProfit.total),
          change: summary.netProfit.change,
          icon: TrendingUp,
          tone: 'emerald',
          note: 'Sales minus expenses',
        },
      ]
    : [];

  return (
    <div className="sf-dashboard">
      <div className="sf-dashboard__ambient sf-dashboard__ambient--one" />
      <div className="sf-dashboard__ambient sf-dashboard__ambient--two" />

      <section className="sf-dashboard__intro">
        <div>
          <div className="sf-eyebrow">BUSINESS OVERVIEW</div>
          <h1>Good to see you<span className="sf-title-accent">.</span></h1>
          <p>{canSeeReports ? 'Sales, expenses and stock at a glance.' : 'Stock levels and recent sales at a glance.'}</p>
        </div>
        {canSeeReports && (
          <div className="sf-date-chip">
            <CalendarDays size={16} />
            <span>Last 30 days</span>
          </div>
        )}
      </section>

      {loading && (
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--sf-muted)' }}>
          <Loader2 className="animate-spin" size={18} /> Loading dashboard...
        </div>
      )}

      {data && (
        <>
          <section className="sf-metrics-grid" aria-label="Business metrics">
            <MetricCard metric={inventoryMetric} />
            {moneyMetrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
            {canSeeReports && !summary && (
              <article className="sf-metric-note">
                <Info size={18} />
                <PanelState message="Could not load reports." onRetry={retry} />
              </article>
            )}
            {!canSeeReports && (
              <article className="sf-metric-note">
                <Info size={18} />
                <span>Sales, expense and profit reports are available to managers and admins.</span>
              </article>
            )}
          </section>

          <section className={`sf-analytics-grid ${canSeeReports ? '' : 'sf-analytics-grid--single'}`}>
            {canSeeReports && (
              <article className="sf-panel sf-performance-panel">
                <div className="sf-panel__heading">
                  <div>
                    <div className="sf-panel__eyebrow">SALES REPORT</div>
                    <h3>Sales Trend</h3>
                    <p>Daily sales totals</p>
                  </div>
                  <span className="sf-period-pill">Past 7 days</span>
                </div>
                {!data.trend ? (
                  <PanelState message="Could not load reports." onRetry={retry} />
                ) : !trendHasSales ? (
                  <PanelState message="No sales in this period." />
                ) : (
                  <>
                    <div className="sf-chart-legend">
                      <span><i className="sf-legend-dot sf-legend-dot--sales" />Sales (₹)</span>
                    </div>
                    <div className="sf-performance-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="sfSalesFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#a879ff" stopOpacity={0.34} />
                              <stop offset="100%" stopColor="#a879ff" stopOpacity={0.015} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="var(--sf-chart-grid)" strokeDasharray="4 5" vertical={false} />
                          <XAxis
                            dataKey="day"
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
                  </>
                )}
              </article>
            )}

            <article className="sf-panel sf-inventory-panel">
              <div className="sf-panel__heading">
                <div>
                  <div className="sf-panel__eyebrow">STOCK HEALTH</div>
                  <h3>Inventory status</h3>
                  <p>Current stock distribution</p>
                </div>
                <span className="sf-panel__icon"><Package size={18} /></span>
              </div>
              {!inventory ? (
                <PanelState message="Could not load products." onRetry={retry} />
              ) : inventory.totalProducts === 0 ? (
                <PanelState message="No products yet." />
              ) : (
                <>
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
                        <strong>{inventory.totalProducts}</strong>
                        <span>{inventory.totalProducts === 1 ? 'product' : 'products'}</span>
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
                          <small>{plural(item.count, 'item')}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="sf-stock-health">
                    <span>Healthy stock ratio</span>
                    <strong>{percentOf(inventory.inStock)}%</strong>
                    <div><i style={{ width: `${percentOf(inventory.inStock)}%` }} /></div>
                  </div>
                </>
              )}
            </article>
          </section>

          <section className="sf-bottom-grid">
            <article className="sf-panel sf-table-panel">
              <div className="sf-panel__heading">
                <div>
                  <div className="sf-panel__eyebrow">LATEST TRANSACTIONS</div>
                  <h3>Recent sales</h3>
                  <p>Last 5 invoices</p>
                </div>
                <button className="sf-text-action" type="button" onClick={() => navigate('/sales')}>
                  View all <ArrowUpRight size={15} />
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
                      <th>PAYMENT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales?.map((sale) => (
                      <tr key={sale.id}>
                        <td><span className="sf-invoice-id">{sale.invoiceNumber}</span></td>
                        <td className="sf-customer-cell">{sale.customerName}</td>
                        <td>{plural(sale.itemCount, 'unit')}</td>
                        <td className="sf-amount-cell">{money(sale.totalAmount)}</td>
                        <td>{new Date(sale.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className="sf-status sf-status--method">
                            {PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!recentSales?.length && (
                      <tr>
                        <td colSpan="6">
                          {recentSales ? (
                            <PanelState message="No sales yet." />
                          ) : (
                            <PanelState message="Could not load recent sales." onRetry={retry} />
                          )}
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
                {products && <span className="sf-alert-count">{plural(lowStockAlerts.length, 'alert')}</span>}
              </div>
              <div className="sf-alert-list">
                {lowStockAlerts.slice(0, 5).map((item) => (
                  <div className="sf-alert-row" key={item.id}>
                    <span className="sf-alert-product-icon"><Package size={18} /></span>
                    <span className="sf-alert-product">
                      <strong>{item.name}</strong>
                      <small>{item.sku}</small>
                    </span>
                    <strong className={`sf-alert-stock ${item.stockStatus === 'out' ? 'is-empty' : ''}`}>
                      {item.quantity} <small>{item.quantity === 1 ? 'unit' : 'units'}</small>
                    </strong>
                    <span className={`sf-alert-badge ${item.stockStatus === 'out' ? 'is-empty' : ''}`}>
                      {item.stockStatus === 'out' ? 'Out of stock' : 'Low stock'}
                    </span>
                  </div>
                ))}
                {!products && <PanelState message="Could not load products." onRetry={retry} />}
                {products && lowStockAlerts.length === 0 && (
                  <PanelState message="All products are adequately stocked." />
                )}
              </div>
              {lowStockAlerts.length > 5 && (
                <button className="sf-text-action" type="button" onClick={() => navigate('/products')}>
                  View all {lowStockAlerts.length} <ArrowUpRight size={15} />
                </button>
              )}
              <div className="sf-alert-footer">
                <Info size={15} />
                <span>Based on each product's reorder level.</span>
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
