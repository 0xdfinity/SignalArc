import "dotenv/config";
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const API_BASE = "https://api.supabase.com";
const envPath = resolve(process.cwd(), ".env");

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required in .env`);
  }

  return value;
}

async function supabase(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${required("SUPABASE_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase API ${response.status} ${path}: ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function updateEnv(updates) {
  const existing = await readFile(envPath, "utf8").catch(() => "");
  const lines = existing.split(/\r?\n/);
  const seen = new Set();
  const next = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);

    if (!match) {
      return line;
    }

    const key = match[1];

    if (!(key in updates)) {
      return line;
    }

    seen.add(key);
    return `${key}=${updates[key]}`;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) {
      next.push(`${key}=${value}`);
    }
  }

  await writeFile(envPath, `${next.filter((line, index, arr) => line !== "" || arr[index - 1] !== "").join("\n")}\n`);
}

async function resolveOrganization() {
  if (process.env.SUPABASE_ORGANIZATION_SLUG) {
    return { organization_slug: process.env.SUPABASE_ORGANIZATION_SLUG };
  }

  if (process.env.SUPABASE_ORGANIZATION_ID) {
    return { organization_id: process.env.SUPABASE_ORGANIZATION_ID };
  }

  const organizations = await supabase("/v1/organizations");
  const organization = organizations[0];

  if (!organization) {
    throw new Error("No Supabase organizations are available for this access token.");
  }

  await updateEnv({
    SUPABASE_ORGANIZATION_ID: organization.id,
    SUPABASE_ORGANIZATION_SLUG: organization.slug ?? organization.id,
  });

  return organization.slug ? { organization_slug: organization.slug } : { organization_id: organization.id };
}

async function resolveDatabasePassword() {
  if (process.env.SUPABASE_DB_PASSWORD) {
    return process.env.SUPABASE_DB_PASSWORD;
  }

  const password = `sa_${randomBytes(24).toString("base64url")}`;
  process.env.SUPABASE_DB_PASSWORD = password;
  await updateEnv({ SUPABASE_DB_PASSWORD: password });
  return password;
}

async function createProject() {
  if (process.env.SUPABASE_PROJECT_REF) {
    return { ref: process.env.SUPABASE_PROJECT_REF, created: false };
  }

  const organization = await resolveOrganization();
  const dbPass = await resolveDatabasePassword();
  const body = {
    db_pass: dbPass,
    name: process.env.SUPABASE_PROJECT_NAME || "signalarc",
    region: process.env.SUPABASE_REGION || "us-east-1",
    ...organization,
  };

  const project = await supabase("/v1/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return { ref: project.ref, created: true };
}

async function getApiKeys(ref) {
  const keys = await supabase(`/v1/projects/${ref}/api-keys?reveal=true`);
  const anon = keys.find((key) => key.name === "anon" || key.prefix === "anon");
  const serviceRole = keys.find((key) => key.name === "service_role" || key.prefix === "service_role");

  return {
    anonKey: anon?.api_key ?? "",
    serviceRoleKey: serviceRole?.api_key ?? "",
  };
}

async function getDatabaseUrl(ref) {
  const password = encodeURIComponent(required("SUPABASE_DB_PASSWORD"));

  try {
    const poolers = await supabase(`/v1/projects/${ref}/config/database/pooler`);
    const transactionPooler = poolers.find((pooler) => pooler.pool_mode === "transaction") ?? poolers[0];
    const connectionString = transactionPooler?.connection_string ?? transactionPooler?.connectionString;

    if (connectionString) {
      return connectionString.replace("[YOUR-PASSWORD]", password);
    }
  } catch (error) {
    console.warn(error.message);
  }

  return `postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres`;
}

async function main() {
  await resolveDatabasePassword();
  const { ref, created } = await createProject();
  const { anonKey, serviceRoleKey } = await getApiKeys(ref);
  const databaseUrl = await getDatabaseUrl(ref);
  const projectUrl = `https://${ref}.supabase.co`;

  await updateEnv({
    NEXT_PUBLIC_SUPABASE_URL: projectUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    SUPABASE_PROJECT_REF: ref,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: `postgresql://postgres:${encodeURIComponent(required("SUPABASE_DB_PASSWORD"))}@db.${ref}.supabase.co:5432/postgres`,
  });

  console.log(JSON.stringify({ created, ref, projectUrl, wrote: ".env" }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
