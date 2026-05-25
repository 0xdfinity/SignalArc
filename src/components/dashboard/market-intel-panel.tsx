import { Activity, LineChart, RadioTower } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketIntelSource } from "@/lib/types";
import { cn } from "@/lib/utils";

const signalTone = {
  bullish: "text-emerald-300",
  bearish: "text-rose-300",
  neutral: "text-cyan-200",
};

export function MarketIntelPanel({ sources }: { sources: MarketIntelSource[] }) {
  const live = sources.filter((source) => source.status === "live").length;

  return (
    <Card className="ops-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChart className="size-4 text-primary" />
            Market watch
          </CardTitle>
          <Badge variant="outline" className="border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
            {live > 0 ? "Live" : "Unavailable"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sources.map((source) => (
          <div key={source.source} className="rounded-lg border border-border/70 bg-background/45 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <RadioTower className="size-3.5 text-primary" />
                {source.source}
              </div>
              <div className="metric-tabular text-xs text-muted-foreground">
                {source.status === "live" ? `${source.latencyMs}ms` : "Unavailable"}
              </div>
            </div>
            {source.items.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {source.items.slice(0, 3).map((item) => (
                <div key={`${source.source}-${item.label}`} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-border/50 bg-card/45 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{item.label}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Activity className="size-3" />
                      {item.metric}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="metric-tabular text-xs font-semibold">{item.value}</div>
                    <div className={cn("mt-1 text-[11px]", signalTone[item.signal])}>
                      {Math.round(item.confidence * 100)}%
                    </div>
                  </div>
                </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-md border border-border/50 bg-card/45 px-3 py-2 text-xs text-muted-foreground">
                No source data available right now.
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
