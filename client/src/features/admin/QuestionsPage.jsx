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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg font-black sm:text-2xl">Question Bank</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">Add questions to a specific subject, unit, program, department, and semester.</p>
      </div>

      <section className="min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 md:p-6">
        <h2 className="text-base font-black sm:text-lg">Add Question</h2>
        <form onSubmit={addQuestion} className="mt-3 grid gap-2 sm:mt-4 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
            className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 sm:col-span-2 lg:col-span-2 lg:min-h-28"
            required
            placeholder="Question text"
            value={form.question_text}
            onChange={(event) => setForm({ ...form, question_text: event.target.value })}
          />
          <button className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white dark:bg-brand-500 sm:col-span-2 lg:col-span-3">Add Question</button>
        </form>
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 md:p-6">
        <div className="flex min-w-0 flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="truncate text-base font-black sm:text-lg">Questions</h2>
          <form
            className="flex w-full gap-1 md:w-auto md:gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              refreshQuestions();
            }}
          >
            <Field placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} />
            <button className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700 sm:px-4 sm:text-sm">Search</button>
          </form>
        </div>
        <div className="table-shell scrollbar-soft mt-3 sm:mt-4 -mx-3 px-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-2 font-semibold sm:py-3">Question</th><th className="py-2 font-semibold sm:py-3">Subject</th><th className="py-2 font-semibold sm:py-3">Unit</th><th className="py-2 font-semibold sm:py-3">Marks</th><th className="py-2 font-semibold sm:py-3">Difficulty</th><th className="py-2 text-right font-semibold sm:py-3">Action</th></tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id} className="border-t align-top dark:border-slate-800">
                  <td className="min-w-0 py-2 sm:py-3" data-label="Question"><span className="line-clamp-3">{question.question_text}</span><div className="mt-0.5 text-xs text-slate-500"><span className="line-clamp-1">{question.program} / {question.department} / {question.semester}</span></div></td>
                  <td className="min-w-0 py-2 sm:py-3" data-label="Subject"><span className="line-clamp-1">{question.subject}</span><div className="text-xs text-slate-500"><span className="line-clamp-1">{question.subject_code}</span></div></td>
                  <td className="min-w-0 py-2 sm:py-3" data-label="Unit"><span className="line-clamp-1">Unit {question.unit_number}</span><div className="text-xs text-slate-500"><span className="line-clamp-1">{question.unit_title}</span></div></td>
                  <td className="py-2 sm:py-3" data-label="Marks">{question.marks}</td>
                  <td className="py-2 capitalize sm:py-3" data-label="Difficulty"><span className="line-clamp-1">{question.difficulty}</span></td>
                  <td className="py-2 text-right sm:py-3" data-label="Action"><button className="rounded bg-rose-600 px-2 py-0.5 text-xs text-white sm:px-3 sm:py-1" onClick={() => deleteQuestion(question.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!questions.length && <p className="py-4 text-center text-xs text-slate-500 sm:py-6 sm:text-sm">No questions found.</p>}
        </div>
      </section>
    </div>
  );
}
