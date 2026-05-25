import { createHash } from "crypto";

import { getSupabaseServiceClient } from "@/lib/supabase/server";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
};

type RateLimitRow = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
};

export async function consumeRateLimit({
  key,
  limit,
  windowSeconds,
}: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000).toISOString(),
    };
  }

  const safeKey = createHash("sha256").update(key).digest("hex");
  const { data, error } = await supabase
    .rpc("consume_rate_limit", {
      p_key: safeKey,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    .maybeSingle();

  if (error || !data) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + windowSeconds * 1000).toISOString(),
    };
  }

  const row = data as RateLimitRow;

  return {
    allowed: row.allowed,
    remaining: row.remaining,
    resetAt: row.reset_at,
  };
}
