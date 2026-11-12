import { Sale, Product } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { audit } from '../utils/audit.js';
import { escapeRegex, parseLimit } from '../utils/helpers.js';
import { optionalRange } from '../utils/dateRange.js';
import { nextNumber } from '../utils/sequence.js';
import { serializeSale } from '../utils/serializers.js';
import { changeStockMany, runInTransaction } from '../services/stockService.js';

// GET /api/sales?from=2026-11-01&to=2026-11-30&search=INV-2026-0001&paymentMethod=upi&limit=200   (newest first)
export const listSales = asyncHandler(async (req, res) => {
  const filter = {};
  const range = optionalRange(req.query);
  if (range) filter.createdAt = { $gte: range.start, $lt: range.end };
  if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ invoiceNumber: rx }, { customerName: rx }];
  }
  const sales = await Sale.find(filter).sort({ createdAt: -1 }).limit(parseLimit(req.query.limit)).populate('soldBy', 'name');
  res.json(sales.map((s) => serializeSale(s)));
});

// GET /api/sales/:id   (with the line items)
export const getSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id).populate('soldBy', 'name');
  if (!sale) throw new ApiError(404, 'Sale not found');
  res.json(serializeSale(sale, true));
});

// POST /api/sales
// body: { items: [{ product, quantity }], discount, customerName, paymentMethod: 'cash' | 'card' | 'upi' }
// Prices come from the product, never from the browser. Saving the sale and taking the stock out happen in ONE
// transaction, so a sale can never exist without its stock being reduced (and the other way round).
export const createSale = asyncHandler(async (req, res) => {
  const { items, customerName, paymentMethod } = req.body;
  const discount = req.body.discount || 0;

  // Same product on two lines is merged into one
  const wanted = new Map();
  for (const { product, quantity } of items) wanted.set(String(product), (wanted.get(String(product)) || 0) + quantity);

  const products = await Product.find({ _id: { $in: [...wanted.keys()] } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines = [];
  for (const [id, quantity] of wanted) {
    const product = byId.get(id);
    if (!product) throw new ApiError(404, 'One of the products was not found');
    if (!product.isActive) throw new ApiError(400, `${product.name} is inactive and cannot be sold`);
    lines.push({ product: product._id, name: product.name, quantity, unitPrice: product.price });
  }

  const gross = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  if (discount > gross) throw new ApiError(400, 'Discount cannot be more than the sale total');

  const invoiceNumber = await nextNumber('INV');

  const sale = await runInTransaction(async (session) => {
    const doc = new Sale({ invoiceNumber, items: lines, discount, customerName, paymentMethod, soldBy: req.user._id });
    await doc.save({ session }); // totals are calculated by the model
    // Throws "Not enough stock for ..." (and undoes the sale) if any item is short
    await changeStockMany({
      items: lines.map((l) => ({ productId: l.product, quantity: l.quantity })),
      type: 'OUT',
      reason: `Sale ${invoiceNumber}`,
      userId: req.user._id,
      reference: { model: 'Sale', id: doc._id },
      session,
    });
    return doc;
  });

  await audit(req.user, 'CREATE', 'Sale', sale._id, null, { invoiceNumber, totalAmount: sale.totalAmount });
  const full = await Sale.findById(sale._id).populate('soldBy', 'name');
  res.status(201).json(serializeSale(full, true));
});
