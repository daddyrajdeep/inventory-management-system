// EXAMPLE controller. Copy to server/src/controllers/ and rename for your own module.
// A controller does the real work for one route: read the request, use the model, send the response.
import { Supplier, Product } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/Suppliers
export const listSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find().sort({ name: 1 });
  res.json(suppliers);
});

// POST /api/Suppliers   body: { name, description }
export const createSupplier = asyncHandler(async (req, res) => {
  const  { name, contactPerson, email, phone, address, isActive }  = req.body;
  const supplier = await Supplier.create({ name, contactPerson, email, phone, address, isActive });
  res.status(201).json(supplier);
});

// PUT /api/Suppliers/:id   body: { name, description }
export const updateSupplier = asyncHandler(async (req, res) => {
  const { name, contactPerson, email, phone, address, isActive } = req.body;
  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    { name, contactPerson, email, phone, address, isActive },
    { new: true, runValidators: true } // new: return the updated one; runValidators: apply the model rules
  );
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  res.json(supplier);
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const inUse = await Product.exists({ supplier: req.params.id });
  if (inUse) throw new ApiError(409, 'Supplier is in use by products');
  const supplier = await Supplier.findByIdAndDelete(req.params.id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  res.json({ message: 'Supplier deleted' });
});
