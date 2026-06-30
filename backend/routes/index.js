import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import mediaRoutes from './media.routes.js';
import galleryRoutes from './gallery.routes.js';
import careerRoutes from './career.routes.js';
import settingsRoutes from './settings.routes.js';
import contactRoutes from './contact.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

// Mount all API version 1 sub-routers
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/media', mediaRoutes);
router.use('/gallery', galleryRoutes);
router.use('/careers', careerRoutes);
router.use('/settings', settingsRoutes);
router.use('/contacts', contactRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

export default router;
