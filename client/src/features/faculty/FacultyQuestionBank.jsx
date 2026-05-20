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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Question Bank</h1>
        <p className="mt-1 text-sm text-slate-500">Add units and questions only for subjects approved by admin.</p>
      </div>

      <section className="rounded-lg border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-black">Select Approved Subject</h2>
        <Select className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={selectedSubjectId || ''} onChange={(event) => selectSubject(event.target.value)}>
          <option value="">Choose subject</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
        </Select>
        {!subjects.length && <p className="mt-3 text-sm text-amber-600">No approved subjects yet. Apply for subjects and wait for admin approval.</p>}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={addUnit} className="rounded-lg border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black">Add Unit</h2>
          <div className="mt-4 grid gap-3">
            <Input type="number" min="1" required placeholder="Unit number" value={unitForm.unit_number} onChange={(event) => setUnitForm({ ...unitForm, unit_number: event.target.value })} />
            <Input required placeholder="Unit title" value={unitForm.title} onChange={(event) => setUnitForm({ ...unitForm, title: event.target.value })} />
            <button disabled={!unitForm.subject_id} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-500">Add Unit</button>
          </div>
        </form>

        <form onSubmit={addQuestion} className="rounded-lg border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black">Add Question</h2>
          <div className="mt-4 grid gap-3">
            <Select required value={questionForm.unit_id} onChange={(event) => setQuestionForm({ ...questionForm, unit_id: event.target.value })}>
              <option value="">Choose unit</option>
              {subjectUnits.map((unit) => <option key={unit.id} value={unit.id}>Unit {unit.unit_number}: {unit.title}</option>)}
            </Select>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input required type="number" min="1" placeholder="Marks" value={questionForm.marks} onChange={(event) => setQuestionForm({ ...questionForm, marks: event.target.value })} />
              <Select required value={questionForm.difficulty} onChange={(event) => setQuestionForm({ ...questionForm, difficulty: event.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
            </div>
            <textarea
              required
              className="min-h-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Question text"
              value={questionForm.question_text}
              onChange={(event) => setQuestionForm({ ...questionForm, question_text: event.target.value })}
            />
            <button disabled={!questionForm.subject_id || !questionForm.unit_id} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-500">Add Question</button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-black">Questions Added For Approved Subjects</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-3">Question</th><th>Subject</th><th>Unit</th><th>Marks</th><th>Difficulty</th><th className="text-right">Action</th></tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id} className="border-t align-top dark:border-slate-800">
                  <td className="max-w-xl py-3">{question.question_text}</td>
                  <td>{question.subject}<div className="text-xs text-slate-500">{question.subject_code}</div></td>
                  <td>Unit {question.unit_number}<div className="text-xs text-slate-500">{question.unit_title}</div></td>
                  <td>{question.marks}</td>
                  <td className="capitalize">{question.difficulty}</td>
                  <td className="text-right"><button className="rounded bg-rose-600 px-3 py-1 text-white" onClick={() => deleteQuestion(question.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!questions.length && <p className="py-6 text-center text-sm text-slate-500">No questions found for approved subjects.</p>}
        </div>
      </section>
    </div>
  );
}
