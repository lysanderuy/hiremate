# TalentFlow AI: PRD (MVP)

Version: MVP v1. Date: 2026-10-08.
Companion file: `talentflow-ai_brief.md` (brand, positioning, audience). Terms here match that file.

## 0. Glossary

| Term              | Meaning                                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TalentFlow AI     | The product. A job board that scores how well a resume fits a listing, before you apply.                                                                                          |
| Applicant         | A user who saves a resume and applies to listings.                                                                                                                                |
| Recruiter         | A user who posts listings and reviews applicants. Needs administrator approval before posting.                                                                                    |
| Administrator     | A platform owner. Approves recruiters, manages users, moderates listings, manages the skills list, reads platform reports.                                                        |
| Company           | The employer a recruiter posts for. One company per recruiter in the MVP. Name only.                                                                                              |
| Listing           | A job posting made by a recruiter.                                                                                                                                                |
| Resume            | The applicant's text resume. One per applicant. Plain text is the source of truth.                                                                                                |
| Application       | An applicant's submission to one listing. Carries a snapshot of the resume.                                                                                                       |
| Snapshot          | The copy of the resume text kept with an application at the moment it was submitted.                                                                                              |
| Match score       | A whole number from 0 to 100 showing how well one resume fits one listing. A ranking aid, not a verdict.                                                                          |
| Band              | The label of a match score: Strong (70 to 100), Fair (40 to 69), Weak (0 to 39).                                                                                                  |
| Fit               | Plain word for how well a resume matches a listing. Shown to users as the match score and its band.                                                                               |
| Skill             | A named skill or tool, such as Python or SQL, kept in the skills list.                                                                                                            |
| Skills list       | The curated list of skills the system looks for in resumes and listings. Managed by administrators.                                                                               |
| Skills matched    | Skills the listing asks for that the resume has.                                                                                                                                  |
| Skills missing    | Skills the listing asks for that the resume does not have.                                                                                                                        |
| Status            | Where an application is in review: Submitted, Viewed, Shortlisted, Interview, Rejected, Withdrawn. Interview is a label the recruiter sets. It carries no date and no scheduling. |
| Account status    | State of a user account: Active, Pending, Rejected, Suspended.                                                                                                                    |
| Ranked applicants | The applicants of one listing, sorted by match score, highest first.                                                                                                              |
| Salary range      | Optional monthly pay range on a listing, in PHP, as a minimum and a maximum.                                                                                                      |
| Employment type   | One of Full-time, Part-time, Contract, Internship.                                                                                                                                |
| Processing        | The short step after a resume or listing is saved, while skills are found and the text is prepared for scoring.                                                                   |

## 1. What the product is, and is not

**TalentFlow AI is:**

- A job board with three roles: Applicant, Recruiter, Administrator.
- A match score for any resume and listing pair, shown to the applicant before applying and to the recruiter on every application.
- Text-first. The match score reads the meaning of the text, not only keywords.
- Transparent. Every match score shows skills matched and skills missing.

**TalentFlow AI is not:**

- A gatekeeper. It never rejects, hides or blocks an applicant because of a score.
- A black box. No score is shown without its reasons.
- A resume builder, career coach or messaging tool.
- An applicant tracking system with workflows, interview scheduling or offers. The Interview status is a plain label. It does not schedule, invite or notify.
- A replacement for the recruiter's decision.

## 2. Core product principles

1. **Show the fit before the apply.** The match score is visible on a listing before the applicant applies.
2. **Every score has a reason.** Show skills matched and skills missing next to the match score.
3. **A score is a ranking aid.** The recruiter decides. Nothing is automated based on a score.
4. **One of each, to stay simple.** One resume per applicant, one company per recruiter, one application per applicant per listing.
5. **Plain text is the source of truth.** PDFs are read for their text only. The text is what gets scored and shown.
6. **Fair by default.** The match score uses only resume text and listing text. No demographic fields exist in the product.
7. **Private by default.** A resume is visible only to the recruiter of a listing the applicant applied to.
8. **Plain voice.** Short sentences, numbers over adjectives, no hype, no exclamation marks.

## 3. Target users

**Primary**

- **Applicant.** Applies to several roles. Wants to know their fit before applying and what is missing. Brings a text resume or a text-based PDF. Success: sends fewer, better applications.
- **Recruiter.** Hires for open roles and gets many applications per listing. Wants the best fits first, with a reason for each. Success: shortlists faster from ranked applicants.

**Secondary**

- **Administrator.** Keeps the platform clean. Approves recruiters, suspends users, removes bad listings, keeps the skills list accurate, reads platform reports.

## 4. Core entities

**User**

| Field            | Rules                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| id               | unique                                                                                                                           |
| email            | unique, valid email                                                                                                              |
| display_name     | required, 2 to 80 characters                                                                                                     |
| role             | Applicant, Recruiter, Administrator. Set at sign up. Administrators are created directly in the database, never through sign up. |
| account_status   | Active, Pending, Rejected, Suspended                                                                                             |
| rejection_reason | optional text, up to 300 characters, set when a recruiter is rejected                                                            |
| approved_at      | timestamp, set when an administrator first approves a Recruiter. Empty if never approved.                                        |
| created_at       | timestamp                                                                                                                        |

**Company** (one per recruiter)

| Field | Rules                                         |
| ----- | --------------------------------------------- |
| id    | unique                                        |
| owner | the Recruiter user, one company per recruiter |
| name  | required, 2 to 120 characters                 |

**Listing**

| Field                  | Rules                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| id                     | unique                                                                                             |
| company, recruiter     | set from the logged-in recruiter                                                                   |
| title                  | required, 3 to 120 characters                                                                      |
| description            | required, 50 to 10,000 characters                                                                  |
| location               | required, 2 to 120 characters. "Remote" is allowed.                                                |
| employment_type        | required. Full-time, Part-time, Contract, Internship                                               |
| salary_min, salary_max | optional, whole numbers, PHP per month, 0 to 10,000,000. Both or neither. min must not exceed max. |
| skills                 | list of Skills, up to 30. Filled from the title and description, editable by the recruiter.        |
| status                 | Open, Closed, Removed                                                                              |
| match_ready            | true when Processing is done. Match scores for this listing need it.                               |
| created_at, updated_at | timestamps                                                                                         |

**Resume** (one per applicant)

| Field            | Rules                                           |
| ---------------- | ----------------------------------------------- |
| id               | unique                                          |
| applicant        | the Applicant user, one resume per applicant    |
| text             | required, 200 to 200,000 characters, plain text |
| source           | Pasted, Text file, PDF. Information only.       |
| processing_state | Processing, Ready, Failed                       |
| skills           | derived from the text. Not editable in the MVP. |
| updated_at       | timestamp                                       |

**Application**

| Field                                    | Rules                                                          |
| ---------------------------------------- | -------------------------------------------------------------- |
| id                                       | unique                                                         |
| listing, applicant                       | one application per applicant per listing, ever                |
| resume_snapshot                          | the resume text at submission. Never changes.                  |
| skills_matched, skills_missing           | stored at submission                                           |
| match_score, band                        | stored at submission. Not recalculated later.                  |
| status                                   | Submitted, Viewed, Shortlisted, Interview, Rejected, Withdrawn |
| applied_at, viewed_at, status_changed_at | timestamps                                                     |

**Skill**

| Field     | Rules                                                           |
| --------- | --------------------------------------------------------------- |
| id        | unique                                                          |
| name      | unique, stored lowercase, 2 to 40 characters                    |
| aliases   | list of other spellings, such as "js" for javascript            |
| is_active | true or false. Inactive skills are ignored when finding skills. |

**Match score** (calculated, shown live; stored only inside an application)

| Field                          | Rules                   |
| ------------------------------ | ----------------------- |
| inputs                         | one resume, one listing |
| match_score                    | whole number, 0 to 100  |
| band                           | Strong, Fair, Weak      |
| skills_matched, skills_missing | lists of skill names    |

**Relationships:** a Recruiter has one Company and many Listings. A Listing has many Applications. An Applicant has one Resume and many Applications. A Listing and a Resume have many Skills through the skills list.

## 5. Core user flows

Each flow lists steps and acceptance criteria. Every criterion is a checkable condition.

### FL-01 Sign up as an Applicant

1. Open Sign up. Choose Applicant.
2. Enter display name, email and password. Submit.
3. Confirm by email if confirmation is on (it is off in development).
4. Land on the Applicant dashboard.

Acceptance criteria:

- [ ] The form requires display name (2 to 80 characters), a valid email and a password of at least 8 characters.
- [ ] Role choices on Sign up are Applicant and Recruiter only.
- [ ] A duplicate email shows "An account with this email already exists." and creates no account.
- [ ] A new Applicant has account status Active.
- [ ] With confirmation on, login before confirming is blocked with "Check your email to confirm your account."
- [ ] After sign up, the Applicant lands on the Applicant dashboard.

### FL-02 Log in, log out, reset password

1. Open Login. Enter email and password.
2. The user lands on the dashboard for their role.
3. Log out from the menu. Or choose Forgot password, enter email, follow the link, set a new password.

Acceptance criteria:

- [ ] A wrong email or password shows "Email or password is incorrect." and does not say which one.
- [ ] Applicant lands on the Applicant dashboard, Recruiter on the Recruiter dashboard, Administrator on the Administrator dashboard.
- [ ] A Suspended user cannot log in and sees "This account is suspended."
- [ ] Logging out ends the session and returns to the landing page.
- [ ] Forgot password always shows "If this email has an account, a reset link is on the way." whether or not the email exists.
- [ ] A logged-out visitor who opens a dashboard page is sent to Login. A logged-in user who opens another role's page is sent to their own dashboard.

### FL-03 Sign up as a Recruiter and get approved

1. Open Sign up. Choose Recruiter.
2. Enter display name, email, password and company name. Submit.
3. The account is Pending. The Recruiter sees the page "Awaiting approval."
4. An Administrator opens the Approvals queue and approves or rejects, with an optional reason.
5. If approved, account status becomes Active and the Recruiter can post listings.
6. If rejected, account status becomes Rejected. The Recruiter sees "Your account was not approved." with the reason, and a button "Ask for another review." The button sets the account back to Pending.

Acceptance criteria:

- [ ] Company name is required (2 to 120 characters) and creates the Company.
- [ ] A new Recruiter has account status Pending.
- [ ] A Pending or Rejected Recruiter can log in, view public listings, and sees the status page, but cannot reach Post a listing or applicant pages.
- [ ] The Approvals queue lists Pending Recruiters oldest first with display name, email, company name and sign up date.
- [ ] Approve sets Active in one click. Reject asks for an optional reason up to 300 characters.
- [ ] After approval the Recruiter can open Post a listing on the next page load.
- [ ] "Ask for another review" returns the account to Pending and the Recruiter reappears in the Approvals queue.

### FL-04 Add or replace a resume

1. Applicant opens My resume.
2. Chooses one input: paste text, upload a .txt file, or upload a PDF.
3. The system shows the text for review in an editable box. For a PDF, this is the text read from the file.
4. Applicant edits if needed and presses Save resume.
5. The resume is Processing, then Ready.

Acceptance criteria:

- [ ] Pasted or edited text must be 200 to 200,000 characters. Otherwise Save is blocked with "A resume needs at least 200 characters." or "This resume is too long."
- [ ] A .txt file must be UTF-8 and at most 200 KB. A larger file shows "Text files can be up to 200 KB."
- [ ] A PDF must be at most 4 MB and contain selectable text. A scanned PDF shows "We could not read text from this file. Paste your text or upload a text-based PDF."
- [ ] Other file types are rejected with "Upload a .txt or .pdf file."
- [ ] The uploaded PDF file itself is not stored. Only the text is.
- [ ] Nothing is saved until the applicant presses Save resume.
- [ ] Saving a new resume replaces the old one. The Applicant never has more than one.
- [ ] After saving, processing_state is Processing and then Ready, within 10 seconds for a typical resume.
- [ ] If processing fails, the state is Failed and the page shows "We could not process your resume. Try saving again." with a Retry button.
- [ ] Existing applications keep their snapshot and are not changed.

### FL-05 Browse and search listings

1. Anyone opens Jobs. The list shows Open listings, newest first, 10 per page.
2. The user searches by keyword and filters by location, employment type and minimum salary.
3. A logged-in Applicant with a Ready resume can sort by Best match.
4. The user opens a listing to see the detail page.

Acceptance criteria:

- [ ] Only listings with status Open, from Active recruiters, appear.
- [ ] Keyword search matches title, company name and description, ignoring case.
- [ ] Location filter matches location text, ignoring case. Employment type filter is a single choice or all.
- [ ] Minimum salary filter shows listings where salary_max is at least the entered amount. Listings with no salary range are left out when this filter is used.
- [ ] Each card shows title, company, location, employment type and salary range ("Not specified" if none).
- [ ] Best match sort appears only for an Applicant whose resume is Ready, and orders by match score, highest first. Listings with no score go last.
- [ ] An empty result shows "No listings match your search."
- [ ] A Closed or Removed listing opened by direct link shows "This listing is not open."

### FL-06 See the match score on a listing (before applying)

1. Applicant opens a listing detail page.
2. The page shows the match score card.

Acceptance criteria:

- [ ] A logged-in Applicant with a Ready resume sees the match score, its band, skills matched and skills missing on the listing page.
- [ ] The card reads like "Strong match. You have 6 of 8 skills this job asks for." The first words match the band: "Strong match.", "Fair match.", "Weak match."
- [ ] If the listing has no skills, the card says "This listing has no skills listed. The score is based on meaning only."
- [ ] An Applicant with no resume sees "Add a resume to see your match score." with a link to My resume.
- [ ] An Applicant whose resume is Processing sees "Your resume is being prepared. Try again in a moment."
- [ ] If the listing is not match_ready, the card says "Match score is being prepared. Try again in a moment."
- [ ] A logged-out visitor sees "Log in as an applicant to see your match score."
- [ ] Recruiters and Administrators do not see the match score card on listings.
- [ ] The card shows in under 2 seconds for at least 95 percent of views.
- [ ] The card always includes the note "A score helps you decide. It does not decide for you."

### FL-07 Apply to a listing

1. Applicant presses Apply on an Open listing.
2. A confirmation shows the resume that will be sent and the current match score.
3. Applicant confirms.
4. The application is created with status Submitted.

Acceptance criteria:

- [ ] Apply is available only to an Applicant with a Ready resume on an Open listing.
- [ ] An Applicant with no resume is sent to My resume. After saving, they return to the listing.
- [ ] An Applicant who already has an application to this listing, in any status, sees "You applied on <date>" instead of Apply.
- [ ] On confirm, the application stores the resume snapshot, skills matched, skills missing, match score and band.
- [ ] The application starts as Submitted with applied_at set.
- [ ] A low match score never blocks applying. Weak applications are allowed.
- [ ] If the listing was closed meanwhile, the confirm fails with "This listing is no longer open." and no application is created.
- [ ] After applying, the Applicant sees "Application sent."

### FL-08 Track and withdraw an application

1. Applicant opens My applications.
2. Each row shows listing title, company, status, applied date.
3. Applicant opens one to see the status and the match score at the time of applying.
4. Applicant can press Withdraw.

Acceptance criteria:

- [ ] The list shows only the logged-in Applicant's applications, newest first.
- [ ] Status changes made by the recruiter show here on the next page load.
- [ ] Withdraw is available for Submitted, Viewed, Shortlisted and Interview. It is not available for Rejected or Withdrawn.
- [ ] Withdraw asks for confirmation. After it, status is Withdrawn and cannot be undone.
- [ ] After Withdrawn, the Applicant cannot apply to the same listing again.
- [ ] Applications to Closed or Removed listings stay visible.

### FL-09 Post a listing

1. An Active Recruiter opens Post a listing.
2. Enters title, description, location, employment type, and optional salary range.
3. The form suggests skills found in the title and description. The Recruiter can add or remove skills.
4. Presses Publish.
5. The listing is Open and goes through Processing.

Acceptance criteria:

- [ ] Only an Active Recruiter can open the form.
- [ ] Title, description, location and employment type are required and follow the limits in section 4.
- [ ] If salary is entered, both minimum and maximum are required and the minimum is not above the maximum. Otherwise show "Enter both amounts, with the minimum at or below the maximum."
- [ ] Suggested skills come from active skills in the skills list, found in the title and description. The Recruiter can add skills from the skills list and remove suggested ones. Up to 30.
- [ ] The Recruiter cannot add a skill that is not in the skills list.
- [ ] After Publish, status is Open and the listing appears in Jobs.
- [ ] The listing's match_ready becomes true within 10 seconds for a typical listing.
- [ ] The listing is linked to the Recruiter's Company.

### FL-10 Edit, close, reopen or delete a listing

1. Recruiter opens My listings and selects a listing.
2. Actions: Edit, Close, Reopen, Delete.

Acceptance criteria:

- [ ] A Recruiter can act only on their own listings.
- [ ] Edit changes any field. After a title, description or skills change, match_ready is false until Processing is done.
- [ ] Editing a listing does not change existing applications or their stored match scores.
- [ ] Close sets status Closed. The listing leaves Jobs and Apply is blocked. Applications stay.
- [ ] Reopen sets a Closed listing back to Open. It does not work on a Removed listing.
- [ ] Delete is available only when the listing has zero applications. Otherwise it is disabled with "Close this listing instead. It has applications."
- [ ] Delete asks for confirmation and removes the listing permanently.
- [ ] My listings shows each listing's status and number of applications.

### FL-11 Review applicants

1. Recruiter opens a listing's Applicants page.
2. The list shows ranked applicants.
3. Recruiter opens an application to read the resume snapshot.
4. Recruiter sets the status.

Acceptance criteria:

- [ ] Only the listing's own Recruiter can open its Applicants page.
- [ ] The default order is match score, highest first. The Recruiter can switch to Newest first.
- [ ] Each row shows applicant display name, match score, band, status, applied date.
- [ ] The Recruiter can filter by status and by band.
- [ ] Opening an application shows the resume snapshot as plain text, skills matched and skills missing.
- [ ] Opening a Submitted application sets status Viewed and viewed_at, once.
- [ ] The Recruiter can set status to Viewed, Shortlisted, Interview or Rejected, in any order among those four.
- [ ] The Recruiter cannot set Submitted or Withdrawn.
- [ ] Setting Interview records no date, sends no invite and sends no message. It only changes the status.
- [ ] A Withdrawn application stays in the list, marked Withdrawn, and its status cannot be changed.
- [ ] Applicant email is visible to the Recruiter only for that listing's applications.

### FL-12 Recruiter analytics

1. Recruiter opens a listing's Analytics tab, or the Recruiter dashboard for all listings.

Acceptance criteria:

- [ ] Per listing, the Analytics tab shows: total applications, applications per day for the last 30 days, count by band, count by status, and the 5 most common skills missing among its applicants.
- [ ] The Recruiter dashboard shows: listings by status, total applications across own listings, applications received in the last 7 days, the number of applications marked Shortlisted, and the number marked Interview.
- [ ] A Recruiter sees only their own data.

### FL-13 Administrator: manage users

1. Administrator opens Users.
2. Searches by name or email, filters by role and account status.
3. Suspends or reactivates a user.

Acceptance criteria:

- [ ] Only an Administrator can open Users.
- [ ] The list shows display name, email, role, account status, sign up date, 20 per page.
- [ ] Suspend asks for confirmation. A Suspended user is logged out on their next request and cannot log in.
- [ ] While a Recruiter is Suspended, their Open listings are hidden from Jobs. Their status stays Open and they return when the Recruiter is reactivated.
- [ ] Reactivate sets account status Active for an Applicant. For a Recruiter, it sets Active if approved_at is set, or Pending if it is empty.
- [ ] An Administrator cannot suspend their own account.
- [ ] Administrators cannot read resumes or application contents from Users.
- [ ] Approve and reject actions for Pending recruiters are the ones in FL-03.

### FL-14 Administrator: moderate listings

1. Administrator opens Listings.
2. Filters by status, searches by title or company.
3. Removes or restores a listing.

Acceptance criteria:

- [ ] The Administrator sees listings in all statuses.
- [ ] Remove sets status Removed, with an optional reason up to 300 characters. The listing leaves Jobs and Apply is blocked.
- [ ] A Removed listing cannot be reopened by its Recruiter. The Recruiter sees "Removed by an administrator." with the reason.
- [ ] Restore sets a Removed listing to Closed. The Recruiter can then reopen it.
- [ ] Applications on a Removed listing stay visible to the Applicant and the Recruiter.

### FL-15 Administrator: manage the skills list

1. Administrator opens Skills.
2. Searches the list, adds a skill, edits a skill or its aliases, switches a skill active or inactive.

Acceptance criteria:

- [ ] Skill names are unique, lowercase, 2 to 40 characters. A duplicate shows "This skill already exists."
- [ ] Aliases are unique across the whole list. An alias that already belongs to another skill is rejected.
- [ ] An inactive skill is no longer found in new resumes and listings. It stays on existing records.
- [ ] Changes apply to resumes and listings saved after the change. Existing stored results are not recalculated.
- [ ] The list shows name, aliases, active state, and the number of Open listings that use the skill.
- [ ] Skills are never deleted in the MVP, only made inactive.

### FL-16 Administrator: platform dashboard and export

1. Administrator opens the dashboard.
2. Presses Export CSV and picks Users, Listings or Applications.

Acceptance criteria:

- [ ] The dashboard shows: users by role and account status, listings by status, applications per day for the last 30 days, average match score across all applications, the 10 most requested skills across Open listings, and the number of Open listings with zero applications.
- [ ] Export Users columns: display name, email, role, account status, sign up date.
- [ ] Export Listings columns: title, company, recruiter, location, employment type, salary min, salary max, status, created date, application count.
- [ ] Export Applications columns: listing title, applicant name, match score, band, status, applied date. It does not include resume text or applicant email.
- [ ] The CSV rules in section 6.10 apply (UTF-8 with byte order mark, formula protection, escaping).
- [ ] The file name is `<export-name>_<YYYY-MM-DD>.csv` with unsafe characters removed. An export with no rows gives a file with the header row only.

## 6. Feature specifications

### 6.1 Accounts and roles

- Sign up creates an Applicant or a Recruiter. Administrators are created directly in the database.
- Account status controls access: Active can use the product. Pending and Rejected Recruiters see only the status page and public listings. Suspended users cannot log in.
- Pages are protected by role. Every API route checks login, role, and ownership before it returns data.
- Confirmation and password reset emails come from the auth provider. The product sends no other email.

### 6.2 Resume handling

- Inputs: pasted text, .txt (UTF-8, up to 200 KB), PDF (up to 4 MB, text-based).
- PDF reading takes the text only and keeps reading order as best it can. Columns and tables can come out jumbled, which is why the text is shown for review and editing before saving.
- A PDF with fewer than 200 readable characters is treated as scanned and rejected.
- Only the final text is stored. Original files are not stored.
- One resume per applicant. A new save replaces the old one.
- After saving, the system finds skills in the text and prepares it for scoring. This is Processing. It runs once per save, not once per view.

### 6.3 Skills list and skill finding

- A skill is found in a text when its name or one of its aliases appears as a whole word or phrase, ignoring case.
- Longer names win over shorter ones ("power bi" over "power").
- Names with symbols, such as "c++" and "c#", match correctly.
- Only active skills are used.
- The list is seeded from the most common skills in real job postings, then cleaned by hand once. Ambiguous everyday words (such as go, flow, spring) start as inactive.

### 6.4 Match score

Inputs: the resume text and the listing's title and description, plus the listing's skills.

Calculation:

1. `skills_overlap` = number of skills matched divided by the number of skills on the listing. Used only if the listing has at least one skill.
2. `semantic` = how alike the meaning of the resume and the listing are. The text is read by the model all-MiniLM-L6-v2, which turns it into numbers. Long texts are split into 150-word pieces and averaged. The similarity is the cosine of the two result vectors, then scaled: `semantic = clamp((cosine - LOW) / (HIGH - LOW), 0, 1)`.
3. If the listing has skills: `match_score = round(100 * (0.4 * skills_overlap + 0.6 * semantic))`.
4. If the listing has no skills: `match_score = round(100 * semantic)`.
5. `band`: Strong for 70 to 100, Fair for 40 to 69, Weak for 0 to 39.

Rules:

- LOW and HIGH start at 0.15 and 0.65. These are initial guesses. They are calibrated on the notebook's real score spread and kept in one config file. The blend (0.4 and 0.6) and the band cutoffs live in the same file. None of them can be changed from inside the product in the MVP.
- Skills matched and skills missing come from the same skills used in step 1.
- Skills missing shows up to 8 names, then "and N more."
- The match score reads the resume text and listing text only. No other user data is an input.
- Scores are calculated when asked for, using results stored when the resume and listing were saved.
- An application stores its own match score at submission. It does not change afterward.
- Copy by band: "Strong match.", "Fair match.", "Weak match." followed by "You have X of Y skills this job asks for." Add "Missing: A, B." when skills are missing.

### 6.5 Listings

- Fields and limits are in section 4.
- Status: Open, Closed, Removed (see section 8).
- Skills are suggested from the text and editable, from the skills list only.
- Salary is optional, monthly, in PHP only. Shown as "PHP 30,000 to 45,000 per month" or "Not specified."
- Delete only with zero applications. Otherwise Close.
- Listings of a Suspended or non-Active Recruiter are hidden from Jobs.

### 6.6 Job search

- Keyword, location, employment type, minimum salary. Sort: Newest (default) and Best match (for Applicants with a Ready resume).
- 10 listings per page.
- Only Open listings of Active Recruiters are shown.

### 6.7 Applications

- One application per applicant per listing, ever. No re-apply after Withdrawn.
- Created only for Open listings by Applicants with a Ready resume.
- Stores a snapshot, skills matched, skills missing, match score and band at submission.
- Statuses and who can set them are in section 8.
- Recruiters see applicant display name and email, and the resume snapshot, only for their own listings.
- No messages and no email are sent when a status changes. Applicants see the new status in My applications.

### 6.8 Recruiter review

- Ranked applicants by match score, with filters by status and band.
- Opening a Submitted application marks it Viewed once.
- The resume is shown as plain text.
- A Recruiter decides. No status is ever set by the system except Viewed on first open.

### 6.9 Analytics

- Recruiter: per listing and overall, own data only (FL-12). No export.
- Administrator: platform-wide (FL-16).
- All figures are counts, daily series or the averages listed. No cohorts, no funnels beyond status counts, no date range picker in the MVP (fixed 30 days or 7 days as stated).

### 6.10 CSV export

- Administrator only: users, listings, applications. Recruiters have no export.
- UTF-8 with byte order mark. Formula protection on cells starting with =, +, - or @. Standard escaping.
- Generated on the server and downloaded as a file. No outside service.

### 6.11 Administration

- Approvals queue, Users, Listings, Skills, dashboard (FL-03, FL-13 to FL-16).
- Administrators cannot read resumes or applications.

### 6.12 Quality targets

- Match score card in under 2 seconds, 95 percent of views.
- Resume or listing Processing done within 10 seconds for a typical text.
- Pages for each role respond in under 1 second for lists of up to 10 rows, after the first load.
- Works on current desktop and mobile browsers. Layout adapts down to a 360 pixel width.

## 7. Roles and permissions

Recruiter (Active) is a Recruiter with account status Active. Recruiter (not active) is Pending or Rejected. Suspended users of any role cannot log in, so they have no permissions.

| Action                                             | Guest | Applicant | Recruiter (Active) | Recruiter (not active) | Administrator |
| -------------------------------------------------- | ----- | --------- | ------------------ | ---------------------- | ------------- |
| View landing page                                  | Yes   | Yes       | Yes                | Yes                    | Yes           |
| Browse and search Open listings                    | Yes   | Yes       | Yes                | Yes                    | Yes           |
| View a listing detail (Open)                       | Yes   | Yes       | Yes                | Yes                    | Yes           |
| Sign up, log in, reset password                    | Yes   | Yes       | Yes                | Yes                    | Yes           |
| Save or replace own resume                         | No    | Yes       | No                 | No                     | No            |
| See match score on a listing                       | No    | Yes       | No                 | No                     | No            |
| Sort listings by Best match                        | No    | Yes       | No                 | No                     | No            |
| Apply to a listing                                 | No    | Yes       | No                 | No                     | No            |
| View and withdraw own applications                 | No    | Yes       | No                 | No                     | No            |
| Create a listing                                   | No    | No        | Yes                | No                     | No            |
| Edit, close, reopen own listings                   | No    | No        | Yes                | No                     | No            |
| Delete own listing (zero applications)             | No    | No        | Yes                | No                     | No            |
| View applicants of own listings                    | No    | No        | Yes                | No                     | No            |
| Read resume snapshot of own listing's applications | No    | No        | Yes                | No                     | No            |
| Change application status (own listings)           | No    | No        | Yes                | No                     | No            |
| Recruiter analytics (own data)                     | No    | No        | Yes                | No                     | No            |
| Ask for another review (when Rejected)             | No    | No        | No                 | Yes                    | No            |
| View Approvals queue, approve, reject              | No    | No        | No                 | No                     | Yes           |
| View users, suspend, reactivate                    | No    | No        | No                 | No                     | Yes           |
| View all listings, remove, restore                 | No    | No        | No                 | No                     | Yes           |
| Manage the skills list                             | No    | No        | No                 | No                     | Yes           |
| Platform dashboard and export                      | No    | No        | No                 | No                     | Yes           |
| Read any resume or application contents            | No    | Own only  | Own listings only  | No                     | No            |

## 8. System states

**Account status** (User)

| State     | Meaning                                                                    | Moves to                                                                         |
| --------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Pending   | New Recruiter, or a Rejected Recruiter who asked again. Awaiting approval. | Active (administrator approves), Rejected (administrator rejects)                |
| Active    | Normal access. Every new Applicant starts here.                            | Suspended (administrator)                                                        |
| Rejected  | Recruiter not approved.                                                    | Pending (the Recruiter asks for another review)                                  |
| Suspended | Cannot log in.                                                             | Active, or Pending if a Recruiter was never approved (administrator reactivates) |

**Listing status**

| State   | Meaning                                | Moves to | Who                     |
| ------- | -------------------------------------- | -------- | ----------------------- |
| Open    | Visible in Jobs. Accepts applications. | Closed   | Recruiter               |
| Open    |                                        | Removed  | Administrator           |
| Closed  | Hidden from Jobs. No new applications. | Open     | Recruiter               |
| Closed  |                                        | Removed  | Administrator           |
| Removed | Hidden. Locked for the Recruiter.      | Closed   | Administrator (Restore) |

A listing with zero applications can also be deleted by its Recruiter, which removes it permanently. Deleted is not a state.

**Resume processing_state**

| State      | Meaning                                        | Moves to                       |
| ---------- | ---------------------------------------------- | ------------------------------ |
| Processing | Saved. Skills and scoring data being prepared. | Ready, Failed                  |
| Ready      | Match scores and Apply work.                   | Processing (on a new save)     |
| Failed     | Preparation failed.                            | Processing (Retry or new save) |

No resume: the Applicant has no resume yet. Scores and Apply are unavailable.

**Listing match_ready**

| State | Meaning                                                                                              |
| ----- | ---------------------------------------------------------------------------------------------------- |
| false | Processing, or title, description or skills just changed. Match scores unavailable for this listing. |
| true  | Match scores available.                                                                              |

**Application status**

| State       | Meaning                                                                         | Moves to                         | Who                                 |
| ----------- | ------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------- |
| Submitted   | Applied. Not opened yet.                                                        | Viewed                           | System, when the Recruiter opens it |
| Submitted   |                                                                                 | Shortlisted, Interview, Rejected | Recruiter                           |
| Submitted   |                                                                                 | Withdrawn                        | Applicant                           |
| Viewed      | Opened by the Recruiter.                                                        | Shortlisted, Interview, Rejected | Recruiter                           |
| Viewed      |                                                                                 | Withdrawn                        | Applicant                           |
| Shortlisted | Recruiter marked as a good fit.                                                 | Viewed, Interview, Rejected      | Recruiter                           |
| Shortlisted |                                                                                 | Withdrawn                        | Applicant                           |
| Interview   | Recruiter is interviewing this applicant. A label only. No date, no scheduling. | Viewed, Shortlisted, Rejected    | Recruiter                           |
| Interview   |                                                                                 | Withdrawn                        | Applicant                           |
| Rejected    | Recruiter declined.                                                             | Viewed, Shortlisted, Interview   | Recruiter                           |
| Withdrawn   | Applicant pulled out. Final.                                                    | None                             |                                     |

**Skill**

| State    | Meaning                                                       |
| -------- | ------------------------------------------------------------- |
| Active   | Found in new resumes and listings.                            |
| Inactive | Ignored for new resumes and listings. Stays on existing ones. |

**Match score availability** (shown on a listing to an Applicant)

| State                   | Shown message                                            |
| ----------------------- | -------------------------------------------------------- |
| Available               | The score card with band, skills matched, skills missing |
| No resume               | "Add a resume to see your match score."                  |
| Resume Processing       | "Your resume is being prepared. Try again in a moment."  |
| Resume Failed           | "We could not process your resume. Try saving again."    |
| Listing not match_ready | "Match score is being prepared. Try again in a moment."  |
| Logged out              | "Log in as an applicant to see your match score."        |

## 9. Deferred to after the MVP

Out of scope for this version:

- Email or push notifications of any kind (other than the auth provider's confirmation and reset emails)
- Scanned PDFs, images and OCR
- Word (.docx) resumes
- Viewing the original PDF file or its layout
- More than one resume per applicant
- Several recruiters per company, company pages, and company logos
- Messaging between applicants and recruiters
- Saved jobs, job alerts and recommendations by email
- Re-applying after withdrawing
- Draft listings, listing expiry dates and reposting
- Salary in currencies other than PHP, or in periods other than monthly
- Editing the skills found in a resume
- Explaining a score with highlighted text
- Settings to change the matcher blend, bands or calibration inside the product
- Social login
- Account deletion and data export tools
- Administrator audit log
- Rate limiting
- Recruiter CSV export of a listing's applicants
- Interview scheduling, interview dates, offers and any other applicant tracking workflow (the Interview status label stays)
- Native mobile apps
- Languages other than English

## 10. Success metrics

Targets are first goals. Adjust them after the first real data.

| Metric                | Definition                                                                                                                                          | Target                     | How it is measured                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------- |
| Matcher agreement     | On a set of 50 resume and listing pairs labelled by the team as fits or not fits, the share where Strong or Fair equals fit and Weak equals not fit | 75 percent or more         | Run the matcher on the labelled set |
| Matcher ranking check | For sample resumes, the share whose top 3 listings include a listing the team labelled as a fit                                                     | 80 percent or more         | Same labelled set                   |
| Application fit rate  | Share of applications whose band is Strong or Fair                                                                                                  | 60 percent or more         | Application records                 |
| Resume read rate      | Share of text-based PDFs in a test set of 20 that give at least 200 readable characters                                                             | 95 percent or more         | Upload the test set                 |
| Score speed           | 95th percentile time to show the match score card                                                                                                   | Under 2 seconds            | Server timing                       |
| Processing speed      | 95th percentile time from save to Ready                                                                                                             | Under 10 seconds           | Server timing                       |
| Task success          | Share of test users who finish each core flow without help, in a usability test with 5 applicants, 3 recruiters and 1 administrator                 | 90 percent or more         | Moderated test                      |
| Screening effort      | Time for a recruiter to shortlist 3 applicants from 20 using ranked applicants                                                                      | Under 5 minutes            | Usability test                      |
| Listing activity      | Open listings with at least 1 application, as a share of Open listings                                                                              | Report only, no target yet | Dashboard                           |
