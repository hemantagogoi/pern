import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

export default function AdminOverview() {
  const [stats, setStats] = useState({});
  useEffect(() => { api.get('/admin/analytics').then(({ data }) => setStats(data)); }, []);
  return (
    <div className="grid gap-4 md:grid-cols-5">
      {Object.entries({ pending_users: 'Pending Users', pending_subject_applications: 'Subject Requests', subjects: 'Subjects', questions: 'Questions', papers: 'Generated Papers' }).map(([key, label]) => (
        <div key={key} className="rounded-lg border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black">{stats[key] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}
