// OWNER: Brijesh (Stock)
import { Router } from 'express';
import { body, query } from 'express-validator';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { stockIn, stockOut, stockAdjust, listMovements } from '../controllers/stockController.js';

const router = Router();

router.use(protect); // every logged-in role (admin, manager, staff) may use stock; each change records the user

const productRule = body('productId').isMongoId().withMessage('Choose a valid product');
const quantityRule = body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a whole number, 1 or more');
const newQuantityRule = body('newQuantity')
  .isInt({ min: 0 })
  .withMessage('New quantity must be a whole number, 0 or more');
const reasonOptional = body('reason')
  .optional({ values: 'falsy' })
  .isString()
  .trim()
  .isLength({ max: 200 })
  .withMessage('Reason must be 200 characters or fewer');
const reasonRequired = body('reason').trim().notEmpty().withMessage('A reason is required for an adjustment').isLength({ max: 200 }).withMessage('Reason must be 200 characters or fewer');

router.post('/in', [productRule, quantityRule, reasonOptional], validate, stockIn);
router.post('/out', [productRule, quantityRule, reasonOptional], validate, stockOut);
router.post('/adjust', [productRule, newQuantityRule, reasonRequired], validate, stockAdjust);

router.get(
  '/movements',
  [
    query('productId').optional().isMongoId().withMessage('Invalid product id'),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500'),
  ],
  validate,
  listMovements
);

export default router;
