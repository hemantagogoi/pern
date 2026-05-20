INSERT INTO roles (name) VALUES ('admin'), ('faculty') ON CONFLICT DO NOTHING;

INSERT INTO programs (name, code) VALUES
  ('Bachelor of Arts', 'BA'),
  ('Bachelor of Computer Applications', 'BCA'),
  ('Bachelor of Science', 'BSC'),
  ('Master of Computer Applications', 'MCA')
ON CONFLICT DO NOTHING;

INSERT INTO departments (name, code) VALUES
  ('Computer Science', 'CS'),
  ('Mathematics', 'MATH'),
  ('English', 'ENG')
ON CONFLICT DO NOTHING;

INSERT INTO semesters (name, semester_number) VALUES
  ('Semester 1', 1), ('Semester 2', 2), ('Semester 3', 3), ('Semester 4', 4)
ON CONFLICT DO NOTHING;

-- Passwords are bcrypt hashes for Admin@12345 and Faculty@12345.
INSERT INTO users (role_id, name, email, password_hash, status)
VALUES
  ((SELECT id FROM roles WHERE name = 'admin'), 'System Admin', 'admin@crestwood.edu', '$2a$12$2xltmqCND5.iR9pMW1Hv3.7Y6xYlDK3Tt.1GP0xHAgPQvb.zlUeoO', 'approved'),
  ((SELECT id FROM roles WHERE name = 'faculty'), 'Demo Faculty', 'faculty@crestwood.edu', '$2a$12$p.aw9xc2/m172dHJQVjaHe3ldqM8NglF5mDKZyP29zLu/aeZuNtZe', 'approved')
ON CONFLICT (email) DO NOTHING;

INSERT INTO subjects (program_id, department_id, semester_id, name, code, credits)
VALUES (
  (SELECT id FROM programs WHERE code = 'BCA'),
  (SELECT id FROM departments WHERE code = 'CS'),
  (SELECT id FROM semesters WHERE semester_number = 3),
  'Database Management Systems',
  'BCA-CS-DBMS',
  4
) ON CONFLICT DO NOTHING;

INSERT INTO units (subject_id, unit_number, title)
SELECT s.id, u.unit_number, u.title
FROM subjects s
CROSS JOIN (VALUES
  (1, 'Database Concepts'),
  (2, 'Relational Model and SQL'),
  (3, 'Normalization'),
  (4, 'Transactions and Recovery')
) AS u(unit_number, title)
WHERE s.code = 'BCA-CS-DBMS'
ON CONFLICT DO NOTHING;

INSERT INTO questions (subject_id, unit_id, question_text, marks, difficulty)
SELECT s.id, u.id, q.question_text, q.marks, q.difficulty::difficulty_level
FROM subjects s
JOIN units u ON u.subject_id = s.id
JOIN (VALUES
  (1, 'Define DBMS and explain its advantages over a file processing system.', 5, 'easy'),
  (1, 'Explain the three-schema architecture with a neat diagram.', 10, 'medium'),
  (2, 'Write SQL queries to demonstrate joins, grouping, and aggregate functions.', 10, 'medium'),
  (2, 'Differentiate between primary key, candidate key, and foreign key.', 5, 'easy'),
  (3, 'Normalize the given relation up to 3NF and justify each step.', 15, 'hard'),
  (3, 'Explain functional dependency and closure of attributes.', 10, 'medium'),
  (4, 'Explain ACID properties with examples.', 10, 'medium'),
  (4, 'Describe two-phase locking and deadlock handling techniques.', 15, 'hard')
) AS q(unit_number, question_text, marks, difficulty)
ON u.unit_number = q.unit_number
WHERE s.code = 'BCA-CS-DBMS';
