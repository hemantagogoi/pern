import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login } from './authSlice.js';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    try {
      const user = await dispatch(login(form)).unwrap();
      if (!user || !user.role) throw new Error('Login response did not include a valid user role.');
      navigate(user.role === 'admin' ? '/admin' : '/faculty');
    } catch (error) {
      const message = typeof error === 'string' ? error : error?.message || 'Login failed';
      toast.error(message);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-gradient-to-br from-brand-50 via-white to-cyan-50 px-4 py-8 sm:p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-5 shadow-soft sm:p-8">
        <h1 className="text-2xl font-black">Login</h1>
        <Link to="/" className="mt-4 block rounded-lg border border-slate-200 p-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Back to Landing Page
        </Link>
        <input
          className="mt-6 w-full rounded-lg border p-3"
          name="email"
          value={form.email}
          placeholder="Email"
          type="email"
          autoComplete="email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="mt-3 w-full rounded-lg border p-3"
          name="password"
          value={form.password}
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="mt-5 w-full rounded-lg bg-brand-700 p-3 font-semibold text-white">Sign in</button>
        <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/register">Create account</Link>
        </div>
      </form>
    </main>
  );
}
