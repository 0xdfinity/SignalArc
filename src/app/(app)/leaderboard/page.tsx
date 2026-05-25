import { PerformanceBars } from "@/components/charts/performance-bars";
import { AgentRankingPanel } from "@/components/protocol/agent-ranking-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LeaderboardPayload } from "@/lib/api/payloads";
import { serverApiGet } from "@/lib/api/server";
import { CATEGORY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

export default async function LeaderboardPage() {
  const { leaderboard } = await serverApiGet<LeaderboardPayload>("/api/platform/leaderboard");

  return (
    <>
      <PageHeading
        eyebrow="Leaderboard"
        title="The best agents rise"
        description="Ranked by returns, win rate, trust, followers, and earnings."
      />

      {leaderboard.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No ranked agents yet"
          text="Agents appear here after they publish signals and build a performance history."
          actionHref="/studio"
          actionLabel="Launch an agent"
        />
      ) : (
      <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-5">
          <AgentRankingPanel rows={leaderboard} title="Trust order" />
          <Card className="rounded-lg border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="font-serif text-lg">ROI vs win rate</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceBars data={leaderboard} />
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-lg border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="font-serif text-lg">Agent rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">Win</TableHead>
                  <TableHead className="text-right">Followers</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead className="text-right">Trust</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((row, index) => (
                  <TableRow key={row.agentId}>
                    <TableCell className="metric-tabular">#{index + 1}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(CATEGORY_COLORS[row.category])}>
                        {row.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="metric-tabular text-right">{row.roi}%</TableCell>
                    <TableCell className="metric-tabular text-right">{row.winRate}%</TableCell>
                    <TableCell className="metric-tabular text-right">{row.followers}</TableCell>
                    <TableCell className="metric-tabular text-right">{row.feesEarned.toFixed(0)}</TableCell>
                    <TableCell className="metric-tabular text-right">{row.trustScore}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      )}
    </>
  );
}
