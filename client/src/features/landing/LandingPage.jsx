import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, FileText, Lock, Shuffle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  ['Role-based approvals', Users],
  ['Secure JWT authentication', Lock],
  ['Random unit-wise papers', Shuffle],
  ['PDF export and print', FileText]
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-slate-900 to-indigo-950 text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="text-xl font-bold text-brand-100">NLU QPG</div>
        <div className="flex gap-3">
          <Link className="rounded-lg px-4 py-2 text-sm hover:bg-white/10" to="/login">Login</Link>
          <Link className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-teal-950 shadow-soft hover:bg-brand-50" to="/register">Register</Link>
        </div>
      </nav>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-400">North Lakhimpur University</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight md:text-7xl">Automated Question Paper Generator</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">A secure academic platform for faculty approvals, subject access control, question bank management, and professional paper generation.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-teal-950 shadow-soft hover:bg-brand-50">Get started <ArrowRight size={18} /></Link>
            <a href="#features" className="rounded-lg border border-white/20 px-5 py-3 font-semibold">Explore features</a>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-soft">
          <div className="rounded-xl bg-white p-5 text-slate-950">
            <div className="flex items-center justify-between border-b pb-4">
              <span className="font-bold">Paper Blueprint</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Ready</span>
            </div>
            {['Unit I - 2 x 5', 'Unit II - 2 x 10', 'Unit III - 1 x 15', 'Unit IV - 1 x 10'].map((item) => (
              <div key={item} className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                <CheckCircle2 className="text-emerald-500" size={20} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
      <section id="features" className="bg-brand-50 py-20 text-slate-950">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-black">Built for academic control</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([label, Icon]) => (
              <div key={label} className="rounded-lg border border-slate-200 p-5">
                <Icon className="text-brand-500" />
                <h3 className="mt-4 font-bold">{label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-white py-20 text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black">About the system</h2>
            <p className="mt-4 leading-7 text-slate-600">Admins manage academic structure, approvals, users, and question banks. Faculty generate papers only for approved subjects using rules that preserve unit coverage and mark totals.</p>
          </div>
          <div id="contact" className="rounded-lg border bg-white p-6">
            <h2 className="text-2xl font-black">Contact</h2>
            <p className="mt-3 text-slate-600">Academic Examination Cell, North Lakhimpur University</p>
            <p className="mt-2 font-semibold text-brand-700">examcell@nlu.edu</p>
          </div>
        </div>
      </section>
    </div>
  );
}
