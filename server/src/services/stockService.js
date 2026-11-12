// THE ONE PLACE WHERE STOCK QUANTITY CHANGES.
// Nothing else in the project may change Product.quantity. Every change goes through changeStock() or
// changeStockMany(), which also writes the StockMovement history and (when needed) a low-stock Alert,
// all in ONE database transaction: either everything is saved, or nothing is.
//
// Used by:  stock routes (in / out / adjust),  creating a sale,  receiving a purchase order.
import mongoose from 'mongoose';
import { Product, StockMovement, Alert } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { emitAlertsRead, emitNewAlerts } from '../socket.js';

const TYPES = ['IN', 'OUT', 'ADJUST'];

// Runs `work(session)` as a transaction. If work() throws, EVERYTHING done with that session is undone.
// Note: MongoDB may run work() again after a temporary conflict, so inside it only do database work.
// Alerts created or resolved inside it are pushed to the browsers only after the commit succeeds.
//
//   await runInTransaction(async (session) => {
//     await sale.save({ session });
//     await changeStockMany({ items, type: 'OUT', userId, session });
//   });
export async function runInTransaction(work) {
  let created = [];
  let resolved = [];
  const result = await mongoose.connection.transaction((session) => {
    created = []; // reset on retry so a retried attempt never pushes twice
    resolved = [];
    session.alertIds = created;
    session.resolvedAlertIds = resolved;
    return work(session);
  });
  emitNewAlerts(created);
  if (resolved.length) emitAlertsRead(resolved.map(String));
  return result;
}

// Creates an alert inside the transaction; runInTransaction pushes it live after commit.
export async function createAlert(data, session) {
  const [alert] = await Alert.create([data], { session });
  session.alertIds?.push(alert._id);
  return alert;
}

// Why did the update match nothing? Give the user a clear message.
async function explainFailure(productId, quantity, session) {
  const product = await Product.findById(productId).session(session);
  if (!product) throw new ApiError(404, 'Product not found');
  if (!product.isActive) throw new ApiError(400, `${product.name} is inactive`);
  throw new ApiError(400, `Not enough stock for ${product.name}. Available: ${product.quantity}, requested: ${quantity}`);
}

// Creates an alert only when stock CROSSES a threshold, so the same product does not alert again and again.
// Crossing back up marks the product's open shortage alerts as read.
async function createAlertIfNeeded(product, previousQty, newQty, session) {
  const level = product.reorderLevel;
  const resolveTypes = [];
  if (newQty > level && previousQty <= level) resolveTypes.push('LOW_STOCK', 'OUT_OF_STOCK');
  else if (newQty > 0 && previousQty === 0) resolveTypes.push('OUT_OF_STOCK');
  if (resolveTypes.length) {
    const filter = { product: product._id, type: { $in: resolveTypes }, isRead: false };
    const open = await Alert.find(filter, '_id').session(session);
    if (open.length) {
      await Alert.updateMany({ _id: { $in: open.map((a) => a._id) } }, { isRead: true }, { session });
      session.resolvedAlertIds?.push(...open.map((a) => a._id));
    }
  }

  let alert = null;
  if (newQty === 0 && previousQty > 0) {
    alert = { type: 'OUT_OF_STOCK', message: `${product.name} is out of stock` };
  } else if (newQty > 0 && newQty <= level && previousQty > level) {
    alert = {
      type: 'LOW_STOCK',
      message: `${product.name} is low on stock (${newQty} left, reorder level ${level})`,
    };
  }
  if (alert) await createAlert({ ...alert, product: product._id }, session);
}

// Changes the stock of ONE product.
//
//   IN      { productId, type: 'IN',     quantity: 20, reason, userId }
//   OUT     { productId, type: 'OUT',    quantity: 3,  reason, userId }
//   ADJUST  { productId, type: 'ADJUST', newQuantity: 42, reason, userId }   (sets the exact count)
//
// Optional: reference: { model: 'Sale' | 'PurchaseOrder', id }  and  session (to join a bigger transaction).
// Returns { movement, product: { id, name, sku, previousQty, newQty } }.
export async function changeStock(options) {
  if (!options?.session) return runInTransaction((session) => changeStock({ ...options, session }));

  const { productId, type, quantity, newQuantity, reason, userId, reference, session } = options;

  if (!TYPES.includes(type)) throw new ApiError(400, 'Type must be IN, OUT or ADJUST');
  if (!userId) throw new ApiError(400, 'userId is required to record who changed the stock');
  if (type === 'ADJUST') {
    if (!Number.isInteger(newQuantity) || newQuantity < 0) {
      throw new ApiError(400, 'New quantity must be a whole number, 0 or more');
    }
  } else if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(400, 'Quantity must be a whole number, 1 or more');
  }

  // ONE atomic update. For OUT the "quantity >= requested" condition is checked by the database itself,
  // at the moment of the update, so two people can never both take the last item.
  const filter = { _id: productId, isActive: true };
  let update;
  if (type === 'IN') update = { $inc: { quantity } };
  else if (type === 'OUT') {
    filter.quantity = { $gte: quantity };
    update = { $inc: { quantity: -quantity } };
  } else update = { $set: { quantity: newQuantity } };

  const before = await Product.findOneAndUpdate(filter, update, { session, returnDocument: 'before' });
  if (!before) await explainFailure(productId, quantity, session);

  const previousQty = before.quantity;
  const newQty = type === 'IN' ? previousQty + quantity : type === 'OUT' ? previousQty - quantity : newQuantity;
  const moved = Math.abs(newQty - previousQty);
  if (moved === 0) throw new ApiError(400, 'Stock is already at that quantity'); // undoes the update

  const [movement] = await StockMovement.create(
    [
      {
        product: before._id,
        type,
        quantity: moved,
        previousQty,
        newQty,
        reason,
        referenceModel: reference?.model || 'Manual',
        referenceId: reference?.id,
        performedBy: userId,
      },
    ],
    { session }
  );

  await createAlertIfNeeded(before, previousQty, newQty, session);

  return {
    movement,
    product: { id: String(before._id), name: before.name, sku: before.sku, previousQty, newQty },
  };
}

// Changes the stock of SEVERAL products at once (a sale with many items, a received purchase order).
// All-or-nothing: if one item fails (for example not enough stock), none of them change.
//
//   await changeStockMany({ items: [{ productId, quantity }, ...], type: 'OUT', reason, userId, reference })
//
// Pass `session` to run inside your own transaction (for example together with saving the Sale).
export async function changeStockMany({ items, type, reason, userId, reference, session }) {
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'At least one item is required');
  if (!session) {
    return runInTransaction((s) => changeStockMany({ items, type, reason, userId, reference, session: s }));
  }

  // The same product twice in the list is added up. Products are processed in a fixed order,
  // which avoids two requests blocking each other.
  const totals = new Map();
  for (const { productId, quantity } of items) {
    const key = String(productId);
    totals.set(key, (totals.get(key) || 0) + Number(quantity));
  }

  const results = [];
  for (const [productId, quantity] of [...totals.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    results.push(await changeStock({ productId, type, quantity, reason, userId, reference, session }));
  }
  return results;
}
