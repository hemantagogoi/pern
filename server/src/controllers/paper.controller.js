import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { streamPaperPdf } from '../utils/pdf.js';
import * as paperService from '../services/paper.service.js';
import { AppError } from '../utils/AppError.js';

export const options = asyncHandler(async (req, res) => {
  const subjectId = Number(req.params.subjectId);
  const unitIds = String(req.query.unit_ids || '')
    .split(',')
    .map((id) => Number(id))
    .filter(Boolean);
  const access = await query(
    `SELECT 1 FROM user_subjects WHERE user_id=$1 AND subject_id=$2 AND status='approved'`,
    [req.user.id, subjectId]
  );
  if (!access.rowCount) throw new AppError('Subject access is not approved', 403);

  const units = await query(
    `SELECT u.id, u.unit_number, u.title, COUNT(q.id)::int AS question_count
     FROM units u
     LEFT JOIN questions q ON q.unit_id = u.id
     WHERE u.subject_id = $1
     GROUP BY u.id
     ORDER BY u.unit_number`,
    [subjectId]
  );

  const marks = await query(
    `SELECT marks, COUNT(*)::int AS question_count
     FROM questions
     WHERE subject_id = $1
       AND ($2::int[] IS NULL OR unit_id = ANY($2::int[]))
     GROUP BY marks
     ORDER BY marks`,
    [subjectId, unitIds.length ? unitIds : null]
  );

  res.json({ units: units.rows, marks: marks.rows });
});

export const generate = asyncHandler(async (req, res) => {
  const paper = await paperService.generatePaper(req.user.id, req.body);
  res.status(201).json(paper);
});

export const getPaper = asyncHandler(async (req, res) => {
  const paper = await query(
    `SELECT gp.*, s.name AS subject_name, s.code AS subject_code
     FROM generated_papers gp
     JOIN subjects s ON s.id = gp.subject_id
     WHERE gp.id=$1 AND gp.user_id=$2`,
    [req.params.id, req.user.id]
  );
  if (!paper.rowCount) throw new AppError('Paper not found', 404);
  const questions = await query(
    `SELECT q.*, pq.display_order, u.unit_number, u.title AS unit_title FROM paper_questions pq
     JOIN questions q ON q.id = pq.question_id
     JOIN units u ON u.id = q.unit_id
     WHERE pq.paper_id=$1 ORDER BY pq.marks, pq.display_order`,
    [req.params.id]
  );
  res.json({ ...paper.rows[0], questions: questions.rows });
});

export const downloadPdf = asyncHandler(async (req, res) => {
  const paper = await query(
    `SELECT gp.*, s.name AS subject_name, s.code AS subject_code
     FROM generated_papers gp
     JOIN subjects s ON s.id = gp.subject_id
     WHERE gp.id=$1 AND gp.user_id=$2`,
    [req.params.id, req.user.id]
  );
  if (!paper.rowCount) throw new AppError('Paper not found', 404);
  const questions = await query(
    `SELECT q.*, pq.display_order, u.unit_number, u.title AS unit_title FROM paper_questions pq
     JOIN questions q ON q.id = pq.question_id
     JOIN units u ON u.id = q.unit_id
     WHERE pq.paper_id=$1 ORDER BY pq.marks, pq.display_order`,
    [req.params.id]
  );
  streamPaperPdf(res, paper.rows[0], questions.rows);
});
