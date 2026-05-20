# REST API Overview

Base URL: `/api`

## Auth

- `POST /auth/register` - register faculty account, defaults to pending approval
- `POST /auth/login` - login approved users
- `POST /auth/forgot-password` - start reset flow placeholder
- `GET /auth/me` - current authenticated user

## Admin

- `GET /admin/analytics`
- `GET /admin/users`
- `PATCH /admin/users/:id/status`
- `DELETE /admin/users/:id`
- `GET /admin/subject-applications`
- `PATCH /admin/subject-applications/:id`

## Catalog

- `/programs` - CRUD
- `/departments` - CRUD
- `/semesters` - CRUD
- `/subjects` - CRUD
- `/questions` - CRUD

## Faculty

- `GET /faculty/subjects/available`
- `GET /faculty/subjects/approved`
- `POST /faculty/subjects/apply`
- `GET /faculty/subjects/applications`
- `GET /faculty/papers`

## Papers

- `POST /papers/generate`
- `GET /papers/:id`
- `GET /papers/:id/pdf`
