import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Contract, formatUnits, JsonRpcProvider } from "ethers";
import { z } from "zod";

import { POLICY_VAULT_ABI } from "@/lib/arc/contracts";
import { ARC_TESTNET } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/db/platform";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const syncSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export async function POST(request: Request) {
  const parsed = syncSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cookieStore = await cookies();
  const user = await getCurrentProfile(cookieStore.get("signalarc_user_id")?.value);

  if (!user.walletAddress) {
    return NextResponse.json({ error: "Create an account before syncing vault balance." }, { status: 401 });
  }

  if (user.walletAddress.toLowerCase() !== parsed.data.walletAddress.toLowerCase()) {
    return NextResponse.json({ error: "Connected wallet does not match this SignalArc account." }, { status: 403 });
  }

  const vaultAddress = process.env.POLICY_VAULT_ADDRESS;
  const supabase = getSupabaseServiceClient();

  if (!vaultAddress || !supabase) {
    return NextResponse.json({ error: "Vault sync is not configured." }, { status: 503 });
  }

  const provider = new JsonRpcProvider(process.env.ARC_CANTEEN_RPC_URL || process.env.ARC_TESTNET_RPC_URL || ARC_TESTNET.rpcUrl);
  const vault = new Contract(vaultAddress, POLICY_VAULT_ABI, provider);
  const rawBalance = await vault.balances(user.walletAddress);
  const usdcBalance = Number(formatUnits(rawBalance, ARC_TESTNET.usdcDecimals));

  const { error } = await supabase
    .from("profiles")
    .update({ usdc_balance: usdcBalance })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Balance could not be saved." }, { status: 500 });
  }

  await supabase.from("activity_events").insert({
    kind: "policy_passed",
    title: "Vault balance synced",
    detail: `${usdcBalance.toFixed(2)} USDC available for policy-checked execution.`,
    entity_id: user.id,
  });

  return NextResponse.json({ usdcBalance });
}
