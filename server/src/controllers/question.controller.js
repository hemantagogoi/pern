import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

async function ensureQuestionAccess(user, subjectId) {
  if (user.role === 'admin') return;
  const { rowCount } = await query(
    `SELECT 1 FROM user_subjects
     WHERE user_id = $1 AND subject_id = $2 AND status = 'approved'`,
    [user.id, subjectId]
  );
  if (!rowCount) throw new AppError('You can add questions only for admin-approved subjects', 403);
}

export const listQuestions = asyncHandler(async (req, res) => {
  const { subject_id, unit_id, difficulty, search = '' } = req.query;
  const { rows } = await query(
    `SELECT q.*, s.name AS subject, s.code AS subject_code, u.unit_number, u.title AS unit_title,
       p.name AS program, d.name AS department, sem.name AS semester
     FROM questions q
     JOIN subjects s ON s.id = q.subject_id
     JOIN units u ON u.id = q.unit_id
     JOIN programs p ON p.id = s.program_id
     JOIN departments d ON d.id = s.department_id
     JOIN semesters sem ON sem.id = s.semester_id
     LEFT JOIN user_subjects us ON us.subject_id = s.id AND us.user_id = $5
     WHERE ($1::int IS NULL OR q.subject_id = $1)
       AND ($2::int IS NULL OR q.unit_id = $2)
       AND ($3::difficulty_level IS NULL OR q.difficulty = $3)
       AND q.question_text ILIKE '%' || $4 || '%'
       AND ($6::boolean OR us.status = 'approved')
     ORDER BY q.created_at DESC`,
    [subject_id || null, unit_id || null, difficulty || null, search, req.user.id, req.user.role === 'admin']
  );
  res.json(rows);
});

export const createQuestion = asyncHandler(async (req, res) => {
  const { subject_id, unit_id, question_text, marks, difficulty } = req.body;
  await ensureQuestionAccess(req.user, subject_id);
  const unit = await query('SELECT 1 FROM units WHERE id = $1 AND subject_id = $2', [unit_id, subject_id]);
  if (!unit.rowCount) throw new AppError('Selected unit does not belong to this subject', 422);
  const { rows } = await query(
    `INSERT INTO questions (subject_id, unit_id, question_text, marks, difficulty, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [subject_id, unit_id, question_text, marks, difficulty || 'medium', req.user.id]
  );
  res.status(201).json(rows[0]);
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const { subject_id, unit_id, question_text, marks, difficulty } = req.body;
  await ensureQuestionAccess(req.user, subject_id);
  if (req.user.role !== 'admin') {
    const owner = await query('SELECT 1 FROM questions WHERE id = $1 AND created_by = $2', [req.params.id, req.user.id]);
    if (!owner.rowCount) throw new AppError('You can edit only your own questions', 403);
  }
  const { rows } = await query(
    `UPDATE questions SET subject_id=$1, unit_id=$2, question_text=$3, marks=$4, difficulty=$5, updated_at=NOW()
     WHERE id=$6 RETURNING *`,
    [subject_id, unit_id, question_text, marks, difficulty, req.params.id]
  );
  res.json(rows[0]);
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  let result;
  if (req.user.role === 'admin') {
    result = await query('DELETE FROM questions WHERE id = $1', [req.params.id]);
  } else {
    result = await query('DELETE FROM questions WHERE id = $1 AND created_by = $2', [req.params.id, req.user.id]);
  }
  if (!result.rowCount) throw new AppError('Question not found or you do not have permission to delete it', 404);
  res.status(204).send();
});
