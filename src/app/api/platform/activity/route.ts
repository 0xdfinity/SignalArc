import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getActivity, getCurrentProfile } from "@/lib/db/platform";

export async function GET() {
  const cookieStore = await cookies();
  const user = await getCurrentProfile(cookieStore.get("signalarc_user_id")?.value);

  return NextResponse.json({ activity: await getActivity(user.id) });
}
