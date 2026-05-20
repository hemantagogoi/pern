import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireApproved, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as papers from '../controllers/paper.controller.js';

const router = Router();
router.use(authenticate, requireApproved, requireRole('faculty'));

router.get('/options/:subjectId', papers.options);
router.post(
  '/generate',
  body('subject_id').isInt(),
  body('total_marks').isInt({ min: 1 }),
  body('unit_ids').isArray({ min: 1 }),
  body('mark_rules').isArray({ min: 1 }),
  validate,
  papers.generate
);
router.get('/:id', papers.getPaper);
router.get('/:id/pdf', papers.downloadPdf);

export default router;
