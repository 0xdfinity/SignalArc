import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getCurrentProfile, getExecutions, getMetrics, getPolicies, getPortfolio } from "@/lib/db/platform";

export async function GET() {
  const cookieStore = await cookies();
  const user = await getCurrentProfile(cookieStore.get("signalarc_user_id")?.value);
  const [policies, executions] = await Promise.all([getPolicies(user.id), getExecutions(user.id)]);

  return NextResponse.json({
    user,
    metrics: getMetrics(user, policies, executions),
    portfolio: getPortfolio(user.usdcBalance, executions),
    policies,
    executions,
  });
}
