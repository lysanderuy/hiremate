export const SEED_EMAIL_DOMAIN = "seed.talentflow.invalid";

export function requireDevDatabase(argv, action) {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DIRECT_URL or DATABASE_URL must be set.");
    process.exit(1);
  }

  let host;
  try {
    host = new URL(connectionString).hostname;
  } catch {
    console.error("Could not parse the database connection string.");
    process.exit(1);
  }

  const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(host);

  if (/prod/i.test(host) || /prod/i.test(connectionString)) {
    console.error(
      `Refusing to ${action}: connection string looks like production (host: ${host}).`,
    );
    process.exit(1);
  }
  if (!isLocal) {
    if (!argv.includes("--allow-remote")) {
      console.error(
        `Refusing to ${action} remote host ${host}.\n` +
          `This check cannot recognise a production database by host name (Supabase hosts rarely contain "prod"), ` +
          `so passing --allow-remote is your confirmation that this is a dev database.`,
      );
      process.exit(1);
    }
    if (process.env.NODE_ENV === "production") {
      console.error(`Refusing to ${action}: NODE_ENV is production.`);
      process.exit(1);
    }
  }

  return { connectionString, host, isLocal };
}
