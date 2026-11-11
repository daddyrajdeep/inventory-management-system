// EXAMPLE controller. Copy to server/src/controllers/ and rename for your own module.
// A controller does the real work for one route: read the request, use the model, send the response.
import { Category } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/categories
export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
});

// POST /api/categories   body: { name, description }
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.create({ name, description });
  res.status(201).json(category);
});

// PUT /api/categories/:id   body: { name, description }
export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, description },
    { new: true, runValidators: true } // new: return the updated one; runValidators: apply the model rules
  );
  if (!category) throw new ApiError(404, 'Category not found');
  res.json(category);
});

// DELETE /api/categories/:id
// TODO (your task): refuse to delete a category that products still use
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ message: 'Category deleted' });
});
