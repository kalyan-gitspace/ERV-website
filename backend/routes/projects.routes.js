import { Router } from 'express';
import { projectsController } from '../controllers/projects.controller.js';
import { protectOptional } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', projectsController.getAll);
router.get('/:slug', projectsController.getBySlug);

router.post('/', protectOptional, projectsController.create);
router.put('/:id', protectOptional, projectsController.update);
router.delete('/:id', protectOptional, projectsController.delete);
router.patch('/:id/enable', protectOptional, projectsController.enable);
router.patch('/:id/disable', protectOptional, projectsController.disable);
router.patch('/:id/reorder', protectOptional, projectsController.reorder);

export default router;
