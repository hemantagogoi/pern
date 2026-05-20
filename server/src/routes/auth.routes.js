import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as auth from '../controllers/auth.controller.js';

const router = Router();

router.post(
  '/register',
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('Enter a valid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
  auth.register
);
router.post('/login', body('email').isEmail().withMessage('Enter a valid email address'), body('password').notEmpty().withMessage('Password is required'), validate, auth.login);
router.post('/forgot-password', body('email').isEmail().withMessage('Enter a valid email address'), validate, auth.forgotPassword);
router.post(
  '/reset-password',
  body('email').isEmail().withMessage('Enter a valid email address'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Enter the 6 digit OTP'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
  auth.resetPassword
);
router.get('/me', authenticate, auth.me);

export default router;
