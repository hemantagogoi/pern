CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id INT NOT NULL REFERENCES roles(id),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  status user_status NOT NULL DEFAULT 'pending',
  reset_token_hash TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) UNIQUE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) UNIQUE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE semesters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) UNIQUE NOT NULL,
  semester_number INT UNIQUE NOT NULL CHECK (semester_number BETWEEN 1 AND 12)
);

CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  program_id INT NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
  department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  semester_id INT NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
  name VARCHAR(140) NOT NULL,
  code VARCHAR(30) UNIQUE NOT NULL,
  credits INT NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE units (
  id SERIAL PRIMARY KEY,
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  unit_number INT NOT NULL CHECK (unit_number > 0),
  title VARCHAR(160) NOT NULL,
  UNIQUE(subject_id, unit_number)
);

CREATE TABLE user_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  unit_id INT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  marks INT NOT NULL CHECK (marks > 0),
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE generated_papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  title VARCHAR(180) NOT NULL,
  total_marks INT NOT NULL CHECK (total_marks > 0),
  duration_minutes INT NOT NULL DEFAULT 180,
  instructions TEXT,
  pattern JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE paper_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id UUID NOT NULL REFERENCES generated_papers(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  section VARCHAR(20) DEFAULT 'A',
  display_order INT NOT NULL,
  marks INT NOT NULL,
  UNIQUE(paper_id, question_id)
);

CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id),
  action VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_subjects_links ON subjects(program_id, department_id, semester_id);
CREATE INDEX idx_user_subjects_user_status ON user_subjects(user_id, status);
CREATE INDEX idx_questions_subject_unit ON questions(subject_id, unit_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
