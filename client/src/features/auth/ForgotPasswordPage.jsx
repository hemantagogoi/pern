import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function requestOtp(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setOtpSent(true);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { email, otp, password });
      toast.success(data.message);
      setOtp('');
      setPassword('');
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const message = validationErrors?.length
        ? validationErrors.map((item) => item.msg).join(', ')
        : error.response?.data?.message || 'Password reset failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <form onSubmit={otpSent ? resetPassword : requestOtp} className="w-full max-w-md rounded-xl bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-black">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-500">
          {otpSent ? 'Enter the OTP sent to your Gmail and choose a new password.' : 'Enter your account email to receive a 6 digit OTP.'}
        </p>
        <input className="mt-6 w-full rounded-lg border p-3" placeholder="Email" type="email" value={email} required disabled={otpSent} onChange={(e) => setEmail(e.target.value)} />
        {otpSent && (
          <>
            <input className="mt-3 w-full rounded-lg border p-3" placeholder="6 digit OTP" value={otp} required maxLength={6} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            <input className="mt-3 w-full rounded-lg border p-3" placeholder="New password - minimum 8 characters" type="password" value={password} required minLength={8} onChange={(e) => setPassword(e.target.value)} />
          </>
        )}
        <button disabled={loading} className="mt-5 w-full rounded-lg bg-brand-700 p-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
          {loading ? 'Please wait...' : otpSent ? 'Reset password' : 'Send OTP'}
        </button>
        {otpSent && (
          <button type="button" disabled={loading} onClick={requestOtp} className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-sm font-semibold text-slate-700 disabled:opacity-70">
            Resend OTP
          </button>
        )}
        <Link className="mt-4 block text-sm" to="/login">Back to login</Link>
      </form>
    </main>
  );
}
