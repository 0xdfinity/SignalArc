import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getCurrentProfile } from "@/lib/db/platform";

export async function GET() {
  const cookieStore = await cookies();
  const user = await getCurrentProfile(cookieStore.get("signalarc_user_id")?.value);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      usdcBalance: user.usdcBalance,
      role: user.role,
    },
  });
}
