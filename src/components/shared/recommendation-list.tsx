import { Clock, RadioTower, ShieldCheck } from "lucide-react";

import type { Recommendation } from "@/lib/types";
import { VENUE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RecommendationList({
  recommendations,
  compact = false,
}: {
  recommendations: Recommendation[];
  compact?: boolean;
}) {
  return (
    <Card className="rounded-lg border-border bg-card">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-lg">
          <RadioTower className="size-4 text-primary" />
          Live recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="rounded-lg border border-border bg-background/45 p-4 text-sm leading-6 text-muted-foreground">
            No recommendations yet. Follow an agent to receive your first signal.
          </div>
        ) : null}
        {recommendations.slice(0, compact ? 4 : 8).map((recommendation) => (
          <div
            key={recommendation.id}
            className="rounded-lg border border-border bg-background/45 p-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{recommendation.title}</span>
                  <Badge variant="outline">{recommendation.action}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {recommendation.rationale}
                </p>
              </div>
              <div className="metric-tabular shrink-0 text-right text-sm font-semibold">
                {recommendation.amount} USDC
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-primary" />
                {Math.round(recommendation.confidence * 100)}% confidence
              </span>
              <span>{VENUE_LABELS[recommendation.venue]}</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {new Date(recommendation.expiry).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">
                EV {recommendation.expectedMove}%
              </span>
            </div>
          </div>
        ))}
        {!compact && recommendations.length > 0 ? (
          <Button className="w-full" variant="outline">
            Review selected signal
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
