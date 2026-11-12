import { Router } from 'express';
import { query } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { getSummary, getTopProducts, getSalesByDay, getExpenseByCategory } from '../controllers/reportController.js';

const router = Router();

// Reports show sales, expenses and profit, so they are admin / manager only (as planned in docs/API.md).
// To let staff see the dashboard too, change this line to:  router.use(protect);
router.use(protect, authorize('admin', 'manager'));

// Shared by all four reports: ?days=30  OR  ?from=YYYY-MM-DD&to=YYYY-MM-DD
const dateRules = [
  query('days').optional().isInt({ min: 1, max: 366 }).withMessage('days must be a number from 1 to 366'),
  query('from').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('from must look like 2026-11-01'),
  query('to').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('to must look like 2026-11-30'),
];

router.get('/summary', dateRules, validate, getSummary);

router.get(
  '/top-products',
  [
    ...dateRules,
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be a number from 1 to 50'),
    query('sortBy').optional().isIn(['revenue', 'quantity']).withMessage('sortBy must be revenue or quantity'),
  ],
  validate,
  getTopProducts
);

router.get('/sales-by-day', dateRules, validate, getSalesByDay);
router.get('/expense-by-category', dateRules, validate, getExpenseByCategory);

export default router;
