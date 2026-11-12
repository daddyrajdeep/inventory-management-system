import { Expense } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { audit } from '../utils/audit.js';
import { escapeRegex, parseLimit, pick } from '../utils/helpers.js';
import { optionalRange } from '../utils/dateRange.js';
import { serializeExpense } from '../utils/serializers.js';

const FIELDS = ['title', 'category', 'amount', 'date', 'note'];

// GET /api/expenses?category=salaries&from=2026-11-01&to=2026-11-30&search=rent&limit=500   (newest first)
export const listExpenses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  const range = optionalRange(req.query);
  if (range) filter.date = { $gte: range.start, $lt: range.end };
  if (req.query.search) filter.title = new RegExp(escapeRegex(req.query.search), 'i');
  const expenses = await Expense.find(filter).sort({ date: -1, _id: -1 }).limit(parseLimit(req.query.limit, 500)).populate('createdBy', 'name');
  res.json(expenses.map(serializeExpense));
});

// POST /api/expenses   body: { title, category, amount, date, note }
export const createExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.create({ ...pick(req.body, FIELDS), createdBy: req.user._id });
  await audit(req.user, 'CREATE', 'Expense', expense._id, null, expense.toObject());
  await expense.populate('createdBy', 'name');
  res.status(201).json(serializeExpense(expense));
});

// PUT /api/expenses/:id
export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new ApiError(404, 'Expense not found');
  const before = expense.toObject();
  expense.set(pick(req.body, FIELDS));
  await expense.save();
  await audit(req.user, 'UPDATE', 'Expense', expense._id, before, expense.toObject());
  await expense.populate('createdBy', 'name');
  res.json(serializeExpense(expense));
});

// DELETE /api/expenses/:id
export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new ApiError(404, 'Expense not found');
  await expense.deleteOne();
  await audit(req.user, 'DELETE', 'Expense', expense._id, expense.toObject(), null);
  res.json({ message: 'Expense deleted' });
});
