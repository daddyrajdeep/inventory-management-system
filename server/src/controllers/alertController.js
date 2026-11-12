import { Alert } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Alerts are created automatically by the stock helper (services/stockService.js).
// Here we only READ them and mark them as read. Alerts are shared by everyone: when one person
// marks an alert as read, it is read for all users.

// Which product details come with each alert (the bell shows the product name)
const PRODUCT_FIELDS = 'name sku quantity reorderLevel';

// GET /api/alerts?unread=true&limit=20      newest first
export const listAlerts = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const filter = req.query.unread === 'true' ? { isRead: false } : {};

  const alerts = await Alert.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('product', PRODUCT_FIELDS);

  res.json(alerts);
});

// GET /api/alerts/unread-count      { count }   (cheap: the bell asks this every 30 seconds)
export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Alert.countDocuments({ isRead: false });
  res.json({ count });
});

// PATCH /api/alerts/:id/read
export const markRead = asyncHandler(async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { returnDocument: 'after' }).populate(
    'product',
    PRODUCT_FIELDS
  );
  if (!alert) throw new ApiError(404, 'Alert not found');
  res.json(alert);
});

// PATCH /api/alerts/read-all      { updated }
export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Alert.updateMany({ isRead: false }, { isRead: true });
  res.json({ updated: result.modifiedCount });
});
