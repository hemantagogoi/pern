import { Link, Outlet } from 'react-router-dom';
import { BookOpenCheck, FileText, GraduationCap, LayoutDashboard, LogOut, Moon, Sun, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const ADMIN_USERS_SEEN_KEY = 'admin_users_seen_at';

export default function DashboardLayout({ type }) {
  const [dark, setDark] = useState(false);
  const [pendingUserItems, setPendingUserItems] = useState(0);
  const user = useSelector((state) => state.auth.user);
  const nav = type === 'admin'
    ? [['/admin', LayoutDashboard, 'Overview'], ['/admin/catalog', GraduationCap, 'Catalog'], ['/admin/questions', BookOpenCheck, 'Questions'], ['/admin/users', Users, 'Users']]
    : [['/faculty', LayoutDashboard, 'Overview'], ['/faculty/subjects', GraduationCap, 'Subjects'], ['/faculty/questions', BookOpenCheck, 'Question Bank'], ['/faculty/generate', FileText, 'Generate']];

  useEffect(() => {
    if (type !== 'admin') return;
    const seenAfter = localStorage.getItem(ADMIN_USERS_SEEN_KEY);
    api.get('/admin/analytics', {
      params: seenAfter ? { seen_after: seenAfter } : {}
    })
      .then(({ data }) => setPendingUserItems((data.new_pending_users || 0) + (data.new_pending_subject_applications || 0)))
      .catch(() => setPendingUserItems(0));
  }, [type]);

  function markUsersSeen(to) {
    if (to !== '/admin/users') return;
    localStorage.setItem(ADMIN_USERS_SEEN_KEY, new Date().toISOString());
    setPendingUserItems(0);
  }

  function toggleTheme() {
    setDark(!dark);
    document.documentElement.classList.toggle('dark');
  }

  function handleLogout() {
    localStorage.removeItem('token');
    window.location.replace('/');
  }

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 hidden w-72 border-r border-brand-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="text-xl font-bold text-brand-700 dark:text-brand-400">NLU QPG</div>
        <p className="mt-1 text-sm text-slate-500">{user?.name}</p>
        <nav className="mt-8 space-y-2">
          {nav.map(([to, Icon, label]) => (
            <Link key={to} to={to} onClick={() => markUsersSeen(to)} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-50 dark:hover:bg-slate-800">
              <span className="flex items-center gap-3"><Icon size={18} /> {label}</span>
              {to === '/admin/users' && pendingUserItems > 0 && (
                <span className="min-w-5 rounded-full bg-rose-600 px-1.5 py-0.5 text-center text-xs font-bold text-white">
                  {pendingUserItems}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-brand-100 bg-white/85 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <span className="font-semibold">{type === 'admin' ? 'Admin Dashboard' : 'Faculty Dashboard'}</span>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="rounded-lg border p-2 dark:border-slate-700" title="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={handleLogout} className="rounded-lg border p-2 dark:border-slate-700" title="Logout"><LogOut size={18} /></button>
          </div>
        </header>
        <section className="p-5">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
