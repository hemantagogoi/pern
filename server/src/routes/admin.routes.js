import { Router } from 'express';
import { authenticate, requireApproved, requireRole } from '../middleware/auth.middleware.js';
import * as admin from '../controllers/admin.controller.js';

const router = Router();
router.use(authenticate, requireApproved, requireRole('admin'));

router.get('/analytics', admin.analytics);
router.get('/users', admin.listUsers);
router.patch('/users/:id/status', admin.updateUserStatus);
router.delete('/users/:id', admin.deleteUser);
router.get('/subject-applications', admin.listSubjectApplications);
router.patch('/subject-applications/:id', admin.reviewSubjectApplication);

export default router;
