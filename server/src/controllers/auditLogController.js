import { AuditLog } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { parseLimit } from '../utils/helpers.js';

// GET /api/audit-logs?entity=Product&entityId=<id>&limit=100   (admin only, newest first)
export const listAuditLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.entity) filter.entity = String(req.query.entity);
  if (req.query.entityId) filter.entityId = req.query.entityId;
  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(parseLimit(req.query.limit, 100, 500)).populate('user', 'name email');
  res.json(logs.map((l) => ({ ...l.toJSON(), user: l.user ? { id: String(l.user._id), name: l.user.name, email: l.user.email } : null })));
});
