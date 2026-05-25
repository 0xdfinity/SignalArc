import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "default" | "good" | "warn";
}) {
  return (
    <Card className="rounded-lg border-border bg-card/95">
      <CardContent className="flex min-h-24 items-start justify-between gap-3 p-3.5">
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
          <div className="metric-tabular mt-3 text-2xl font-semibold leading-none">{value}</div>
          <div className="mt-2 truncate text-[11px] text-muted-foreground">{detail}</div>
        </div>
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md border",
            tone === "good" && "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
            tone === "warn" && "border-amber-400/25 bg-amber-400/10 text-amber-300",
            tone === "default" && "border-primary/25 bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}
