import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// All notification routes are protected
router.use(protect);

router.get('/', notificationController.getAll);
router.patch('/:id/read', restrictTo('superadmin', 'editor'), notificationController.markRead);
router.post('/read-all', restrictTo('superadmin', 'editor'), notificationController.markAllRead);

export default router;
