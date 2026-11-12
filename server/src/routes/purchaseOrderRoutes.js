import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  listOrders,
  getOrder,
  createOrder,
  updateStatus,
  cancelOrder,
  receiveOrder,
} from '../controllers/purchaseOrderController.js';

const router = Router();
router.use(protect, authorize('admin', 'manager')); // purchase orders are admin / manager only

const idRule = param('id').isMongoId().withMessage('Invalid purchase order id');

router.get('/', [query('status').optional().isIn(['draft', 'ordered', 'received', 'cancelled'])], validate, listOrders);
router.get('/:id', [idRule], validate, getOrder);

router.post(
  '/',
  [
    body('supplier').isMongoId().withMessage('Please choose a supplier'),
    body('items').isArray({ min: 1 }).withMessage('Add at least one item'),
    body('items.*.product').isMongoId().withMessage('Choose a valid product for every item'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a whole number, 1 or more').toInt(),
    body('items.*.unitCost').isFloat({ min: 0 }).withMessage('Unit cost cannot be negative').toFloat(),
    body('expectedDate').optional({ values: 'falsy' }).isISO8601().withMessage('Expected date is not a valid date'),
    body('status').optional().isIn(['draft', 'ordered']).withMessage('A new order can be draft or ordered'),
  ],
  validate,
  createOrder
);

router.patch(
  '/:id/status',
  [idRule, body('status').isIn(['ordered', 'cancelled']).withMessage('status must be ordered or cancelled')],
  validate,
  updateStatus
);
router.patch('/:id/cancel', [idRule], validate, cancelOrder);

// Both verbs work, so either the API doc (PATCH) or the frontend service comments (POST) can be followed
router.patch('/:id/receive', [idRule], validate, receiveOrder);
router.post('/:id/receive', [idRule], validate, receiveOrder);

export default router;
