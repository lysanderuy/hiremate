# Job Board with AI Resume Matching: Brief

Recruiters post job listings. Applicants upload a PDF resume and apply. An AI matcher scores a resume against a listing.

Two parts:

- **Part A: Web app.** This pass. Boilerplate only.
- **Part B: ML matcher.** Built. The section below is the original plan, kept for history. The current design is in the PRD (section 6.4) and the README ("ML matching").

## Part A: Web app

### Scope (this pass)

- Start from the starter-stack template, strip what is not needed, add what is.
- Result: builds, typechecks, tests pass, auth works, empty pages and schema in place.
- Out of scope: ML, email, rate limiting, deployment, image resumes and non-PDF formats.

### Stack

- Next.js (App Router), React, TypeScript
- Tailwind
- TanStack Query (server state), Zustand (small UI state)
- Route handlers + Zod (validation) + zod-openapi (docs at /api/docs)
- Supabase: Postgres + Auth. No Storage (the PDF is parsed on upload and only its extracted text is kept in a DB column).
- Drizzle ORM (`postgres` driver)
- Vitest, ESLint, Prettier, Husky

### Template changes

**Remove**

- Deps: `resend`, `@react-email/components`, `@react-email/render`, `@upstash/ratelimit`, `@upstash/redis`, `standardwebhooks`
- Files/folders: `src/emails/`, `src/services/email.service.ts`, `src/app/api/auth/email-hook/`, `src/lib/rate-limit.ts`, `src/lib/rate-limit.test.ts`
- Edits:
  - `src/proxy.ts`: delete the rate-limit block, keep `updateSession`.
  - `src/lib/env.ts` and `.env.example`: delete RESEND__, UPSTASH__, SEND_EMAIL_HOOK_SECRET.
  - `src/app/api/auth/callback/route.ts`: delete `sendWelcomeOnce` and its calls.
  - `src/services/profile.service.ts`: delete `claimWelcomeEmail` and the release method.
  - `src/db/schema/profiles.ts`: drop `welcomeEmailSentAt` (new migration).
  - Login/signup pages: remove any leftover email-service references. Keep `supabase.auth.resend`, it is Supabase's own.
  - `README.md`, `AGENTS.md`: remove email and rate-limit mentions.
- Template sample code: the placeholder dashboard page (replace with role dashboards).

**Keep**

- Auth pages and routes (`(auth)/*`, `api/auth/callback`, `api/auth/logout`), `lib/supabase/*`
- `proxy.ts` + `updateSession` (route protection)
- `lib/api/*` (client, response, openapi), `lib/query/*`, `lib/env.ts` (lazy validation)
- `db/`, `drizzle.config.ts`, `scripts/*`, migrations 0000 and 0001 (profile table + auth trigger + RLS)
- `profile` route/service/validator/hook (extend with `role`)
- Vitest, lint, prettier, husky config

**Add**

- `role` on profiles: `applicant` or `recruiter`. Chosen at signup, copied by the auth trigger from user metadata.
- Tables below, each with RLS enabled.
- Services, validators, hooks, routes, pages listed below.
- Role guard (server side) for dashboard sections.
- Seed script: 1 recruiter, 1 applicant, ~10 jobs.

### Rules for the agent

- Flow: page -> hook -> `lib/api` client -> route handler -> service -> Drizzle.
- Route handlers do auth, role check, ownership check, and Zod parse. Services hold the queries only.
- Drizzle bypasses RLS. Authorization lives in route handlers. Still `ENABLE ROW LEVEL SECURITY` on every table.
- Env vars stay lazy (`lib/env.ts`). Optional integrations get added there only when used.
- UUID primary keys, `timestamptz`, snake_case columns, camelCase in TS.
- One migration per change (`db:generate`, then `db:migrate`).
- Every new route is in the OpenAPI doc.

### Data model

| Table        | Columns                                                                                                                                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| profiles     | id (= auth.users.id), email, display_name, role, created_at, updated_at                                                                                                                                                                 |
| companies    | id, owner_id -> profiles, name, created_at                                                                                                                                                                                              |
| jobs         | id, company_id, recruiter_id, title, description, location, employment_type, status (`open`/`closed`), created_at, updated_at                                                                                                           |
| resumes      | id, applicant_id (unique), text (extracted from the uploaded PDF), source (`pdf`), state (`ready`/`failed`), created_at, updated_at                                                                                                     |
| applications | id, job_id, applicant_id, resume_id, status (`submitted`/`viewed`/`shortlisted`/`interview`/`rejected`/`withdrawn`), created_at. Unique (job_id, applicant_id) among non-withdrawn rows, so an applicant can re-apply after withdrawing |

Part B added `embedding real[]` on `jobs` and `resumes` and `skills text[]` on `resumes`. There is no `match_scores` cache: scores are computed from the stored embeddings.

### Access rules

- Public: landing, job list, job detail (open jobs only).
- Applicant: own profile, own resume, apply, own applications.
- Recruiter: own company, own jobs (create/edit/close), applications for own jobs only.
- Nobody reads another user's resume, except a recruiter on an application to their job.

### Routes

| Route                                | Who               | Does                                                 |
| ------------------------------------ | ----------------- | ---------------------------------------------------- |
| GET /api/jobs, GET /api/jobs/[id]    | public            | list/detail open jobs                                |
| POST /api/jobs, PATCH /api/jobs/[id] | recruiter         | create, edit, close own                              |
| GET /api/jobs/[id]/applications      | recruiter (owner) | applicants for a job                                 |
| GET, PUT /api/resumes/me             | applicant         | read, replace own resume text                        |
| POST /api/resumes/me/pdf             | applicant         | upload a PDF (up to 4 MB), extract and save its text |
| POST /api/applications               | applicant         | apply to a job                                       |
| GET /api/applications/me             | applicant         | own applications                                     |
| PATCH /api/applications/[id]         | recruiter (owner) | change status                                        |
| GET, PATCH /api/profile              | any               | own profile                                          |

### Pages

- `/` landing
- `/jobs`, `/jobs/[id]`
- `/login`, `/signup` (role picker), `/forgot-password`, `/reset-password`
- `/dashboard/applicant`: my resume, my applications
- `/dashboard/recruiter`: my jobs, new job, applicants per job

### Target structure

```
src/
  app/
    (auth)/
    (public)/            landing, jobs
    dashboard/
      applicant/  recruiter/
    api/
      auth/  profile/  jobs/  resumes/  applications/
  db/schema/             profiles companies jobs resumes applications
  services/              job resume application profile
  validators/            one per resource
  hooks/                 use-jobs use-resume use-applications use-profile
  components/            ui/  shared/
  lib/                   api/ query/ supabase/ env.ts
  proxy.ts
```

### Done when

- `npm run typecheck`, `lint`, `test`, `build` all pass.
- Sign up as either role, log in, land on the right dashboard.
- Recruiter can post a job. Applicant can save a resume and apply.
- No import or env var refers to Resend or Upstash.

### Open decisions (default in brackets)

- Recruiter sign-up needs approval? [no, self-select role]
- Company: one per recruiter, name only? [yes]
- Resume input: PDF upload only, up to 4 MB and 30 pages. Text is extracted server-side; no pasted or .txt input. [decided]
- Snapshot resume text on apply? [yes, `resume_snapshot` on the application]
- Email confirmation on signup? [off in dev]

## Part B: ML matcher (original plan, now built)

### What it does

Scores how well a resume fits a job listing. Reference implementation: `resume_matcher.ipynb` (Colab).

### Methods

1. **Keyword:** share of the job's skills found in the resume. Skills come from a curated `skills` table, not learned live.
2. **TF-IDF cosine:** notebook only. Needs the whole corpus, so it is not used on the site.
3. **SBERT cosine:** `all-MiniLM-L6-v2`, 384 dims. Text split in 150-word chunks, chunk vectors averaged, normalized.

- Notebook blend: keyword 0.3, tfidf 0.2, sbert 0.5, each scaled 0-1 per resume. A ranking, not a percent.
- Site blend: keyword + sbert only. Weights to be re-tuned.

### Site design

- **Embed once on save, compare on read.**
  - Saving a resume or job: extract skills, compute the vector, store both in Postgres (`pgvector`).
  - "See my score": skills overlap in SQL + cosine (`1 - (a <=> b)`), blended.
  - Score on a listing must work before applying.
- **Skills table:** seed from real postings, clean by hand once, store aliases and an active flag. Ambiguous words (go, flow, spring) stay inactive.
- **ML service:** small Python service (FastAPI) that returns a vector and skills for a text. Next.js calls it on save. Host is undecided.
- Score display scale is undecided (needs real score spread).

### Later tasks

- Enable `pgvector`, add columns, backfill.
- Skills table + seed.
- ML service + call on save.
- Score endpoint and UI ("see my score", ranked jobs for an applicant, ranked applicants for a job).
- Fix years/degree extraction (many resumes show 0 years).
- Accuracy check: category retrieval on the resume dataset.
- Decide where the ML service runs.
