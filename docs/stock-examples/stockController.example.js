// EXAMPLE for the Stock routes (Brijesh). Copy to server/src/controllers/ and build your routes on top.
// You never touch Product.quantity yourself: you call changeStock() and it does everything safely.
import { changeStock } from '../services/stockService.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/stock/in   body: { productId, quantity, reason }
export const stockIn = asyncHandler(async (req, res) => {
  const { productId, quantity, reason } = req.body;
  const result = await changeStock({ productId, type: 'IN', quantity: Number(quantity), reason, userId: req.user._id });
  res.status(201).json(result);
});

// POST /api/stock/out   body: { productId, quantity, reason }
export const stockOut = asyncHandler(async (req, res) => {
  const { productId, quantity, reason } = req.body;
  const result = await changeStock({ productId, type: 'OUT', quantity: Number(quantity), reason, userId: req.user._id });
  res.status(201).json(result);
});

// POST /api/stock/adjust   body: { productId, newQuantity, reason }   (sets the exact count after a recount)
export const stockAdjust = asyncHandler(async (req, res) => {
  const { productId, newQuantity, reason } = req.body;
  const result = await changeStock({ productId, type: 'ADJUST', newQuantity: Number(newQuantity), reason, userId: req.user._id });
  res.status(201).json(result);
});

// GET /api/stock/movements?productId=...   (the history list is yours to build with StockMovement.find)
