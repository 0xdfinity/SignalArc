import { NextResponse } from "next/server";

import { createRecommendation, getAgent, getRecommendations } from "@/lib/db/platform";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { actionIntentSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? undefined;

  return NextResponse.json({ recommendations: await getRecommendations(agentId) });
}

export async function POST(request: Request) {
  const parsed = actionIntentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const agent = await getAgent(input.agentId);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  const rate = await consumeRateLimit({
    key: `signal-ingest:${agent.id}`,
    limit: 30,
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return NextResponse.json({ error: "Signal ingest is rate limited.", resetAt: rate.resetAt }, { status: 429 });
  }

  const recommendation = await createRecommendation({
    agent,
    marketId: input.marketId,
    venue: input.venue,
    action: input.action,
    amount: input.amount,
    confidence: input.confidence,
    rationale: input.rationale,
    expiry: input.expiry,
    signature: input.signature,
    expectedMove: Number(((input.confidence - 0.68) * 12).toFixed(2)),
  });

  return NextResponse.json({ recommendation }, { status: 201 });
}
