import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { listUsers, createUser, updateUserRole, setUserActive } from '../controllers/userController.js';
import { passwordRule } from '../utils/passwordRule.js';

const router = Router();

// Everything below this line is admin only
router.use(protect, authorize('admin'));

const roles = ['admin', 'manager', 'staff'];
const idRule = param('id').isMongoId().withMessage('Invalid user id');

router.get('/', listUsers);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email'),
    passwordRule('password', 'Password'),
    body('role').optional().isIn(roles).withMessage('Role must be admin, manager or staff'),
  ],
  validate,
  createUser
);

router.patch(
  '/:id/role',
  [idRule, body('role').isIn(roles).withMessage('Role must be admin, manager or staff')],
  validate,
  updateUserRole
);

router.patch(
  '/:id/active',
  [idRule, body('isActive').isBoolean().withMessage('isActive must be true or false').toBoolean()],
  validate,
  setUserActive
);

export default router;
