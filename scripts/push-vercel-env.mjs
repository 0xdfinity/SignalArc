import "dotenv/config";
import fs from "node:fs";

const VERCEL_API_BASE = "https://api.vercel.com";
const RESERVED = new Set([
  "VERCEL_TOKEN",
  "VERCEL_ORG_ID",
  "VERCEL_PROJECT_ID",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_ORGANIZATION_ID",
  "SUPABASE_ORGANIZATION_SLUG",
  "SUPABASE_PROJECT_NAME",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_REGION",
]);

function required(name) {
  const value = envEntries.get(name) || process.env[name];

  if (!value) {
    throw new Error(`${name} is required in .env`);
  }

  return value;
}

function readLocalEnv() {
  const lines = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8").split(/\r?\n/) : [];
  const entries = new Map();

  for (const line of lines) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) {
      continue;
    }

    const index = line.indexOf("=");
    entries.set(line.slice(0, index).trim(), line.slice(index + 1).trim());
  }

  return entries;
}

const envEntries = readLocalEnv();

function teamQuery() {
  const teamId = process.env.VERCEL_ORG_ID;
  return teamId ? `&teamId=${encodeURIComponent(teamId)}` : "";
}

async function pushEnv(key, value) {
  const project = required("VERCEL_PROJECT_ID");
  const response = await fetch(
    `${VERCEL_API_BASE}/v10/projects/${encodeURIComponent(project)}/env?upsert=true${teamQuery()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${required("VERCEL_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
        type: key.startsWith("NEXT_PUBLIC_") ? "plain" : "encrypted",
        target: ["production", "preview", "development"],
        comment: "SignalArc deployment variable",
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vercel env ${key} failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function main() {
  const entries = [...envEntries.entries()].filter(([key, value]) => {
    return (
      value &&
      !RESERVED.has(key) &&
      /^(NEXT_PUBLIC_|SUPABASE_|DATABASE_URL|DIRECT_URL|SIGNALARC_|OPENROUTER_|OPENAI_|ANTHROPIC_|GOOGLE_|GROQ_|DEEPSEEK_|QWEN_|CUSTOM_AI_|TELEGRAM_|CRON_|ARC_|PLATFORM_|AGENT_REGISTRY_ADDRESS|POLICY_VAULT_ADDRESS|ATTRIBUTION_ROUTER_ADDRESS|FEE_SETTLEMENT_ADDRESS|MOCK_USDC_ADDRESS)/.test(
        key,
      )
    );
  });

  for (const [key, value] of entries) {
    await pushEnv(key, value);
    console.log(`pushed ${key}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
