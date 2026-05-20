import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

function createTransporter() {
  if (!env.smtp.user || !env.smtp.pass) {
    throw new AppError('SMTP is not configured. Set SMTP_USER and SMTP_PASS in server .env', 500);
  }

  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass
    }
  });
}

export async function sendPasswordResetOtp(email, otp) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: env.smtp.from,
    to: email,
    subject: 'Password reset OTP',
    text: `Your password reset OTP is ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Password reset OTP</h2>
        <p>Your OTP is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `
  });
}
