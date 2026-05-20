import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

const tableMap = {
  programs: ['name', 'code'],
  departments: ['name', 'code'],
  semesters: ['name', 'semester_number']
};

function makeCode(name) {
  return String(name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
}

async function ensureSubjectAccess(user, subjectId) {
  if (user.role === 'admin') return;
  const { rowCount } = await query(
    `SELECT 1 FROM user_subjects
     WHERE user_id = $1 AND subject_id = $2 AND status = 'approved'`,
    [user.id, subjectId]
  );
  if (!rowCount) throw new AppError('You can add units only for admin-approved subjects', 403);
}

export function crudController(table) {
  const columns = tableMap[table];
  return {
    list: asyncHandler(async (req, res) => {
      const { rows } = await query(`SELECT * FROM ${table} ORDER BY id DESC`);
      res.json(rows);
    }),
    create: asyncHandler(async (req, res) => {
      if ((table === 'programs' || table === 'departments') && !req.body.code) {
        req.body.code = makeCode(req.body.name);
      }
      const values = columns.map((column) => req.body[column]);
      const params = columns.map((_, index) => `$${index + 1}`).join(', ');
      const { rows } = await query(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${params}) RETURNING *`,
        values
      );
      res.status(201).json(rows[0]);
    }),
    update: asyncHandler(async (req, res) => {
      const values = columns.map((column) => req.body[column]);
      const sets = columns.map((column, index) => `${column} = $${index + 1}`).join(', ');
      const { rows } = await query(
        `UPDATE ${table} SET ${sets} WHERE id = $${columns.length + 1} RETURNING *`,
        [...values, req.params.id]
      );
      res.json(rows[0]);
    }),
    remove: asyncHandler(async (req, res) => {
      await query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
      res.status(204).send();
    })
  };
}

export const subjects = {
  list: asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT s.*, p.name AS program, d.name AS department, sem.name AS semester
       FROM subjects s
       JOIN programs p ON p.id = s.program_id
       JOIN departments d ON d.id = s.department_id
       JOIN semesters sem ON sem.id = s.semester_id
       ORDER BY s.created_at DESC`
    );
    res.json(rows);
  }),
  create: asyncHandler(async (req, res) => {
    const { program_id, department_id, semester_id, name, code, credits } = req.body;
    const { rows } = await query(
      `INSERT INTO subjects (program_id, department_id, semester_id, name, code, credits)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [program_id, department_id, semester_id, name, code, credits || 4]
    );
    res.status(201).json(rows[0]);
  }),
  update: asyncHandler(async (req, res) => {
    const { program_id, department_id, semester_id, name, code, credits } = req.body;
    const { rows } = await query(
      `UPDATE subjects SET program_id=$1, department_id=$2, semester_id=$3, name=$4, code=$5, credits=$6
       WHERE id=$7 RETURNING *`,
      [program_id, department_id, semester_id, name, code, credits || 4, req.params.id]
    );
    res.json(rows[0]);
  }),
  remove: asyncHandler(async (req, res) => {
    await query('DELETE FROM subjects WHERE id = $1', [req.params.id]);
    res.status(204).send();
  })
};

export const units = {
  list: asyncHandler(async (req, res) => {
    const { subject_id } = req.query;
    const { rows } = await query(
      `SELECT u.*, s.name AS subject_name, s.code AS subject_code
       FROM units u
       JOIN subjects s ON s.id = u.subject_id
       LEFT JOIN user_subjects us ON us.subject_id = s.id AND us.user_id = $2
       WHERE ($1::int IS NULL OR u.subject_id = $1)
         AND ($3::boolean OR us.status = 'approved')
       ORDER BY s.name, u.unit_number`,
      [subject_id || null, req.user.id, req.user.role === 'admin']
    );
    res.json(rows);
  }),
  create: asyncHandler(async (req, res) => {
    const { subject_id, unit_number, title } = req.body;
    await ensureSubjectAccess(req.user, subject_id);
    const { rows } = await query(
      `INSERT INTO units (subject_id, unit_number, title)
       VALUES ($1, $2, $3) RETURNING *`,
      [subject_id, unit_number, title]
    );
    res.status(201).json(rows[0]);
  }),
  update: asyncHandler(async (req, res) => {
    const { subject_id, unit_number, title } = req.body;
    await ensureSubjectAccess(req.user, subject_id);
    const { rows } = await query(
      `UPDATE units SET subject_id=$1, unit_number=$2, title=$3 WHERE id=$4 RETURNING *`,
      [subject_id, unit_number, title, req.params.id]
    );
    res.json(rows[0]);
  }),
  remove: asyncHandler(async (req, res) => {
    await query('DELETE FROM units WHERE id = $1', [req.params.id]);
    res.status(204).send();
  })
};
