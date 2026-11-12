import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from './Badge';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { getAlerts, getUnreadCount, markAlertRead, markAllAlertsRead } from '../services/alertService';
import { connectSocket } from '../services/socket';

// OWNER: Leader
// The bell in the top bar. New and read alerts arrive live over a socket; the list loads when you open it.
const LIST_LIMIT = 15;
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
  const { user } = useAuth();
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

  // Live updates (only when the user wants notifications). The count is refetched on every
  // (re)connect, so anything missed while offline is caught up.
  const userId = user?.id;
  useEffect(() => {
    if (!prefs.notifications || !userId) return undefined;
    const socket = connectSocket();

    socket.on('connect', refreshCount);
    // The server drops sockets on password change; retry once with the current token (refused if it's stale)
    socket.on('disconnect', (reason) => reason === 'io server disconnect' && socket.connect());
    socket.on('alert:new', ({ alerts: incoming, count }) => {
      setUnread(count);
      setAlerts((list) => {
        const ids = new Set(incoming.map((a) => a.id));
        return [...incoming, ...list.filter((a) => !ids.has(a.id))].slice(0, LIST_LIMIT);
      });
      incoming.forEach((a) => toast(a.message, { id: `alert-${a.id}` }));
    });
    socket.on('alert:read', ({ ids, count }) => {
      setUnread(count);
      const readIds = ids && new Set(ids);
      setAlerts((list) => list.map((a) => (!readIds || readIds.has(a.id) ? { ...a, isRead: true } : a)));
    });

    return () => socket.disconnect();
  }, [prefs.notifications, userId, refreshCount]);

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
      setAlerts(await getAlerts({ limit: LIST_LIMIT }));
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
    const canSeeOrders = user?.role === 'admin' || user?.role === 'manager';
    navigate(alert.type === 'ORDER_RECEIVED' && canSeeOrders ? '/orders' : '/inventory');
    if (alert.isRead) return;
    try {
      await markAlertRead(alert.id);
      setAlerts((list) => list.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a)));
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
