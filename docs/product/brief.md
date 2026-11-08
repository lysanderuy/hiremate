# TalentFlow AI: Brief

## Product

- **Name:** TalentFlow AI
- **One line:** A job board that scores how well your resume fits a listing, before you apply.
- **What it is:** Recruiters post listings. Applicants upload a PDF resume and apply. The system scores each resume against each listing and shows the result to both sides.

## Brand personality

**How it feels:** clear, calm, fair, quick. Professional, but not corporate or stiff. It should feel like a sharp friend who knows the job market and tells you straight.

**How it talks:**

- Plain words and short sentences. Speaks to "you".
- Numbers over adjectives. Shows why: "You have 6 of 8 skills this job asks for."
- Says what the score means and what it does not. A score is a ranking, not a verdict.
- No hype, no buzzwords, no exclamation marks.

| Sounds like                                             | Does not sound like                     |
| ------------------------------------------------------- | --------------------------------------- |
| Strong match. You have 6 of 8 skills this job asks for. | Unlock your dream career with AI magic! |
| Missing: Docker, AWS.                                   | You are not qualified.                  |
| 12 applicants. Top match: 84%.                          | Revolutionary candidate intelligence.   |

**What it is:**

- A guide that helps you decide where to apply.
- Transparent. Every score shows the skills behind it.
- Practical. Fewer wasted applications, less time screening.
- Quietly smart. The AI does the work and stays out of the way.

**What it is not:**

- A hype AI product.
- A gatekeeper that rejects people.
- A black box that gives a score with no reason.
- Playful or gimmicky.
- A replacement for the recruiter's decision.

## Positioning statement

For job seekers and recruiters who lose time on applications that do not fit, TalentFlow AI is a job board that scores a resume against a listing by meaning, not just keywords. Unlike job boards that filter on exact keywords and give no feedback, it shows applicants their fit before they apply and gives recruiters a ranked list of applicants.

## Target audience

**Primary**

- **Applicants.** People applying to several roles who send a lot of applications and rarely hear why they were passed over. They want to know their fit before applying, and what is missing. They bring a PDF resume.
- **Recruiters.** People hiring for open roles who get hundreds of applications per position and screen by hand. They want the best matches first, with a reason for each.

**Secondary**

- **Administrators.** Platform owners. They approve recruiter accounts, suspend and reactivate users, moderate listings, read platform stats and export CSV reports.

## Core value proposition

**Know your fit before you apply.**

TalentFlow AI shows a match score you can read and understand, using the meaning of a resume and not only its keywords. Equal qualifications written in different words still match.

Why it holds up:

- **For applicants:** the score appears on the listing, before applying, with the skills matched and the skills missing.
- **For recruiters:** applicants come ranked by fit, with the skill gaps per person.

## How it works

- **Resume.** A PDF (up to 4 MB and 30 pages). The file is stored in `resume_files`; the text extracted from it is stored in `resumes.text`.
- **Matching.** A trained model (`src/lib/matching/model.json`, produced by the `ml/` pipeline) scores a resume against a listing in TypeScript, from stored embeddings and extracted skills. The `matcher/` service only embeds text; it is never called when a score is read, and there is no pgvector. Band cutoffs come from the model file.
- **Skills.** One skills list, shared with the model. It changes only by retraining and reseeding.
- **Listings** need at least 3 skills.
- **Flow.** Page, TanStack Query hook, API wrapper, route handler, service, Drizzle. Route handlers authenticate, authorize and validate; services hold the business logic and queries.

## Accounts and administration

- **Roles.** Applicant, recruiter or administrator. Applicants and recruiters choose a role at signup; it is read-only afterwards.
- **Recruiter approval.** New recruiters are pending until an administrator approves them. A rejection carries a reason, and the recruiter can send a review request.
- **Suspension.** Administrators suspend and reactivate users.
- **Administrator console.** Users, approvals, listings, platform stats and CSV exports.

## Data rules

- UUID primary keys, `timestamptz`, snake_case columns in the database and camelCase in TypeScript.
- Row level security is enabled on every table. Drizzle bypasses it, so authorization lives in route handlers and services.
- Nobody reads another user's resume, except a recruiter on an application to their own listing.

## Future

No items recorded.
