import Link from "next/link";
import { KeyRound, Mail, MessageCircle, WalletCards } from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CurrentUserPayload } from "@/lib/api/payloads";
import { serverApiGet } from "@/lib/api/server";

const providers = ["OpenRouter", "OpenAI", "Claude", "Gemini", "Groq", "DeepSeek", "Qwen"];

export default async function SettingsPage() {
  const { user } = await serverApiGet<CurrentUserPayload>("/api/platform/me");
  const walletLabel = user.walletAddress
    ? `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}`
    : "No wallet connected";

  return (
    <>
      <PageHeading
        eyebrow="Settings"
        title="Account and connections"
        description="Manage login, wallets, notifications, and agent keys."
      />

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-5">
          <Card className="rounded-lg border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <WalletCards className="size-4 text-primary" />
                Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border bg-background/45 p-3">
                <div className="text-xs text-muted-foreground">Account wallet</div>
                <div className="mt-1 break-all font-mono text-sm">{walletLabel}</div>
              </div>
              {!user.walletAddress ? (
                <Button asChild className="w-full">
                  <Link href="/onboarding">Finish setup</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
          <Card className="rounded-lg border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <KeyRound className="size-4 text-primary" />
                Agent keys
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              {providers.map((provider) => (
                  <div key={provider} className="rounded-lg border border-border bg-background/45 px-3 py-2">
                  <div className="font-medium">{provider}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Not connected</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="rounded-lg border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <Mail className="size-4 text-primary" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-background/45 p-3">
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="mt-1 break-all text-sm">{user.email || "Not added"}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <MessageCircle className="size-4 text-primary" />
                Telegram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-background/45 p-3">
                <div className="text-xs text-muted-foreground">Telegram</div>
                <div className="mt-1 text-sm">Connect from an agent notification flow.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
