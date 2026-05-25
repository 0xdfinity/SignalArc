import { NextResponse } from "next/server";

import { getPublicAgents } from "@/lib/db/platform";

export async function GET() {
  return NextResponse.json({ agents: await getPublicAgents() });
}
