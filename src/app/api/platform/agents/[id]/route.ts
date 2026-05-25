import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getAgent, getAgentReceipts, getCurrentProfile, getPolicies, getRecommendations } from "@/lib/db/platform";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const [agent, user] = await Promise.all([
    getAgent(id),
    getCurrentProfile(cookieStore.get("signalarc_user_id")?.value),
  ]);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  const policies = await getPolicies(user.id);

  return NextResponse.json({
    agent,
    receipts: await getAgentReceipts(agent.id),
    recommendations: await getRecommendations(agent.id),
    policy: policies.find((item) => item.agentId === agent.id) ?? null,
  });
}
