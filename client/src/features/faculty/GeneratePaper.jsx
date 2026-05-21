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
    <div className="grid max-w-full gap-5 xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
      <form onSubmit={generate} className="no-print min-w-0 rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h1 className="text-2xl font-black leading-tight">Generate Paper</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a subject, select its units, then enter how many questions you need for each mark type.</p>

        <select className="mt-5 w-full rounded-lg border border-slate-200 p-3 dark:border-slate-700 dark:bg-slate-950" value={form.subject_id} onChange={(e) => selectSubject(e.target.value)} required>
          <option value="">Select approved subject</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
        </select>
        {selectedSubject && (
          <p className="mt-2 text-sm text-slate-500">
            Showing units and marks available in database for {selectedSubject.name} ({selectedSubject.code}).
          </p>
        )}

        <Input className="mt-3 w-full rounded-lg border border-slate-200 p-3 dark:border-slate-700 dark:bg-slate-950" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Input className="mt-3 w-full rounded-lg border border-slate-200 p-3 dark:border-slate-700 dark:bg-slate-950" type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} required />

        <div className="mt-5">
          <h2 className="font-bold">Subject Units</h2>
          <div className="mt-3 space-y-2">
            {!form.subject_id && <p className="text-sm text-slate-500">Select a subject to load units from the database.</p>}
            {options.units.map((unit) => (
              <label key={unit.id} className={`flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800 ${!unit.question_count ? 'opacity-60' : ''}`}>
                <span className="min-w-0">
                  <b>Unit {unit.unit_number}: {unit.title}</b>
                  <div className="text-slate-500">{unit.question_count ? `${unit.question_count} questions available` : 'No questions available'}</div>
                </span>
                <input className="shrink-0" type="checkbox" disabled={!unit.question_count} checked={form.unit_ids.includes(unit.id)} onChange={(event) => toggleUnit(unit.id, event.target.checked)} />
              </label>
            ))}
            {form.subject_id && !options.units.length && <p className="text-sm text-amber-600">No units are available for this subject.</p>}
          </div>
        </div>

        <div className="mt-5">
          <h2 className="font-bold">Question Type / Marks</h2>
          <div className="mt-3 space-y-2">
            {!form.subject_id && <p className="text-sm text-slate-500">Select a subject to load mark criteria from the database.</p>}
            {options.marks.map((item) => (
              <label key={item.marks} className="grid grid-cols-1 items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800 min-[420px]:grid-cols-[minmax(0,1fr)_110px]">
                <span className="min-w-0">
                  <b>{item.marks} mark question type</b>
                  <div className="text-slate-500">
                    {item.question_count} available in {form.unit_ids.length ? 'selected units' : 'this subject'}
                  </div>
                </span>
                <Input type="number" min="0" max={item.question_count} placeholder="Needed" value={getMarkCount(item.marks)} onChange={(event) => setMarkCount(item.marks, event.target.value)} />
              </label>
            ))}
            {form.subject_id && !options.marks.length && <p className="text-sm text-amber-600">No question type found in database for this subject.</p>}
          </div>
        </div>

        <textarea
          className="mt-5 min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
        />

        <div className="mt-5 rounded-lg bg-slate-100 p-4 text-sm dark:bg-slate-800">
          Question pattern: <b>{selectedPattern || 'Select question type counts'}</b>
          <div className="mt-1">Total marks: <b>{totalMarks}</b></div>
        </div>

        <button className="mt-5 w-full rounded-lg bg-brand-700 p-3 font-semibold text-white dark:bg-brand-500">Generate Question Paper</button>
      </form>

      <section className="paper-print-area min-w-0 rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {!paper ? <p className="text-slate-500">Generated paper preview will appear here.</p> : (
          <>
            <div className="text-center">
              <h2 className="text-xl font-black">North Lakhimpur University</h2>
              <p>{paper.title}</p>
              <p className="mt-1 text-sm">Subject: {paper.subject_name}{paper.subject_code ? ` (${paper.subject_code})` : ''}</p>
              <p className="mt-2 text-sm">Total Marks: {paper.total_marks} | Duration: {paper.duration_minutes} minutes</p>
            </div>
            {paper.instructions && <p className="mt-6 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">{paper.instructions}</p>}
            <ol className="mt-8 list-decimal space-y-4 pl-5">
              {paper.questions.map((question) => (
                <li key={question.id}>
                  {question.question_text}
                  <div className="mt-1 text-sm text-slate-500">Unit {question.unit_number} | {question.marks} marks</div>
                </li>
              ))}
            </ol>
            <div className="no-print mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => downloadPaperPdf(paper)} className="rounded-lg bg-brand-700 px-4 py-2 text-white">Download PDF</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
