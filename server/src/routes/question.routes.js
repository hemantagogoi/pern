import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireApproved, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as questions from '../controllers/question.controller.js';

const router = Router();
router.use(authenticate, requireApproved, requireRole('admin', 'faculty'));

router.get('/', questions.listQuestions);
router.post('/', body('question_text').notEmpty(), body('marks').isInt({ min: 1 }), validate, questions.createQuestion);
router.put('/:id', questions.updateQuestion);
router.delete('/:id', questions.deleteQuestion);

export default router;
