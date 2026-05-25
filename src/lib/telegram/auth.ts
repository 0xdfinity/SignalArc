import { createHmac } from "crypto";

export function verifyTelegramInitData(initData: string, botToken?: string) {
  if (!botToken) {
    return { ok: false, reason: "Telegram bot token is not configured." };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    return { ok: false, reason: "Missing Telegram hash." };
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculated = createHmac("sha256", secret).update(dataCheckString).digest("hex");

  return {
    ok: calculated === hash,
    reason: calculated === hash ? "Telegram login verified." : "Telegram signature mismatch.",
  };
}

export async function sendTelegramMessage(chatId: string, text: string, botToken?: string) {
  if (!botToken) {
    return { ok: false, reason: "Telegram bot token is not configured." };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });

  return {
    ok: response.ok,
    reason: response.ok ? "Message sent." : await response.text(),
  };
}
