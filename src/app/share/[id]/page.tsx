import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, Send, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAgent, getExecution } from "@/lib/db/platform";

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const execution = await getExecution(id);

  if (!execution) {
    notFound();
  }

  const agent = await getAgent(execution.agentId);
  const shareText = encodeURIComponent(
    `${agent?.name ?? "SignalArc agent"} settled ${execution.pnl.toFixed(2)} USDC PnL on SignalArc`,
  );

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Public execution proof</div>
          <h1 className="display-title mt-3 text-5xl leading-none">SignalArc share card</h1>
        </div>
        <Card className="rounded-lg border-border bg-card">
          <CardContent className="p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/share/${execution.id}/opengraph-image`}
              alt="SignalArc share card"
              className="w-full rounded-lg border border-border/70"
            />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1">
                <a href={`https://twitter.com/intent/tweet?text=${shareText}`}>
                  <Share2 className="size-4" />
                  Share on X
                </a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href={`https://t.me/share/url?url=${encodeURIComponent(`/share/${execution.id}`)}&text=${shareText}`}>
                  <Send className="size-4" />
                  Telegram
                </a>
              </Button>
              <Button asChild variant="secondary" className="flex-1">
                <Link href={`/dashboard`}>
                  <Copy className="size-4" />
                  Back
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
