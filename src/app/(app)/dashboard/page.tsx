import { Banknote, ChartNoAxesCombined, ReceiptText, ShieldCheck, UserPlus } from "lucide-react";

import { PortfolioChart } from "@/components/charts/portfolio-chart";
import { MarketIntelPanel } from "@/components/dashboard/market-intel-panel";
import { LiveFlow } from "@/components/graph/live-flow";
import { AgentRankingPanel } from "@/components/protocol/agent-ranking-panel";
import { EconomyStrip } from "@/components/protocol/economy-strip";
import { ExecutionFeed } from "@/components/protocol/execution-feed";
import { ProtocolGraph } from "@/components/protocol/protocol-graph";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { RecommendationList } from "@/components/shared/recommendation-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardPayload } from "@/lib/api/payloads";
import { serverApiGet } from "@/lib/api/server";

export default async function DashboardPage() {
  const { activity, graph, leaderboard, marketIntel, metrics, portfolio, recommendations, user } =
    await serverApiGet<DashboardPayload>("/api/platform/dashboard");
  const needsSetup = !user.walletAddress;
  const settledEvents = activity.filter((event) => event.kind === "execution_settled").length;

  return (
    <>
      <PageHeading
        eyebrow="Dashboard"
        title="Agent economy command"
        description="Track agents, signals, policy gates, execution flow, and attribution from one protocol desk."
      />

      {needsSetup ? (
        <div className="mb-5">
          <EmptyState
            icon={UserPlus}
            title="Finish setup to start"
            text="Create your account, add a wallet, and set rules before following agents."
            actionHref="/onboarding"
            actionLabel="Start onboarding"
          />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Banknote}
          label="USDC balance"
          value={`${metrics.balance.toLocaleString()}`}
          detail="Available capital"
          tone="good"
        />
        <MetricCard
          icon={ChartNoAxesCombined}
          label="Net PnL"
          value={`+${metrics.pnl.toFixed(2)}`}
          detail="Recent performance"
          tone="good"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Active policies"
          value={`${metrics.activePolicies}`}
          detail="Rules protecting capital"
        />
        <MetricCard
          icon={ReceiptText}
          label="Route cost"
          value={`<=${metrics.networkFeeCap.toFixed(2)}`}
          detail="Estimated maximum"
          tone="warn"
        />
      </div>

      <div className="mt-5">
        <EconomyStrip />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-lg border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="font-serif text-lg">Live agent graph</CardTitle>
          </CardHeader>
          <CardContent>
            {graph.nodes.length > 0 ? (
              <LiveFlow nodes={graph.nodes} edges={graph.edges} />
            ) : (
              <ProtocolGraph agentCount={leaderboard.length} signalCount={recommendations.length} executionCount={settledEvents} />
            )}
          </CardContent>
        </Card>
        <div className="space-y-5">
          <AgentRankingPanel rows={leaderboard} />
          <RecommendationList recommendations={recommendations} compact />
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <MarketIntelPanel sources={marketIntel} />
        <Card className="rounded-lg border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="font-serif text-lg">Balance history</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioChart data={portfolio} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-5">
        <ExecutionFeed activity={activity} recommendations={recommendations} />
      </div>
    </>
  );
}
