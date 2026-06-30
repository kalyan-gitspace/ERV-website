import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Public auth endpoints
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected auth endpoints
router.get('/profile', protect, authController.getProfile);
router.post('/change-password', protect, authController.changePassword);

export default router;
