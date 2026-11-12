// EXAMPLE for creating a sale (Asmita). The sale and the stock change are saved TOGETHER:
// if anything fails (for example not enough stock), nothing is saved at all.
import { Product, Sale } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { runInTransaction, changeStockMany } from '../services/stockService.js';

// POST /api/sales   body: { items: [{ productId, quantity }], discount, customerName, paymentMethod }
export const createSale = asyncHandler(async (req, res) => {
  const { items, discount = 0, customerName, paymentMethod } = req.body;
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Add at least one item');

  const sale = await runInTransaction(async (session) => {
    // Names and prices come from the DATABASE, never from the browser, so nobody can send a fake price
    const products = await Product.find({ _id: { $in: items.map((i) => i.productId) } }).session(session);
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const lines = items.map((i) => {
      const product = byId.get(String(i.productId));
      if (!product) throw new ApiError(404, 'Product not found');
      return { product: product._id, name: product.name, quantity: Number(i.quantity), unitPrice: product.price };
    });

    const invoiceNumber = `INV-${Date.now()}`; // simple version. Your task: make it a proper running number
    const doc = new Sale({ invoiceNumber, items: lines, discount, customerName, paymentMethod, soldBy: req.user._id });
    await doc.save({ session }); // the Sale model works out subtotals and the total by itself

    await changeStockMany({
      items: lines.map((l) => ({ productId: l.product, quantity: l.quantity })),
      type: 'OUT',
      reason: `Sale ${invoiceNumber}`,
      userId: req.user._id,
      reference: { model: 'Sale', id: doc._id }, // links every stock movement to this sale
      session, // joins the same transaction
    });
    return doc;
  });

  res.status(201).json(sale);
});
