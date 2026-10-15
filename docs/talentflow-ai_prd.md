# TalentFlow AI: PRD (MVP)

Version: MVP v1.3. Date: 2026-10-15.
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
| Resume            | The applicant's PDF resume, kept as the original file. One per applicant. Text read from the PDF is used inside the product to find skills and is never shown.                    |
| Application       | An applicant's submission to one listing. Carries a snapshot of the resume.                                                                                                       |
| Snapshot          | The resume file and text kept with an application at the moment it was submitted.                                                                                                 |
| Match score       | A whole number from 0 to 100 showing how well one resume fits one listing. A ranking aid, not a verdict.                                                                          |
| Rating            | The model's predicted fit for one resume and listing pair, from 0 to 4. The match score is the rating times 25.                                                                   |
| Band              | The label of a match score: Strong (70 to 100), Fair (40 to 69), Weak (0 to 39).                                                                                                  |
| Fit               | Plain word for how well a resume matches a listing. Shown to users as the match score and its band.                                                                               |
| Skill             | A named skill or tool, such as Python or SQL, kept in the skills list.                                                                                                            |
| Skills list       | The curated list of skills the system looks for in resumes and listings. Managed by administrators.                                                                               |
| Skills comparison | The skills the listing asks for, split into matched and missing. Shown beside the match score. It is not part of the AI result.                                                   |
| Skills matched    | Skills the listing asks for that the resume has.                                                                                                                                  |
| Skills missing    | Skills the listing asks for that the resume does not have.                                                                                                                        |
| Status            | Where an application is in review: Submitted, Viewed, Shortlisted, Interview, Rejected, Withdrawn. Interview is a label the recruiter sets. It carries no date and no scheduling. |
| Account status    | State of a user account: Active, Pending, Rejected, Suspended.                                                                                                                    |
| Ranked applicants | The applicants of one listing, sorted by match score, highest first.                                                                                                              |
| Salary range      | Optional monthly pay range on a listing, in PHP, as a minimum and a maximum.                                                                                                      |
| Employment type   | One of Full-time, Part-time, Contract, Internship.                                                                                                                                |
| Preparing         | The short step after a resume or listing is saved, while skills are found and the text is turned into an embedding (a list of 384 numbers) for scoring.                           |

## 1. What the product is, and is not

**TalentFlow AI is:**

- A job board with three roles: Applicant, Recruiter, Administrator.
- A match score for any resume and listing pair, shown to the applicant before applying and to the recruiter on every application.
- Text-first. The match score reads the meaning of the text, not only keywords.
- Transparent. Every match score comes with a skills comparison and a short insight.

**TalentFlow AI is not:**

- A gatekeeper. It never rejects, hides or blocks an applicant because of a score.
- A black box. No score is shown without its skills comparison and insight.
- A resume builder, career coach or messaging tool.
- An applicant tracking system with workflows, interview scheduling or offers. The Interview status is a plain label. It does not schedule, invite or notify.
- A replacement for the recruiter's decision.
- A matcher for every field. The score model is trained on tech jobs and tech resumes. Scores for other fields can be less reliable (see 6.4, Limits).

## 2. Core product principles

1. **Show the fit before the apply.** The match score is visible on a listing before the applicant applies.
2. **Every score has a reason.** Show the skills comparison and a short insight next to the match score.
3. **A score is a ranking aid.** The recruiter decides. Nothing is automated based on a score.
4. **One of each, to stay simple.** One resume per applicant, one company per recruiter, one active application per applicant per listing.
5. **The PDF is the resume.** Applicants and recruiters open the original PDF. Text read from it is internal, used only to find skills and score.
6. **Fair by default.** The match score uses only resume text and listing text. No demographic fields exist in the product.
7. **Private by default.** A resume is visible only to the recruiter of a listing the applicant applied to.
8. **Plain voice.** Short sentences, numbers over adjectives, no hype, no exclamation marks.

## 3. Target users

**Primary**

- **Applicant.** Applies to several roles. Wants to know their fit before applying and what is missing. Brings a text-based PDF resume. Success: sends fewer, better applications.
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
| job_title        | Recruiters only. Required at sign up, up to 100 characters.                                                                      |
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

| Field                  | Rules                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| id                     | unique                                                                                                     |
| company, recruiter     | set from the logged-in recruiter                                                                           |
| title                  | required, 3 to 120 characters                                                                              |
| description            | required, 50 to 10,000 characters                                                                          |
| location               | required, 2 to 120 characters. "Remote" is allowed.                                                        |
| employment_type        | required. Full-time, Part-time, Contract, Internship                                                       |
| salary_min, salary_max | optional, whole numbers, PHP per month, 0 to 10,000,000. Both or neither. min must not exceed max.         |
| skills                 | list of Skills, at least 3 and up to 30. Filled from the title and description, editable by the recruiter. |
| status                 | Open, Closed, Removed                                                                                      |
| match_ready            | true when the description has an embedding. Match scores for this listing need it. Internal.               |
| embedding              | 384 numbers made from the description. Internal. Never returned by the API.                                |
| created_at, updated_at | timestamps                                                                                                 |

**Resume** (one per applicant)

| Field      | Rules                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------ |
| id         | unique                                                                                           |
| applicant  | the Applicant user, one resume per applicant                                                     |
| text       | required, 200 to 200,000 characters, read from the PDF. Internal only. Never shown.              |
| source     | PDF. Information only.                                                                           |
| file       | the original PDF, up to 4 MB, kept so the applicant and the recruiters they apply to can open it |
| state      | Ready, Failed. Ready only when skills and the embedding were both stored.                        |
| embedding  | 384 numbers made from the text. Internal. Never returned by the API.                             |
| skills     | derived from the text. Not editable in the MVP.                                                  |
| updated_at | timestamp                                                                                        |

**Application**

| Field                                    | Rules                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| id                                       | unique                                                                                                                      |
| listing, applicant                       | one active application per applicant per listing. After Withdrawn, the applicant can apply again while the listing is Open. |
| resume_snapshot                          | the resume file and text at submission. Never change.                                                                       |
| skills_matched, skills_missing           | stored at submission                                                                                                        |
| match_score, band                        | stored at submission. Not recalculated later.                                                                               |
| model_version, match_breakdown           | stored at submission. The model that scored it, and the points from the start, skills and resume content. Never change.     |
| status                                   | Submitted, Viewed, Shortlisted, Interview, Rejected, Withdrawn                                                              |
| applied_at, viewed_at, status_changed_at | timestamps                                                                                                                  |

**Skill**

| Field     | Rules                                                           |
| --------- | --------------------------------------------------------------- |
| id        | unique                                                          |
| name      | unique, stored lowercase, 2 to 40 characters                    |
| aliases   | list of other spellings, such as "js" for javascript            |
| is_active | true or false. Inactive skills are ignored when finding skills. |

**Match score** (calculated, shown live; stored only inside an application)

| Field                          | Rules                                                      |
| ------------------------------ | ---------------------------------------------------------- |
| inputs                         | one resume, one listing                                    |
| match_score                    | whole number, 0 to 100                                     |
| band                           | Strong, Fair, Weak                                         |
| skills_matched, skills_missing | lists of skill names                                       |
| breakdown                      | points from the start, skills and wording (resume content) |

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
2. Enter display name, email, password, company name and job title. Submit.
3. The account is Pending. The Recruiter sees the page "Awaiting approval."
4. An Administrator opens the Approvals queue and approves or rejects, with an optional reason.
5. If approved, account status becomes Active and the Recruiter can post listings.
6. If rejected, account status becomes Rejected. The Recruiter sees "Your account was not approved." with the reason, and a button "Ask for another review." The button sets the account back to Pending.

Acceptance criteria:

- [ ] Company name is required (2 to 120 characters) and creates the Company.
- [ ] Job title is required (up to 100 characters).
- [ ] A new Recruiter has account status Pending.
- [ ] A Pending or Rejected Recruiter can log in, view public listings, and sees the status page, but cannot reach Post a listing or applicant pages.
- [ ] The Approvals queue lists Pending Recruiters oldest first with display name, email, company name and sign up date.
- [ ] Approve sets Active in one click. Reject asks for an optional reason up to 300 characters.
- [ ] After approval the Recruiter can open Post a listing on the next page load.
- [ ] "Ask for another review" returns the account to Pending and the Recruiter reappears in the Approvals queue.

### FL-04 Add or replace a resume

1. Applicant opens My resume.
2. Chooses a PDF file to upload.
3. The system reads the text from the PDF on the server and keeps the file.
4. The resume is prepared. It is Ready, or Failed.
5. The applicant can open the PDF from My resume.

Acceptance criteria:

- [ ] The file must be a PDF of at most 4 MB with selectable text. Other file types are rejected with "Upload a PDF file."
- [ ] A larger PDF shows "PDF files can be up to 4 MB."
- [ ] A scanned PDF, or one with fewer than 200 readable characters, shows "We could not read text from this file. Upload a text-based PDF."
- [ ] The text read from the PDF must be 200 to 200,000 characters. Otherwise the upload is rejected with "A resume needs at least 200 characters." or "This resume is too long."
- [ ] The original PDF is stored. The extracted text is never shown to the applicant or to recruiters.
- [ ] The resume is saved as soon as the PDF is read. There is no text box to edit.
- [ ] Uploading a new PDF replaces the old resume. The Applicant never has more than one. The old file is deleted unless an existing application uses it.
- [ ] My resume shows an "Open resume (PDF)" button that opens the stored PDF in a new tab.
- [ ] After saving, the resume is Ready within 10 seconds for a typical resume. It is Ready only when skills were found and the embedding was stored.
- [ ] Otherwise the state is Failed and the page shows "We could not process your resume. Try saving again." with a Retry button.
- [ ] Retry prepares the stored resume again without a new upload. It can be used once every 30 seconds.
- [ ] Saving never fails because preparing failed. The resume is kept as Failed.
- [ ] Existing applications keep their snapshot and PDF and are not changed.

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
- [ ] Best match sort appears only for an Applicant whose resume is Ready. The filters apply first, then up to 500 of the newest matching listings are scored and sorted by match score, highest first. Listings with no score go last. 10 per page.
- [ ] An empty result shows "No listings match your search."
- [ ] A Closed or Removed listing opened by direct link shows "This listing is not open."

### FL-06 See the match score on a listing (before applying)

1. Applicant opens a listing detail page.
2. The page shows the Match analysis card.

Acceptance criteria:

- [ ] A logged-in Applicant with a Ready resume sees one Match analysis card on the listing page. It shows the AI match score and its band first.
- [ ] The card also shows a separate skills comparison: "X of Y" skills, with chips for skills matched and skills missing.
- [ ] The card includes a one-paragraph insight. It comes from the points for skills and for resume content.
- [ ] The band comes from the server. The cutoffs live in the model file only, never in the page.
- [ ] A listing with no skills is still scored. The skills part says "This listing has no skills listed, so the score is less reliable."
- [ ] An Applicant with no resume sees "Add a resume to see your match score." with a link to My resume.
- [ ] An Applicant whose resume is Failed sees "Your resume is not ready. Open My resume to try again." The skills comparison still shows.
- [ ] If the listing is not match_ready, the card says "Match score is being prepared. Try again in a moment." The skills comparison still shows.
- [ ] When an Applicant opens an Open listing that is not match_ready, the server tries to prepare it again, at most once every 30 seconds.
- [ ] A logged-out visitor sees "Log in as an applicant to see your match score."
- [ ] Recruiters and Administrators do not see the match score card on listings.
- [ ] The card shows in under 2 seconds for at least 95 percent of views.
- [ ] The score never blocks or hides anything. It is a ranking aid (principle 3).

### FL-07 Apply to a listing

1. Applicant presses Apply on an Open listing.
2. A confirmation shows the resume that will be sent and the current match score. For a Weak band it adds "This is a weak match. You can still apply."
3. Applicant confirms.
4. The application is created with status Submitted.

Acceptance criteria:

- [ ] Apply is available only to an Applicant with a Ready resume on an Open listing.
- [ ] An Applicant with no resume is sent to My resume. After saving, they return to the listing.
- [ ] An Applicant who has an application to this listing that is not Withdrawn sees "You applied on <date>" instead of Apply.
- [ ] An Applicant whose resume has no stored PDF sees "Upload your resume PDF again before applying."
- [ ] Apply is blocked with "This listing is still being prepared. Try again in a moment." while the listing is not match_ready.
- [ ] Apply is blocked with "Your resume is not ready. Save it again before applying." while the resume is not Ready.
- [ ] On confirm, the application stores the resume snapshot (the PDF and its text), skills matched, skills missing, match score, band, model version and breakdown. Every application therefore has a score.
- [ ] The application starts as Submitted with applied_at set.
- [ ] A low match score never blocks applying. Weak applications are allowed.
- [ ] If the listing was closed meanwhile, the confirm fails with "This listing is no longer open." and no application is created.
- [ ] After applying, the Applicant sees "Application sent."

### FL-08 Track and withdraw an application

1. Applicant opens My applications.
2. Each row shows listing title, company, status, applied date.
3. Applicant opens one to see the status and the match score at the time of applying, and to open the resume PDF they sent.
4. Applicant can press Withdraw.

Acceptance criteria:

- [ ] The list shows only the logged-in Applicant's applications, newest first.
- [ ] Status changes made by the recruiter show here on the next page load.
- [ ] Withdraw is available for Submitted, Viewed, Shortlisted and Interview. It is not available for Rejected or Withdrawn.
- [ ] Withdraw asks for confirmation. After it, status is Withdrawn and cannot be undone.
- [ ] After Withdrawn, the Applicant can apply to the same listing again while it is Open. The withdrawn application stays as it was.
- [ ] Applications to Closed or Removed listings stay visible.

### FL-09 Post a listing

1. An Active Recruiter opens Post a listing.
2. Enters title, description, location, employment type, and optional salary range.
3. The form suggests skills found in the title and description. The Recruiter can add or remove skills.
4. Presses Publish.
5. The listing is Open and is prepared for scoring.

Acceptance criteria:

- [ ] Only an Active Recruiter can open the form.
- [ ] Title, description, location and employment type are required and follow the limits in section 4.
- [ ] If salary is entered, both minimum and maximum are required and the minimum is not above the maximum. Otherwise show "Enter both amounts, with the minimum at or below the maximum."
- [ ] Suggested skills come from active skills in the skills list, found in the title and description. The Recruiter can add skills from the skills list and remove suggested ones. At least 3 and up to 30.
- [ ] The Recruiter cannot add a skill that is not in the skills list.
- [ ] After Publish, status is Open and the listing appears in Jobs.
- [ ] The listing's match_ready becomes true within 10 seconds for a typical listing. If preparing fails, the listing still saves and stays not ready.
- [ ] While a listing is not ready, the Recruiter sees "Preparing" with a Retry button. Retry can be used once every 30 seconds.
- [ ] The listing is linked to the Recruiter's Company.

### FL-10 Edit, close, reopen or delete a listing

1. Recruiter opens My listings and selects a listing.
2. Actions: Edit, Close, Reopen, Delete.

Acceptance criteria:

- [ ] A Recruiter can act only on their own listings.
- [ ] Edit changes any field. After a description change, match_ready is false until the listing is prepared again. A title or skills change does not change match_ready.
- [ ] Editing a listing does not change existing applications or their stored match scores.
- [ ] Close sets status Closed. The listing leaves Jobs and Apply is blocked. Applications stay.
- [ ] Reopen sets a Closed listing back to Open. It does not work on a Removed listing.
- [ ] Delete is available only when the listing has zero applications. Otherwise it is disabled with "Close this listing instead. It has applications."
- [ ] Delete asks for confirmation and removes the listing permanently.
- [ ] My listings shows each listing's status and number of applications.

### FL-11 Review applicants

1. Recruiter opens a listing's Applicants page.
2. The list shows ranked applicants.
3. Recruiter opens an application and opens the resume PDF.
4. Recruiter sets the status.

Acceptance criteria:

- [ ] Only the listing's own Recruiter can open its Applicants page.
- [ ] The default order is match score, highest first. The Recruiter can switch to Newest first.
- [ ] Each row shows applicant display name, match score, band, status, applied date. Ranking and the band filter use the score and band saved at submission.
- [ ] The Recruiter can filter by status and by band.
- [ ] Opening an application shows an "Open resume (PDF)" button and the same Match analysis card the applicant saw, built from the saved score and breakdown: score, band, skills comparison and insight. The extracted text is not shown.
- [ ] Opening a Submitted application sets status Viewed and viewed_at, once.
- [ ] The Recruiter can set status to Viewed, Shortlisted, Interview or Rejected, in any order among those four.
- [ ] Setting Interview records no date, sends no invite and sends no message. It only changes the status.
- [ ] The Recruiter cannot set Submitted or Withdrawn.
- [ ] A Withdrawn application stays in the list, marked Withdrawn, and its status cannot be changed.
- [ ] The Applicants page shows an Export CSV button (see FL-12).
- [ ] Applicant email is visible to the Recruiter only for that listing's applications.

### FL-12 Recruiter analytics and CSV export

1. Recruiter opens a listing's Analytics tab, or the Recruiter dashboard for all listings.
2. Presses Export CSV on the Applicants page.

Acceptance criteria:

- [ ] Per listing, the Analytics tab shows: total applications, applications per day for the last 30 days, count by band, count by status, and the 5 most common skills missing among its applicants.
- [ ] The Recruiter dashboard shows: listings by status, total applications across own listings, and applications received in the last 7 days.
- [ ] A Recruiter sees only their own data.
- [ ] Export CSV downloads a file with one row per application and columns: applicant name, applicant email, match score, band, skills matched, skills missing, status, applied at.
- [ ] The file is UTF-8 with a byte order mark and opens correctly in Excel and Google Sheets.
- [ ] Any cell that starts with =, +, - or @ is prefixed with a single quote so it cannot run as a formula.
- [ ] Commas, quotes and line breaks inside cells are escaped correctly.
- [ ] The file name is `<listing-title>_applicants_<YYYY-MM-DD>.csv` with unsafe characters removed.
- [ ] A listing with no applications gives a file with the header row only.

### FL-13 Administrator: manage users

1. Administrator opens Users.
2. Searches by name or email, filters by role and account status.
3. Suspends or reactivates a user.

Acceptance criteria:

- [ ] Only an Administrator can open Users.
- [ ] The list shows display name, email, role, account status, sign up date, 20 per page.
- [ ] Suspend asks for confirmation. A Suspended user is logged out on their next request and cannot log in.
- [ ] While a Recruiter is Suspended, their Open listings are hidden from Jobs. Their status stays Open and they return when the Recruiter is reactivated. Applications on those listings show "Listing closed" to the Applicant.
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
- [ ] CSV rules from FL-12 apply (UTF-8 with byte order mark, formula protection, escaping).

## 6. Feature specifications

### 6.1 Accounts and roles

- Sign up creates an Applicant or a Recruiter. Administrators are created directly in the database.
- Account status controls access: Active can use the product. Pending and Rejected Recruiters see only the status page and public listings. Suspended users cannot log in.
- Pages are protected by role. Every API route checks login, role, and ownership before it returns data.
- Confirmation and password reset emails come from the auth provider. The product sends no other email.

### 6.2 Resume handling

- Input: PDF only (up to 4 MB, text-based).
- The text read from the PDF is used inside the product to find skills and make the embedding. It keeps reading order as best it can. Columns and tables can come out jumbled. The text is never shown to applicants or recruiters. The PDF reader library is chosen by the PDF check notebook (notebook 3).
- A PDF with fewer than 200 readable characters is treated as scanned and rejected.
- The original PDF is stored privately, with the extracted text. It opens only for the applicant, and for the recruiter of a listing the applicant applied to, through the app. It is never public. Administrators cannot open it.
- One resume per applicant. A new save replaces the old one.
- After saving, the system finds skills in the text and makes an embedding for scoring. This is Preparing. It runs once per save, not once per view.
- The resume is Ready only when skills and the embedding were both stored. Otherwise it is Failed, and the applicant can retry (once every 30 seconds).

### 6.3 Skills list and skill finding

- A skill is found in a text when its name or one of its aliases appears as a whole word or phrase, ignoring case.
- Longer names win over shorter ones ("power bi" over "power").
- Names with symbols, such as "c++" and "c#", match correctly.
- One extractor finds skills in resumes and listings.
- Only active skills are used.
- The list is seeded from the model's own list of 389 skills (`src/db/seeds/skills.json`). It was built once from three sources: the skills that appear in the `data_jobs` job postings dataset (Hugging Face), the O*NET software skills file, and skills the team adds by hand. It is reviewed by hand in the skills notebook (notebook 0). Ambiguous everyday words (such as go, flow, spring) start as inactive.
- The match model counts skills, so the model and the skills list change together. Changing the list needs a retrain (see 6.4).

### 6.4 Match score

Inputs: the resume's skills and embedding, and the listing's skills and embedding. The listing embedding is made from the description only, never the title.

Features. Five numbers are made for each resume and listing pair:

- `sbert_cosine`: how alike the meaning of the two texts is. Each text is read by the model all-MiniLM-L6-v2 (SBERT), which turns it into 384 numbers (an embedding). Long texts are split into 150-word pieces and the results are averaged into a vector of length 1. The value is the cosine similarity of the two vectors.
- `skills_overlap`: skills matched divided by the number of skills on the listing. It is 0 if the listing has no skills.
- `matched_count`: number of skills matched.
- `job_skill_count`: number of skills on the listing.
- `resume_skill_count`: number of skills found in the resume.

Calculation:

1. Make the five features from the stored embeddings and skills.
2. A trained Ridge regression (a linear model with a penalty that keeps the weights small) predicts a rating from 0 to 4. The rating is clipped to that range.
3. `match_score = round(rating * 25)`.
4. `band`: Strong for 70 to 100, Fair for 40 to 69, Weak for 0 to 39.

Training:

- Data: 600 resume and listing pairs, tech roles only, rated 0 to 4 by four raters using one written rubric. The label is the average of the four ratings.
- Split by resume: about 70 percent train, 15 percent validation, 15 percent test. Validation sets the Ridge penalty. The final model is refit on train and validation. The test set is used once.
- The model is compared against two others on the test set: the earlier hand-made formula (0.4 skills overlap + 0.6 meaning) and an untrained pretrained cross-encoder.
- The cross-encoder is not used live.

Rules:

- The score formula (rating times 25) and the band cutoffs are in one config file. They can change without retraining. They cannot be changed from inside the product in the MVP.
- Years of experience is not an input. Job text in the training data often has its numbers removed, resume dates are hard to read reliably, and 600 labeled pairs are too few to add more inputs without adding noise.
- Skills matched and skills missing come from the same skills used for the features.
- Skills missing shows up to 8 names, then "and N more."
- The match score reads the resume text and listing text only. No other user data is an input.
- Scores are calculated when asked for, in the app, from the embeddings stored when the resume and listing were saved. No outside call is made at score time.
- An application stores its own match score at submission. It does not change afterward.
- The skills comparison ("X of Y", matched and missing chips) is separate from the AI score. A listing with no skills is still scored.
- The insight is one paragraph made from the saved breakdown: the points from skills and from resume content. It is never recalculated for an existing application.
- Score and band shown to the recruiter come from the application. The Match analysis card is the same for both roles.

Where it runs:

- A separate Python service in `matcher/` (FastAPI) only makes embeddings. `POST /embed` takes a kind (resume or listing) and texts and returns 384 numbers per text. It does its own text prep: resumes are cleaned; listings use the description only, lowercased, with digits and punctuation deleted, to match the training listings.
- The app calls it when a resume or listing is saved. If the service is not set up or fails, the save still works, and the resume is Failed or the listing is not ready until a retry works.
- Scoring and skill finding run in the app (TypeScript). The model weights and the 389-skill list come from the trained model through an export script. Tests check that the TypeScript code gives the same features as the Python training code.
- Hosting of the matcher is not decided. It needs an always-on host, separate from the web app.

Limits:

- The model is trained on tech roles only. Scores for other fields are less reliable.
- Resume PDFs can come out with jumbled columns. The training resumes were plain text.
- Training listings had digits and punctuation removed. Live listing text is prepared the same way for the embedding. Skills written with punctuation (c++, c#, ci/cd, .net) were rarely matched on the listing side in training.
- The model counts skills. Changing the skills list needs a retrain, and the model and the list are replaced together.

### 6.5 Listings

- Fields and limits are in section 4.
- Status: Open, Closed, Removed (see section 8).
- Skills are suggested from the text and editable, from the skills list only. A listing needs at least 3 skills.
- Salary is optional, monthly, in PHP only. Shown as "PHP 30,000 to 45,000 per month" or "Not specified."
- Delete only with zero applications. Otherwise Close.
- Listings of a Suspended or non-Active Recruiter are hidden from Jobs.

### 6.6 Job search

- Keyword, location, employment type, minimum salary. Sort: Newest (default) and Best match (for Applicants with a Ready resume).
- Best match: the filters apply in the database. Up to 500 of the newest matching listings are scored in memory and sorted by score, with unscored ones last.
- The Applicant dashboard shows Best matches: only listings in the Fair and Strong bands.
- 10 listings per page.
- Only Open listings of Active Recruiters are shown.

### 6.7 Applications

- One active application per applicant per listing. After Withdrawn, the applicant can apply again while the listing is Open.
- Created only for Open listings that are match_ready, by Applicants with a Ready resume.
- Stores a snapshot (the resume PDF and its text), skills matched, skills missing, match score, band, model version and breakdown at submission.
- Statuses and who can set them are in section 8.
- Recruiters see applicant display name and email, and can open the resume PDF, only for their own listings.
- No messages and no email are sent when a status changes. Applicants see the new status in My applications.

### 6.8 Recruiter review

- Ranked applicants by match score, with filters by status and band.
- Opening a Submitted application marks it Viewed once.
- The resume opens as the original PDF. Extracted text is not shown.
- A Recruiter decides. No status is ever set by the system except Viewed on first open.

### 6.9 Analytics

- Recruiter: per listing and overall, own data only (FL-12).
- Administrator: platform-wide (FL-16).
- All figures are counts, daily series or the averages listed. No cohorts, no funnels beyond status counts, no date range picker in the MVP (fixed 30 days or 7 days as stated).

### 6.10 CSV export

- Recruiter: applicants of one listing. Administrator: users, listings, applications.
- UTF-8 with byte order mark. Formula protection on cells starting with =, +, - or @. Standard escaping.
- Generated on the server and downloaded as a file. No outside service.

### 6.11 Administration

- Approvals queue, Users, Listings, Skills, dashboard (FL-03, FL-13 to FL-16).
- Administrators cannot read resumes or applications.

### 6.12 Quality targets

- Match analysis card in under 2 seconds, 95 percent of views.
- Resume or listing Preparing done within 10 seconds for a typical text.
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
| Recruiter analytics and export (own data)          | No    | No        | Yes                | No                     | No            |
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

**Resume state**

| State  | Meaning                                                        | Moves to                                                    |
| ------ | -------------------------------------------------------------- | ----------------------------------------------------------- |
| Ready  | Skills and embedding stored. Match scores and Apply work.      | Ready or Failed (on a new save)                             |
| Failed | Skills or embedding could not be stored. Scores and Apply off. | Ready or Failed (Retry, once per 30 seconds, or a new save) |

No resume: the Applicant has no resume yet. Scores and Apply are unavailable.

**Listing match_ready**

| State | Meaning                                                                                                   |
| ----- | --------------------------------------------------------------------------------------------------------- |
| false | No description embedding yet, or the description just changed. Match scores and Apply unavailable for it. |
| true  | Match scores available.                                                                                   |

Only a changed description clears it. Title and skills edits do not. The Recruiter can retry preparing (once per 30 seconds). When an Applicant opens a not-ready Open listing, the server retries too.

**Application status**

| State       | Meaning                                                                          | Moves to                         | Who                                 |
| ----------- | -------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------- |
| Submitted   | Applied. Not opened yet.                                                         | Viewed                           | System, when the Recruiter opens it |
| Submitted   |                                                                                  | Shortlisted, Interview, Rejected | Recruiter                           |
| Submitted   |                                                                                  | Withdrawn                        | Applicant                           |
| Viewed      | Opened by the Recruiter.                                                         | Shortlisted, Interview, Rejected | Recruiter                           |
| Viewed      |                                                                                  | Withdrawn                        | Applicant                           |
| Shortlisted | Recruiter marked as a good fit.                                                  | Viewed, Interview, Rejected      | Recruiter                           |
| Shortlisted |                                                                                  | Withdrawn                        | Applicant                           |
| Interview   | Recruiter is interviewing this applicant. A label only. No date, no scheduling.  | Viewed, Shortlisted, Rejected    | Recruiter                           |
| Interview   |                                                                                  | Withdrawn                        | Applicant                           |
| Rejected    | Recruiter declined.                                                              | Viewed, Shortlisted, Interview   | Recruiter                           |
| Withdrawn   | Applicant pulled out. Final for that application. The applicant can apply again. | None                             |                                     |

**Skill**

| State    | Meaning                                                       |
| -------- | ------------------------------------------------------------- |
| Active   | Found in new resumes and listings.                            |
| Inactive | Ignored for new resumes and listings. Stays on existing ones. |

**Match score availability** (shown on a listing to an Applicant)

| State                   | Shown message                                                    |
| ----------------------- | ---------------------------------------------------------------- |
| Available               | The Match analysis card: score, band, skills comparison, insight |
| No resume               | "Add a resume to see your match score."                          |
| Resume Failed           | "Your resume is not ready. Open My resume to try again."         |
| Listing not match_ready | "Match score is being prepared. Try again in a moment."          |
| Logged out              | "Log in as an applicant to see your match score."                |

## 9. Deferred to after the MVP

Out of scope for this version:

- Email or push notifications of any kind (other than the auth provider's confirmation and reset emails)
- Scanned PDFs, images and OCR
- Word (.docx) resumes
- More than one resume per applicant
- Several recruiters per company, company pages, and company logos
- Messaging between applicants and recruiters
- Saved jobs, job alerts and recommendations by email
- Draft listings, listing expiry dates and reposting
- Salary in currencies other than PHP, or in periods other than monthly
- Editing the skills found in a resume
- Explaining a score with highlighted text
- Settings to change the score formula or bands inside the product
- Years of experience as a score input (see 6.4 for the reason)
- Match scoring for fields outside tech (the model is trained on tech only)
- Social login
- Account deletion and data export tools
- Administrator audit log
- Rate limiting
- Interview scheduling, interview dates, offers and any other applicant tracking workflow (the Interview status label stays)
- Native mobile apps
- Languages other than English

## 10. Success metrics

Targets are first goals. Adjust them after the first real data.

| Metric               | Definition                                                                                                                                           | Target                                                                           | How it is measured    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------- |
| Matcher error        | Mean absolute error between the model's rating and the average of the four raters' ratings, on the test set (about 90 pairs, never used in training) | Lower than the hand-made formula and the untrained cross-encoder on the same set | Notebook 2 test table |
| Matcher ranking      | Spearman correlation between the model's rating and the raters' average, on the test set                                                             | Higher than the hand-made formula and the untrained cross-encoder                | Notebook 2 test table |
| Matcher band match   | Share of test pairs where the model's band (Strong, Fair, Weak) equals the band of the raters' average                                               | 75 percent or more                                                               | Notebook 2 test table |
| Matcher within 1     | Share of test pairs where the model's rating is within 1 of the raters' average                                                                      | Report only, no target yet                                                       | Notebook 2 test table |
| Rater agreement      | Agreement among the four raters on the 600 pairs: exact match, within 1, and weighted kappa for each pair of raters                                  | Report only. Pairs where the ratings differ by 2 or more are listed for review.  | Notebook 1 Part B     |
| Application fit rate | Share of applications whose band is Strong or Fair                                                                                                   | 60 percent or more                                                               | Application records   |
| Resume read rate     | Share of text-based PDFs in a test set of 30 that give at least 200 readable characters                                                              | 95 percent or more                                                               | Notebook 3            |
| Score speed          | 95th percentile time to show the match score card                                                                                                    | Under 2 seconds                                                                  | Server timing         |
| Preparing speed      | 95th percentile time from save to Ready                                                                                                              | Under 10 seconds                                                                 | Server timing         |
| Task success         | Share of test users who finish each core flow without help, in a usability test with 5 applicants, 3 recruiters and 1 administrator                  | 90 percent or more                                                               | Moderated test        |
| Screening effort     | Time for a recruiter to shortlist 3 applicants from 20 using ranked applicants                                                                       | Under 5 minutes                                                                  | Usability test        |
| Listing activity     | Open listings with at least 1 application, as a share of Open listings                                                                               | Report only, no target yet                                                       | Dashboard             |
