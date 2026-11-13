import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Banknote, CreditCard, Download, Package, Plus, ShoppingCart, Smartphone, Trash2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Drawer from '../components/ui/Drawer';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SearchInput, { useDebounced } from '../components/ui/SearchInput';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import CopyButton from '../components/ui/CopyButton';
import NumberStepper from '../components/ui/NumberStepper';
import { useAuth } from '../context/AuthContext';
import { getSales, getSaleById, createSale } from '../services/saleService';
import { getProducts } from '../services/productService';
import { getTopProducts, getSalesByDay } from '../services/reportService';
import { downloadCsv } from '../utils/csv';
import { formatINR, formatDateTime, formatDayMonth } from '../utils/format';

const PAYMENTS = { cash: { label: 'Cash', Icon: Banknote }, upi: { label: 'UPI', Icon: Smartphone }, card: { label: 'Card', Icon: CreditCard } };
const PAGE_SIZE = 10;

export default function Sales() {
  const { user } = useAuth();
  const canViewReports = user?.role === 'admin' || user?.role === 'manager';
  const [params, setParams] = useSearchParams();

  const search = params.get('search') || '';
  const payment = params.get('payment') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const debouncedSearch = useDebounced(search, 200);

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [trend, setTrend] = useState([]);
  const [reportsError, setReportsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [picker, setPicker] = useState('');
  const [customer, setCustomer] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [discount, setDiscount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cartError, setCartError] = useState('');

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };

  useEffect(() => {
    let active = true;
    const q = {};
    if (debouncedSearch) q.search = debouncedSearch;
    if (payment) q.paymentMethod = payment;
    if (from) q.from = from;
    if (to) q.to = to;
    getSales(q)
      .then((list) => { if (active) { setSales(list); setLoadError(''); } })
      .catch((err) => active && setLoadError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [debouncedSearch, payment, from, to, refreshKey]);

  useEffect(() => { getProducts().then(setProducts).catch(() => {}); }, [refreshKey]);

  useEffect(() => {
    if (!canViewReports) return undefined;
    let active = true;
    Promise.all([getTopProducts({ limit: 4, sortBy: 'revenue', days: 7 }), getSalesByDay({ days: 7 })])
      .then(([top, t]) => { if (active) { setTopProducts(top || []); setTrend(t || []); setReportsError(false); } })
      .catch(() => active && setReportsError(true));
    return () => { active = false; };
  }, [canViewReports, refreshKey]);

  // Invoice detail deep link
  const saleParam = params.get('sale');
  useEffect(() => {
    if (!saleParam) return undefined;
    let active = true;
    getSaleById(saleParam).then((s) => active && setDetail(s)).catch((err) => toast.error(err.message));
    return () => { active = false; };
  }, [saleParam]);

  // ?new=1 opens the cart
  const newParam = params.get('new');
  const [consumed, setConsumed] = useState(null);
  if (newParam && newParam !== consumed) {
    setConsumed(newParam);
    setCart([]); setCustomer(''); setPayMethod('cash'); setDiscount(''); setCartError(''); setPicker('');
    setCartOpen(true);
  }

  const refresh = () => setRefreshKey((k) => k + 1);
  const activeProducts = products.filter((p) => p.isActive !== false);
  const pickerResults = activeProducts.filter((p) => { const q = picker.trim().toLowerCase(); return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q); }).slice(0, 8);

  const addToCart = (p) => {
    setCart((c) => {
      const existing = c.find((i) => i.product === p.id);
      if (existing) return c.map((i) => i.product === p.id ? { ...i, quantity: Math.min(i.quantity + 1, p.quantity) } : i);
      return [...c, { product: p.id, name: p.name, sku: p.sku, price: p.price, stock: p.quantity, quantity: 1 }];
    });
    setCartError('');
  };
  const setQty = (id, q) => setCart((c) => c.map((i) => i.product === id ? { ...i, quantity: q } : i));
  const removeItem = (id) => setCart((c) => c.filter((i) => i.product !== id));

  const gross = cart.reduce((s, i) => s + i.price * (Number(i.quantity) || 0), 0);
  const disc = Number(discount) || 0;
  const net = Math.max(gross - disc, 0);

  const submitSale = async () => {
    if (!cart.length) return setCartError('Add products to start a sale.');
    if (disc > gross) return setCartError('Discount cannot exceed the gross total.');
    setSubmitting(true);
    setCartError('');
    try {
      const sale = await createSale({
        items: cart.map((i) => ({ product: i.product, quantity: Number(i.quantity) })),
        discount: disc || undefined,
        customerName: customer.trim() || undefined,
        paymentMethod: payMethod,
      });
      toast.success(`Sale recorded — ${sale.invoiceNumber}`);
      setSubmitting(false);
      setCartOpen(false);
      setParam('new', '');
      refresh();
    } catch (err) {
      setSubmitting(false);
      setCartError(err.message);
      refresh();
    }
  };

  const exportCsv = () => {
    const rows = [['Invoice', 'Customer', 'Units', 'Amount', 'Payment', 'Date', 'Sold by'],
      ...paged.map((s) => [s.invoiceNumber, s.customerName, s.itemCount, s.totalAmount, PAYMENTS[s.paymentMethod]?.label || s.paymentMethod, formatDateTime(s.createdAt), s.soldBy || ''])];
    downloadCsv(`stockflow-sales-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const totalPages = Math.max(1, Math.ceil(sales.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = sales.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const kpis = useMemo(() => ({
    revenue: sales.reduce((s, x) => s + x.totalAmount, 0),
    invoices: sales.length,
    units: sales.reduce((s, x) => s + x.itemCount, 0),
  }), [sales]);

  const maxTop = Math.max(...topProducts.map((t) => t.revenue || 0), 1);

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice', render: (s) => <span className="inline-flex items-center gap-1"><span className="mono">{s.invoiceNumber}</span><CopyButton value={s.invoiceNumber} /></span> },
    { key: 'customerName', label: 'Customer', render: (s) => s.customerName },
    { key: 'itemCount', label: 'Units', align: 'right', num: true, render: (s) => s.itemCount },
    { key: 'totalAmount', label: 'Amount', align: 'right', num: true, render: (s) => formatINR(s.totalAmount) },
    { key: 'paymentMethod', label: 'Payment', render: (s) => <Badge tone="neutral">{PAYMENTS[s.paymentMethod]?.label || s.paymentMethod}</Badge> },
    { key: 'createdAt', label: 'Date', render: (s) => <span className="text-ink-soft">{formatDateTime(s.createdAt)}</span> },
    { key: 'soldBy', label: 'Sold by', render: (s) => s.soldBy || '—' },
  ];

  return (
    <>
      <PageHeader title="Sales" subtitle="Invoices and stock deductions." action={<div className="flex gap-2"><Button variant="secondary" onClick={exportCsv} disabled={!sales.length} title="Exports the invoices currently loaded (max 200)"><Download size={16} /> Export CSV</Button><Button onClick={() => { setCart([]); setCustomer(''); setPayMethod('cash'); setDiscount(''); setCartError(''); setCartOpen(true); }}><Plus size={16} /> New sale</Button></div>} />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total revenue" value={formatINR(kpis.revenue)} footnote="Latest 200 invoices" />
        <StatCard label="Invoices" value={kpis.invoices} />
        <StatCard label="Units sold" value={kpis.units} />
      </div>

      {canViewReports && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-ink">Sales, last 7 days</h3>
            {reportsError ? <p className="text-sm text-out">Couldn’t load reports. <button className="underline" onClick={refresh}>Retry</button></p> : trend.every((d) => !d.sales) ? <EmptyState title="No sales in the last 7 days." /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="date" tickFormatter={formatDayMonth} tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`} />
                  <Tooltip cursor={{ fill: 'var(--paper)' }} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 12 }} formatter={(v) => formatINR(v)} labelFormatter={formatDayMonth} />
                  <Bar dataKey="sales" fill="var(--ink)" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-ink">Top products, last 7 days</h3>
            {reportsError ? <p className="text-sm text-out">Couldn’t load reports.</p> : topProducts.length === 0 ? <EmptyState title="No sales in the last 7 days." /> : (
              <div className="space-y-3">
                {topProducts.map((t, i) => (
                  <div key={t.product || i}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2"><span className="num text-ink-soft">{i + 1}</span><span className="font-medium text-ink">{t.name}</span><span className="mono text-xs text-ink-soft">{t.sku}</span></span>
                      <span className="num text-ink">{formatINR(t.revenue)}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-paper"><div className="h-full rounded-full bg-ink" style={{ width: `${(t.revenue / maxTop) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(v) => setParam('search', v)} placeholder="Search invoice or customer…" className="min-w-50 flex-1" />
        <Select value={payment} onChange={(e) => setParam('payment', e.target.value)} aria-label="Payment method" className="w-40">
          <option value="">All payments</option><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option>
        </Select>
        <Input type="date" value={from} onChange={(e) => setParam('from', e.target.value)} aria-label="From date" className="w-40" />
        <Input type="date" value={to} onChange={(e) => setParam('to', e.target.value)} aria-label="To date" className="w-40" />
      </div>

      <DataTable columns={columns} rows={paged} loading={loading} onRowClick={(s) => setParam('sale', s.id)}
        empty={loadError ? <EmptyState title={loadError} action={<Button size="sm" variant="secondary" onClick={refresh}>Retry</Button>} /> : <EmptyState icon={ShoppingCart} title={search || payment || from || to ? 'No sales match these filters.' : 'No sales yet.'} action={!search && !payment && !from && !to ? <Button size="sm" onClick={() => setCartOpen(true)}>Record your first sale</Button> : undefined} />} />
      {sales.length > PAGE_SIZE && <Pagination page={currentPage} pageSize={PAGE_SIZE} total={sales.length} onPage={setPage} />}
      {sales.length >= 200 && <p className="mt-2 text-center text-xs text-ink-soft">Older invoices: narrow the date range.</p>}

      {/* Invoice drawer */}
      <Drawer open={!!saleParam} title={detail?.invoiceNumber || 'Invoice'} onClose={() => setParam('sale', '')}>
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-2"><Badge tone="neutral">{PAYMENTS[detail.paymentMethod]?.label || detail.paymentMethod}</Badge><CopyButton value={detail.invoiceNumber} /></div>
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <div><dt className="text-xs text-ink-soft">Customer</dt><dd className="text-ink">{detail.customerName}</dd></div>
              <div><dt className="text-xs text-ink-soft">Sold by</dt><dd className="text-ink">{detail.soldBy || '—'}</dd></div>
              <div><dt className="text-xs text-ink-soft">Date</dt><dd className="text-ink">{formatDateTime(detail.createdAt)}</dd></div>
            </dl>
            <div className="overflow-hidden rounded-md border border-line">
              <table className="min-w-full text-[13px]">
                <thead><tr className="border-b border-line text-xs text-ink-soft"><th className="px-3 py-2 text-left font-semibold">Product</th><th className="px-3 py-2 text-right font-semibold">Qty</th><th className="px-3 py-2 text-right font-semibold">Price</th><th className="px-3 py-2 text-right font-semibold">Subtotal</th></tr></thead>
                <tbody>
                  {detail.items.map((i) => (
                    <tr key={i.product} className="border-b border-line last:border-0">
                      <td className="px-3 py-2 font-medium text-ink">{i.name}</td>
                      <td className="num px-3 py-2 text-right">{i.quantity}</td>
                      <td className="num px-3 py-2 text-right">{formatINR(i.unitPrice)}</td>
                      <td className="num px-3 py-2 text-right">{formatINR(i.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-ink-soft"><span>Gross</span><span className="num">{formatINR(detail.items.reduce((s, i) => s + i.subtotal, 0))}</span></div>
              {detail.discount > 0 && <div className="flex justify-between text-ink-soft"><span>Discount</span><span className="num">−{formatINR(detail.discount)}</span></div>}
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink"><span>Total</span><span className="num">{formatINR(detail.totalAmount)}</span></div>
            </div>
          </div>
        )}
      </Drawer>

      {/* New sale — POS cart */}
      <Drawer
        open={cartOpen}
        title="New sale"
        width="min(560px, 100vw)"
        onClose={() => !submitting && (setCartOpen(false), setParam('new', ''))}
        footer={
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-ink-soft"><span>Gross</span><span className="num">{formatINR(gross)}</span></div>
            {disc > 0 && <div className="flex justify-between text-sm text-ink-soft"><span>Discount</span><span className="num">−{formatINR(disc)}</span></div>}
            <div className="flex justify-between text-base font-semibold text-ink" aria-live="polite"><span>Total</span><span className="num">{formatINR(net)}</span></div>
            {cartError && <p className="text-[13px] text-out" role="alert">{cartError}</p>}
            <Button className="w-full" loading={submitting} onClick={submitSale}>Record sale</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <SearchInput value={picker} onChange={setPicker} placeholder="Search products to add…" />
          {picker.trim() && (
            <div className="overflow-hidden rounded-md border border-line">
              {pickerResults.length === 0 ? <p className="px-3 py-3 text-sm text-ink-soft">No products match.</p> : pickerResults.map((p) => (
                <button key={p.id} type="button" disabled={p.quantity <= 0} onClick={() => addToCart(p)} className="flex w-full items-center gap-2 border-b border-line px-3 py-2 text-left text-sm last:border-0 hover:bg-paper disabled:opacity-50">
                  <span className="flex-1"><span className="font-medium text-ink">{p.name}</span> <span className="mono text-xs text-ink-soft">{p.sku}</span></span>
                  <span className="num text-ink-soft">{formatINR(p.price)}</span>
                  <span className={`text-xs ${p.quantity <= 0 ? 'text-out' : p.quantity <= p.reorderLevel ? 'text-low' : 'text-ink-soft'}`}>{p.quantity <= 0 ? 'Out of stock' : `${p.quantity} in stock`}</span>
                </button>
              ))}
            </div>
          )}

          {cart.length === 0 ? <EmptyState icon={Package} title="Add products to start a sale." /> : (
            <div className="space-y-2">
              {cart.map((i) => (
                <div key={i.product} className="rounded-sm border border-line p-2.5">
                  <div className="flex items-center justify-between"><span className="font-medium text-ink">{i.name}</span><IconButton label={`Remove ${i.name}`} className="text-out" onClick={() => removeItem(i.product)}><Trash2 size={15} /></IconButton></div>
                  <p className="mono text-xs text-ink-soft">{i.sku} · {formatINR(i.price)} each</p>
                  <div className="mt-2 flex items-center gap-3">
                    <NumberStepper value={i.quantity} onChange={(q) => setQty(i.product, q)} min={1} max={i.stock} ariaLabel={`Quantity for ${i.name}`} />
                    <span className="text-xs text-ink-soft">Available: {i.stock}</span>
                    <span className="num ml-auto font-medium text-ink">{formatINR(i.price * (Number(i.quantity) || 0))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Walk-in customer" aria-label="Customer name" />
          <div role="radiogroup" aria-label="Payment method" className="flex gap-2">
            {Object.entries(PAYMENTS).map(([key, { label, Icon }]) => (
              <button key={key} type="button" role="radio" aria-checked={payMethod === key} onClick={() => setPayMethod(key)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm border px-3 py-2 text-sm font-medium transition-colors ${payMethod === key ? 'border-ink bg-ink text-on-ink' : 'border-line text-ink-soft hover:border-ink-soft'}`}><Icon size={15} /> {label}</button>
            ))}
          </div>
          <Input type="number" min="0" step="0.01" value={discount} onChange={(e) => { setDiscount(e.target.value); setCartError(''); }} placeholder="Discount (₹)" aria-label="Discount" />
        </div>
      </Drawer>
    </>
  );
}
