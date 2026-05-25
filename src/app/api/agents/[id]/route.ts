import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { encryptSecret } from "@/lib/crypto/secrets";
import { getAgent, getCurrentProfile } from "@/lib/db/platform";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { agentUpdateSchema } from "@/lib/validators";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = agentUpdateSchema.safeParse(await request.json());

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
    return NextResponse.json({ error: "Only the owner can update this agent." }, { status: 403 });
  }

  const rate = await consumeRateLimit({
    key: `agent-update:${agent.id}`,
    limit: 30,
    windowSeconds: 3600,
  });

  if (!rate.allowed) {
    return NextResponse.json({ error: "Agent updates are rate limited.", resetAt: rate.resetAt }, { status: 429 });
  }

  const input = parsed.data;
  const update: Record<string, unknown> = {};

  if (input.name !== undefined) update.name = input.name;
  if (input.description !== undefined) update.description = input.description;
  if (input.avatar !== undefined) update.avatar = input.avatar;
  if (input.category !== undefined) update.category = input.category;
  if (input.aiProvider !== undefined) update.ai_provider = input.aiProvider;
  if (input.model !== undefined) update.model = input.model;
  if (input.mode !== undefined) update.mode = input.mode;
  if (input.schedule !== undefined) update.schedule = input.schedule;
  if (input.confidenceThreshold !== undefined) update.confidence_threshold = input.confidenceThreshold;
  if (input.allowedVenues !== undefined) update.allowed_venues = input.allowedVenues;
  if (input.feePercent !== undefined) update.fee_percent = input.feePercent;
  if (input.visibility !== undefined) update.visibility = input.visibility;
  if (input.status !== undefined) update.status = input.status;
  if (input.instructionPrompt !== undefined) update.instruction_prompt = input.instructionPrompt;

  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from("agents").update(update).eq("id", agent.id);

    if (error) {
      return NextResponse.json({ error: "Agent could not be updated." }, { status: 500 });
    }
  }

  const secretContext = `agent:${agent.id}`;
  const secretUpdate: Record<string, string | null> = {};

  if (input.apiKey) secretUpdate.encrypted_model_key = encryptSecret(input.apiKey, secretContext);
  if (input.telegramBotToken) secretUpdate.encrypted_telegram_token = encryptSecret(input.telegramBotToken, secretContext);
  if (input.githubPat) secretUpdate.encrypted_github_pat = encryptSecret(input.githubPat, secretContext);

  if (Object.keys(secretUpdate).length > 0) {
    const { error } = await supabase.from("agent_secrets").upsert({
      agent_id: agent.id,
      ...secretUpdate,
    });

    if (error) {
      return NextResponse.json({ error: "Agent secrets could not be updated." }, { status: 500 });
    }
  }

  return NextResponse.json({ agent: await getAgent(agent.id) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json({ error: "Only the owner can delete this agent." }, { status: 403 });
  }

  const { error } = await supabase.from("agents").update({ status: "archived", visibility: "private" }).eq("id", agent.id);

  if (error) {
    return NextResponse.json({ error: "Agent could not be deleted." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
