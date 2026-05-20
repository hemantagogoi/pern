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
    <div className="rounded-lg border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-2xl font-black">Previous Papers</h1>
      <div className="mt-4 grid gap-3">
        {loading && <p className="text-sm text-slate-500">Loading previous papers...</p>}
        {!loading && !papers.length && <p className="text-sm text-slate-500">No previous papers generated yet.</p>}
        {papers.map((paper) => (
          <div key={paper.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 dark:border-slate-800">
            <div>
              <b>{paper.title}</b>
              <div className="text-sm text-slate-500">
                {paper.subject_name} {paper.subject_code ? `(${paper.subject_code})` : ''} • {paper.total_marks} marks
              </div>
            </div>
            <button type="button" onClick={() => download(paper)} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
              Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
