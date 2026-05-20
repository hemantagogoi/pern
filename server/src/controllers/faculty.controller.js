import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const availableSubjects = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT s.*, p.name AS program, d.name AS department, sem.name AS semester,
      COALESCE(us.status::text, 'not_applied') AS application_status
     FROM subjects s
     JOIN programs p ON p.id = s.program_id
     JOIN departments d ON d.id = s.department_id
     JOIN semesters sem ON sem.id = s.semester_id
     LEFT JOIN user_subjects us ON us.subject_id = s.id AND us.user_id = $1
     ORDER BY s.name`,
    [req.user.id]
  );
  res.json(rows);
});

export const applySubjects = asyncHandler(async (req, res) => {
  const subjectIds = [...new Set(req.body.subject_ids.map(Number).filter(Boolean))];
  if (!subjectIds.length) throw new AppError('Select at least one subject', 422);

  const existing = await query(
    `SELECT us.subject_id, us.status, s.name AS subject_name
     FROM user_subjects us
     JOIN subjects s ON s.id = us.subject_id
     WHERE us.user_id = $1 AND us.subject_id = ANY($2::int[])`,
    [req.user.id, subjectIds]
  );
  const blocked = existing.rows.find((row) => ['pending', 'approved'].includes(row.status));
  if (blocked) {
    throw new AppError(`You already have a ${blocked.status} application for ${blocked.subject_name}`, 422);
  }

  const { rowCount } = await query('SELECT 1 FROM subjects WHERE id = ANY($1::int[])', [subjectIds]);
  if (rowCount !== subjectIds.length) throw new AppError('One or more selected subjects are invalid', 422);

  const values = subjectIds.map((_, index) => `($1, $${index + 2})`).join(', ');
  await query(
    `INSERT INTO user_subjects (user_id, subject_id) VALUES ${values}
     ON CONFLICT (user_id, subject_id) DO UPDATE SET status='pending', reviewed_by=NULL, reviewed_at=NULL`,
    [req.user.id, ...subjectIds]
  );
  res.status(201).json({ message: 'Subject application submitted' });
});

export const approvedSubjects = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT s.* FROM subjects s
     JOIN user_subjects us ON us.subject_id = s.id
     WHERE us.user_id=$1 AND us.status='approved'
     ORDER BY s.name`,
    [req.user.id]
  );
  res.json(rows);
});

export const applications = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT us.*, s.name AS subject_name, s.code AS subject_code
     FROM user_subjects us JOIN subjects s ON s.id = us.subject_id
     WHERE us.user_id=$1 ORDER BY us.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

export const myPapers = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT gp.*, s.name AS subject_name, s.code AS subject_code
     FROM generated_papers gp JOIN subjects s ON s.id = gp.subject_id
     WHERE gp.user_id=$1 ORDER BY gp.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});
