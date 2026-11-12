import { Router } from 'express';
import { body, query } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { getStock, listMovements, stockIn, stockOut, stockAdjust } from '../controllers/stockController.js';

const router = Router();
router.use(protect);

const productRule = body('product').isMongoId().withMessage('Choose a valid product');
const quantityRule = body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a whole number, 1 or more').toInt();
const reasonRule = body('reason').optional().trim();

router.get('/', getStock);
router.get(
  '/movements',
  [
    query('product').optional().isMongoId().withMessage('Invalid product id'),
    query('type').optional().isIn(['IN', 'OUT', 'ADJUST']).withMessage('type must be IN, OUT or ADJUST'),
  ],
  validate,
  listMovements
);

router.post('/in', [productRule, quantityRule, reasonRule], validate, stockIn);
router.post('/out', [productRule, quantityRule, reasonRule], validate, stockOut);
// Adjusting (setting the count) is limited to admin and manager
router.post(
  '/adjust',
  authorize('admin', 'manager'),
  [productRule, body('newQty').isInt({ min: 0 }).withMessage('New quantity must be a whole number, 0 or more').toInt(), reasonRule],
  validate,
  stockAdjust
);

export default router;
