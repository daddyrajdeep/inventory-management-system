import { Supplier, Product, PurchaseOrder } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { audit } from '../utils/audit.js';
import { escapeRegex, pick } from '../utils/helpers.js';

const FIELDS = ['name', 'contactPerson', 'email', 'phone', 'address', 'isActive'];

// GET /api/suppliers?search=abc&active=true
export const listSuppliers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.active === 'true') filter.isActive = true;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ name: rx }, { contactPerson: rx }, { email: rx }, { phone: rx }];
  }
  res.json(await Supplier.find(filter).sort({ name: 1 }));
});

// GET /api/suppliers/:id
export const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  res.json(supplier);
});

// POST /api/suppliers   body: { name, contactPerson, email, phone, address }
export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(pick(req.body, FIELDS));
  await audit(req.user, 'CREATE', 'Supplier', supplier._id, null, supplier.toObject());
  res.status(201).json(supplier);
});

// PUT /api/suppliers/:id
export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  const before = supplier.toObject();
  supplier.set(pick(req.body, FIELDS));
  await supplier.save();
  await audit(req.user, 'UPDATE', 'Supplier', supplier._id, before, supplier.toObject());
  res.json(supplier);
});

// DELETE /api/suppliers/:id   (refused if products or purchase orders use it: deactivate it instead)
export const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  const [products, orders] = await Promise.all([
    Product.countDocuments({ supplier: supplier._id }),
    PurchaseOrder.countDocuments({ supplier: supplier._id }),
  ]);
  if (products + orders > 0) {
    throw new ApiError(409, 'This supplier is used by products or purchase orders. Deactivate it instead of deleting.');
  }
  await supplier.deleteOne();
  await audit(req.user, 'DELETE', 'Supplier', supplier._id, supplier.toObject(), null);
  res.json({ message: 'Supplier deleted' });
});
