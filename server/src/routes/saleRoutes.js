import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { listSales, getSale, createSale } from '../controllers/saleController.js';

const router = Router();
router.use(protect); // all roles can sell and view sales

const day = (name) => query(name).optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(`${name} must look like 2026-11-01`);

router.get(
  '/',
  [day('from'), day('to'), query('paymentMethod').optional().isIn(['cash', 'card', 'upi']).withMessage('Payment method must be cash, card or upi')],
  validate,
  listSales
);
router.get('/:id', [param('id').isMongoId().withMessage('Invalid sale id')], validate, getSale);

router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('Add at least one item'),
    body('items.*.product').isMongoId().withMessage('Choose a valid product for every item'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a whole number, 1 or more').toInt(),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Discount cannot be negative').toFloat(),
    body('customerName').optional().trim(),
    body('paymentMethod').optional().isIn(['cash', 'card', 'upi']).withMessage('Payment method must be cash, card or upi'),
  ],
  validate,
  createSale
);

export default router;
