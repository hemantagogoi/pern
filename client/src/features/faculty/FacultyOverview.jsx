import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, downloadPaperPdf } from '../../lib/api.js';

export default function FacultyOverview() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/faculty/papers')
      .then(({ data }) => setPapers(data))
      .catch((error) => toast.error(error.response?.data?.message || 'Could not load previous papers'))
      .finally(() => setLoading(false));
  }, []);

  async function download(paper) {
    try {
      await downloadPaperPdf(paper);
    } catch (error) {
      toast.error(error.response?.data?.message || 'PDF download failed');
    }
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 md:p-6">
      <h1 className="truncate text-xl font-black sm:text-2xl">Previous Papers</h1>
      <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3">
        {loading && <p className="text-xs text-slate-500 sm:text-sm">Loading previous papers...</p>}
        {!loading && !papers.length && <p className="text-xs text-slate-500 sm:text-sm">No previous papers generated yet.</p>}
        {papers.map((paper) => (
          <div key={paper.id} className="flex min-w-0 flex-col gap-2 rounded-lg border p-2 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-3">
            <div className="min-w-0 break-words">
              <b className="line-clamp-2 text-sm sm:text-base">{paper.title}</b>
              <div className="text-xs text-slate-500 sm:text-sm">
                {paper.subject_name} {paper.subject_code ? `(${paper.subject_code})` : ''} • {paper.total_marks} marks
              </div>
            </div>
            <button type="button" onClick={() => download(paper)} className="shrink-0 w-full rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white sm:w-auto sm:px-4 sm:py-2 sm:text-sm">
              Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
