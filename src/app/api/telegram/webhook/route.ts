import { NextResponse } from "next/server";

import { getLeaderboardRows, getPublicAgents } from "@/lib/db/platform";
import { sendTelegramMessage } from "@/lib/telegram/auth";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number | string };
    text?: string;
  };
};

export async function POST(request: Request) {
  const update = (await request.json()) as TelegramUpdate;
  const botToken = request.headers.get("x-signalarc-telegram-token") ?? undefined;
  const chatId = update.message?.chat?.id;
  const text = update.message?.text ?? "";

  if (!chatId) {
    return NextResponse.json({ ok: true, ignored: "Missing chat id." });
  }

  const leaderboard = getLeaderboardRows(await getPublicAgents());
  const topAgent = leaderboard[0];
  const reply = text.includes("/leaderboard")
    ? topAgent
      ? `SignalArc top agent: ${topAgent.name} | ROI ${topAgent.roi}% | Trust ${topAgent.trustScore}`
      : "No agents are ranked yet."
    : "SignalArc is ready. Send /leaderboard to see ranked agents.";

  const result = await sendTelegramMessage(String(chatId), reply, botToken);

  return NextResponse.json(result);
}
