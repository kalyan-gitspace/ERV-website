import { Router } from 'express';
import { galleryController } from '../controllers/gallery.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// =========================================================================
// PUBLIC GALLERY ROUTES
// =========================================================================
router.get('/categories', galleryController.getAllCategories);
router.get('/', galleryController.getItems);
router.get('/search', galleryController.search);
router.get('/:id', galleryController.getItemById);

// =========================================================================
// PROTECTED ADMIN ROUTES
// =========================================================================

// Categories CRUD
router.post('/categories', protect, restrictTo('superadmin', 'editor'), galleryController.createCategory);
router.put('/categories/:id', protect, restrictTo('superadmin', 'editor'), galleryController.updateCategory);
router.delete('/categories/:id', protect, restrictTo('superadmin'), galleryController.deleteCategory);

// Gallery Items CRUD
router.post('/', protect, restrictTo('superadmin', 'editor'), galleryController.createItem);
router.put('/:id', protect, restrictTo('superadmin', 'editor'), galleryController.updateItem);
router.post('/reorder', protect, restrictTo('superadmin', 'editor'), galleryController.reorderItems);
router.delete('/:id', protect, restrictTo('superadmin'), galleryController.deleteItem);

export default router;
