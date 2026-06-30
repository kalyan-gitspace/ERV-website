import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', productController.getAll);
router.get('/search', productController.search);
router.get('/:slug', productController.getBySlug);

// Admin-only protected routes
router.get('/id/:id', protect, restrictTo('superadmin', 'editor'), productController.getById);
router.post('/', protect, restrictTo('superadmin', 'editor'), productController.create);
router.put('/:id', protect, restrictTo('superadmin', 'editor'), productController.update);

// Delete product is restricted to Superadmin
router.delete('/:id', protect, restrictTo('superadmin'), productController.delete);

export default router;
