import { notFound } from "next/navigation";
import { Banknote, RadioTower, ShieldCheck, Users } from "lucide-react";

import { RecommendationList } from "@/components/shared/recommendation-list";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { AgentActions } from "@/components/protocol/agent-actions";
import { AgentReceiptTrail } from "@/components/protocol/agent-receipt-trail";
import { SubscribeAgentPanel } from "@/components/protocol/subscribe-agent-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CATEGORY_COLORS, VENUE_LABELS } from "@/lib/constants";
import type { AgentDetailPayload } from "@/lib/api/payloads";
import { serverApiGet } from "@/lib/api/server";
import { cn } from "@/lib/utils";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await serverApiGet<AgentDetailPayload>(`/api/platform/agents/${id}`).catch(() => null);

  if (!payload) {
    notFound();
  }

  const { agent, policy, receipts, recommendations } = payload;

  return (
    <>
      <PageHeading
        eyebrow="Agent"
        title={agent.name}
        description={agent.description}
        action={<AgentActions agent={agent} />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Banknote} label="ROI" value={`${agent.roi}%`} detail="Net of fees" tone="good" />
        <MetricCard icon={ShieldCheck} label="Trust" value={`${agent.trustScore}/100`} detail="Reputation score" />
        <MetricCard icon={Users} label="Followers" value={`${agent.followers}`} detail="Active subscribers" />
        <MetricCard icon={RadioTower} label="Executions" value={`${agent.totalExecutions}`} detail={`${agent.schedule} schedule`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="rounded-lg border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="font-serif text-lg">Agent profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="outline" className={cn(CATEGORY_COLORS[agent.category])}>
              {agent.category}
            </Badge>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Confidence threshold</span>
                <span>{Math.round(agent.confidenceThreshold * 100)}%</span>
              </div>
              <Progress value={agent.confidenceThreshold * 100} className="h-2" />
            </div>
            <div className="grid gap-2">
              {agent.allowedVenues.map((venue) => (
                <div key={venue} className="rounded-lg border border-border bg-background/45 p-3 text-sm">
                  {VENUE_LABELS[venue]}
                </div>
              ))}
            </div>
            <AgentReceiptTrail agent={agent} receipts={receipts} />
            <SubscribeAgentPanel agent={agent} policy={policy} />
          </CardContent>
        </Card>
        <RecommendationList recommendations={recommendations} />
      </div>
    </>
  );
}
