import { Router } from 'express';
import { careerController } from '../controllers/career.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', careerController.getAll);
router.get('/search', careerController.search);
router.get('/:id', careerController.getById);

// Admin-only protected routes
router.post('/', protect, restrictTo('superadmin', 'editor'), careerController.create);
router.put('/:id', protect, restrictTo('superadmin', 'editor'), careerController.update);
router.patch('/:id/close', protect, restrictTo('superadmin', 'editor'), careerController.close);
router.patch('/:id/reopen', protect, restrictTo('superadmin', 'editor'), careerController.reopen);
router.delete('/:id', protect, restrictTo('superadmin'), careerController.delete);

export default router;
