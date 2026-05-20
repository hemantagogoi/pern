import { withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

export async function generatePaper(userId, payload) {
  return withTransaction(async (client) => {
    const access = await client.query(
      `SELECT s.name AS subject_name, s.code AS subject_code
       FROM user_subjects us
       JOIN subjects s ON s.id = us.subject_id
       WHERE us.user_id=$1 AND us.subject_id=$2 AND us.status='approved'`,
      [userId, payload.subject_id]
    );
    if (!access.rowCount) throw new AppError('Subject access is not approved', 403);

    const unitIds = (payload.unit_ids || []).map(Number).filter(Boolean);
    const markRules = (payload.mark_rules || []).map((rule) => ({
      marks: Number(rule.marks),
      count: Number(rule.count)
    })).filter((rule) => rule.marks > 0 && rule.count > 0);

    if (!unitIds.length) throw new AppError('Select at least one unit', 422);
    if (!markRules.length) throw new AppError('Add at least one marks pattern', 422);

    const validUnits = await client.query(
      `SELECT u.id
       FROM units u
       JOIN questions q ON q.unit_id = u.id
       WHERE u.subject_id = $1 AND u.id = ANY($2::int[])
       GROUP BY u.id`,
      [payload.subject_id, unitIds]
    );
    if (validUnits.rowCount !== new Set(unitIds).size) {
      throw new AppError('Select only units available for the selected subject', 422);
    }

    const availableMarks = await client.query(
      `SELECT marks, COUNT(*)::int AS question_count
       FROM questions
       WHERE subject_id = $1 AND unit_id = ANY($2::int[])
       GROUP BY marks`,
      [payload.subject_id, unitIds]
    );
    const availableByMarks = new Map(availableMarks.rows.map((row) => [Number(row.marks), Number(row.question_count)]));
    const unavailableRule = markRules.find((rule) => rule.count > (availableByMarks.get(rule.marks) || 0));
    if (unavailableRule) {
      throw new AppError(`Not enough ${unavailableRule.marks} mark questions are available for the selected subject and units`, 422);
    }

    const selected = [];
    const used = new Set();

    for (const markRule of markRules) {
      const params = [
        payload.subject_id,
        unitIds,
        markRule.count,
        markRule.marks,
        payload.difficulty || null
      ];
      const { rows } = await client.query(
        `SELECT q.*, u.unit_number, u.title AS unit_title
         FROM questions q
         JOIN units u ON u.id = q.unit_id
         WHERE q.subject_id=$1
           AND q.unit_id = ANY($2::int[])
           AND q.marks=$4
           AND ($5::difficulty_level IS NULL OR q.difficulty=$5)
         ORDER BY random()
         LIMIT $3`,
        params
      );
      if (rows.length < markRule.count) {
        throw new AppError(`Not enough ${markRule.marks} mark questions are available for the selected units`, 422);
      }
      for (const question of rows) {
        if (!used.has(question.id)) {
          used.add(question.id);
          selected.push(question);
        }
      }
    }

    const selectedMarks = selected.reduce((sum, question) => sum + Number(question.marks), 0);
    if (selectedMarks !== Number(payload.total_marks)) {
      throw new AppError(`Selected questions total ${selectedMarks} marks, expected ${payload.total_marks}`, 422);
    }

    const paper = await client.query(
      `INSERT INTO generated_papers (user_id, subject_id, title, total_marks, duration_minutes, instructions, pattern)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        userId,
        payload.subject_id,
        payload.title,
        payload.total_marks,
        payload.duration_minutes || 180,
        payload.instructions || null,
        JSON.stringify({ unit_ids: unitIds, mark_rules: markRules, difficulty: payload.difficulty || null })
      ]
    );

    for (const [index, question] of selected.entries()) {
      await client.query(
        `INSERT INTO paper_questions (paper_id, question_id, display_order, marks)
         VALUES ($1, $2, $3, $4)`,
        [paper.rows[0].id, question.id, index + 1, question.marks]
      );
    }

    return { ...paper.rows[0], ...access.rows[0], questions: selected };
  });
}
