import { NextResponse } from "next/server";

import { generateSignalWithProvider } from "@/lib/ai/providers";
import { createRecommendation, getAgentProviderKey, getPublicAgents } from "@/lib/db/platform";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized scheduler request." }, { status: 401 });
  }

  const agents = (await getPublicAgents()).filter((agent) => agent.status === "active" && agent.schedule !== "manual");
  const generated = [];

  for (const agent of agents) {
    const agentLimit = await consumeRateLimit({
      key: `scheduler:agent:${agent.id}`,
      limit: 1,
      windowSeconds: scheduleWindow(agent.schedule),
    });
    const providerLimit = await consumeRateLimit({
      key: `scheduler:provider:${agent.aiProvider}`,
      limit: 40,
      windowSeconds: 60,
    });

    if (!agentLimit.allowed || !providerLimit.allowed) {
      generated.push({
        agentId: agent.id,
        status: "rate_limited",
        resetAt: agentLimit.allowed ? providerLimit.resetAt : agentLimit.resetAt,
      });
      continue;
    }

    const apiKey = agent.mode === "algorithmic" ? undefined : (await getAgentProviderKey(agent.id)) ?? undefined;

    if (!apiKey && agent.mode !== "algorithmic") {
      generated.push({
        agentId: agent.id,
        status: "needs_provider_key",
      });
      continue;
    }

    try {
      const signal = await generateSignalWithProvider({
        agent,
        apiKey,
        endpoint: agent.aiProvider === "custom" ? process.env.CUSTOM_AI_BASE_URL : undefined,
      });

      const recommendation = await createRecommendation({
        agent,
        ...signal,
        expiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        signature: `scheduler:${agent.id}:${Date.now()}`,
      });

      generated.push({
        agentId: agent.id,
        status: "published",
        recommendation,
      });
    } catch (error) {
      generated.push({
        agentId: agent.id,
        status: "provider_error",
        error: error instanceof Error ? error.message : "Provider request failed.",
      });
    }
  }

  return NextResponse.json({
    generated,
  });
}

function scheduleWindow(schedule: string) {
  if (schedule === "5m") {
    return 240;
  }

  if (schedule === "10m") {
    return 540;
  }

  return 3300;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    schedule: ["5m", "10m", "hourly"],
    endpoint: "/api/scheduler",
    auth: Boolean(process.env.CRON_SECRET),
  });
}
