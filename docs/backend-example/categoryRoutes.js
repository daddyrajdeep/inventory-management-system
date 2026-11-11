// EXAMPLE routes. Copy to server/src/routes/ and rename for your own module.
// A route file connects a URL + method to a controller, and lists who may use it and what input is valid.
import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';

const router = Router();

router.use(protect); // every route below needs a logged-in user

const idRule = param('id').isMongoId().withMessage('Invalid category id');
const nameRule = body('name').trim().notEmpty().withMessage('Category name is required');

router.get('/', listCategories); // any logged-in role can read
router.post('/', authorize('admin', 'manager'), [nameRule], validate, createCategory);
router.put('/:id', authorize('admin', 'manager'), [idRule, nameRule], validate, updateCategory);
router.delete('/:id', authorize('admin', 'manager'), [idRule], validate, deleteCategory);

export default router;
