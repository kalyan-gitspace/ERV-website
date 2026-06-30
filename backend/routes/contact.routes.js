import { Router } from 'express';
import { contactController } from '../controllers/contact.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Extra rate limit for contact submissions to prevent spam (max 5 per 15 mins per IP)
const contactSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many contact inquiries sent from this IP. Please try again in 15 minutes.' }
});

// Public contact submission
router.post('/', contactSubmissionLimiter, contactController.submit);

// Protected admin routes
router.get('/', protect, restrictTo('superadmin', 'editor'), contactController.getAll);
router.get('/:id', protect, restrictTo('superadmin', 'editor'), contactController.getById);
router.patch('/:id/read', protect, restrictTo('superadmin', 'editor'), contactController.markRead);
router.delete('/:id', protect, restrictTo('superadmin'), contactController.delete);

export default router;
