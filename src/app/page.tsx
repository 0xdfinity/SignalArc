import { cookies } from "next/headers";

import { LandingHero } from "@/components/landing/landing-hero";
import {
  getCurrentProfile,
  getLeaderboardRows,
  getPublicActivity,
  getPublicAgents,
  getRecommendations,
} from "@/lib/db/platform";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const [agents, recommendations, activity, user] = await Promise.all([
    getPublicAgents(),
    getRecommendations(),
    getPublicActivity(),
    getCurrentProfile(cookieStore.get("signalarc_user_id")?.value),
  ]);

  return (
    <LandingHero
      agents={agents}
      activity={activity}
      consoleHref={user.walletAddress ? "/dashboard" : "/onboarding"}
      leaderboard={getLeaderboardRows(agents)}
      recommendations={recommendations}
    />
  );
}
