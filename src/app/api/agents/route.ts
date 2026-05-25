import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getCurrentProfile, getPublicAgents } from "@/lib/db/platform";
import { encryptSecret, isUsingDevelopmentSecret } from "@/lib/crypto/secrets";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { agentInputSchema } from "@/lib/validators";

export async function GET() {
  return NextResponse.json({ agents: await getPublicAgents() });
}

export async function POST(request: Request) {
  const parsed = agentInputSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const cookieStore = await cookies();
  const owner = await getCurrentProfile(cookieStore.get("signalarc_user_id")?.value);
  const supabase = getSupabaseServiceClient();

  if (!owner.walletAddress || !supabase) {
    return NextResponse.json({ error: "Create an account and wallet before launching an agent." }, { status: 401 });
  }

  const rate = await consumeRateLimit({
    key: `agent-create:${owner.id}`,
    limit: 10,
    windowSeconds: 3600,
  });

  if (!rate.allowed) {
    return NextResponse.json({ error: "Agent creation is rate limited.", resetAt: rate.resetAt }, { status: 429 });
  }

  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: agent, error } = await supabase
    .from("agents")
    .insert({
      owner_id: owner.id,
      slug: `${slug}-${Date.now().toString(36)}`,
      name: input.name,
      description: input.description,
      avatar: input.avatar,
      category: input.category,
      ai_provider: input.aiProvider,
      model: input.model,
      mode: input.mode,
      schedule: input.schedule,
      confidence_threshold: input.confidenceThreshold,
      allowed_venues: input.allowedVenues,
      fee_percent: input.feePercent,
      visibility: input.visibility,
      status: "active",
      instruction_prompt: input.instructionPrompt,
    })
    .select("*")
    .single();

  if (error || !agent) {
    return NextResponse.json({ error: "Agent could not be created." }, { status: 500 });
  }

  const secretContext = `agent:${agent.id}`;
  const encryptedSecrets = {
    apiKey: input.apiKey ? encryptSecret(input.apiKey, secretContext) : null,
    telegramBotToken: input.telegramBotToken ? encryptSecret(input.telegramBotToken, secretContext) : null,
    githubPat: input.githubPat ? encryptSecret(input.githubPat, secretContext) : null,
  };

  await supabase.from("agent_secrets").upsert({
    agent_id: agent.id,
    encrypted_model_key: encryptedSecrets.apiKey,
    encrypted_telegram_token: encryptedSecrets.telegramBotToken,
    encrypted_github_pat: encryptedSecrets.githubPat,
  });

  return NextResponse.json(
    {
      agent: {
        id: agent.id,
        ownerId: agent.owner_id,
        slug: agent.slug,
        name: agent.name,
        description: agent.description,
        avatar: agent.avatar,
        category: agent.category,
        aiProvider: agent.ai_provider,
        model: agent.model,
        mode: agent.mode,
        schedule: agent.schedule,
        confidenceThreshold: Number(agent.confidence_threshold),
        allowedVenues: agent.allowed_venues,
        feePercent: Number(agent.fee_percent),
        visibility: agent.visibility,
        status: agent.status,
        followers: 0,
        trustScore: 50,
        roi: 0,
        winRate: 0,
        feesEarned: 0,
        totalExecutions: 0,
        createdAt: agent.created_at,
        instructionPrompt: agent.instruction_prompt,
        receiptCount: 0,
        latestVerdict: "pending",
      },
      secretStatus: isUsingDevelopmentSecret() ? "development-key" : "encrypted",
    },
    { status: 201 },
  );
}
