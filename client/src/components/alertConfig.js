import { AlertTriangle, Bell, CheckCircle2, PackageX } from 'lucide-react';

export const ALERT_TYPE = {
  LOW_STOCK: { label: 'Low stock', tone: 'low', Icon: AlertTriangle },
  OUT_OF_STOCK: { label: 'Out of stock', tone: 'out', Icon: PackageX },
  ORDER_RECEIVED: { label: 'Order received', tone: 'ok', Icon: CheckCircle2 },
};

export const ALERT_TILE = {
  low: 'bg-low-soft text-low',
  out: 'bg-out-soft text-out',
  ok: 'bg-ok-soft text-ok',
  info: 'bg-info-soft text-info',
  neutral: 'bg-paper text-ink-soft',
};

export const alertFallback = { label: 'Alert', tone: 'neutral', Icon: Bell };

export function alertRoute(alert, role) {
  const canSeeOrders = role === 'admin' || role === 'manager';
  if (alert.type === 'ORDER_RECEIVED' && canSeeOrders) return '/orders';
  if (alert.product?.id) return `/inventory?product=${alert.product.id}`;
  return '/inventory';
}
