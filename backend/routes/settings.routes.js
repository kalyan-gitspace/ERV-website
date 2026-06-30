import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', settingsController.getSettings);
router.get('/company-info', settingsController.getCompanyInfo);

// Protected admin routes
router.put('/:key', protect, restrictTo('superadmin', 'editor'), settingsController.updateSetting);
router.put('/company-info/:key', protect, restrictTo('superadmin', 'editor'), settingsController.updateCompanyInfo);

export default router;
