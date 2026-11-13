import { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import Tabs from '../components/ui/Tabs';
import SearchInput from '../components/ui/SearchInput';
import Pagination from '../components/ui/Pagination';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import NumberStepper from '../components/ui/NumberStepper';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CopyButton from '../components/ui/CopyButton';
import Kbd from '../components/ui/Kbd';
import Stamp from '../components/ui/Stamp';
import PageHeader from '../components/ui/PageHeader';

function Section({ title, children }) {
  return (
    <Card className="space-y-3">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {children}
    </Card>
  );
}

export default function UIKit() {
  const [tab, setTab] = useState('a');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [qty, setQty] = useState(3);
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 p-6">
      <PageHeader title="UI kit" subtitle="Living documentation — every component, both themes." />
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Buttons">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <IconButton label="Add"><Plus size={16} /></IconButton>
          </div>
        </Section>
        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge tone="ok" dot>In stock</Badge>
            <Badge tone="low" dot>Low: 3</Badge>
            <Badge tone="out" dot>Out</Badge>
            <Badge tone="info">Ordered</Badge>
            <Badge tone="neutral">Draft</Badge>
          </div>
        </Section>
        <Section title="Stat cards">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Sales" value="₹1,53,889" delta={{ value: 12.4, direction: 'up' }} spark={[3, 5, 4, 8, 6, 9]} />
            <StatCard label="Products" value="8" footnote="no prior period" />
          </div>
        </Section>
        <Section title="Form">
          <FormField label="Name" hint="As shown across the app">
            <Input placeholder="Wireless Mouse" />
          </FormField>
          <FormField label="Category" error="Choose a category">
            <Select><option>Electronics</option></Select>
          </FormField>
          <FormField label="Quantity">
            <NumberStepper value={qty} onChange={setQty} min={0} max={99} ariaLabel="Quantity" />
          </FormField>
          <FormField label="Notes"><Textarea placeholder="Optional" /></FormField>
        </Section>
        <Section title="Tabs + search + pagination">
          <Tabs value={tab} onChange={setTab} tabs={[{ value: 'a', label: 'Stock', count: 8 }, { value: 'b', label: 'History' }]} />
          <SearchInput value={q} onChange={setQ} placeholder="Search products…" />
          <Pagination page={page} pageSize={10} total={43} onPage={setPage} />
        </Section>
        <Section title="Overlays + misc">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setModal(true)}>Modal</Button>
            <Button variant="secondary" onClick={() => setDrawer(true)}>Drawer</Button>
            <Button variant="secondary" onClick={() => setConfirm(true)}>Confirm</Button>
            <CopyButton value="WM-001" />
            <Kbd>⌘K</Kbd>
            <Stamp />
          </div>
          <div className="flex items-center gap-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /></div>
        </Section>
      </div>
      <Section title="Data table">
        <DataTable
          columns={[
            { key: 'name', label: 'Product', render: (r) => <span className="font-medium">{r.name}</span> },
            { key: 'sku', label: 'SKU', mono: true },
            { key: 'qty', label: 'Stock', align: 'right', num: true },
            { key: 'status', label: 'Status', render: (r) => <Badge tone={r.tone}>{r.status}</Badge> },
          ]}
          rows={[
            { id: 1, name: 'Wireless Mouse', sku: 'WM-001', qty: 120, status: 'In stock', tone: 'ok' },
            { id: 2, name: 'USB-C Cable', sku: 'UC-002', qty: 8, status: 'Low: 8', tone: 'low' },
            { id: 3, name: 'Desk Lamp', sku: 'DL-004', qty: 0, status: 'Out', tone: 'out' },
          ]}
        />
        <EmptyState icon={Package} title="No products yet." action={<Button size="sm">Create product</Button>} />
      </Section>

      <Modal open={modal} title="Example modal" onClose={() => setModal(false)}>
        <p className="text-sm text-ink-soft">Focus is trapped; Escape closes; background does not scroll.</p>
      </Modal>
      <Drawer open={drawer} title="Example drawer" onClose={() => setDrawer(false)}>
        <p className="text-sm text-ink-soft">Slides in from the right.</p>
      </Drawer>
      <ConfirmDialog open={confirm} title="Delete product" body="Delete 'Wireless Mouse'? This cannot be undone." confirmLabel="Delete product" danger onClose={() => setConfirm(false)} onConfirm={() => setConfirm(false)} />
    </div>
  );
}
