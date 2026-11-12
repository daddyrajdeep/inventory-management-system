import { AuditLog } from '../models/index.js';

// Writes one line to the audit trail: who did what to which record.
//   await audit(req.user, 'CREATE', 'Product', product._id, null, product.toObject())
// It never breaks the request: if writing the log fails, the error is only printed.
export async function audit(user, action, entity, entityId, before = null, after = null) {
  try {
    await AuditLog.create({ user: user._id ?? user, action, entity, entityId, before, after });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}
