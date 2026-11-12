import api from './api';

// Alerts are created by the backend when stock gets low. The frontend only reads them and marks them as read.

// array of { id, type, message, isRead, createdAt, product: { id, name, sku, quantity, reorderLevel } | null }
export async function getAlerts({ unread = false, limit = 20 } = {}) {
  const { data } = await api.get('/alerts', { params: { unread, limit } });
  return data;
}

// { count } : the bell asks this on load and after each socket (re)connect
export async function getUnreadCount() {
  const { data } = await api.get('/alerts/unread-count');
  return data;
}

export async function markAlertRead(id) {
  const { data } = await api.patch(`/alerts/${id}/read`);
  return data;
}

// { updated }
export async function markAllAlertsRead() {
  const { data } = await api.patch('/alerts/read-all');
  return data;
}
