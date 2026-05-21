import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../lib/api.js';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      await api.post('/auth/register', form);
      setSuccessMessage('Registration successful. Your account is pending admin approval. You can login after the admin approves your account.');
      setForm({ name: '', email: '', password: '' });
      toast.success('Registration submitted for admin approval');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Registration failed');
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-gradient-to-br from-brand-50 via-white to-cyan-50 px-4 py-8 sm:p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-5 shadow-soft sm:p-8">
        <h1 className="text-2xl font-black">Faculty Registration</h1>
        <Link to="/" className="mt-4 block rounded-lg border border-slate-200 p-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Back to Landing Page
        </Link>
        {successMessage && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
            {errorMessage}
          </div>
        )}
        <input className="mt-6 w-full rounded-lg border p-3" placeholder="Full name" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="mt-3 w-full rounded-lg border p-3" placeholder="Email" type="email" value={form.email} required onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="mt-3 w-full rounded-lg border p-3" placeholder="Password - minimum 8 characters" type="password" value={form.password} required minLength={8} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={loading} className="mt-5 w-full rounded-lg bg-brand-700 p-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
          {loading ? 'Submitting...' : 'Submit registration'}
        </button>
        <Link className="mt-4 block text-sm" to="/login">Already registered?</Link>
      </form>
    </main>
  );
}
