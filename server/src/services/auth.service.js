import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { sendPasswordResetOtp } from '../utils/mailer.js';

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export async function registerFaculty({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await query(
    `INSERT INTO users (role_id, name, email, password_hash)
     VALUES ((SELECT id FROM roles WHERE name = 'faculty'), $1, LOWER($2), $3)
     RETURNING id, name, email, status`,
    [name, email, passwordHash]
  );
  return rows[0];
}

export async function login({ email, password }) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.status, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = LOWER($1)`,
    [email]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError('Invalid credentials', 401);
  }
  if (user.status !== 'approved') throw new AppError('Your account is awaiting admin approval', 403);
  const token = signToken(user);
  delete user.password_hash;
  return { token, user };
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function requestPasswordResetOtp({ email }) {
  const normalizedEmail = email.toLowerCase();
  const { rows } = await query('SELECT id, email FROM users WHERE email = LOWER($1)', [normalizedEmail]);
  const user = rows[0];

  if (!user) return;

  const otp = generateOtp();
  await query(
    `UPDATE users
     SET reset_token_hash = $1, reset_token_expires_at = NOW() + INTERVAL '10 minutes', updated_at = NOW()
     WHERE id = $2`,
    [hashOtp(otp), user.id]
  );

  await sendPasswordResetOtp(user.email, otp);
}

export async function resetPasswordWithOtp({ email, otp, password }) {
  const { rows } = await query(
    `SELECT id, reset_token_hash, reset_token_expires_at
     FROM users
     WHERE email = LOWER($1)`,
    [email]
  );
  const user = rows[0];
  if (!user || !user.reset_token_hash || !user.reset_token_expires_at) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  const isExpired = new Date(user.reset_token_expires_at).getTime() < Date.now();
  if (isExpired || user.reset_token_hash !== hashOtp(String(otp))) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await query(
    `UPDATE users
     SET password_hash = $1, reset_token_hash = NULL, reset_token_expires_at = NULL, updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, user.id]
  );
}
