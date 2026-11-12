// EXAMPLE for receiving a purchase order (Shilpa). Marking it received and adding the stock happen together.
// IMPORTANT: the status flip is ONE atomic conditional update. A read-then-save would let two
// concurrent receives both pass the check and add the stock twice (see the real controller).
import { PurchaseOrder } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { runInTransaction, changeStockMany } from '../services/stockService.js';

// PATCH /api/purchase-orders/:id/receive
export const receiveOrder = asyncHandler(async (req, res) => {
  const order = await runInTransaction(async (session) => {
    const po = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, status: 'ordered' },
      { status: 'received', receivedDate: new Date() },
      { session, returnDocument: 'after' }
    );
    if (!po) throw new ApiError(400, 'Only an ordered purchase order can be received');

    await changeStockMany({
      items: po.items.map((i) => ({ productId: i.product, quantity: i.quantity })),
      type: 'IN',
      reason: `Purchase order ${po.orderNumber}`,
      userId: req.user._id,
      reference: { model: 'PurchaseOrder', id: po._id },
      session,
    });

    return po;
  });

  res.json(order);
});
