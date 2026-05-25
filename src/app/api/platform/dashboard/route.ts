import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getActivity, getCurrentProfile, getExecutions, getGraph, getLeaderboardRows, getMetrics, getPolicies, getPortfolio, getPublicAgents, getRecommendations } from "@/lib/db/platform";
import { getMarketIntel } from "@/lib/market-data";

export async function GET() {
  const cookieStore = await cookies();
  const user = await getCurrentProfile(cookieStore.get("signalarc_user_id")?.value);
  const [agents, recommendations, policies, executions, activity, marketIntel] = await Promise.all([
    getPublicAgents(),
    getRecommendations(),
    getPolicies(user.id),
    getExecutions(user.id),
    getActivity(user.id),
    getMarketIntel(),
  ]);
  const metrics = getMetrics(user, policies, executions);

  return NextResponse.json({
    user,
    metrics,
    portfolio: getPortfolio(user.usdcBalance, executions),
    marketIntel,
    graph: getGraph(user, agents, recommendations),
    leaderboard: getLeaderboardRows(agents),
    recommendations,
    activity: activity.slice(0, 5),
  });
}
