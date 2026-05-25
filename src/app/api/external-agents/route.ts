import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { hashSecret } from "@/lib/crypto/secrets";
import { getCurrentProfile, getExternalAgents } from "@/lib/db/platform";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { externalAgentSchema } from "@/lib/validators";

export async function GET() {
  const cookieStore = await cookies();
  const owner = await getCurrentProfile(cookieStore.get("signalarc_user_id")?.value);

  return NextResponse.json({ externalAgents: await getExternalAgents(owner.id) });
}

export async function POST(request: Request) {
  const parsed = externalAgentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const cookieStore = await cookies();
  const owner = await getCurrentProfile(cookieStore.get("signalarc_user_id")?.value);
  const supabase = getSupabaseServiceClient();

  if (!owner.walletAddress || !supabase) {
    return NextResponse.json({ error: "Create an account and wallet before connecting an agent." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("external_agents")
    .insert({
      owner_id: owner.id,
      provider: input.provider,
      endpoint: input.endpoint,
      auth_token_hash: hashSecret(input.authToken),
      signature_key_hash: hashSecret(input.signatureKey),
      capabilities: input.capabilities,
      metadata: input.metadata,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "External agent could not be connected." }, { status: 500 });
  }

  return NextResponse.json({ externalAgent: data }, { status: 201 });
}
