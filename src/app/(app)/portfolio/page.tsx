import { Banknote, LockKeyhole, RadioTower, ShieldCheck } from "lucide-react";

import { PortfolioChart } from "@/components/charts/portfolio-chart";
import { VaultFundingPanel } from "@/components/portfolio/vault-funding-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PortfolioPayload } from "@/lib/api/payloads";
import { serverApiGet } from "@/lib/api/server";
import { VENUE_LABELS } from "@/lib/constants";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  policy_blocked: "Blocked",
  executed: "Open",
  settled: "Settled",
  expired: "Expired",
};

export default async function PortfolioPage() {
  const { executions, metrics, policies, portfolio, user } =
    await serverApiGet<PortfolioPayload>("/api/platform/portfolio");
  const manualGateCount = policies.filter((policy) => policy.manualReview).length;

  return (
    <>
      <PageHeading
        eyebrow="Portfolio"
        title="Capital and rules"
        description="See balances, limits, and recent results."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Banknote} label="Balance" value={`${metrics.balance.toLocaleString()}`} detail="Available USDC" tone="good" />
        <MetricCard icon={RadioTower} label="Executions" value={`${metrics.executions}`} detail={`${metrics.settled} settled`} />
        <MetricCard icon={ShieldCheck} label="Policies" value={`${metrics.activePolicies}`} detail="Active authorizations" />
        <MetricCard icon={LockKeyhole} label="Manual gates" value={`${manualGateCount}`} detail="Review required" tone="warn" />
      </div>

      <div className="mt-5">
        <VaultFundingPanel accountWallet={user.walletAddress} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-lg border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="font-serif text-lg">Balance history</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioChart data={portfolio} />
          </CardContent>
        </Card>
        <Card className="rounded-lg border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="font-serif text-lg">Active rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {policies.length === 0 ? (
              <div className="rounded-lg border border-border/70 bg-background/45 p-4 text-sm leading-6 text-muted-foreground">
                No rules yet. Subscribe to an agent to create your first rule set.
              </div>
            ) : null}
            {policies.map((policy) => (
              <div key={policy.id} className="rounded-lg border border-border bg-background/45 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium font-mono text-xs">{policy.agentId}</div>
                  <Badge variant={policy.manualReview ? "secondary" : "outline"}>
                    {policy.manualReview ? "Review first" : "Auto follow"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <span>{policy.maxPerTrade} per trade</span>
                  <span>{policy.maxDailySpend} daily</span>
                  <span>{policy.stopLossPercent}% stop loss</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {executions.length > 0 ? (
      <Card className="mt-5 rounded-lg border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-serif text-lg">Execution ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Execution</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Tx fee</TableHead>
                <TableHead className="text-right">PnL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell className="font-mono text-xs">{execution.id.replace("exec-", "#")}</TableCell>
                  <TableCell className="font-mono text-xs">{execution.agentId}</TableCell>
                  <TableCell>{VENUE_LABELS[execution.venue]}</TableCell>
                  <TableCell>
                    <Badge variant={execution.status === "settled" ? "outline" : "secondary"}>
                      {statusLabels[execution.status] ?? execution.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="metric-tabular text-right">{execution.amount}</TableCell>
                  <TableCell className="metric-tabular text-right">{execution.networkFee.toFixed(2)}</TableCell>
                  <TableCell className="metric-tabular text-right">{execution.pnl.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      ) : (
        <div className="mt-5">
          <EmptyState
            icon={RadioTower}
            title="No activity yet"
            text="Once an agent acts inside your rules, the result appears in this ledger."
            actionHref="/agents"
            actionLabel="Find agents"
          />
        </div>
      )}
    </>
  );
}
