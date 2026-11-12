// OWNER: Brijesh (Stock)
// Stock in / out / adjust and the movement history.
// RULE: Product.quantity is never changed here. changeStock() does it safely (quantity + history + alerts
// in one transaction).
import { StockMovement } from '../models/index.js';
import { changeStock } from '../services/stockService.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/stock/in   body: { productId, quantity, reason? }
export const stockIn = asyncHandler(async (req, res) => {
  const { productId, quantity, reason } = req.body;
  const result = await changeStock({
    productId,
    type: 'IN',
    quantity: Number(quantity),
    reason,
    userId: req.user._id,
  });
  res.status(201).json(result);
});

// POST /api/stock/out   body: { productId, quantity, reason? }
export const stockOut = asyncHandler(async (req, res) => {
  const { productId, quantity, reason } = req.body;
  const result = await changeStock({
    productId,
    type: 'OUT',
    quantity: Number(quantity),
    reason,
    userId: req.user._id,
  });
  res.status(201).json(result);
});

// POST /api/stock/adjust   body: { productId, newQuantity, reason }   (sets the exact counted quantity)
export const stockAdjust = asyncHandler(async (req, res) => {
  const { productId, newQuantity, reason } = req.body;
  const result = await changeStock({
    productId,
    type: 'ADJUST',
    newQuantity: Number(newQuantity),
    reason,
    userId: req.user._id,
  });
  res.status(201).json(result);
});

// GET /api/stock/movements?productId=...&limit=100     newest first
// Each item is flat, so the Stock history table can show it directly:
// { id, product, productName, sku, type, quantity, previousQty, newQty, reason,
//   referenceModel, referenceId, performedBy (the user's name), createdAt }
export const listMovements = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
  const filter = req.query.productId ? { product: req.query.productId } : {};

  const movements = await StockMovement.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('product', 'name sku')
    .populate('performedBy', 'name');

  res.json(
    movements.map((m) => ({
      id: String(m._id),
      product: m.product ? String(m.product._id) : null,
      productName: m.product?.name || 'Deleted product',
      sku: m.product?.sku || '',
      type: m.type,
      quantity: m.quantity,
      previousQty: m.previousQty,
      newQty: m.newQty,
      reason: m.reason || '',
      referenceModel: m.referenceModel,
      referenceId: m.referenceId ? String(m.referenceId) : null,
      performedBy: m.performedBy?.name || 'Unknown user',
      createdAt: m.createdAt,
    }))
  );
});
