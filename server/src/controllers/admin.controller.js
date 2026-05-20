import { query, withTransaction } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const analytics = asyncHandler(async (req, res) => {
  const seenAfter = req.query.seen_after || null;
  const { rows } = await query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE status='pending')::int AS pending_users,
      (SELECT COUNT(*) FROM user_subjects WHERE status='pending')::int AS pending_subject_applications,
      (SELECT COUNT(*) FROM users WHERE status='pending' AND ($1::timestamptz IS NULL OR created_at > $1::timestamptz))::int AS new_pending_users,
      (SELECT COUNT(*) FROM user_subjects WHERE status='pending' AND ($1::timestamptz IS NULL OR created_at > $1::timestamptz))::int AS new_pending_subject_applications,
      (SELECT COUNT(*) FROM subjects)::int AS subjects,
      (SELECT COUNT(*) FROM questions)::int AS questions,
      (SELECT COUNT(*) FROM generated_papers)::int AS papers
  `, [seenAfter]);
  res.json(rows[0]);
});

export const listUsers = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.status, u.created_at, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.created_at DESC`
  );
  res.json(rows);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const { rows } = await query('UPDATE users SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id, name, email, status', [
    status,
    req.params.id
  ]);
  await query(
    `INSERT INTO approvals (approver_id, target_user_id, action, status, note) VALUES ($1, $2, 'user_registration', $3, $4)`,
    [req.user.id, req.params.id, status, note || null]
  );
  res.json(rows[0]);
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError('You cannot delete your own admin account while logged in', 400);
  }

  await withTransaction(async (client) => {
    await client.query('UPDATE questions SET created_by = NULL WHERE created_by = $1', [req.params.id]);
    await client.query('UPDATE user_subjects SET reviewed_by = NULL WHERE reviewed_by = $1', [req.params.id]);
    await client.query('UPDATE approvals SET approver_id = NULL WHERE approver_id = $1', [req.params.id]);
    await client.query('DELETE FROM approvals WHERE target_user_id = $1', [req.params.id]);
    await client.query('DELETE FROM activity_logs WHERE user_id = $1', [req.params.id]);
    await client.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  });

  res.status(204).send();
});

export const listSubjectApplications = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT us.*, u.name AS user_name, u.email, s.name AS subject_name, s.code AS subject_code
     FROM user_subjects us
     JOIN users u ON u.id = us.user_id
     JOIN subjects s ON s.id = us.subject_id
     ORDER BY us.created_at DESC`
  );
  res.json(rows);
});

export const reviewSubjectApplication = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const { rows } = await query(
    `UPDATE user_subjects SET status=$1, reviewed_by=$2, reviewed_at=NOW() WHERE id=$3 RETURNING *`,
    [status, req.user.id, req.params.id]
  );
  await query(
    `INSERT INTO approvals (approver_id, target_user_id, subject_id, action, status, note)
     SELECT $1, user_id, subject_id, 'subject_application', $2, $3 FROM user_subjects WHERE id=$4`,
    [req.user.id, status, note || null, req.params.id]
  );
  res.json(rows[0]);
});
