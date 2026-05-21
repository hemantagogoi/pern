import { ArrowRight, CheckCircle2, FileText, Lock, ShieldCheck, Shuffle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  ['Role-based approvals', Users],
  ['Secure JWT authentication', Lock],
  ['Random unit-wise papers', Shuffle],
  ['PDF export and print', FileText]
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 overflow-hidden px-4 py-4 sm:px-6">
        <Link to="/" className="min-w-0 shrink truncate text-base font-black text-brand-100 sm:text-xl">NLU QPG</Link>
        <div className="flex shrink-0 gap-1.5 sm:gap-3">
          <Link className="rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-white/10 min-[420px]:px-3 min-[420px]:text-sm sm:px-4" to="/login">Login</Link>
          <Link className="rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-teal-950 shadow-soft hover:bg-brand-50 min-[420px]:px-3 min-[420px]:text-sm sm:px-4" to="/register">Register</Link>
        </div>
      </nav>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-7 sm:px-6 sm:pb-16 sm:pt-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-xs font-bold uppercase text-brand-100">
            <ShieldCheck size={14} /> North Lakhimpur University
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">Automated Question Paper Generator</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">A secure academic platform for approvals, subject access control, question banks, and professional paper generation.</p>
          <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-teal-950 shadow-soft hover:bg-brand-50">Get started <ArrowRight size={18} /></Link>
            <a href="#features" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10">Explore features</a>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white text-slate-950 shadow-soft">
          <div className="bg-gradient-to-r from-teal-700 via-cyan-700 to-rose-700 p-4 text-white sm:p-5">
            <p className="text-sm font-semibold text-white/80">Live generation board</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <span className="rounded-lg bg-white/15 px-2 py-2">Units</span>
              <span className="rounded-lg bg-white/15 px-2 py-2">Marks</span>
              <span className="rounded-lg bg-white/15 px-2 py-2">PDF</span>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b pb-4">
              <span className="font-bold">Paper Blueprint</span>
              <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Ready</span>
            </div>
            {['Unit I - 2 x 5', 'Unit II - 2 x 10', 'Unit III - 1 x 15', 'Unit IV - 1 x 10'].map((item) => (
              <div key={item} className="mt-3 flex items-center gap-3 rounded-lg bg-slate-50 p-3 sm:p-4">
                <CheckCircle2 className="shrink-0 text-emerald-500" size={20} />
                <span className="min-w-0">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="features" className="bg-brand-50 py-12 text-slate-950 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-black sm:text-3xl">Built for academic control</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([label, Icon]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <Icon className="text-brand-500" />
                <h3 className="mt-4 font-bold">{label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-white py-12 text-slate-950 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">About the system</h2>
            <p className="mt-4 leading-7 text-slate-600">Admins manage academic structure, approvals, users, and question banks. Faculty generate papers only for approved subjects using rules that preserve unit coverage and mark totals.</p>
          </div>
          <div id="contact" className="rounded-lg border bg-white p-5 sm:p-6">
            <h2 className="text-2xl font-black">Contact</h2>
            <p className="mt-3 text-slate-600">Academic Examination Cell, North Lakhimpur University</p>
            <p className="mt-2 font-semibold text-brand-700">examcell@nlu.edu</p>
          </div>
        </div>
      </section>
    </div>
  );
}
