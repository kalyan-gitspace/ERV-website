import { Router } from 'express';
import { mediaController } from '../controllers/media.controller.js';
import { protectOptional, restrictTo } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

router.post('/upload', protectOptional, upload.single('file'), mediaController.upload);
router.get('/', mediaController.getAll);
router.delete('/:id', protectOptional, restrictTo('superadmin'), mediaController.delete); // Only superadmin can delete media from CDN

export default router;
