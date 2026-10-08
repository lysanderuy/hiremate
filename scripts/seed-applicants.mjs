import { config } from "dotenv";
import postgres from "postgres";
import { createSkillMatcher } from "../src/lib/skills/extract-skills.ts";

import { SEED_EMAIL_DOMAIN as EMAIL_DOMAIN, requireDevDatabase } from "./lib/dev-db-guard.mjs";

config({ path: ".env.local" });
config({ path: ".env" });

const { connectionString, host, isLocal } = requireDevDatabase(process.argv, "seed");

const INSTANCE_ID = "00000000-0000-0000-0000-000000000000";
const DAY_MS = 24 * 60 * 60 * 1000;

const NAMES = [
  "Amara Okafor",
  "Liam Chen",
  "Sofia Martinez",
  "Noah Patel",
  "Hana Kobayashi",
  "Mateo Rossi",
  "Zara Ahmed",
  "Ethan Walker",
  "Priya Nair",
  "Lucas Dubois",
  "Isla Thompson",
  "Omar Haddad",
  "Chloe Nguyen",
  "Daniel Kim",
  "Elena Petrova",
];

const TITLES = [
  "Full-Stack Developer",
  "Frontend Engineer",
  "Backend Engineer",
  "Software Engineer",
  "Data Analyst",
  "DevOps Engineer",
  "Mobile Developer",
  "QA Engineer",
  "Product Designer",
  "Data Engineer",
];

const COMPANIES = [
  "Brightwave",
  "Northlake Labs",
  "Cedar & Pine",
  "Orbital Works",
  "Kitebridge",
  "Lumen Systems",
];

const STATUS_PATTERN = [
  "submitted",
  "viewed",
  "shortlisted",
  "withdrawn",
  "interview",
  "rejected",
  "submitted",
  "withdrawn",
  "shortlisted",
  "viewed",
  "withdrawn",
  "interview",
  "rejected",
  "submitted",
  "withdrawn",
  "shortlisted",
];

function pickSkills(allNames, applicantIndex, jobSkillNames) {
  const picked = new Set();
  const count = 5 + (applicantIndex % 4);
  const half = Math.ceil(jobSkillNames.length / 2);
  for (let j = 0; j < half; j++)
    picked.add(jobSkillNames[(applicantIndex + j) % jobSkillNames.length]);
  for (let j = 0; picked.size < count && j < allNames.length * 2; j++) {
    picked.add(allNames[(applicantIndex * 7 + j * 3) % allNames.length]);
  }
  return [...picked];
}

function buildResume(name, index, skillNames) {
  const title = TITLES[index % TITLES.length];
  const years = 2 + (index % 9);
  const first = COMPANIES[index % COMPANIES.length];
  const second = COMPANIES[(index + 3) % COMPANIES.length];
  const head = skillNames.slice(0, 3).join(", ");
  const rest = skillNames.slice(3);
  return [
    `${name}`,
    `${title} with ${years} years of experience delivering reliable products in small, fast-moving teams.`,
    `At ${first}, built and maintained production features using ${head}, working closely with design and product.`,
    `At ${second}, improved delivery speed and quality${rest.length ? ` with ${rest.slice(0, 2).join(" and ")}` : ""}, and mentored two junior colleagues.`,
    `Comfortable owning work end to end: scoping, implementation, code review, and on-call support.`,
    `Skills: ${skillNames.join(", ")}.`,
  ].join("\n");
}

const sql = postgres(connectionString);

try {
  await seed();
} finally {
  await sql.end();
}

async function seed() {
  const skillRows =
    await sql`select name, aliases from skills where is_active = true order by name`;
  if (skillRows.length === 0) {
    console.error("No active skills found. Run npm run db:seed-skills first.");
    process.exitCode = 1;
    return;
  }
  const allSkillNames = skillRows.map((row) => row.name);
  const matchSkills = createSkillMatcher(
    skillRows.map((row) => ({ name: row.name, aliases: row.aliases ?? [] })),
  );

  const jobRows =
    await sql`select id, title from jobs where status in ('open', 'closed') order by id`;
  if (jobRows.length === 0) {
    console.error("No open or closed listings found. Create listings first, then rerun.");
    process.exitCode = 1;
    return;
  }
  const jobSkillRows = await sql`
    select js.job_id, s.name
    from job_skills js
    join skills s on s.id = js.skill_id
    where js.job_id = any(${jobRows.map((job) => job.id)}::uuid[])
    order by s.name
  `;
  const skillsByJob = new Map(jobRows.map((job) => [job.id, []]));
  for (const row of jobSkillRows) skillsByJob.get(row.job_id).push(row.name);

  const applicants = NAMES.map((name, index) => ({
    name,
    index,
    email: `seed-applicant-${String(index + 1).padStart(2, "0")}@${EMAIL_DOMAIN}`,
  }));

  const existing =
    await sql`select id, email from auth.users where email = any(${applicants.map((a) => a.email)}::text[])`;
  const existingByEmail = new Map(existing.map((row) => [row.email, row.id]));

  const plannedApplications = applicants.reduce(
    (sum, a) => sum + Math.min(1 + (a.index % 3), jobRows.length),
    0,
  );
  console.log(`Database host: ${host}`);
  console.log(
    `Planned: ${applicants.length} applicants (${applicants.length - existingByEmail.size} new, ${existingByEmail.size} existing), ` +
      `up to ${plannedApplications} applications across ${jobRows.length} listings.`,
  );

  if (!isLocal) {
    console.warn(
      "WARNING: this will insert fake users into this database's auth.users and attach applications to " +
        "existing open/closed listings of ANY recruiter. To undo: npm run db:cleanup-applicants -- --allow-remote --yes",
    );
  }

  const now = Date.now();
  let created = 0;
  let reused = 0;
  let appsCreated = 0;
  let appsSkipped = 0;
  let appCounter = 0;

  await sql.begin(async (tx) => {
    for (const applicant of applicants) {
      let userId = existingByEmail.get(applicant.email);
      if (userId) {
        reused++;
      } else {
        const [row] = await tx`
          insert into auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token, email_change, email_change_token_new
          ) values (
            gen_random_uuid(), ${INSTANCE_ID}::uuid, 'authenticated', 'authenticated', ${applicant.email},
            '!seed-no-login', now(),
            ${tx.json({ provider: "email", providers: ["email"] })},
            ${tx.json({ full_name: applicant.name })},
            now(), now(), '', '', '', ''
          )
          returning id
        `;
        userId = row.id;
        created++;
      }

      const [profile] = await tx`select id from profiles where id = ${userId}`;
      if (!profile)
        throw new Error(`No profiles row for ${applicant.email}; is the signup trigger installed?`);

      const jobCount = Math.min(1 + (applicant.index % 3), jobRows.length);
      const assignedJobs = [];
      for (let k = 0; assignedJobs.length < jobCount && k < jobRows.length; k++) {
        const job = jobRows[(applicant.index * 3 + k) % jobRows.length];
        if (!assignedJobs.includes(job)) assignedJobs.push(job);
      }

      const skillNames = pickSkills(
        allSkillNames,
        applicant.index,
        skillsByJob.get(assignedJobs[0].id),
      );
      const resumeText = buildResume(applicant.name, applicant.index, skillNames);
      const found = new Set(matchSkills(resumeText));

      await tx`
        insert into resumes (applicant_id, text)
        values (${userId}, ${resumeText})
        on conflict (applicant_id) do update set text = excluded.text, updated_at = now()
      `;

      for (const job of assignedJobs) {
        const n = appCounter++;
        const status = STATUS_PATTERN[n % STATUS_PATTERN.length];
        const createdAt = new Date(now - (2 + ((n * 7) % 28)) * DAY_MS - (n % 24) * 3600 * 1000);
        const changedAt =
          status === "submitted"
            ? createdAt
            : new Date(Math.min(now, createdAt.getTime() + (1 + (n % 5)) * DAY_MS));
        const viewedAt =
          status === "submitted" || (status === "withdrawn" && n % 2 === 0) ? null : changedAt;

        const jobSkills = skillsByJob.get(job.id);
        const matched = jobSkills.filter((skill) => found.has(skill));
        const missing = jobSkills.filter((skill) => !found.has(skill));

        const inserted = await tx`
          insert into applications (
            job_id, applicant_id, resume_snapshot, skills_matched, skills_missing,
            status, viewed_at, status_changed_at, created_at
          ) values (
            ${job.id}, ${userId}, ${resumeText},
            ${sql.array(matched, 1009)}::text[], ${sql.array(missing, 1009)}::text[],
            ${status}::application_status, ${viewedAt}, ${changedAt}, ${createdAt}
          )
          on conflict (job_id, applicant_id) do nothing
          returning id
        `;
        if (inserted.length > 0) appsCreated++;
        else appsSkipped++;
      }
    }
  });

  console.log(
    `Applicants seeded: ${created} created, ${reused} reused; ${appsCreated} applications created, ${appsSkipped} skipped.`,
  );
}
