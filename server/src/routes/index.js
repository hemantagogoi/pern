import { Router } from 'express';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import catalogRoutes from './catalog.routes.js';
import facultyRoutes from './faculty.routes.js';
import questionRoutes from './question.routes.js';
import paperRoutes from './paper.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/faculty', facultyRoutes);
router.use('/questions', questionRoutes);
router.use('/papers', paperRoutes);
router.use('/', catalogRoutes);

export default router;
