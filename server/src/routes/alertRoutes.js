import { Router } from 'express';
import { param } from 'express-validator';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { listAlerts, unreadCount, markAllRead, markRead } from '../controllers/alertController.js';

const router = Router();

router.use(protect); // every logged-in role can see and read alerts

router.get('/', listAlerts);
router.get('/unread-count', unreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', [param('id').isMongoId().withMessage('Invalid alert id')], validate, markRead);

export default router;
