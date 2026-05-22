import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api.js';

const emptyUnit = { subject_id: '', unit_number: 1, title: '' };
const emptyQuestion = { subject_id: '', unit_id: '', question_text: '', marks: 5, difficulty: 'medium' };

function Input(props) {
  return <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" {...props} />;
}

function Select(props) {
  return <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" {...props} />;
}

export default function FacultyQuestionBank() {
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [unitForm, setUnitForm] = useState(emptyUnit);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);

  const selectedSubjectId = questionForm.subject_id || unitForm.subject_id;
  const subjectUnits = useMemo(() => units.filter((unit) => unit.subject_id === Number(selectedSubjectId)), [units, selectedSubjectId]);

  function refreshSubjects() {
    api.get('/faculty/subjects/approved').then(({ data }) => setSubjects(data));
  }

  function refreshUnits(subjectId = selectedSubjectId) {
    api.get('/units', { params: subjectId ? { subject_id: subjectId } : {} }).then(({ data }) => setUnits(data));
  }

  function refreshQuestions(subjectId = selectedSubjectId) {
    api.get('/questions', { params: subjectId ? { subject_id: subjectId } : {} }).then(({ data }) => setQuestions(data));
  }

  useEffect(() => {
    refreshSubjects();
    refreshUnits();
    refreshQuestions();
  }, []);

  function selectSubject(subjectId) {
    setUnitForm({ ...unitForm, subject_id: subjectId });
    setQuestionForm({ ...questionForm, subject_id: subjectId, unit_id: '' });
    refreshUnits(subjectId);
    refreshQuestions(subjectId);
  }

  async function addUnit(event) {
    event.preventDefault();
    try {
      await api.post('/units', {
        subject_id: Number(unitForm.subject_id),
        unit_number: Number(unitForm.unit_number),
        title: unitForm.title
      });
      toast.success('Unit added');
      setUnitForm({ subject_id: unitForm.subject_id, unit_number: Number(unitForm.unit_number) + 1, title: '' });
      refreshUnits(unitForm.subject_id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add unit');
    }
  }

  async function addQuestion(event) {
    event.preventDefault();
    try {
      await api.post('/questions', {
        subject_id: Number(questionForm.subject_id),
        unit_id: Number(questionForm.unit_id),
        question_text: questionForm.question_text,
        marks: Number(questionForm.marks),
        difficulty: questionForm.difficulty
      });
      toast.success('Question added');
      setQuestionForm({ ...questionForm, unit_id: '', question_text: '', marks: 5, difficulty: 'medium' });
      refreshQuestions(questionForm.subject_id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add question');
    }
  }

  async function deleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      toast.success('Question deleted');
      refreshQuestions(selectedSubjectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete question');
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg font-black sm:text-2xl">Question Bank</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">Add units and questions only for subjects approved by admin.</p>
      </div>

      <section className="min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 md:p-6">
        <h2 className="text-base font-black sm:text-lg">Select Approved Subject</h2>
        <select className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 sm:mt-4" value={selectedSubjectId || ''} onChange={(event) => selectSubject(event.target.value)}>
          <option value="">Choose subject</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
        </select>
        {!subjects.length && <p className="mt-2 text-xs text-amber-600 sm:mt-3 sm:text-sm">No approved subjects yet. Apply for subjects and wait for admin approval.</p>}
      </section>

      <section className="grid gap-3 sm:gap-4 md:gap-6 xl:grid-cols-2">
        <form onSubmit={addUnit} className="min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 md:p-6">
          <h2 className="text-base font-black sm:text-lg">Add Unit</h2>
          <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3">
            <input type="number" min="1" required placeholder="Unit number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" value={unitForm.unit_number} onChange={(event) => setUnitForm({ ...unitForm, unit_number: event.target.value })} />
            <input required placeholder="Unit title" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" value={unitForm.title} onChange={(event) => setUnitForm({ ...unitForm, title: event.target.value })} />
            <button disabled={!unitForm.subject_id} className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-500">Add Unit</button>
          </div>
        </form>

        <form onSubmit={addQuestion} className="min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 md:p-6">
          <h2 className="text-base font-black sm:text-lg">Add Question</h2>
          <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3">
            <select required className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" value={questionForm.unit_id} onChange={(event) => setQuestionForm({ ...questionForm, unit_id: event.target.value })}>
              <option value="">Choose unit</option>
              {subjectUnits.map((unit) => <option key={unit.id} value={unit.id}>Unit {unit.unit_number}: {unit.title}</option>)}
            </select>
            <div className="grid gap-2 grid-cols-1 sm:gap-3 sm:grid-cols-2">
              <input required type="number" min="1" placeholder="Marks" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" value={questionForm.marks} onChange={(event) => setQuestionForm({ ...questionForm, marks: event.target.value })} />
              <select required className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" value={questionForm.difficulty} onChange={(event) => setQuestionForm({ ...questionForm, difficulty: event.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <textarea
              required
              className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 sm:min-h-28"
              placeholder="Question text"
              value={questionForm.question_text}
              onChange={(event) => setQuestionForm({ ...questionForm, question_text: event.target.value })}
            />
            <button disabled={!questionForm.subject_id || !questionForm.unit_id} className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-500">Add Question</button>
          </div>
        </form>
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 md:p-6">
        <h2 className="text-base font-black sm:text-lg">Questions Added For Approved Subjects</h2>
        <div className="table-shell scrollbar-soft mt-3 sm:mt-4 -mx-3 px-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-2 font-semibold sm:py-3">Question</th><th className="py-2 font-semibold sm:py-3">Subject</th><th className="py-2 font-semibold sm:py-3">Unit</th><th className="py-2 font-semibold sm:py-3">Marks</th><th className="py-2 font-semibold sm:py-3">Difficulty</th><th className="py-2 text-right font-semibold sm:py-3">Action</th></tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id} className="border-t align-top dark:border-slate-800">
                  <td className="min-w-0 py-2 sm:py-3" data-label="Question"><span className="line-clamp-3">{question.question_text}</span></td>
                  <td className="min-w-0 py-2 sm:py-3" data-label="Subject"><span className="line-clamp-1">{question.subject}</span><div className="text-xs text-slate-500"><span className="line-clamp-1">{question.subject_code}</span></div></td>
                  <td className="min-w-0 py-2 sm:py-3" data-label="Unit"><span className="line-clamp-1">Unit {question.unit_number}</span><div className="text-xs text-slate-500"><span className="line-clamp-1">{question.unit_title}</span></div></td>
                  <td className="py-2 sm:py-3" data-label="Marks">{question.marks}</td>
                  <td className="py-2 capitalize sm:py-3" data-label="Difficulty"><span className="line-clamp-1">{question.difficulty}</span></td>
                  <td className="py-2 text-right sm:py-3" data-label="Action"><button className="rounded bg-rose-600 px-2 py-0.5 text-xs text-white sm:px-3 sm:py-1" onClick={() => deleteQuestion(question.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!questions.length && <p className="py-4 text-center text-xs text-slate-500 sm:py-6 sm:text-sm">No questions found for approved subjects.</p>}
        </div>
      </section>
    </div>
  );
}
