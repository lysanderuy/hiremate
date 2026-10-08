# TalentFlow AI: Brand Guidelines

Identity and tone come from `talentflow-ai_brief.md`. Values come from `talentflow-ai_design.yaml` and `talentflow-ai_tokens.css`. If they disagree, the tokens file wins.

**Personality:** clear, calm, fair, quick. Professional, not stiff. A sharp friend who knows the job market and tells you straight.

---

## 1. Logo

**Parts**

- **Mark:** a sparkle pair, white, on a rounded indigo square (`#4f39f6`). Corner radius is 25% of the square's width.
- **Wordmark:** "TalentFlow AI" in Space Grotesk SemiBold, tight tracking (-0.02em). Capital T, capital F, capital A and I. Never "Talentflow", "talentflow" or "TalentFlow.ai".
- **Lockup:** mark on the left, wordmark on the right, with a gap equal to 30% of the mark's width. Mark and wordmark are vertically centered.

**Versions**

| Background           | Mark                         | Wordmark      |
| -------------------- | ---------------------------- | ------------- |
| White or light gray  | Indigo square, white sparkle | Ink `#101828` |
| Near-black `#0f172a` | Indigo square, white sparkle | White         |
| Indigo `#4f39f6`     | White square, indigo sparkle | White         |

**Size and space**

- Minimum lockup height: 24px. Minimum mark alone: 16px.
- Clear space on all sides: half the mark's height.
- Mark alone is for favicons, app icons and avatars. The full lockup is for everything else.

**Do not**

- Stretch, rotate, outline or add shadows or gradients.
- Recolor the mark outside the three versions above.
- Put the logo on a busy photo or on a color that gives less than 3:1 contrast with the mark.
- Add taglines, sparkles or extra effects around it.
- Set the wordmark in any font other than Space Grotesk.

---

## 2. Color

**Roles**

| Role         | Color     | Use                                                                                         |
| ------------ | --------- | ------------------------------------------------------------------------------------------- |
| Primary      | `#4f39f6` | Primary buttons, links, active states, the one solid-color section on a page, the logo mark |
| Primary soft | `#eeebff` | Chips, hero panel, soft highlights, hover tints                                             |
| Ink          | `#101828` | Headings and key numbers                                                                    |
| Text         | `#475467` | Body copy                                                                                   |
| Muted        | `#667085` | Meta text, helper text, placeholders                                                        |
| Line         | `#e4e7ec` | Borders and dividers                                                                        |
| Page         | `#f7f8fa` | Alternate section background                                                                |
| Night        | `#0f172a` | Recruiter card and footer only                                                              |

**Score colors (reserved)**

| Band   | Range     | Text      | Background |
| ------ | --------- | --------- | ---------- |
| Strong | 70 to 100 | `#0f6b4c` | `#e3f5ee`  |
| Fair   | 40 to 69  | `#975004` | `#fdf1df`  |
| Weak   | 0 to 39   | `#566074` | `#eef0f3`  |

**Rules**

- Green, amber and gray mean a score band and nothing else. Do not use them as general decoration, status colors for other things, or button colors.
- Weak is gray, not red. A low score is information, not a failure.
- Errors in forms use red (`#d92d20`) and appear only on form fields and failed actions.
- One solid primary section per page. The rest is white or light gray. Use Night for the footer and the recruiter card only.
- No gradients on UI surfaces. The only gradient allowed is the faint primary-soft fade behind a hero.
- Never carry meaning by color alone. A score always has its number and band name. Missing skills have a dashed border as well as lighter color.
- Text on primary backgrounds uses white or `#e6e2ff`. Do not use primary text on dark navy.

---

## 3. Typography

**Fonts**

- **Space Grotesk** (500, 600, 700): headings, the wordmark, score numerals, step numbers, eyebrows.
- **Inter** (400, 500, 600): everything else, including buttons, forms and tables.

**Scale**

| Style                                    | Size                                                        | Weight     | Font          |
| ---------------------------------------- | ----------------------------------------------------------- | ---------- | ------------- |
| Hero headline (landing)                  | 34 to 48px (fluid)                                          | 700        | Space Grotesk |
| Section heading (landing)                | 24 to 32px (fluid)                                          | 600        | Space Grotesk |
| Page heading (app)                       | 24px (20px on phones)                                       | 600        | Space Grotesk |
| Auth heading                             | 26px                                                        | 600        | Space Grotesk |
| Card title, h2                           | 16px                                                        | 600        | Space Grotesk |
| Stat numeral                             | 28px                                                        | 600        | Space Grotesk |
| Score numeral                            | 56px (44px on phones); 36px in hero preview; 18px in tables | 700        | Space Grotesk |
| Lead text (landing)                      | 17px                                                        | 400        | Inter         |
| Body (landing)                           | 15px                                                        | 400        | Inter         |
| Body (app), inputs, buttons, table cells | 14px                                                        | 400 to 600 | Inter         |
| Skill chip                               | 13px                                                        | 500        | Inter         |
| Badge, pill, helper, error               | 12px                                                        | 600 / 400  | Inter         |
| Eyebrow                                  | 12px, uppercase, +0.08em                                    | 600        | Space Grotesk |

**Rules**

- Headlines are sentence case, except the hero line "Where AI Meets Career Potential".
- Second line of the hero headline takes the primary color. Do this once per page.
- Use tabular numerals for scores and counts so they line up.
- Line height: 1.1 for display, 1.5 for app text, 1.6 for landing body.
- Keep paragraphs under about 70 characters per line.
- No all-caps outside eyebrows. No italics for emphasis. No underlines except links.
- Do not set long paragraphs in Space Grotesk.

---

## 4. Tone of voice

**How it talks**

- Plain words, short sentences. Speaks to "you".
- Numbers over adjectives.
- Shows the reason: "You have 6 of 8 skills this job asks for."
- Says what a score means and does not mean. A score is a ranking, not a verdict.
- No hype, no buzzwords, no exclamation marks.

**Sounds like / does not**

| Sounds like                                                               | Does not sound like                     |
| ------------------------------------------------------------------------- | --------------------------------------- |
| Strong match. You have 6 of 8 skills this job asks for.                   | Unlock your dream career with AI magic! |
| Missing: Docker, AWS.                                                     | You are not qualified.                  |
| 12 applicants. Top match: 84.                                             | Revolutionary candidate intelligence.   |
| Your resume could not be read. Upload a text-based PDF or paste the text. | Oops! Something went wrong.             |
| Save your resume                                                          | Supercharge your profile                |

**Word choices**

| Use                                         | Avoid                                              |
| ------------------------------------------- | -------------------------------------------------- |
| score, match, fit                           | rating, grade, rank (for people), verdict          |
| skills you have, skills missing             | gaps in your profile, deficiencies                 |
| applicant, recruiter                        | candidate pool, talent, human capital              |
| listing, job                                | opportunity (as filler), role-based solution       |
| "AI" in the product name and in AI Matching | "AI-powered", "magic", "revolutionary", "next-gen" |

**Rules**

- Say "missing", never "you lack" or "you failed". Missing skills are shown as facts.
- Never claim accuracy, user counts or results we have not measured. The only true numbers today are 853 job postings tested and 24 resume categories.
- Do not mention price or plans. There is no paid tier.
- Errors say what happened and what to do next, in one or two short sentences.
- Buttons are verbs: Get Started, Explore Jobs, Create Applicant Account, Apply.
- Dates and numbers: write "6 of 8", not "six out of eight". Scores are whole numbers.
- Pesos for pay: PHP, monthly range, e.g. PHP 25,000 to 35,000 per month. Write "to", not a dash.

**Writing punctuation:** no em dashes. Use commas, periods or colons.

---

## 5. Imagery and illustration

**Principle:** the product is the picture. Show real interface pieces: a match card, a skills list, a ranked applicants list. They carry the proof and match the tone.

**Use**

- Built-from-HTML product visuals with realistic but clearly sample data (e.g. "Junior Data Analyst", "Sample_Resume.pdf", "Applicant A").
- Simple outline icons: 24px grid, 1.8px stroke, rounded caps. Sparkle, check-circle, info, document.
- Flat shapes and soft indigo tints (`#eeebff`) as backgrounds for visuals.
- If people appear in the future, use real photos of real working people in everyday settings, natural light, no handshake or laptop-at-sunrise clichés.

**Avoid**

- Stock photos of smiling teams, handshakes, or people pointing at screens.
- Robots, glowing brains, circuit boards, neural-network meshes, binary rain, blue holograms.
- 3D blobs, heavy gradients, glassmorphism, neon glow.
- Fake company logos, fake testimonials, fake user counts.
- Emoji in product UI or marketing copy.

**Sample data rules**

- Sample names are generic ("Applicant A") or clearly fictional.
- Sample scores should include a Fair or Weak example now and then, so the product does not look like it only says yes.
- Do not use a real company's name for example employers.

---

## 6. UI personality

**Feel:** quiet and orderly. Plenty of white space, flat surfaces, thin borders, one accent color. The score is the loudest thing on screen.

**Shape and surface**

- Rounded but not bubbly: 10px on controls, 16px on cards, 24px on feature panels, pills for badges and chips.
- Cards are white with a 1px border and a very light shadow. Heavier shadow only on the main score card and floating panels.
- Sections alternate white, light gray, and (once) solid primary.

**Hierarchy**

- One primary action per section, always an indigo button. Secondary is white with a border.
- Score numeral first, band second, reason third, skills fourth.
- Matched skills are soft indigo chips. Missing skills are white chips with a dashed border.

**Behavior**

- Fast and plain. Hover and focus changes take 150 to 200ms. No looping animation, no parallax, no confetti.
- Visible focus ring on everything interactive.
- Empty states say what to do next: "No applications yet. Browse jobs to find a fit."
- Loading states are simple skeletons or a short text line. No spinners with jokes.
- Forms: labels above inputs, errors below in plain language, never blame the user.

**Layout**

- Max content width 1120px with 24px gutters (16px on phones).
- On desktop, each landing section is at least one screen tall with content centered.
- Grids stack below 960px. Phone layouts keep 44px touch targets for primary actions and inputs; desktop controls are 40px (buttons 36px small, 44px large).

**Never**

- Show a percentage as the score.
- Show a score without its reasons.
- Use language or visuals that suggest the system decides who gets hired. Recruiters decide.

---

## 7. Quick checklist

- [ ] Name is "TalentFlow AI".
- [ ] Headings in Space Grotesk, body in Inter.
- [ ] One accent color, one primary button per section.
- [ ] Score shown as a number out of 100 with a band name.
- [ ] Matched and missing skills shown next to the score.
- [ ] No invented numbers, no "free" or pricing, no hype words, no exclamation marks, no em dashes.
- [ ] Contrast meets 4.5:1 for normal text.
