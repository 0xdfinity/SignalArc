import { NextResponse } from "next/server";

import { getMarketIntel } from "@/lib/market-data";

export async function GET() {
  return NextResponse.json({
    sources: await getMarketIntel(),
    execution: "Arc L1 testnet",
  });
}
