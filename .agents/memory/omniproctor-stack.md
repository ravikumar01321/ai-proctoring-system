---
name: OmniProctor Stack
description: Key decisions and layout for the AI proctoring system — auth, DB, frontend, seed data
---

## Auth
- JWT signed with `SESSION_SECRET` env var, stored in localStorage under `proctor_token`
- `setAuthTokenGetter(() => localStorage.getItem("proctor_token"))` in `main.tsx`
- Bcrypt password hashing (12 rounds) in api-server

## Seed credentials (all use password `password123`)
- admin@proctorx.com (role: admin, id: 1)
- proctor@proctorx.com (role: proctor, id: 2)
- student@proctorx.com (role: student, id: 3)
- maria@proctorx.com (role: student, id: 4)

## DB tables (lib/db/src/schema/)
users, exams, questions, enrollments, answers, violations, results, activity

## API routes (artifacts/api-server/src/routes/)
auth, users, exams, questions, enrollments, answers, violations, results, dashboard

## Frontend pages (artifacts/proctor-app/src/pages/)
Login, Register, Dashboard, ExamsList, NewExam, ExamDetail, ExamMonitor, Students, MyExams, TakeExam, Results

## useListExams hook signature
`useListExams(params, options)` — params is first arg (ListExamsParams), options is second

**Why:** Orval generates hooks where query params are the first arg, not inside options object.

## After any lib schema change
Must run `pnpm run typecheck:libs` before checking api-server typecheck (rebuilds declarations).
