import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

export default function AdminOverview() {
  const [stats, setStats] = useState({});
  useEffect(() => { api.get('/admin/analytics').then(({ data }) => setStats(data)); }, []);
  return (
    <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
      {Object.entries({ pending_users: 'Pending Users', pending_subject_applications: 'Subject Requests', subjects: 'Subjects', questions: 'Questions', papers: 'Generated Papers' }).map(([key, label]) => (
        <div key={key} className="min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <p className="truncate text-xs text-slate-500 sm:text-sm">{label}</p>
          <p className="mt-2 truncate text-2xl font-black sm:mt-3 sm:text-3xl">{stats[key] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}
