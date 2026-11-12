import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';

const router = Router();
router.use(protect);

const idRule = param('id').isMongoId().withMessage('Invalid product id');

// required = true for create (name, sku, price must be sent), false for update (send only what changes)
const rules = (required) => {
  const need = (chain, msg) => (required ? chain.notEmpty().withMessage(msg) : chain.optional().notEmpty().withMessage(msg));
  return [
    need(body('name').trim(), 'Product name is required'),
    need(body('sku').trim(), 'SKU is required'),
    required
      ? body('price').isFloat({ min: 0 }).withMessage('Price must be a number, 0 or more').toFloat()
      : body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a number, 0 or more').toFloat(),
    body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be a number, 0 or more').toFloat(),
    body('reorderLevel').optional().isInt({ min: 0 }).withMessage('Reorder level must be a whole number, 0 or more').toInt(),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5').toFloat(),
    body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
    body('category').optional({ values: 'falsy' }).isString().withMessage('Category must be an id or a name').trim(),
    body('supplier').optional({ values: 'falsy' }).isString().withMessage('Supplier must be an id or a name').trim(),
  ];
};

router.get(
  '/',
  [query('status').optional().isIn(['low', 'out', 'ok']).withMessage('status must be low, out or ok')],
  validate,
  listProducts
);
router.get('/:id', [idRule], validate, getProduct);
router.post('/', authorize('admin', 'manager'), rules(true), validate, createProduct);
router.put('/:id', authorize('admin', 'manager'), [idRule, ...rules(false)], validate, updateProduct);
router.delete('/:id', authorize('admin'), [idRule], validate, deleteProduct);

export default router;
