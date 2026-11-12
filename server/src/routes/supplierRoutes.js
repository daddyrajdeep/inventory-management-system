import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';

const router = Router();
router.use(protect);

const idRule = param('id').isMongoId().withMessage('Invalid supplier id');
const rules = (required) => [
  required
    ? body('name').trim().notEmpty().withMessage('Supplier name is required')
    : body('name').optional().trim().notEmpty().withMessage('Supplier name cannot be empty'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Enter a valid email'),
  body('phone').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
];

router.get('/', listSuppliers);
router.get('/:id', [idRule], validate, getSupplier);
router.post('/', authorize('admin', 'manager'), rules(true), validate, createSupplier);
router.put('/:id', authorize('admin', 'manager'), [idRule, ...rules(false)], validate, updateSupplier);
router.delete('/:id', authorize('admin', 'manager'), [idRule], validate, deleteSupplier);

export default router;
