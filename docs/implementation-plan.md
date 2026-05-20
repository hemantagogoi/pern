# Implementation Plan

## Phase 1: Foundation

1. Create PostgreSQL schema with strict foreign keys, enums, and indexes.
2. Configure Express with security middleware, CORS, JSON parsing, request logging, and centralized error handling.
3. Implement JWT authentication with bcrypt password hashing.
4. Add role-based access control for `admin` and `faculty`.

## Phase 2: Admin Domain

1. Build CRUD APIs for programs, departments, semesters, and subjects.
2. Build question bank APIs with subject, unit, marks, and difficulty filters.
3. Build user approval APIs.
4. Build subject application approval APIs.
5. Add activity logs for sensitive actions.

## Phase 3: Faculty Domain

1. Allow approved faculty to view available subjects.
2. Allow faculty to apply for multiple subjects.
3. Display application status.
4. Restrict subject access until admin approval.

## Phase 4: Paper Generator

1. Accept paper settings: subject, total marks, per-unit question counts, optional difficulty, title, duration, instructions.
2. Verify approved subject access.
3. Randomly select questions per unit with no duplicates.
4. Validate marks and persist generated paper.
5. Provide preview, PDF download, print, and previous-paper history.

## Phase 5: Frontend

1. Build landing page with hero, features, about, contact, and auth links.
2. Build auth screens with validation, toasts, and loading states.
3. Build admin dashboard with cards, tables, search, filters, and forms.
4. Build faculty dashboard with approved subjects, applications, and generated papers.
5. Add dark/light mode and responsive sidebar navigation.

## Phase 6: Production Hardening

1. Add rate limiting to auth endpoints.
2. Add request validation for all mutation routes.
3. Add audit logging for approvals and destructive actions.
4. Add tests for auth, access control, subject approvals, and generator edge cases.
5. Deploy with managed PostgreSQL, environment variables, HTTPS, and CI checks.
