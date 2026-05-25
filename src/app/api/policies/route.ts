import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getAgent, getCurrentProfile } from "@/lib/db/platform";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { policyInputSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = policyInputSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cookieStore = await cookies();
  const user = await getCurrentProfile(cookieStore.get("signalarc_user_id")?.value);
  const supabase = getSupabaseServiceClient();

  if (!user.walletAddress || !supabase) {
    return NextResponse.json({ error: "Create an account and wallet before subscribing." }, { status: 401 });
  }

  const input = parsed.data;
  const agent = await getAgent(input.agentId);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  const payload = {
    user_id: user.id,
    agent_id: agent.id,
    max_spend: input.maxSpend,
    max_daily_spend: input.maxDailySpend,
    max_per_trade: input.maxPerTrade,
    market_categories: [agent.category],
    stop_loss_percent: input.stopLossPercent,
    expiry: new Date(Date.now() + input.expiryDays * 24 * 60 * 60 * 1000).toISOString(),
    manual_review: input.manualReview,
  };

  const { data: existingPolicy } = await supabase
    .from("policies")
    .select("id")
    .eq("user_id", user.id)
    .eq("agent_id", agent.id)
    .maybeSingle();

  const { data, error } = existingPolicy
    ? await supabase.from("policies").update(payload).eq("id", existingPolicy.id).select("*").single()
    : await supabase.from("policies").insert(payload).select("*").single();

  if (error || !data) {
    return NextResponse.json({ error: "Policy could not be created." }, { status: 500 });
  }

  if (!existingPolicy) {
    await supabase
      .from("agents")
      .update({ followers: agent.followers + 1 })
      .eq("id", agent.id);
  }
  await supabase.from("activity_events").insert({
    kind: "subscription_created",
    title: `${user.name} subscribed to ${agent.name}`,
    detail: `${input.maxPerTrade} USDC per action, ${input.maxDailySpend} USDC daily.`,
    entity_id: agent.id,
  });

  return NextResponse.json({ policy: data }, { status: 201 });
}
