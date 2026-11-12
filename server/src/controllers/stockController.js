import { Product, StockMovement } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { audit } from '../utils/audit.js';
import { parseLimit } from '../utils/helpers.js';
import { changeStock } from '../services/stockService.js';
import { serializeMovement, serializeProduct } from '../utils/serializers.js';

const withNames = (query) => query.populate('product', 'name sku').populate('performedBy', 'name');

// Shared by in / out / adjust: runs the stock service, then sends the movement back.
async function applyChange(req, res, options) {
  const { movement, product } = await changeStock({ ...options, productId: req.body.product, userId: req.user._id, reason: req.body.reason });
  const full = await withNames(StockMovement.findById(movement._id));
  await audit(req.user, `STOCK_${options.type}`, 'Product', product.id, { quantity: product.previousQty }, { quantity: product.newQty });
  res.status(201).json(serializeMovement(full));
}

// GET /api/stock   ->  all active products with their stock status (same shape as /api/products)
export const getStock = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true }).sort({ name: 1 }).populate('category', 'name').populate('supplier', 'name');
  res.json(products.map(serializeProduct));
});

// GET /api/stock/movements?product=<id>&type=IN|OUT|ADJUST&limit=200   (newest first)
export const listMovements = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.product) filter.product = req.query.product;
  if (req.query.type) filter.type = req.query.type;
  const movements = await withNames(StockMovement.find(filter).sort({ createdAt: -1, _id: -1 }).limit(parseLimit(req.query.limit)));
  res.json(movements.map(serializeMovement));
});

// POST /api/stock/in      body: { product, quantity, reason }
export const stockIn = asyncHandler((req, res) => applyChange(req, res, { type: 'IN', quantity: req.body.quantity }));

// POST /api/stock/out     body: { product, quantity, reason }
export const stockOut = asyncHandler((req, res) => applyChange(req, res, { type: 'OUT', quantity: req.body.quantity }));

// POST /api/stock/adjust  body: { product, newQty, reason }   (sets the exact counted number; reason is required)
export const stockAdjust = asyncHandler((req, res) => {
  if (!req.body.reason?.trim()) throw new ApiError(400, 'A reason is required for an adjustment');
  return applyChange(req, res, { type: 'ADJUST', newQuantity: req.body.newQty });
});
