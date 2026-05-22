import crypto from 'node:crypto';
import { withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

function shuffleQuestions(questions) {
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function getMarkCounts(markRules) {
  return new Map(markRules.map((rule) => [rule.marks, rule.count]));
}

function getRemainingTotal(markCounts) {
  return [...markCounts.values()].reduce((sum, count) => sum + count, 0);
}

function canStillCoverUnits(units, candidates, markCounts, usedQuestionIds) {
  return units.every((unitId) => candidates.some((question) => {
    return Number(question.unit_id) === Number(unitId)
      && (markCounts.get(Number(question.marks)) || 0) > 0
      && !usedQuestionIds.has(question.id);
  }));
}

function selectQuestionsWithUnitCoverage(candidates, unitIds, markRules) {
  const markCounts = getMarkCounts(markRules);
  const selected = [];
  const usedQuestionIds = new Set();
  const orderedUnitIds = shuffleQuestions(unitIds).sort((left, right) => {
    const leftOptions = candidates.filter((question) => Number(question.unit_id) === Number(left)).length;
    const rightOptions = candidates.filter((question) => Number(question.unit_id) === Number(right)).length;
    return leftOptions - rightOptions;
  });

  function coverUnit(unitIndex) {
    if (unitIndex === orderedUnitIds.length) return true;
    const unitId = orderedUnitIds[unitIndex];
    const remainingUnits = orderedUnitIds.slice(unitIndex + 1);
    const options = shuffleQuestions(candidates.filter((question) => {
      return Number(question.unit_id) === Number(unitId)
        && (markCounts.get(Number(question.marks)) || 0) > 0
        && !usedQuestionIds.has(question.id);
    }));

    for (const question of options) {
      const marks = Number(question.marks);
      selected.push(question);
      usedQuestionIds.add(question.id);
      markCounts.set(marks, markCounts.get(marks) - 1);

      const enoughSlotsRemain = remainingUnits.length <= getRemainingTotal(markCounts);
      if (
        enoughSlotsRemain
        && canStillCoverUnits(remainingUnits, candidates, markCounts, usedQuestionIds)
        && coverUnit(unitIndex + 1)
      ) {
        return true;
      }

      markCounts.set(marks, markCounts.get(marks) + 1);
      usedQuestionIds.delete(question.id);
      selected.pop();
    }

    return false;
  }

  if (!coverUnit(0)) return null;

  for (const markRule of markRules) {
    const remainingCount = markCounts.get(markRule.marks) || 0;
    if (!remainingCount) continue;

    const options = shuffleQuestions(candidates.filter((question) => {
      return Number(question.marks) === markRule.marks && !usedQuestionIds.has(question.id);
    }));

    if (options.length < remainingCount) return null;

    for (const question of options.slice(0, remainingCount)) {
      selected.push(question);
      usedQuestionIds.add(question.id);
    }
  }

  return shuffleQuestions(selected);
}

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

    const requestedQuestionCount = markRules.reduce((sum, rule) => sum + rule.count, 0);
    if (unitIds.length > requestedQuestionCount) {
      throw new AppError('Requested question count must be at least the number of selected units', 422);
    }

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

    const pattern = { unit_ids: unitIds, mark_rules: markRules, difficulty: payload.difficulty || null };
    const previousPaper = await client.query(
      `SELECT gp.id
       FROM generated_papers gp
       WHERE gp.user_id = $1
         AND gp.subject_id = $2
         AND gp.pattern = $3::jsonb
       ORDER BY gp.created_at DESC
       LIMIT 1`,
      [userId, payload.subject_id, JSON.stringify(pattern)]
    );

    let previousQuestionIds = [];
    if (previousPaper.rowCount) {
      const previousQuestions = await client.query(
        `SELECT question_id
         FROM paper_questions
         WHERE paper_id = $1`,
        [previousPaper.rows[0].id]
      );
      previousQuestionIds = previousQuestions.rows.map((row) => row.question_id);
    }

    async function loadCandidates(avoidPreviousQuestions) {
      const { rows } = await client.query(
        `SELECT q.*, u.unit_number, u.title AS unit_title
         FROM questions q
         JOIN units u ON u.id = q.unit_id
         WHERE q.subject_id=$1
           AND q.unit_id = ANY($2::int[])
           AND q.marks = ANY($3::int[])
           AND ($4::difficulty_level IS NULL OR q.difficulty=$4)
           AND ($5::boolean = FALSE OR NOT (q.id = ANY($6::uuid[])))
         ORDER BY random()`,
        [
          payload.subject_id,
          unitIds,
          markRules.map((rule) => rule.marks),
          payload.difficulty || null,
          avoidPreviousQuestions,
          previousQuestionIds
        ]
      );
      return rows;
    }

    const allCandidates = await loadCandidates(false);
    const availableByMarks = new Map();
    for (const question of allCandidates) {
      const marks = Number(question.marks);
      availableByMarks.set(marks, (availableByMarks.get(marks) || 0) + 1);
    }

    const unavailableRule = markRules.find((rule) => rule.count > (availableByMarks.get(rule.marks) || 0));
    if (unavailableRule) {
      throw new AppError(`Not enough ${unavailableRule.marks} mark questions are available for the selected subject and units`, 422);
    }

    let randomizedSelected = null;
    if (previousQuestionIds.length) {
      const freshCandidates = await loadCandidates(true);
      randomizedSelected = selectQuestionsWithUnitCoverage(freshCandidates, unitIds, markRules);
    }

    if (!randomizedSelected) {
      randomizedSelected = selectQuestionsWithUnitCoverage(allCandidates, unitIds, markRules);
      if (!randomizedSelected) {
        throw new AppError('Not enough eligible questions to include every selected unit in this paper pattern', 422);
      }
    }

    if (randomizedSelected.length !== requestedQuestionCount) {
      throw new AppError('Generated question count does not match the requested paper pattern', 422);
    }

    const coveredUnitIds = new Set(randomizedSelected.map((question) => Number(question.unit_id)));
    const missingUnitId = unitIds.find((unitId) => !coveredUnitIds.has(unitId));
    if (missingUnitId) {
      throw new AppError('Generated paper must include at least one question from every selected unit', 422);
    }

    const selectedMarks = randomizedSelected.reduce((sum, question) => sum + Number(question.marks), 0);
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
        JSON.stringify(pattern)
      ]
    );

    const orderedSelected = [...randomizedSelected].sort((left, right) => Number(left.marks) - Number(right.marks));

    for (const [index, question] of orderedSelected.entries()) {
      await client.query(
        `INSERT INTO paper_questions (paper_id, question_id, display_order, marks)
         VALUES ($1, $2, $3, $4)`,
        [paper.rows[0].id, question.id, index + 1, question.marks]
      );
    }

    return { ...paper.rows[0], ...access.rows[0], questions: orderedSelected };
  });
}
