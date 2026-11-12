import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import productRoutes from './productRoutes.js';
import stockRoutes from './stockRoutes.js';
import purchaseOrderRoutes from './purchaseOrderRoutes.js';
import saleRoutes from './saleRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import reportRoutes from './reportRoutes.js';
import alertRoutes from './alertRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/products', productRoutes);
router.use('/stock', stockRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/sales', saleRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reports', reportRoutes);
router.use('/alerts', alertRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;
