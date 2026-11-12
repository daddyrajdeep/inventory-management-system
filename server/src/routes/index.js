import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import alertRoutes from './alertRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/alerts', alertRoutes);
// Next modules plug in here, one line each:
// router.use('/products', productRoutes);
// router.use('/stock', stockRoutes);

export default router;
