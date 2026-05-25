import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServiceClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(160),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  rules: z.object({
    maxPerTrade: z.number().positive().max(10_000),
    maxDailySpend: z.number().positive().max(100_000),
    manualReview: z.boolean(),
  }),
});

export async function POST(request: Request) {
  const parsed = onboardingSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json({ error: "Account service unavailable." }, { status: 503 });
  }

  const input = parsed.data;
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        email: input.email,
        display_name: input.name,
        wallet_address: input.walletAddress,
        role: "user",
        usdc_balance: 0,
      },
      { onConflict: "email" },
    )
    .select("id,email,display_name,wallet_address,role,usdc_balance,created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Account could not be created." }, { status: 500 });
  }

  const response = NextResponse.json({
    user: {
      id: data.id,
      name: data.display_name,
      email: data.email,
      walletAddress: data.wallet_address,
      role: data.role,
      usdcBalance: Number(data.usdc_balance ?? 0),
    },
    rules: input.rules,
  });

  response.cookies.set("signalarc_user_id", data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });

  return response;
}
