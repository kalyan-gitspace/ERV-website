import { Router } from 'express';
import { mediaController } from '../controllers/media.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// Centralized Media Manager is fully protected for all admin roles
router.use(protect);

router.post('/upload', upload.single('file'), mediaController.upload);
router.get('/', mediaController.getAll);
router.delete('/:id', restrictTo('superadmin'), mediaController.delete); // Only superadmin can delete media from CDN

export default router;
