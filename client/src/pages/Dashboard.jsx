import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Lock, Package } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import CopyButton from '../components/ui/CopyButton';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { getSummary, getSalesByDay } from '../services/reportService';
import { getSales } from '../services/saleService';
import { getProducts } from '../services/productService';
import { getMovements } from '../services/stockService';
import { formatINR, formatDateTime, formatDayMonth, timeAgo, plural } from '../utils/format';
import { animateNumber } from '../utils/motion';

const PAYMENT = { cash: 'Cash', upi: 'UPI', card: 'Card' };
const moveTone = { IN: 'ok', OUT: 'out', ADJUST: 'info' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canSeeReports = user?.role === 'admin' || user?.role === 'manager';
  const [params, setParams] = useSearchParams();
  const days = Number(params.get('days')) || 30;

  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState(null);
  const [sales, setSales] = useState(null);
  const [products, setProducts] = useState(null);
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const animated = useRef(new Set());

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      canSeeReports ? getSummary({ days }) : Promise.resolve(null),
      canSeeReports ? getSalesByDay({ days }) : Promise.resolve(null),
      getSales({ limit: 5 }),
      getProducts(),
      getMovements({ limit: 6 }),
    ]).then(([s, t, sa, p, m]) => {
      if (!active) return;
      const val = (r) => (r.status === 'fulfilled' ? r.value : null);
      setSummary(val(s)); setTrend(val(t)); setSales(val(sa)); setProducts(val(p)); setMoves(val(m) || []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [canSeeReports, days, reloadKey]);

  useEffect(() => {
    moves.forEach((m) => {
      if (animated.current.has(m.id)) return;
      animated.current.add(m.id);
      const el = document.querySelector(`[data-move-qty="${m.id}"]`);
      animateNumber(el, m.previousQty, m.newQty);
    });
  }, [moves]);

  const retry = () => { setLoading(true); setReloadKey((k) => k + 1); };
  const inv = products && {
    totalProducts: products.length,
    totalUnits: products.reduce((s, p) => s + p.quantity, 0),
    inStock: products.filter((p) => p.stockStatus === 'ok').length,
    lowStock: products.filter((p) => p.stockStatus === 'low').length,
    outOfStock: products.filter((p) => p.stockStatus === 'out').length,
  };
  const attention = products ? products.filter((p) => p.stockStatus !== 'ok').sort((a, b) => (a.stockStatus === 'out' ? -1 : 1) - (b.stockStatus === 'out' ? -1 : 1)) : [];
  const trendData = trend?.map((d) => ({ date: d.date, sales: d.sales })) ?? [];
  const delta = (change) => (typeof change === 'number' ? { value: change, direction: change < 0 ? 'down' : 'up' } : undefined);

  const salesColumns = [
    { key: 'invoiceNumber', label: 'Invoice', render: (s) => <span className="inline-flex items-center gap-1"><span className="mono">{s.invoiceNumber}</span><CopyButton value={s.invoiceNumber} /></span> },
    { key: 'customerName', label: 'Customer' },
    { key: 'itemCount', label: 'Units', align: 'right', num: true, render: (s) => plural(s.itemCount, 'unit') },
    { key: 'totalAmount', label: 'Amount', align: 'right', num: true, render: (s) => formatINR(s.totalAmount) },
    { key: 'paymentMethod', label: 'Payment', render: (s) => <Badge tone="neutral">{PAYMENT[s.paymentMethod] || s.paymentMethod}</Badge> },
    { key: 'createdAt', label: 'Date', render: (s) => <span className="text-ink-soft">{formatDateTime(s.createdAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Sales, expenses and stock at a glance."
        action={canSeeReports ? <Tabs value={String(days)} onChange={(v) => setParams(v === '30' ? {} : { days: v }, { replace: true })} ariaLabel="Range" tabs={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: '90', label: '90 days' }]} /> : null}
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : (
        <div className="space-y-4">
          {/* KPI + stock health */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {canSeeReports ? (
                summary ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatCard label="Sales" value={formatINR(summary.sales.total)} delta={delta(summary.sales.change)} spark={trendData.map((d) => d.sales)} footnote="no prior period" />
                    <StatCard label="Expenses" value={formatINR(summary.expenses.total)} delta={delta(summary.expenses.change)} footnote="no prior period" />
                    <StatCard label="Net profit" value={formatINR(summary.netProfit.total)} delta={delta(summary.netProfit.change)} footnote="no prior period" />
                  </div>
                ) : <Card><PanelError label="Couldn’t load the sales summary." onRetry={retry} /></Card>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Products tracked" value={inv?.totalProducts ?? 0} />
                  <StatCard label="Units in stock" value={inv?.totalUnits ?? 0} />
                </div>
              )}

              <Card>
                <h3 className="mb-3 text-sm font-semibold text-ink">Sales trend</h3>
                {!canSeeReports ? (
                  <div className="flex items-center gap-2 py-8 text-sm text-ink-soft"><Lock size={16} /> Sales reports are available to managers.</div>
                ) : trend === null ? <PanelError label="Couldn’t load the sales trend." onRetry={retry} /> : trendData.every((d) => !d.sales) ? (
                  <EmptyState title="No sales in this period." />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--line)" />
                      <XAxis dataKey="date" tickFormatter={formatDayMonth} tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`} />
                      <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 12 }} formatter={(v) => formatINR(v)} labelFormatter={formatDayMonth} />
                      <Area type="monotone" dataKey="sales" stroke="var(--ink)" strokeWidth={2} fill="var(--ink)" fillOpacity={0.08} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            <Card>
              <h3 className="mb-3 text-sm font-semibold text-ink">Stock health</h3>
              {!inv ? <PanelError label="Couldn’t load products." onRetry={retry} /> : inv.totalProducts === 0 ? (
                <EmptyState icon={Package} title="No products yet." action={<Button size="sm" onClick={() => navigate('/products?new=1')}>Add product</Button>} />
              ) : (
                <>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-paper">
                    <div className="bg-ok" style={{ width: `${(inv.inStock / inv.totalProducts) * 100}%` }} />
                    <div className="bg-low" style={{ width: `${(inv.lowStock / inv.totalProducts) * 100}%` }} />
                    <div className="bg-out" style={{ width: `${(inv.outOfStock / inv.totalProducts) * 100}%` }} />
                  </div>
                  <ul className="mt-4 space-y-2 text-[13px]">
                    <HealthRow tone="ok" label="In stock" count={inv.inStock} total={inv.totalProducts} />
                    <HealthRow tone="low" label="Low stock" count={inv.lowStock} total={inv.totalProducts} />
                    <HealthRow tone="out" label="Out of stock" count={inv.outOfStock} total={inv.totalProducts} />
                  </ul>
                  <div className="mt-4 border-t border-line pt-3 text-[13px] text-ink-soft">
                    {summary?.inventory?.stockValue != null && <p>Stock value <span className="num font-medium text-ink">{formatINR(summary.inventory.stockValue)}</span> <span className="text-xs">at cost</span></p>}
                    <p className="num">{plural(inv.totalProducts, 'product')} · {plural(inv.totalUnits, 'unit')}</p>
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Latest movements ledger strip */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Latest movements</h3>
              <a className="text-xs text-ink underline-offset-2 hover:underline" href="/inventory?tab=history">View all</a>
            </div>
            {moves.length === 0 ? <p className="text-sm text-ink-soft">No movements yet.</p> : (
              <div className="divide-y border-line">
                {moves.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 py-2 text-[13px]">
                    <Badge tone={moveTone[m.type]}>{m.type}</Badge>
                    <span className="font-medium text-ink">{m.productName || 'Unknown'}</span>
                    <span className="mono text-xs text-ink-soft">{m.sku}</span>
                    <span className="mono num text-ink-soft">{m.previousQty} → <span data-move-qty={m.id} className="text-ink">{m.newQty}</span></span>
                    <span className="ml-auto text-xs text-ink-soft">{m.performedBy || '—'} · {timeAgo(m.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent sales + needs attention */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-0">
              <div className="flex items-center justify-between px-4 pt-4"><h3 className="text-sm font-semibold text-ink">Recent sales</h3><a className="text-xs text-ink underline-offset-2 hover:underline" href="/sales">View all</a></div>
              <div className="p-4">
                <DataTable columns={salesColumns} rows={sales || []} empty={<EmptyState title="No sales yet." action={<Button size="sm" onClick={() => navigate('/sales?new=1')}>Record a sale</Button>} />} />
              </div>
            </Card>
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-ink">{attention.length > 0 ? `${attention.length} products need attention` : 'Needs attention'}</h3>
              {!products ? <PanelError label="Couldn’t load products." onRetry={retry} /> : attention.length === 0 ? (
                <div className="flex items-center gap-2 rounded-sm bg-ok-soft px-3 py-3 text-sm text-ok"><CheckCircle2 size={16} /> All products are above their reorder levels.</div>
              ) : (
                <div className="space-y-2">
                  {attention.slice(0, 6).map((p) => (
                    <button key={p.id} type="button" onClick={() => navigate(`/inventory?product=${p.id}`)} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-paper">
                      <AlertTriangle size={15} className={p.stockStatus === 'out' ? 'text-out' : 'text-low'} />
                      <span className="font-medium text-ink">{p.name}</span>
                      <span className="mono text-xs text-ink-soft">{p.sku}</span>
                      <span className="num ml-auto text-ink-soft">{p.quantity} / {p.reorderLevel}</span>
                      <Badge tone={p.stockStatus === 'out' ? 'out' : 'low'}>{p.stockStatus === 'out' ? 'Out' : 'Low'}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function HealthRow({ tone, label, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <li className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full bg-${tone}`} />
      <span className="text-ink">{label}</span>
      <span className="num ml-auto text-ink-soft">{count} · {pct}%</span>
    </li>
  );
}

function PanelError({ label, onRetry }) {
  return <div className="flex items-center gap-2 py-6 text-sm text-out"><AlertTriangle size={16} /> {label} <button className="underline" onClick={onRetry}>Retry</button></div>;
}
