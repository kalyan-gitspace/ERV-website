import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// Public route to log traffic (triggered by frontend page loads)
router.post('/page-view', dashboardController.logPageView);

// Protected dashboard routes
router.get('/stats', protect, restrictTo('superadmin', 'editor'), dashboardController.getStats);
router.get('/activities', protect, restrictTo('superadmin', 'editor'), dashboardController.getActivities);
router.get('/analytics', protect, restrictTo('superadmin', 'editor'), dashboardController.getAnalytics);

export default router;
