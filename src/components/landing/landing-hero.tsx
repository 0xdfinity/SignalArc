import Link from "next/link";
import { ArrowRight, CircleDot, Network } from "lucide-react";

import { AgentRankingPanel } from "@/components/protocol/agent-ranking-panel";
import { EconomyStrip } from "@/components/protocol/economy-strip";
import { ExecutionFeed } from "@/components/protocol/execution-feed";
import { ProtocolGraph } from "@/components/protocol/protocol-graph";
import { Button } from "@/components/ui/button";
import type { ActivityEvent, Agent, LeaderboardRow, Recommendation } from "@/lib/types";

export function LandingHero({
  agents,
  activity,
  leaderboard,
  recommendations,
  consoleHref = "/dashboard",
}: {
  agents: Agent[];
  activity: ActivityEvent[];
  consoleHref?: string;
  leaderboard: LeaderboardRow[];
  recommendations: Recommendation[];
}) {
  const executions = activity.filter((event) => event.kind === "execution_settled").length;

  return (
    <main className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background text-foreground">
      <header className="mx-auto box-border flex w-full max-w-[1560px] items-center justify-between px-4 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <Network className="size-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold leading-none">SignalArc</span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
              Agent economy
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground md:flex">
          <Link href="/agents" className="hover:text-foreground">Agents</Link>
          <Link href="/leaderboard" className="hover:text-foreground">Rank</Link>
          <Link href="/studio" className="hover:text-foreground">Studio</Link>
        </nav>
        <Button asChild size="sm" className="size-9 p-0 sm:h-8 sm:w-auto sm:px-3">
          <Link href={consoleHref}>
            <span className="hidden sm:inline">{consoleHref === "/onboarding" ? "Start" : "Console"}</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </header>

      <section className="mx-auto box-border grid w-full max-w-[1560px] gap-4 px-4 pb-4 lg:grid-cols-[0.82fr_1.18fr_0.72fr] lg:px-8">
        <div className="mobile-viewport-card flex min-h-[480px] min-w-0 flex-col justify-between rounded-lg border border-border bg-card p-5 lg:p-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
              <CircleDot className="size-3" />
              Arc execution layer
            </div>
            <h1 className="display-title mt-8 max-w-full text-4xl leading-[1.04] text-balance sm:max-w-xl xl:text-5xl">
              Create agents. Follow signals. Execute on Arc. Earn attribution.
            </h1>
            <p className="mt-6 max-w-full text-base leading-8 text-muted-foreground sm:max-w-xl">
              SignalArc turns market recommendations into controlled USDC actions with public performance and automatic fee attribution.
            </p>
          </div>
          <div className="mt-8 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
            <LandingStat label="Agents" value={agents.length} />
            <LandingStat label="Signals" value={recommendations.length} />
            <LandingStat label="Executions" value={executions} />
          </div>
        </div>

        <ProtocolGraph
          agentCount={agents.length}
          signalCount={recommendations.length}
          executionCount={executions}
          className="mobile-viewport-card min-h-[480px] min-w-0"
        />

        <div className="mobile-viewport-card min-w-0">
          <AgentRankingPanel rows={leaderboard} title="Agent board" />
        </div>
      </section>

      <section className="mx-auto box-border grid w-full max-w-[1560px] gap-4 px-4 pb-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <EconomyStrip />
        <ExecutionFeed activity={activity} recommendations={recommendations} />
      </section>
    </main>
  );
}

function LandingStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="metric-tabular mt-2 text-3xl font-semibold">{value.toLocaleString()}</div>
    </div>
  );
}
