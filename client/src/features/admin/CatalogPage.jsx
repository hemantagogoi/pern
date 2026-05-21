import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api.js';

const emptySubject = { program_id: '', department_id: '', semester_id: '', name: '', code: '', credits: 4 };
const emptyUnit = { subject_id: '', unit_number: 1, title: '' };

function TextInput(props) {
  return <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" {...props} />;
}

function SelectInput(props) {
  return <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" {...props} />;
}

export default function CatalogPage() {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [simpleForms, setSimpleForms] = useState({
    programs: { name: '' },
    departments: { name: '' },
    semesters: { name: '', semester_number: 1 }
  });
  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [unitForm, setUnitForm] = useState(emptyUnit);

  const subjectOptions = useMemo(() => subjects.map((subject) => ({
    ...subject,
    label: `${subject.name} (${subject.code}) - ${subject.program} / ${subject.department} / ${subject.semester}`
  })), [subjects]);

  function refresh() {
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

  useEffect(refresh, []);

  async function addSimple(resource) {
    try {
      await api.post(`/${resource}`, simpleForms[resource]);
      setSimpleForms({ ...simpleForms, [resource]: resource === 'semesters' ? { name: '', semester_number: 1 } : { name: '' } });
      toast.success(`${resource.slice(0, -1)} added`);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || `Could not add ${resource.slice(0, -1)}`);
    }
  }

  async function remove(resource, id) {
    if (!confirm(`Delete this ${resource.slice(0, -1)}?`)) return;
    try {
      await api.delete(`/${resource}/${id}`);
      toast.success(`${resource.slice(0, -1)} deleted`);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || `Could not delete ${resource.slice(0, -1)}`);
    }
  }

  async function addSubject() {
    try {
      await api.post('/subjects', {
        ...subjectForm,
        program_id: Number(subjectForm.program_id),
        department_id: Number(subjectForm.department_id),
        semester_id: Number(subjectForm.semester_id),
        credits: Number(subjectForm.credits)
      });
      setSubjectForm(emptySubject);
      toast.success('Subject added');
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add subject');
    }
  }

  async function addUnit() {
    try {
      await api.post('/units', {
        ...unitForm,
        subject_id: Number(unitForm.subject_id),
        unit_number: Number(unitForm.unit_number)
      });
      setUnitForm(emptyUnit);
      toast.success('Unit added');
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add unit');
    }
  }

  const simpleSections = [
    { resource: 'programs', title: 'Programs', rows: programs, fields: ['name'], placeholders: ['Program name'] },
    { resource: 'departments', title: 'Departments', rows: departments, fields: ['name'], placeholders: ['Department name'] },
    { resource: 'semesters', title: 'Semesters', rows: semesters, fields: ['name', 'semester_number'], placeholders: ['Semester name', 'Number'] }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Academic Catalog</h1>
        <p className="mt-1 text-sm text-slate-500">Add and delete programs, departments, semesters, subjects, and units.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {simpleSections.map((section) => (
          <section key={section.resource} className="min-w-0 rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <h2 className="text-lg font-black">{section.title}</h2>
            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                addSimple(section.resource);
              }}
            >
              {section.fields.map((field, index) => (
                <TextInput
                  key={field}
                  required
                  type={field === 'semester_number' ? 'number' : 'text'}
                  min={field === 'semester_number' ? 1 : undefined}
                  placeholder={section.placeholders[index]}
                  value={simpleForms[section.resource][field]}
                  onChange={(event) => setSimpleForms({
                    ...simpleForms,
                    [section.resource]: { ...simpleForms[section.resource], [field]: event.target.value }
                  })}
                />
              ))}
              <button className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white dark:bg-brand-500">Add {section.title.slice(0, -1)}</button>
            </form>
            <div className="mt-4 space-y-2">
              {section.rows.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <span className="min-w-0 break-words"><b>{row.name}</b><span className="text-slate-500"> {row.code || row.semester_number}</span></span>
                  <button className="shrink-0 rounded bg-rose-600 px-3 py-1 text-white" onClick={() => remove(section.resource, row.id)}>Delete</button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="min-w-0 rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <h2 className="text-lg font-black">Subjects</h2>
        <form
          className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
            addSubject();
          }}
        >
          <SelectInput required value={subjectForm.program_id} onChange={(event) => setSubjectForm({ ...subjectForm, program_id: event.target.value })}>
            <option value="">Program</option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
          </SelectInput>
          <SelectInput required value={subjectForm.department_id} onChange={(event) => setSubjectForm({ ...subjectForm, department_id: event.target.value })}>
            <option value="">Department</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </SelectInput>
          <SelectInput required value={subjectForm.semester_id} onChange={(event) => setSubjectForm({ ...subjectForm, semester_id: event.target.value })}>
            <option value="">Semester</option>
            {semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
          </SelectInput>
          <TextInput required placeholder="Subject name" value={subjectForm.name} onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })} />
          <TextInput required placeholder="Subject code" value={subjectForm.code} onChange={(event) => setSubjectForm({ ...subjectForm, code: event.target.value })} />
          <TextInput required type="number" min="1" placeholder="Credits" value={subjectForm.credits} onChange={(event) => setSubjectForm({ ...subjectForm, credits: event.target.value })} />
          <button className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white dark:bg-brand-500 xl:col-span-6">Add Subject</button>
        </form>
        <div className="table-shell scrollbar-soft mt-5">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-3">Subject</th><th>Program</th><th>Department</th><th>Semester</th><th className="text-right">Action</th></tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id} className="border-t dark:border-slate-800">
                  <td className="py-3"><b>{subject.name}</b><div className="text-slate-500">{subject.code}</div></td>
                  <td>{subject.program}</td>
                  <td>{subject.department}</td>
                  <td>{subject.semester}</td>
                  <td className="text-right"><button className="rounded bg-rose-600 px-3 py-1 text-white" onClick={() => remove('subjects', subject.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="min-w-0 rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <h2 className="text-lg font-black">Units</h2>
        <form
          className="mt-4 grid gap-3 md:grid-cols-[1fr_140px_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            addUnit();
          }}
        >
          <SelectInput required value={unitForm.subject_id} onChange={(event) => setUnitForm({ ...unitForm, subject_id: event.target.value })}>
            <option value="">Select subject</option>
            {subjectOptions.map((subject) => <option key={subject.id} value={subject.id}>{subject.label}</option>)}
          </SelectInput>
          <TextInput required type="number" min="1" placeholder="Unit no." value={unitForm.unit_number} onChange={(event) => setUnitForm({ ...unitForm, unit_number: event.target.value })} />
          <TextInput required placeholder="Unit title" value={unitForm.title} onChange={(event) => setUnitForm({ ...unitForm, title: event.target.value })} />
          <button className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white dark:bg-brand-500">Add Unit</button>
        </form>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {units.map((unit) => (
            <div key={unit.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
              <span className="min-w-0 break-words"><b>Unit {unit.unit_number}: {unit.title}</b><div className="text-slate-500">{unit.subject_name} ({unit.subject_code})</div></span>
              <button className="shrink-0 rounded bg-rose-600 px-3 py-1 text-white" onClick={() => remove('units', unit.id)}>Delete</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
