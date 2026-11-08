import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const email = process.argv[2]?.trim();
if (!email) {
  console.error("Usage: npm run db:seed-admin -- <email>");
  process.exit(1);
}

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DIRECT_URL or DATABASE_URL must be set.");
  process.exit(1);
}

console.log(`Database host: ${new URL(connectionString).host}`);

const sql = postgres(connectionString, { max: 1 });

try {
  const rows = await sql`
    update profiles
    set role = 'administrator', account_status = 'active', updated_at = now()
    where lower(email) = lower(${email})
    returning id, email
  `;

  if (rows.length === 0) {
    console.error(`No profile found for ${email}. Sign up with that email first, then re-run.`);
    process.exitCode = 1;
  } else {
    console.log(`${rows[0].email} (${rows[0].id}) is now an administrator.`);
  }
} finally {
  await sql.end();
}
