import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError('Authentication required', 401);

    const payload = jwt.verify(token, env.jwtSecret);
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.status, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
      [payload.sub]
    );
    if (!rows[0]) throw new AppError('User not found', 401);
    req.user = rows[0];
    next();
  } catch (error) {
    next(error.statusCode ? error : new AppError('Invalid or expired token', 401));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return next(new AppError('Forbidden', 403));
    next();
  };
}

export function requireApproved(req, res, next) {
  if (req.user?.status !== 'approved') return next(new AppError('Account approval is pending', 403));
  next();
}
