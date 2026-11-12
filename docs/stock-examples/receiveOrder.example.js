// EXAMPLE for receiving a purchase order (Shilpa). Marking it received and adding the stock happen together.
import { PurchaseOrder } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { runInTransaction, changeStockMany } from '../services/stockService.js';

// PATCH /api/purchase-orders/:id/receive
export const receiveOrder = asyncHandler(async (req, res) => {
  const order = await runInTransaction(async (session) => {
    const po = await PurchaseOrder.findById(req.params.id).session(session);
    if (!po) throw new ApiError(404, 'Purchase order not found');
    if (po.status !== 'ordered') {
      throw new ApiError(400, `Only ordered purchase orders can be received (this one is ${po.status})`);
    }

    await changeStockMany({
      items: po.items.map((i) => ({ productId: i.product, quantity: i.quantity })),
      type: 'IN',
      reason: `Purchase order ${po.orderNumber}`,
      userId: req.user._id,
      reference: { model: 'PurchaseOrder', id: po._id },
      session,
    });

    po.status = 'received';
    po.receivedDate = new Date();
    await po.save({ session });
    return po;
  });

  res.json(order);
});
