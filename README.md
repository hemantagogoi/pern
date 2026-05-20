# Automated Question Paper Generator System

A production-oriented PERN application for a college or university to manage programs, departments, semesters, subjects, faculty approvals, question banks, and automated question paper generation.

## Stack

- PostgreSQL with relational schema and foreign keys
- Express.js REST API with JWT, bcrypt, validation, role checks, and centralized errors
- React, Vite, Redux Toolkit, React Router, Axios, Tailwind CSS
- PDF generation with PDFKit

## Quick Start

1. Create a PostgreSQL database.
2. Copy `server/.env.example` to `server/.env` and update credentials.
3. Run schema and seed:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

4. Install dependencies:

```bash
npm install
npm run install:all
```

5. Start both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000/api`

## Default Seed Accounts

- Admin: `admin@crestwood.edu` / `Admin@12345`
- Faculty: `faculty@crestwood.edu` / `Faculty@12345`

## Core Workflow

1. Faculty registers and remains `pending`.
2. Admin approves the faculty account.
3. Faculty applies for one or more subjects.
4. Admin approves or rejects each subject application.
5. Faculty can generate papers only for approved subjects.
6. Generated papers can be previewed, saved, downloaded as PDF, and printed.

## Architecture

```text
client/
  src/
    app/            Redux store
    components/     Shared UI, layout, route guards
    features/       Auth, admin, faculty, paper generator
    lib/            API client and utilities
server/
  src/
    config/         Database and environment config
    controllers/    HTTP handlers
    middleware/     Auth, roles, validation, errors
    routes/         REST route declarations
    services/       Business logic
    utils/          PDF and async helpers
database/
  schema.sql        Relational schema
  seed.sql          Demo data
docs/
  implementation-plan.md
  api.md
  er-diagram.md
```

## Question Paper Logic

The generator verifies the user has approved access to the subject, fetches eligible questions by unit, marks, and optional difficulty, shuffles them with PostgreSQL `ORDER BY random()`, prevents duplicates with a `Set`, validates the selected marks against the requested total, then stores the generated paper and linked questions inside a database transaction.
