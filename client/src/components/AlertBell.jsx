import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from './Badge';
import { usePreferences } from '../context/PreferencesContext';
import { getAlerts, getUnreadCount, markAlertRead, markAllAlertsRead } from '../services/alertService';

// OWNER: Leader
// The bell in the top bar. It checks the unread count every 30 seconds, and loads the list when you open it.
const POLL_MS = 30000;
const TYPE_INFO = {
  LOW_STOCK: { label: 'Low stock', tone: 'amber' },
  OUT_OF_STOCK: { label: 'Out of stock', tone: 'red' },
  ORDER_RECEIVED: { label: 'Order received', tone: 'green' },
};

function timeAgo(value) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

export default function AlertBell() {
  const { prefs } = usePreferences();
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // The bell must never break the page, so failures here are ignored quietly
  const refreshCount = useCallback(async () => {
    try {
      const { count } = await getUnreadCount();
      setUnread(count);
    } catch {
      /* ignore */
    }
  }, []);

  // Keep the number fresh (only when the user wants notifications)
  useEffect(() => {
    if (!prefs.notifications) return undefined;
    let active = true;
    const poll = () =>
      getUnreadCount()
        .then(({ count }) => active && setUnread(count))
        .catch(() => {}); // the bell must never break the page
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [prefs.notifications]);

  // Close the list on outside click or Escape
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const loadList = async () => {
    setLoading(true);
    try {
      setAlerts(await getAlerts({ limit: 15 }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      loadList();
      refreshCount();
    }
  };

  const openAlert = async (alert) => {
    setOpen(false);
    navigate('/inventory');
    if (alert.isRead) return;
    try {
      await markAlertRead(alert.id);
      setUnread((n) => Math.max(0, n - 1));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const markAll = async () => {
    try {
      await markAllAlertsRead();
      setAlerts((list) => list.map((a) => ({ ...a, isRead: true })));
      setUnread(0);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button onClick={toggle} aria-label="Notifications" aria-expanded={open} className="relative">
        <Bell size={20} className="text-gray-600" />
        {prefs.notifications && unread > 0 && (
          <span
            data-testid="bell-badge"
            className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white"
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
            <button
              onClick={markAll}
              disabled={unread === 0}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
            >
              <CheckCheck size={14} /> Mark all as read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">Loading...</p>
            ) : alerts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">No alerts. You are all caught up.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {alerts.map((alert) => {
                  const info = TYPE_INFO[alert.type] || { label: alert.type, tone: 'gray' };
                  return (
                    <li key={alert.id}>
                      <button
                        onClick={() => openAlert(alert)}
                        className={`block w-full px-4 py-3 text-left hover:bg-gray-100 ${alert.isRead ? '' : 'bg-indigo-50'}`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <Badge tone={info.tone}>{info.label}</Badge>
                          <span className="text-xs text-gray-500">{timeAgo(alert.createdAt)}</span>
                        </div>
                        <p className={`text-sm ${alert.isRead ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
                          {alert.message}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
