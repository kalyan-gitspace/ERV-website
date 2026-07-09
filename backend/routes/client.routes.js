import { Router } from 'express';
import { clientController } from '../controllers/client.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

router.get('/', clientController.getAll);
router.post('/', protect, restrictTo('superadmin', 'editor'), upload.single('logo'), clientController.create);
router.put('/:id', protect, restrictTo('superadmin', 'editor'), upload.single('logo'), clientController.update);
router.patch('/:id/swap', protect, restrictTo('superadmin', 'editor'), clientController.swapOrder);
router.delete('/:id', protect, restrictTo('superadmin', 'editor'), clientController.delete);

export default router;
