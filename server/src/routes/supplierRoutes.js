// EXAMPLE routes. Copy to server/src/routes/ and rename for your own module.
// A route file connects a URL + method to a controller, and lists who may use it and what input is valid.
import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';

const router = Router();

router.use(protect); // every route below needs a logged-in user

const idRule = param('id').isMongoId().withMessage('Invalid supplier id');
const nameRule = body('name').trim().notEmpty().withMessage('Supplier name is required');
const emailRule = body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email');
router.get('/', listSuppliers); // any logged-in role can read
router.post('/', authorize('admin', 'manager'), [nameRule, emailRule], validate, createSupplier);
router.put('/:id', authorize('admin', 'manager'), [idRule, nameRule, emailRule], validate, updateSupplier);
router.delete('/:id', authorize('admin', 'manager'), [idRule], validate, deleteSupplier);

export default router;
