import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getVenueAdapter } from "@/lib/adapters";
import {
  getAgent,
  getCurrentProfile,
  getPolicies,
  getRecommendation,
  recordExecution,
} from "@/lib/db/platform";
import { calculateFeeSplit, evaluatePolicy } from "@/lib/policy";
import { executeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = executeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { recommendationId } = parsed.data;
  const cookieStore = await cookies();
  const user = await getCurrentProfile(cookieStore.get("signalarc_user_id")?.value);

  if (!user.walletAddress) {
    return NextResponse.json({ error: "Create an account and wallet before executing actions." }, { status: 401 });
  }

  const recommendation = await getRecommendation(recommendationId);

  if (!recommendation) {
    return NextResponse.json({ error: "Recommendation not found." }, { status: 404 });
  }

  const agent = await getAgent(recommendation.agentId);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  const policy = (await getPolicies(user.id)).find((item) => item.agentId === agent.id);
  const decision = evaluatePolicy({ policy, intent: recommendation, agent, user });

  if (!decision.allowed) {
    return NextResponse.json(
      {
        status: decision.result,
        reasons: decision.reasons,
        execution: {
          id: `exec-blocked-${Date.now().toString(36)}`,
          policyResult: decision.result,
          recommendationId,
        },
      },
      { status: decision.result === "manual_review" ? 202 : 409 },
    );
  }

  const adapter = getVenueAdapter(recommendation.venue);
  const adapterResult = await adapter.execute(recommendation);
  const fees = calculateFeeSplit(recommendation.amount, agent.feePercent);
  const execution = await recordExecution({
    user,
    agent,
    recommendation,
    networkFee: fees.networkFee,
    feePaid: fees.totalFee,
    agentFee: fees.agentFee,
    status: adapterResult.status,
    txHash: adapterResult.txHash,
    pnl: adapterResult.pnl,
    policyResult: "passed",
  });

  return NextResponse.json({
    status: "executed",
    reasons: decision.reasons,
    execution,
    settlementNote: adapterResult.settlementNote,
  });
}
