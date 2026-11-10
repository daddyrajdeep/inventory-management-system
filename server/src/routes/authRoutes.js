import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { login, me, updateProfile, changePassword } from '../controllers/authController.js';

const router = Router();

// Slows down password guessing: 20 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

const emailRule = body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email');
const nameRule = body('name').trim().notEmpty().withMessage('Name is required');

router.post(
  '/login',
  loginLimiter,
  [emailRule, body('password').notEmpty().withMessage('Password is required')],
  validate,
  login
);
router.get('/me', protect, me);
router.put('/profile', protect, [nameRule, emailRule], validate, updateProfile);
router.put(
  '/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

export default router;
