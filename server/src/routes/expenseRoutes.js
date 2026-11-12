import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { Expense } from '../models/index.js';
import { listExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController.js';

const router = Router();
router.use(protect, authorize('admin', 'manager')); // expenses are admin / manager only

// Read from the model, so the list never goes out of date: office, professional, salaries, other
const categories = Expense.schema.path('category').enumValues;
const idRule = param('id').isMongoId().withMessage('Invalid expense id');
const day = (name) => query(name).optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(`${name} must look like 2026-11-01`);

const rules = (required) => {
  const opt = (chain) => (required ? chain : chain.optional());
  return [
    opt(body('title').trim().notEmpty().withMessage('Title is required')),
    opt(body('category').isIn(categories).withMessage(`Category must be one of: ${categories.join(', ')}`)),
    opt(body('amount').isFloat({ gt: 0 }).withMessage('Amount must be more than 0').toFloat()),
    body('date').optional({ values: 'falsy' }).isISO8601().withMessage('Date is not valid'),
    body('note').optional().trim(),
  ];
};

router.get(
  '/',
  [day('from'), day('to'), query('category').optional().isIn(categories).withMessage(`Category must be one of: ${categories.join(', ')}`)],
  validate,
  listExpenses
);
router.post('/', rules(true), validate, createExpense);
router.put('/:id', [idRule, ...rules(false)], validate, updateExpense);
router.delete('/:id', [idRule], validate, deleteExpense);

export default router;
