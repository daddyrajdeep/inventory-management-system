import { Product, Category, Supplier, StockMovement, Sale, PurchaseOrder } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { audit } from '../utils/audit.js';
import { escapeRegex, exactName, isObjectId, pick } from '../utils/helpers.js';
import { serializeProduct } from '../utils/serializers.js';

// NOTE: "quantity" is NOT in this list on purpose. Stock only changes through the stock service
// (POST /api/stock/in | out | adjust, sales and purchase orders).
const FIELDS = ['name', 'sku', 'barcode', 'description', 'costPrice', 'price', 'reorderLevel', 'unit', 'rating', 'isActive'];

const populated = (query) => query.populate('category', 'name').populate('supplier', 'name');

// The pages send a category NAME (typed or chosen), other clients may send an id. Both work.
// An unknown name creates the category, so a new product never fails just because the category is new.
async function resolveCategory(value) {
  if (value === undefined) return undefined; // not sent: leave as is
  if (value === null || String(value).trim() === '') return null; // cleared
  if (isObjectId(value)) {
    if (!(await Category.exists({ _id: value }))) throw new ApiError(400, 'Category not found');
    return value;
  }
  const existing = await Category.findOne({ name: exactName(value) });
  return (existing || (await Category.create({ name: String(value).trim() })))._id;
}

// Suppliers are never auto-created. Send an id, or the exact name of an existing supplier.
async function resolveSupplier(value) {
  if (value === undefined) return undefined;
  if (value === null || String(value).trim() === '') return null;
  const supplier = isObjectId(value)
    ? await Supplier.findById(value)
    : await Supplier.findOne({ name: exactName(value) });
  if (!supplier) throw new ApiError(400, 'Supplier not found');
  return supplier._id;
}

// GET /api/products?search=&category=&supplier=&status=low|out|ok&includeInactive=true
// `category` / `supplier` accept an id or a name.   Returns a plain array.
export const listProducts = asyncHandler(async (req, res) => {
  const { search, category, supplier, status, includeInactive } = req.query;
  const filter = {};
  if (includeInactive !== 'true') filter.isActive = true;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { barcode: rx }];
  }
  if (category) {
    // filtering must never create a category, so look it up only
    const found = isObjectId(category) ? { _id: category } : await Category.findOne({ name: exactName(category) });
    if (!found) return res.json([]); // no such category, so no products
    filter.category = found._id;
  }
  if (supplier) {
    const found = isObjectId(supplier) ? { _id: supplier } : await Supplier.findOne({ name: exactName(supplier) });
    if (!found) return res.json([]);
    filter.supplier = found._id;
  }
  if (status === 'out') filter.quantity = 0;
  else if (status === 'low') filter.$expr = { $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', '$reorderLevel'] }] };
  else if (status === 'ok') filter.$expr = { $gt: ['$quantity', '$reorderLevel'] };

  const products = await populated(Product.find(filter).sort({ name: 1 }));
  res.json(products.map(serializeProduct));
});

// GET /api/products/:id
export const getProduct = asyncHandler(async (req, res) => {
  const product = await populated(Product.findById(req.params.id));
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(serializeProduct(product));
});

// POST /api/products   body: { name, sku, price, costPrice, category, supplier, reorderLevel, unit, ... }
// New products start with 0 stock. Add stock with POST /api/stock/in (or receive a purchase order).
export const createProduct = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  data.category = await resolveCategory(req.body.category);
  data.supplier = await resolveSupplier(req.body.supplier);
  const product = await Product.create({ ...data, quantity: 0 });
  const full = await populated(Product.findById(product._id));
  await audit(req.user, 'CREATE', 'Product', product._id, null, product.toObject());
  res.status(201).json(serializeProduct(full));
});

// PUT /api/products/:id   (partial updates are fine; quantity cannot be changed here)
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  const before = product.toObject();

  product.set(pick(req.body, FIELDS));
  const category = await resolveCategory(req.body.category);
  const supplier = await resolveSupplier(req.body.supplier);
  if (category !== undefined) product.category = category;
  if (supplier !== undefined) product.supplier = supplier;
  await product.save(); // a duplicate SKU becomes a 409 in the error handler

  const full = await populated(Product.findById(product._id));
  await audit(req.user, 'UPDATE', 'Product', product._id, before, product.toObject());
  res.json(serializeProduct(full));
});

// DELETE /api/products/:id   (admin)
// A product that has ever been stocked, sold or ordered keeps its history, so it cannot be deleted:
// set isActive to false instead (it then disappears from the lists but old sales stay correct).
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  const [moves, sales, orders] = await Promise.all([
    StockMovement.exists({ product: product._id }),
    Sale.exists({ 'items.product': product._id }),
    PurchaseOrder.exists({ 'items.product': product._id }),
  ]);
  if (moves || sales || orders) {
    throw new ApiError(409, 'This product has stock, sales or order history and cannot be deleted. Set it to inactive instead.');
  }
  await product.deleteOne();
  await audit(req.user, 'DELETE', 'Product', product._id, product.toObject(), null);
  res.json({ message: 'Product deleted' });
});
