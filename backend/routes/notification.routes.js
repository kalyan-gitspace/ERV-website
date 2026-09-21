import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { protectAny, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// All notification routes are protected
router.use(protectAny);

router.get('/', notificationController.getAll);
router.get('/leave-requests/pending-count', restrictTo('superadmin', 'editor'), notificationController.pendingLeaveCount);
router.post('/leave-requests/mark-read', restrictTo('superadmin', 'editor'), notificationController.markLeaveRequestsRead);
router.patch('/:id/read', (req, res, next) => req.admin ? restrictTo('superadmin', 'editor')(req, res, next) : next(), notificationController.markRead);
router.post('/read-all', (req, res, next) => req.admin ? restrictTo('superadmin', 'editor')(req, res, next) : next(), notificationController.markAllRead);

export default router;
