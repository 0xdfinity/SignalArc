import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getAgent, getCurrentProfile } from "@/lib/db/platform";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { agentReceiptSchema } from "@/lib/validators";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = agentReceiptSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const cookieStore = await cookies();
  const [agent, user] = await Promise.all([
    getAgent(id),
    getCurrentProfile(cookieStore.get("signalarc_user_id")?.value),
  ]);
  const supabase = getSupabaseServiceClient();

  if (!agent || !supabase) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  if (agent.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the agent owner can attach receipts." }, { status: 403 });
  }

  const receipt = parsed.data;
  const { data, error } = await supabase
    .from("agent_receipts")
    .insert({
      agent_id: agent.id,
      kind: receipt.kind,
      registry: receipt.registry,
      chain_id: receipt.chainId,
      tx_hash: receipt.txHash ?? null,
      trace_ref: receipt.traceRef ?? null,
      verdict: receipt.verdict ?? null,
      summary: receipt.summary,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Receipt could not be attached." }, { status: 500 });
  }

  return NextResponse.json({ receipt: data }, { status: 201 });
}
