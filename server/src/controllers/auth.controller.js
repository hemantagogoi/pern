import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerFaculty(req.body);
  res.status(201).json({ message: 'Registration submitted for approval', user });
});

export const login = asyncHandler(async (req, res) => {
  res.json(await authService.login(req.body));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordResetOtp(req.body);
  res.json({ message: 'If this email exists, an OTP has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPasswordWithOtp(req.body);
  res.json({ message: 'Password reset successful. You can login with your new password.' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
