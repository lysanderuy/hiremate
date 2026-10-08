import { readFileSync } from "node:fs";

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const entries = JSON.parse(
  readFileSync(new URL("../src/db/seeds/skills.json", import.meta.url), "utf8"),
);

function validate(list) {
  const errors = [];
  const seen = new Map();

  if (!Array.isArray(list) || list.length === 0) {
    return ["skills.json must be a non-empty array."];
  }

  list.forEach((entry, index) => {
    const label = `entry ${index} (${JSON.stringify(entry?.name)})`;
    if (typeof entry?.name !== "string" || typeof entry?.isActive !== "boolean") {
      errors.push(`${label}: name must be a string and isActive a boolean.`);
      return;
    }
    if (!Array.isArray(entry.aliases) || entry.aliases.some((a) => typeof a !== "string")) {
      errors.push(`${label}: aliases must be an array of strings.`);
      return;
    }

    for (const term of [entry.name, ...entry.aliases]) {
      if (term !== term.toLowerCase()) errors.push(`${label}: "${term}" must be lowercase.`);
      if (term.length < 2 || term.length > 40) {
        errors.push(`${label}: "${term}" must be 2..40 characters.`);
      }
      if (seen.has(term)) {
        errors.push(`${label}: "${term}" is already used by "${seen.get(term)}".`);
      } else {
        seen.set(term, entry.name);
      }
    }
  });

  return errors;
}

const errors = validate(entries);
if (errors.length > 0) {
  console.error(`Invalid skills.json:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DIRECT_URL or DATABASE_URL must be set.");
  process.exit(1);
}

const sql = postgres(connectionString);

try {
  let inserted = 0;
  let updated = 0;

  await sql.begin(async (tx) => {
    for (const entry of entries) {
      // xmax is 0 only for freshly inserted rows, so this separates inserts from updates.
      const [row] = await tx`
        insert into skills (name, aliases, is_active)
        values (${entry.name}, ${sql.array(entry.aliases, 1009)}::text[], ${entry.isActive})
        on conflict (name) do update
          set aliases = excluded.aliases, is_active = excluded.is_active
        returning (xmax = 0) as inserted
      `;
      if (row.inserted) inserted += 1;
      else updated += 1;
    }
  });

  console.log(`Skills seeded: ${inserted} inserted, ${updated} updated.`);
} finally {
  await sql.end();
}
