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
    <div className="rounded-lg border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-2xl font-black">Subject Access</h1>
      <div className="mt-4 grid gap-3">
        {loading && <p className="text-sm text-slate-500">Loading subjects...</p>}
        {subjects.map((subject) => (
          <label key={subject.id} className={`flex items-center justify-between gap-4 rounded-lg border p-4 dark:border-slate-800 ${!canApply(subject) ? 'opacity-70' : ''}`}>
            <span>
              <b>{subject.name}</b>
              <div className="text-sm text-slate-500">{subject.program} • {subject.department}</div>
              <div className="mt-1 text-sm font-semibold text-brand-600 dark:text-brand-400">{statusText(subject.application_status)}</div>
            </span>
            <input
              type="checkbox"
              disabled={!canApply(subject)}
              checked={selected.includes(subject.id)}
              onChange={(e) => setSelected(e.target.checked ? [...selected, subject.id] : selected.filter((id) => id !== subject.id))}
            />
          </label>
        ))}
      </div>
      <button disabled={!selected.length} onClick={apply} className="mt-5 rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Apply selected</button>
    </div>
  );
}
