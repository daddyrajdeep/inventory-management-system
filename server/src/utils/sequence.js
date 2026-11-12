import { Counter } from '../models/index.js';

// nextNumber('INV') -> 'INV-2026-0001', then 'INV-2026-0002' ...   nextNumber('PO') -> 'PO-2026-0001'
// The database increases the counter in one atomic step, so two people can never get the same number.
// (If a sale then fails, that number is skipped. Gaps are normal and harmless.)
export async function nextNumber(prefix) {
  const key = `${prefix}-${new Date().getFullYear()}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return `${key}-${String(counter.seq).padStart(4, '0')}`;
}
