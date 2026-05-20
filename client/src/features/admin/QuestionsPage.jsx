import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api.js';

const emptyForm = {
  program_id: '',
  department_id: '',
  semester_id: '',
  subject_id: '',
  unit_id: '',
  question_text: '',
  marks: 5,
  difficulty: 'medium'
};

function Field(props) {
  return <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" {...props} />;
}

function Select(props) {
  return <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" {...props} />;
}

export default function QuestionsPage() {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  function refreshCatalog() {
    Promise.all([
      api.get('/programs'),
      api.get('/departments'),
      api.get('/semesters'),
      api.get('/subjects'),
      api.get('/units')
    ]).then(([programRes, departmentRes, semesterRes, subjectRes, unitRes]) => {
      setPrograms(programRes.data);
      setDepartments(departmentRes.data);
      setSemesters(semesterRes.data);
      setSubjects(subjectRes.data);
      setUnits(unitRes.data);
    });
  }

  function refreshQuestions() {
    api.get('/questions', { params: { search } }).then(({ data }) => setQuestions(data));
  }

  useEffect(() => {
    refreshCatalog();
    refreshQuestions();
  }, []);

  const filteredSubjects = useMemo(() => subjects.filter((subject) => {
    return (!form.program_id || subject.program_id === Number(form.program_id))
      && (!form.department_id || subject.department_id === Number(form.department_id))
      && (!form.semester_id || subject.semester_id === Number(form.semester_id));
  }), [subjects, form.program_id, form.department_id, form.semester_id]);

  const filteredUnits = useMemo(() => units.filter((unit) => {
    return form.subject_id && unit.subject_id === Number(form.subject_id);
  }), [units, form.subject_id]);

  async function addQuestion(event) {
    event.preventDefault();
    await api.post('/questions', {
      subject_id: Number(form.subject_id),
      unit_id: Number(form.unit_id),
      question_text: form.question_text,
      marks: Number(form.marks),
      difficulty: form.difficulty
    });
    setForm({ ...form, unit_id: '', question_text: '', marks: 5, difficulty: 'medium' });
    toast.success('Question added');
    refreshQuestions();
  }

  async function deleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    await api.delete(`/questions/${id}`);
    toast.success('Question deleted');
    refreshQuestions();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Question Bank</h1>
        <p className="mt-1 text-sm text-slate-500">Add questions to a specific subject, unit, program, department, and semester.</p>
      </div>

      <section className="rounded-lg border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-black">Add Question</h2>
        <form onSubmit={addQuestion} className="mt-4 grid gap-3 lg:grid-cols-3">
          <Select required value={form.program_id} onChange={(event) => setForm({ ...form, program_id: event.target.value, subject_id: '', unit_id: '' })}>
            <option value="">Program</option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
          </Select>
          <Select required value={form.department_id} onChange={(event) => setForm({ ...form, department_id: event.target.value, subject_id: '', unit_id: '' })}>
            <option value="">Department</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </Select>
          <Select required value={form.semester_id} onChange={(event) => setForm({ ...form, semester_id: event.target.value, subject_id: '', unit_id: '' })}>
            <option value="">Semester</option>
            {semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
          </Select>
          <Select required value={form.subject_id} onChange={(event) => setForm({ ...form, subject_id: event.target.value, unit_id: '' })}>
            <option value="">Subject</option>
            {filteredSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
          </Select>
          <Select required value={form.unit_id} onChange={(event) => setForm({ ...form, unit_id: event.target.value })}>
            <option value="">Unit</option>
            {filteredUnits.map((unit) => <option key={unit.id} value={unit.id}>Unit {unit.unit_number}: {unit.title}</option>)}
          </Select>
          <Select required value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
          <Field required type="number" min="1" placeholder="Marks" value={form.marks} onChange={(event) => setForm({ ...form, marks: event.target.value })} />
          <textarea
            className="min-h-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 lg:col-span-2"
            required
            placeholder="Question text"
            value={form.question_text}
            onChange={(event) => setForm({ ...form, question_text: event.target.value })}
          />
          <button className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white dark:bg-brand-500 lg:col-span-3">Add Question</button>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-black">Questions</h2>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              refreshQuestions();
            }}
          >
            <Field placeholder="Search question text" value={search} onChange={(event) => setSearch(event.target.value)} />
            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700">Search</button>
          </form>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-3">Question</th><th>Subject</th><th>Unit</th><th>Marks</th><th>Difficulty</th><th className="text-right">Action</th></tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id} className="border-t align-top dark:border-slate-800">
                  <td className="max-w-xl py-3">{question.question_text}<div className="mt-1 text-xs text-slate-500">{question.program} / {question.department} / {question.semester}</div></td>
                  <td>{question.subject}<div className="text-xs text-slate-500">{question.subject_code}</div></td>
                  <td>Unit {question.unit_number}<div className="text-xs text-slate-500">{question.unit_title}</div></td>
                  <td>{question.marks}</td>
                  <td className="capitalize">{question.difficulty}</td>
                  <td className="text-right"><button className="rounded bg-rose-600 px-3 py-1 text-white" onClick={() => deleteQuestion(question.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!questions.length && <p className="py-6 text-center text-sm text-slate-500">No questions found.</p>}
        </div>
      </section>
    </div>
  );
}
