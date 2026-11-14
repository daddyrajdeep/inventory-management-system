import { Link } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  Layers3,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Wallet,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../config/navigation';

const FEATURES = [
  { icon: Layers3, title: 'Products & catalog', body: 'SKUs, barcodes, categories and suppliers, with cost and selling prices and reorder levels.' },
  { icon: Archive, title: 'Stock ledger', body: 'Every stock in, out and adjustment is recorded with a full movement history — transactional, so counts stay correct.' },
  { icon: ClipboardList, title: 'Purchase orders', body: 'Draft, order and receive. Receiving an order adds the items to stock automatically.' },
  { icon: ShoppingCart, title: 'Sales & invoices', body: 'Sell several products on one invoice with cash, UPI or card. Stock deducts as you sell.' },
  { icon: Wallet, title: 'Expenses', body: 'Record what the business spends by category and date, and see it against revenue.' },
  { icon: BarChart3, title: 'Reports & dashboard', body: 'Sales, profit and stock health derived from the same data, with period comparisons.' },
  { icon: Bell, title: 'Real-time alerts', body: 'Low-stock and out-of-stock alerts arrive live in every open tab the moment stock crosses a threshold.' },
  { icon: ShieldCheck, title: 'Roles & audit trail', body: 'Admin, manager and staff permissions, with an audit log of who changed what.' },
];

const STEPS = [
  { n: '1', title: 'Add products & suppliers', body: 'Set up your catalog with prices, reorder levels and the suppliers you buy from.' },
  { n: '2', title: 'Receive stock', body: 'Create a purchase order and receive it — stock and the movement ledger update together.' },
  { n: '3', title: 'Sell', body: 'Ring up multi-line invoices. Stock deducts and the sale is recorded with its payment method.' },
  { n: '4', title: 'Watch the numbers', body: 'Dashboards, reports and live low-stock alerts keep the whole shop in view.' },
];

function PreviewCard() {
  // Illustrative interface preview (not live data). Sample names only, no business figures.
  const rows = [
    ['WM-001', 'Wireless Mouse', 'ok'],
    ['UC-002', 'USB-C Cable', 'low'],
    ['DL-004', 'Desk Lamp', 'out'],
  ];
  const tone = { ok: 'bg-ok', low: 'bg-low', out: 'bg-out' };
  return (
    <div className="rounded-md border border-line bg-surface p-5 shadow-float" aria-hidden="true">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-ink-soft">Stock card</p>
        <Badge tone="neutral">Preview</Badge>
      </div>
      <ul className="space-y-2.5">
        {rows.map(([sku, name, t]) => (
          <li key={sku} className="flex items-center gap-3 text-[13px]">
            <span className={`h-1.5 w-1.5 rounded-full ${tone[t]}`} />
            <span className="mono w-16 text-ink-soft">{sku}</span>
            <span className="flex-1 text-ink">{name}</span>
            <span className="mono text-ink-soft">pcs</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-line pt-3 text-sm font-medium text-ink">Every unit accounted for.</div>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const authed = !!user;

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5">
          <Link to="/welcome" className="flex items-center gap-2.5" aria-label={`${APP_NAME} home`}>
            <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink text-on-ink"><Boxes size={16} /></span>
            <span className="text-base font-semibold">{APP_NAME}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex" aria-label="Sections">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#how" className="hover:text-ink">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            {authed ? (
              <Link to="/"><Button>Go to dashboard <ArrowRight size={16} /></Button></Link>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost">Login</Button></Link>
                <Link to="/login"><Button>Sign Up</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="mx-auto grid max-w-[1120px] items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div className="rise">
            <Badge tone="neutral">Inventory · Sales · Purchasing</Badge>
            <h1 className="mt-4 text-[36px] font-semibold leading-[40px] tracking-[-0.02em] sm:text-[44px] sm:leading-[48px]">
              Run your shop’s stock, sales and purchasing in one place.
            </h1>
            <p className="mt-4 max-w-lg text-base text-ink-soft">
              {APP_NAME} is a stock ledger for small shops — products, purchase orders, sales and expenses,
              with role-based access and real-time low-stock alerts. Every number comes from the same data.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {authed ? (
                <Link to="/"><Button size="md">Go to dashboard <ArrowRight size={16} /></Button></Link>
              ) : (
                <>
                  <Link to="/login"><Button size="md">Login <ArrowRight size={16} /></Button></Link>
                  <a href="#how"><Button size="md" variant="secondary">See how it works</Button></a>
                </>
              )}
            </div>
            <p className="mt-4 text-xs text-ink-soft">Accounts are created by an administrator — there is no public sign-up.</p>
          </div>
          <div className="rise" style={{ '--i': 2 }}>
            <PreviewCard />
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-[1120px] px-5 py-14">
            <h2 className="text-[22px] font-semibold">The problem with spreadsheets</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {[
                ['Overselling', 'Stock counts live in someone’s head or a stale sheet, so you sell what you don’t have.'],
                ['Stockouts', 'Low stock is noticed only when a customer asks for it.'],
                ['No visibility', 'Sales, purchases and expenses sit in different places, so the numbers never agree.'],
              ].map(([t, b]) => (
                <div key={t}>
                  <h3 className="text-base font-semibold text-ink">{t}</h3>
                  <p className="mt-1.5 text-sm text-ink-soft">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution */}
        <section className="mx-auto max-w-[1120px] px-5 py-14">
          <h2 className="text-[22px] font-semibold">One ledger that reconciles</h2>
          <p className="mt-3 max-w-2xl text-base text-ink-soft">
            Stock changes only through a single transactional path that also writes the movement history and
            raises alerts. Sales deduct stock, purchase orders add it, and the dashboard, reports and inventory
            counts are all derived from the same records — so they match on every page.
          </p>
        </section>

        {/* Features */}
        <section id="features" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-[1120px] px-5 py-14">
            <h2 className="text-[22px] font-semibold">What’s inside</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-md border border-line bg-paper p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-surface text-ink"><Icon size={18} /></span>
                  <h3 className="mt-3 text-base font-semibold text-ink">{title}</h3>
                  <p className="mt-1.5 text-[13px] text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-[1120px] px-5 py-14">
          <h2 className="text-[22px] font-semibold">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className="rise" style={{ '--i': Number(n) }}>
                <span className="mono num flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-semibold text-on-ink">{n}</span>
                <h3 className="mt-3 text-base font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-[13px] text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles strip */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-3 px-5 py-10">
            <Truck size={18} className="text-ink-soft" />
            <p className="text-sm text-ink-soft">Built for three roles:</p>
            <Badge tone="ok">Admin</Badge>
            <Badge tone="info">Manager</Badge>
            <Badge tone="neutral">Staff</Badge>
            <Receipt size={18} className="ml-auto text-ink-soft" />
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-[1120px] px-5 py-16 text-center">
          <h2 className="text-[28px] font-semibold">Ready to see your shop clearly?</h2>
          <p className="mx-auto mt-3 max-w-md text-base text-ink-soft">Sign in with the account your administrator created for you.</p>
          <div className="mt-6 flex justify-center">
            {authed ? (
              <Link to="/"><Button size="md">Go to dashboard <ArrowRight size={16} /></Button></Link>
            ) : (
              <Link to="/login"><Button size="md">Login <ArrowRight size={16} /></Button></Link>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-ink text-on-ink"><Boxes size={13} /></span>
            <span className="text-sm font-semibold">{APP_NAME}</span>
          </div>
          <nav className="flex items-center gap-5 text-sm text-ink-soft" aria-label="Footer">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <Link to="/login" className="hover:text-ink">Login</Link>
          </nav>
          <p className="text-xs text-ink-soft">{APP_NAME} · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
