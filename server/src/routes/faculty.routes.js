import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireApproved, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as faculty from '../controllers/faculty.controller.js';

const router = Router();
router.use(authenticate, requireApproved, requireRole('faculty'));

router.get('/subjects/available', faculty.availableSubjects);
router.get('/subjects/approved', faculty.approvedSubjects);
router.post('/subjects/apply', body('subject_ids').isArray({ min: 1 }), validate, faculty.applySubjects);
router.get('/subjects/applications', faculty.applications);
router.get('/papers', faculty.myPapers);

export default router;
