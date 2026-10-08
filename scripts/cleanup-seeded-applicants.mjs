import { config } from "dotenv";
import postgres from "postgres";

import { SEED_EMAIL_DOMAIN, requireDevDatabase } from "./lib/dev-db-guard.mjs";

config({ path: ".env.local" });
config({ path: ".env" });

const { connectionString, host } = requireDevDatabase(process.argv, "clean up");
const confirmed = process.argv.includes("--yes");
const emailPattern = `^seed-applicant-[0-9]{2}@${SEED_EMAIL_DOMAIN.replaceAll(".", "\\.")}$`;

const sql = postgres(connectionString);

try {
  const users = await sql`select id from auth.users where email ~ ${emailPattern}`;
  const userIds = users.map((row) => row.id);

  console.log(`Database host: ${host}`);

  if (userIds.length === 0) {
    console.log("No seeded applicants found. Nothing to delete.");
  } else {
    const [{ count: resumeCount }] = await sql`
      select count(*)::int as count from resumes where applicant_id = any(${userIds}::uuid[])
    `;
    const [{ count: applicationCount }] = await sql`
      select count(*)::int as count from applications where applicant_id = any(${userIds}::uuid[])
    `;

    if (!confirmed) {
      console.log(
        `Dry run: would remove ${userIds.length} seeded users, ${resumeCount} resumes, ${applicationCount} applications.`,
      );
      console.log("Rerun with --yes to delete them.");
    } else {
      const deleted = await sql.begin(async (tx) => {
        const applications =
          await tx`delete from applications where applicant_id = any(${userIds}::uuid[]) returning id`;
        const resumes =
          await tx`delete from resumes where applicant_id = any(${userIds}::uuid[]) returning id`;
        await tx`delete from auth.identities where user_id = any(${userIds}::uuid[])`;
        await tx`delete from auth.sessions where user_id = any(${userIds}::uuid[])`;
        // profiles rows are removed by the profiles_id_auth_users_fk ON DELETE CASCADE.
        const removedUsers =
          await tx`delete from auth.users where id = any(${userIds}::uuid[]) returning id`;
        return {
          applications: applications.length,
          resumes: resumes.length,
          users: removedUsers.length,
        };
      });

      console.log(
        `Seeded applicants removed: ${deleted.users} users, ${deleted.resumes} resumes, ${deleted.applications} applications.`,
      );
    }
  }
} finally {
  await sql.end();
}
