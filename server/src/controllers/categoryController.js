import { Category, Product } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { audit } from '../utils/audit.js';
import { exactName } from '../utils/helpers.js';

async function assertNameFree(name, exceptId) {
  const clash = await Category.findOne({ name: exactName(name), ...(exceptId && { _id: { $ne: exceptId } }) });
  if (clash) throw new ApiError(409, 'A category with this name already exists');
}

// GET /api/categories   ->  [{ id, name, description, productCount }]
export const listCategories = asyncHandler(async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }),
    Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const countOf = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json(categories.map((c) => ({ ...c.toJSON(), productCount: countOf.get(String(c._id)) || 0 })));
});

// POST /api/categories   body: { name, description }
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  await assertNameFree(name);
  const category = await Category.create({ name, description });
  await audit(req.user, 'CREATE', 'Category', category._id, null, category.toObject());
  res.status(201).json(category);
});

// PUT /api/categories/:id   body: { name, description }
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  await assertNameFree(req.body.name, category._id);
  const before = category.toObject();
  category.name = req.body.name;
  if (req.body.description !== undefined) category.description = req.body.description;
  await category.save();
  await audit(req.user, 'UPDATE', 'Category', category._id, before, category.toObject());
  res.json(category);
});

// DELETE /api/categories/:id   (refused while products still use it)
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  const used = await Product.countDocuments({ category: category._id });
  if (used > 0) throw new ApiError(409, `This category is used by ${used} product(s). Move them to another category first.`);
  await category.deleteOne();
  await audit(req.user, 'DELETE', 'Category', category._id, category.toObject(), null);
  res.json({ message: 'Category deleted' });
});
