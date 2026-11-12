import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from './ui/Badge';
import IconButton from './ui/IconButton';
import AlertCenter from './AlertCenter';
import { ALERT_TYPE, ALERT_TILE, alertFallback, alertRoute } from './alertConfig';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { getAlerts, getUnreadCount, markAlertRead, markAllAlertsRead } from '../services/alertService';
import { connectSocket } from '../services/socket';
import { timeAgo } from '../utils/format';

// OWNER: Leader
// The bell in the top bar. New and read alerts arrive live over a socket.
const PREVIEW_LIMIT = 5;

export default function AlertBell() {
  const { user } = useAuth();
  const { prefs } = usePreferences();
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [centerOpen, setCenterOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [version, setVersion] = useState(0);

  const refreshCount = useCallback(async () => {
    try { setUnread((await getUnreadCount()).count); } catch { /* bell never breaks the page */ }
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (!prefs.notifications || !userId) return undefined;
    const socket = connectSocket();
    socket.on('connect', refreshCount);
    socket.on('disconnect', (reason) => reason === 'io server disconnect' && socket.connect());
    socket.on('alert:new', ({ alerts: incoming, count }) => {
      setUnread(count);
      setAlerts((list) => {
        const ids = new Set(incoming.map((a) => a.id));
        return [...incoming, ...list.filter((a) => !ids.has(a.id))].slice(0, PREVIEW_LIMIT);
      });
      setVersion((v) => v + 1);
      incoming.forEach((a) => toast(a.message, { id: `alert-${a.id}` }));
    });
    socket.on('alert:read', ({ ids, count }) => {
      setUnread(count);
      const readIds = ids && new Set(ids);
      setAlerts((list) => list.map((a) => (!readIds || readIds.has(a.id) ? { ...a, isRead: true } : a)));
      setVersion((v) => v + 1);
    });
    return () => socket.disconnect();
  }, [prefs.notifications, userId, refreshCount]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      refreshCount();
      try { setAlerts(await getAlerts({ limit: PREVIEW_LIMIT })); } catch { /* ignore */ }
    }
  };

  const openAlert = async (alert) => {
    setOpen(false);
    navigate(alertRoute(alert, user?.role));
    if (alert.isRead) return;
    try {
      await markAlertRead(alert.id);
      setAlerts((list) => list.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a)));
      setUnread((n) => Math.max(0, n - 1));
      setVersion((v) => v + 1);
    } catch (err) { toast.error(err.message); }
  };

  const markAll = async () => {
    try {
      await markAllAlertsRead();
      setAlerts((list) => list.map((a) => ({ ...a, isRead: true })));
      setUnread(0);
      setVersion((v) => v + 1);
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <IconButton label="Notifications" aria-expanded={open} onClick={toggle} className="relative">
        <Bell size={18} />
        {prefs.notifications && unread > 0 && (
          <span data-testid="bell-badge" className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-out px-1 text-[10px] font-medium text-on-ink" style={{ animation: 'rise 120ms var(--ease) both' }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </IconButton>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-line bg-surface shadow-float" style={{ animation: 'rise 160ms var(--ease) both' }}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Notifications</h2>
            <button onClick={markAll} disabled={unread === 0} className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink disabled:opacity-40">
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-soft">No alerts. You’re all caught up.</p>
            ) : (
              <ul className="divide-y divide-line">
                {alerts.map((alert) => {
                  const info = ALERT_TYPE[alert.type] || alertFallback;
                  return (
                    <li key={alert.id}>
                      <button onClick={() => openAlert(alert)} className="flex w-full gap-3 px-4 py-3 text-left hover:bg-paper">
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm ${ALERT_TILE[info.tone]}`}><info.Icon size={15} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <Badge tone={info.tone}>{info.label}</Badge>
                            <span className="text-xs text-ink-soft">{timeAgo(alert.createdAt)}</span>
                          </span>
                          <span className={`mt-1 block text-[13px] ${alert.isRead ? 'text-ink-soft' : 'font-medium text-ink'}`}>{alert.message}</span>
                        </span>
                        {!alert.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <button onClick={() => { setOpen(false); setCenterOpen(true); }} className="block w-full border-t border-line px-4 py-2.5 text-center text-xs font-medium text-ink hover:bg-paper">
            View all
          </button>
        </div>
      )}

      <AlertCenter open={centerOpen} onClose={() => setCenterOpen(false)} version={version} role={user?.role} onMarkAll={markAll} />
    </div>
  );
}
