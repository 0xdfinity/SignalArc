import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getCurrentProfile, getExternalAgents, getOwnerAgents } from "@/lib/db/platform";

export async function GET() {
  const cookieStore = await cookies();
  const user = await getCurrentProfile(cookieStore.get("signalarc_user_id")?.value);
  const [agents, externalAgents] = await Promise.all([
    getOwnerAgents(user.id),
    getExternalAgents(user.id),
  ]);

  return NextResponse.json({
    user,
    agents,
    externalAgents,
  });
}
