import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Drawer from './ui/Drawer';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Tabs from './ui/Tabs';
import EmptyState from './ui/EmptyState';
import { ALERT_TYPE, ALERT_TILE, alertFallback, alertRoute } from './alertConfig';
import { getAlerts, markAlertRead } from '../services/alertService';
import { timeAgo } from '../utils/format';

const TYPE_CHIPS = [
  { value: '', label: 'All types' },
  { value: 'LOW_STOCK', label: 'Low stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of stock' },
  { value: 'ORDER_RECEIVED', label: 'Orders received' },
];

export default function AlertCenter({ open, onClose, version, role, onMarkAll }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [limit, setLimit] = useState(100);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    getAlerts({ unread: tab === 'unread', limit })
      .then((data) => active && (setList(data), setLoading(false)))
      .catch(() => active && setLoading(false));
    return () => { active = false; };
  }, [open, version, tab, limit]);

  const openAlert = async (alert) => {
    onClose();
    navigate(alertRoute(alert, role));
    if (alert.isRead) return;
    try {
      await markAlertRead(alert.id);
      setList((l) => l.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a)));
    } catch (err) { toast.error(err.message); }
  };

  const visible = typeFilter ? list.filter((a) => a.type === typeFilter) : list;

  return (
    <Drawer open={open} title="Alert center" width="min(440px, 100vw)" onClose={onClose}
      footer={<Button variant="secondary" className="w-full" onClick={onMarkAll}>Mark all read</Button>}>
      <div className="space-y-4">
        <p className="text-xs text-ink-soft">Alerts are shared — marking read affects everyone.</p>
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }]} />
        <div className="flex flex-wrap gap-1.5">
          {TYPE_CHIPS.map((c) => (
            <button key={c.value} type="button" onClick={() => setTypeFilter(c.value)} className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${typeFilter === c.value ? 'border-ink bg-ink text-on-ink' : 'border-line text-ink-soft hover:border-ink-soft'}`}>{c.label}</button>
          ))}
        </div>

        {loading ? <p className="py-6 text-center text-sm text-ink-soft">Loading…</p> : visible.length === 0 ? (
          tab === 'unread' ? <div className="flex items-center gap-2 rounded-sm bg-ok-soft px-3 py-3 text-sm text-ok"><CheckCircle2 size={16} /> All caught up.</div> : <EmptyState title="No alerts yet. Stock changes will appear here." />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((alert) => {
              const info = ALERT_TYPE[alert.type] || alertFallback;
              return (
                <li key={alert.id}>
                  <button onClick={() => openAlert(alert)} className={`flex w-full gap-3 py-3 text-left hover:bg-paper ${alert.isRead ? 'opacity-60' : ''}`}>
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm ${ALERT_TILE[info.tone]}`}><info.Icon size={15} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2"><Badge tone={info.tone}>{info.label}</Badge><span className="text-xs text-ink-soft">{timeAgo(alert.createdAt)}</span></span>
                      <span className="mt-1 block text-[13px] text-ink">{alert.message}</span>
                      {alert.product && <span className="mono mt-0.5 block text-xs text-ink-soft">{alert.product.sku} · {alert.product.quantity} / {alert.product.reorderLevel} left</span>}
                    </span>
                    {!alert.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {list.length >= limit && limit < 100 && <Button variant="secondary" size="sm" className="w-full" onClick={() => setLimit(100)}>Load more</Button>}
        {limit >= 100 && list.length >= 100 && <p className="text-center text-xs text-ink-soft">Showing the latest 100 alerts.</p>}
      </div>
    </Drawer>
  );
}
