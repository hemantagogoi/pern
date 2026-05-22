import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api.js';

export default function FacultySubjects() {
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadSubjects() {
    const { data } = await api.get('/faculty/subjects/available');
    setSubjects(data);
    setLoading(false);
  }

  useEffect(() => { loadSubjects(); }, []);

  async function apply() {
    if (!selected.length) {
      toast.error('Select at least one subject');
      return;
    }
    try {
      await api.post('/faculty/subjects/apply', { subject_ids: selected });
      toast.success('Application submitted');
      setSelected([]);
      await loadSubjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Application failed');
    }
  }

  function statusText(status) {
    if (status === 'pending') return 'Pending application';
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected - apply again';
    return 'Not applied';
  }

  function canApply(subject) {
    return ['not_applied', 'rejected'].includes(subject.application_status);
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 md:p-6">
      <h1 className="truncate text-lg font-black sm:text-2xl">Subject Access</h1>
      <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3">
        {loading && <p className="text-xs text-slate-500 sm:text-sm">Loading subjects...</p>}
        {subjects.map((subject) => (
          <label key={subject.id} className={`flex min-w-0 flex-col gap-2 rounded-lg border p-2 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-3 ${!canApply(subject) ? 'opacity-70' : ''}`}>
            <span className="min-w-0 break-words">
              <b className="line-clamp-1 text-sm sm:text-base">{subject.name}</b>
              <div className="text-xs text-slate-500 sm:text-sm">{subject.program} • {subject.department}</div>
              <div className="mt-1 text-xs font-semibold text-brand-600 dark:text-brand-400 sm:text-sm">{statusText(subject.application_status)}</div>
            </span>
            <input
              className="shrink-0"
              type="checkbox"
              disabled={!canApply(subject)}
              checked={selected.includes(subject.id)}
              onChange={(e) => setSelected(e.target.checked ? [...selected, subject.id] : selected.filter((id) => id !== subject.id))}
            />
          </label>
        ))}
      </div>
      <button disabled={!selected.length} onClick={apply} className="mt-3 w-full rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:mt-4 sm:px-4 sm:py-3 md:w-auto">Apply selected</button>
    </div>
  );
}
