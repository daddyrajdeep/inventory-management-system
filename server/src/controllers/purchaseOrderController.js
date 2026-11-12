import { PurchaseOrder, Supplier, Product, Alert } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { audit } from '../utils/audit.js';
import { nextNumber } from '../utils/sequence.js';
import { serializeOrder } from '../utils/serializers.js';
import { changeStockMany, runInTransaction } from '../services/stockService.js';

const withNames = (query) =>
  query.populate('supplier', 'name').populate('items.product', 'name sku').populate('createdBy', 'name');

const load = async (id) => {
  const order = await withNames(PurchaseOrder.findById(id));
  if (!order) throw new ApiError(404, 'Purchase order not found');
  return order;
};

// Allowed moves. "received" is only reachable through the receive route, because that is what adds the stock.
const MOVES = { draft: ['ordered', 'cancelled'], ordered: ['cancelled'] };

// GET /api/purchase-orders?status=ordered   (newest first)
export const listOrders = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const orders = await withNames(PurchaseOrder.find(filter).sort({ createdAt: -1 }));
  res.json(orders.map(serializeOrder));
});

// GET /api/purchase-orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  res.json(serializeOrder(await load(req.params.id)));
});

// POST /api/purchase-orders
// body: { supplier, items: [{ product, quantity, unitCost }], expectedDate, notes, status: 'draft' | 'ordered' }
export const createOrder = asyncHandler(async (req, res) => {
  const { supplier, items, expectedDate, notes, status = 'draft' } = req.body;

  const sup = await Supplier.findById(supplier);
  if (!sup) throw new ApiError(400, 'Please choose a supplier');
  if (!sup.isActive) throw new ApiError(400, `${sup.name} is inactive`);

  const ids = [...new Set(items.map((i) => i.product))];
  const found = await Product.countDocuments({ _id: { $in: ids } });
  if (found !== ids.length) throw new ApiError(400, 'One of the products was not found');

  const order = await PurchaseOrder.create({
    orderNumber: await nextNumber('PO'),
    supplier: sup._id,
    items: items.map((i) => ({ product: i.product, quantity: i.quantity, unitCost: i.unitCost })),
    status,
    expectedDate: expectedDate || undefined,
    notes,
    createdBy: req.user._id,
  });
  await audit(req.user, 'CREATE', 'PurchaseOrder', order._id, null, order.toObject());
  res.status(201).json(serializeOrder(await load(order._id)));
});

// PATCH /api/purchase-orders/:id/status   body: { status: 'ordered' | 'cancelled' }
async function moveTo(req, res, status) {
  const order = await PurchaseOrder.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Purchase order not found');
  if (!MOVES[order.status]?.includes(status)) {
    throw new ApiError(400, `Cannot change a ${order.status} order to ${status}`);
  }
  const before = order.toObject();
  order.status = status;
  await order.save();
  await audit(req.user, 'UPDATE', 'PurchaseOrder', order._id, before, order.toObject());
  res.json(serializeOrder(await load(order._id)));
}
export const updateStatus = asyncHandler((req, res) => moveTo(req, res, req.body.status));
export const cancelOrder = asyncHandler((req, res) => moveTo(req, res, 'cancelled'));

// PATCH or POST /api/purchase-orders/:id/receive
// Marks the order received AND adds every item to stock, all in ONE transaction:
// either the order is received with all its stock in, or nothing changes.
export const receiveOrder = asyncHandler(async (req, res) => {
  const exists = await PurchaseOrder.exists({ _id: req.params.id });
  if (!exists) throw new ApiError(404, 'Purchase order not found');

  await runInTransaction(async (session) => {
    // One atomic step: only an "ordered" order can be flipped. If two people click Receive together,
    // the second one finds it already received and stops here, so stock is never added twice.
    const order = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, status: 'ordered' },
      { status: 'received', receivedDate: new Date() },
      { session, returnDocument: 'after' }
    );
    if (!order) throw new ApiError(400, 'Only an ordered purchase order can be received');

    await changeStockMany({
      items: order.items.map((i) => ({ productId: i.product, quantity: i.quantity })),
      type: 'IN',
      reason: `Received ${order.orderNumber}`,
      userId: req.user._id,
      reference: { model: 'PurchaseOrder', id: order._id },
      session,
    });
    await Alert.create([{ type: 'ORDER_RECEIVED', message: `Purchase order ${order.orderNumber} was received and added to stock` }], { session });
  });

  await audit(req.user, 'RECEIVE', 'PurchaseOrder', req.params.id, { status: 'ordered' }, { status: 'received' });
  res.json(serializeOrder(await load(req.params.id)));
});
