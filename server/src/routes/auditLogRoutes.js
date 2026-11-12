import { Router } from 'express';
import { query } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { listAuditLogs } from '../controllers/auditLogController.js';

const router = Router();
router.use(protect, authorize('admin'));

router.get('/', [query('entityId').optional().isMongoId().withMessage('Invalid entity id')], validate, listAuditLogs);

export default router;
