import fs from "node:fs";
import process from "node:process";
import { Client } from "pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL or DIRECT_URL is required.");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function tableExists(name) {
  const { rows } = await client.query("select to_regclass($1) as table_name", [name]);
  return Boolean(rows[0]?.table_name);
}

async function applyMigrations() {
  if (!fs.existsSync("supabase/migrations")) {
    return;
  }

  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const migrations = fs
    .readdirSync("supabase/migrations")
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const migration of migrations) {
    const version = migration.replace(/\.sql$/, "");
    const { rows } = await client.query("select 1 from public.schema_migrations where version = $1", [version]);

    if (rows.length) {
      continue;
    }

    await client.query("begin");
    try {
      await client.query(fs.readFileSync(`supabase/migrations/${migration}`, "utf8"));
      await client.query("insert into public.schema_migrations (version) values ($1)", [version]);
      await client.query("commit");
      console.log(`Applied migration ${version}.`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
}

try {
  await client.connect();

  if (!(await tableExists("public.profiles"))) {
    await client.query(fs.readFileSync("supabase/schema.sql", "utf8"));
    console.log("Supabase schema applied.");
  } else {
    console.log("Supabase schema already present.");
  }

  await applyMigrations();
} finally {
  await client.end();
}
