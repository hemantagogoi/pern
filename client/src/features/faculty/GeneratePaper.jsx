import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api, downloadPaperPdf } from '../../lib/api.js';

function Input(props) {
  return <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" {...props} />;
}

export default function GeneratePaper() {
  const [subjects, setSubjects] = useState([]);
  const [options, setOptions] = useState({ units: [], marks: [] });
  const [paper, setPaper] = useState(null);
  const [form, setForm] = useState({
    subject_id: '',
    title: 'Question Paper',
    duration_minutes: 180,
    instructions: 'Answer all questions.',
    unit_ids: [],
    mark_rules: []
  });

  useEffect(() => {
    api.get('/faculty/subjects/approved').then(({ data }) => setSubjects(data));
  }, []);

  const totalMarks = useMemo(() => {
    return form.mark_rules.reduce((sum, rule) => sum + Number(rule.marks || 0) * Number(rule.count || 0), 0);
  }, [form.mark_rules]);

  const selectedPattern = useMemo(() => {
    return form.mark_rules
      .filter((rule) => Number(rule.count) > 0)
      .map((rule) => `${rule.marks} x ${rule.count}`)
      .join(', ');
  }, [form.mark_rules]);

  const selectedSubject = useMemo(() => {
    return subjects.find((subject) => Number(subject.id) === Number(form.subject_id));
  }, [subjects, form.subject_id]);

  async function loadOptions(subjectId, unitIds = []) {
    const { data } = await api.get(`/papers/options/${subjectId}`, {
      params: unitIds.length ? { unit_ids: unitIds.join(',') } : {}
    });
    setOptions(data);
  }

  async function selectSubject(subjectId) {
    setPaper(null);
    setForm({ ...form, subject_id: subjectId, unit_ids: [], mark_rules: [] });
    if (!subjectId) {
      setOptions({ units: [], marks: [] });
      return;
    }
    await loadOptions(subjectId);
  }

  async function toggleUnit(unitId, checked) {
    const nextUnitIds = checked ? [...form.unit_ids, unitId] : form.unit_ids.filter((id) => id !== unitId);
    setForm({
      ...form,
      unit_ids: nextUnitIds,
      mark_rules: []
    });
    await loadOptions(form.subject_id, nextUnitIds);
  }

  function setMarkCount(marks, count) {
    const available = options.marks.find((item) => Number(item.marks) === Number(marks))?.question_count || 0;
    const cleanCount = Math.min(Number(count), available);
    const nextRules = form.mark_rules.filter((rule) => Number(rule.marks) !== Number(marks));
    if (cleanCount > 0) nextRules.push({ marks: Number(marks), count: cleanCount });
    nextRules.sort((a, b) => Number(a.marks) - Number(b.marks));
    setForm({ ...form, mark_rules: nextRules });
  }

  function getMarkCount(marks) {
    return form.mark_rules.find((rule) => Number(rule.marks) === Number(marks))?.count || '';
  }

  async function generate(event) {
    event.preventDefault();
    if (!form.unit_ids.length) {
      toast.error('Select at least one unit with available questions');
      return;
    }
    if (!form.mark_rules.length) {
      toast.error('Enter question count for at least one marks type');
      return;
    }
    const unavailableRule = form.mark_rules.find((rule) => {
      const available = options.marks.find((item) => Number(item.marks) === Number(rule.marks))?.question_count || 0;
      return Number(rule.count) > available;
    });
    if (unavailableRule) {
      toast.error(`Not enough ${unavailableRule.marks} mark questions are available`);
      return;
    }

    try {
      const { data } = await api.post('/papers/generate', {
        ...form,
        subject_id: Number(form.subject_id),
        total_marks: totalMarks,
        duration_minutes: Number(form.duration_minutes)
      });
      setPaper(data);
      toast.success('Paper generated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Generation failed');
    }
  }

  return (
    <div className="grid max-w-full gap-3 sm:gap-4 md:gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <form onSubmit={generate} className="no-print min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 md:p-6">
        <h1 className="truncate text-lg font-black leading-tight sm:text-2xl">Generate Paper</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">Choose a subject, select its units, then enter how many questions you need for each mark type.</p>

        <select className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" value={form.subject_id} onChange={(e) => selectSubject(e.target.value)} required>
          <option value="">Select approved subject</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
        </select>
        {selectedSubject && (
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            Showing units and marks available in database for {selectedSubject.name} ({selectedSubject.code}).
          </p>
        )}

        <input className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} required />

        <div className="mt-4 sm:mt-5">
          <h2 className="text-sm font-bold sm:text-base">Subject Units</h2>
          <div className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
            {!form.subject_id && <p className="text-xs text-slate-500 sm:text-sm">Select a subject to load units from the database.</p>}
            {options.units.map((unit) => (
              <label key={unit.id} className={`flex min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-800 sm:gap-3 sm:p-3 sm:text-sm ${!unit.question_count ? 'opacity-60' : ''}`}>
                <span className="min-w-0">
                  <b className="line-clamp-1">Unit {unit.unit_number}: {unit.title}</b>
                  <div className="text-slate-500">{unit.question_count ? `${unit.question_count} questions available` : 'No questions available'}</div>
                </span>
                <input className="shrink-0" type="checkbox" disabled={!unit.question_count} checked={form.unit_ids.includes(unit.id)} onChange={(event) => toggleUnit(unit.id, event.target.checked)} />
              </label>
            ))}
            {form.subject_id && !options.units.length && <p className="text-xs text-amber-600 sm:text-sm">No units are available for this subject.</p>}
          </div>
        </div>

        <div className="mt-4 sm:mt-5">
          <h2 className="text-sm font-bold sm:text-base">Question Type / Marks</h2>
          <div className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
            {!form.subject_id && <p className="text-xs text-slate-500 sm:text-sm">Select a subject to load mark criteria from the database.</p>}
            {options.marks.map((item) => (
              <label key={item.marks} className="grid min-w-0 items-center gap-2 rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-800 grid-cols-1 sm:gap-3 sm:p-3 sm:text-sm min-[420px]:grid-cols-[minmax(0,1fr)_80px] sm:grid-cols-[minmax(0,1fr)_110px]">
                <span className="min-w-0">
                  <b className="line-clamp-1">{item.marks} mark question type</b>
                  <div className="text-slate-500">
                    {item.question_count} available in {form.unit_ids.length ? 'selected units' : 'this subject'}
                  </div>
                </span>
                <input className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" type="number" min="0" max={item.question_count} placeholder="Needed" value={getMarkCount(item.marks)} onChange={(event) => setMarkCount(item.marks, event.target.value)} />
              </label>
            ))}
            {form.subject_id && !options.marks.length && <p className="text-xs text-amber-600 sm:text-sm">No question type found in database for this subject.</p>}
          </div>
        </div>

        <textarea
          className="mt-4 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 sm:mt-5 sm:min-h-24"
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
        />

        <div className="mt-4 rounded-lg bg-slate-100 p-2 text-xs dark:bg-slate-800 sm:mt-5 sm:p-3 sm:text-sm">
          Question pattern: <b className="line-clamp-2">{selectedPattern || 'Select question type counts'}</b>
          <div className="mt-1">Total marks: <b>{totalMarks}</b></div>
        </div>

        <button className="mt-4 w-full rounded-lg bg-brand-700 px-3 py-2 font-semibold text-white dark:bg-brand-500 sm:mt-5 sm:py-3">Generate Question Paper</button>
      </form>

      <section className="paper-print-area min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 md:p-8">
        {!paper ? <p className="text-xs text-slate-500 sm:text-sm">Generated paper preview will appear here.</p> : (
          <>
            <div className="text-center">
              <h2 className="truncate text-lg font-black sm:text-xl">North Lakhimpur University</h2>
              <p className="line-clamp-2 text-sm">{paper.title}</p>
              <p className="mt-1 truncate text-xs text-slate-500 sm:text-sm">Subject: {paper.subject_name}{paper.subject_code ? ` (${paper.subject_code})` : ''}</p>
              <p className="mt-1 truncate text-xs text-slate-500 sm:mt-2 sm:text-sm">Total Marks: {paper.total_marks} | Duration: {paper.duration_minutes} minutes</p>
            </div>
            {paper.instructions && <p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:mt-4 sm:p-3 sm:text-sm">{paper.instructions}</p>}
            <ol className="mt-4 list-decimal space-y-2 pl-4 text-xs sm:mt-6 sm:space-y-3 sm:pl-5 sm:text-sm">
              {paper.questions.map((question) => (
                <li key={question.id} className="break-words">
                  {question.question_text}
                  <div className="mt-0.5 text-xs text-slate-500 sm:mt-1">{question.marks} marks</div>
                </li>
              ))}
            </ol>
            <div className="no-print mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-3">
              <button type="button" onClick={() => downloadPaperPdf(paper)} className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm">Download PDF</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
