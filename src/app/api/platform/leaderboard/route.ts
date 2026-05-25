import { NextResponse } from "next/server";

import { getLeaderboardRows, getPublicAgents } from "@/lib/db/platform";

export async function GET() {
  return NextResponse.json({ leaderboard: getLeaderboardRows(await getPublicAgents()) });
}
