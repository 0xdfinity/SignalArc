import Link from "next/link";
import { ArrowUpRight, RadioTower, ShieldCheck, Users } from "lucide-react";

import { AgentReceiptTrait } from "@/components/protocol/agent-receipt-trail";
import type { Agent } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card className="rounded-lg border-border bg-card/95 transition hover:border-primary/35">
      <CardHeader className="space-y-3 p-3.5 pb-2">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9 rounded-md">
            <AvatarFallback className="rounded-md bg-primary/15 text-primary">{agent.avatar}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link href={`/agents/${agent.id}`} className="text-sm font-semibold hover:text-primary">
              {agent.name}
            </Link>
            <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {agent.followers} followers
            </div>
          </div>
          </div>
        </div>
        <Badge variant="outline" className={cn("w-fit max-w-full whitespace-normal text-left leading-4", CATEGORY_COLORS[agent.category])}>
          {agent.category}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 p-3.5 pt-2">
        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{agent.description}</p>
        <AgentReceiptTrait agent={agent} />
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="ROI" value={`${agent.roi}%`} />
          <MiniStat label="Win" value={`${agent.winRate}%`} />
          <MiniStat label="Fee" value={`${agent.feePercent}%`} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              Trust score
            </span>
            <span className="metric-tabular">{agent.trustScore}/100</span>
          </div>
          <Progress value={agent.trustScore} className="h-1.5" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {agent.followers}
            </span>
            <span className="flex items-center gap-1">
              <RadioTower className="size-3.5" />
              {agent.schedule}
            </span>
          </div>
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link href={`/agents/${agent.id}`}>
              Open
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/45 p-2">
      <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="metric-tabular mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
