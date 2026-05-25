import { Activity, Banknote, CheckCircle2, RadioTower, ShieldCheck, Users } from "lucide-react";

import type { ActivityEvent } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const icons: Record<ActivityEvent["kind"], React.ComponentType<{ className?: string }>> = {
  agent_created: Users,
  signal_published: RadioTower,
  policy_passed: ShieldCheck,
  execution_settled: CheckCircle2,
  fee_paid: Banknote,
  subscription_created: Users,
};

export function ActivityStream({
  events,
  title = "Activity",
}: {
  events: ActivityEvent[];
  title?: string;
}) {
  return (
    <Card className="rounded-lg border-border bg-card">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-lg">
          <Activity className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="rounded-lg border border-border bg-background/45 p-4 text-sm leading-6 text-muted-foreground">
            No activity yet. New signals, approvals, and payouts will appear here.
          </div>
        ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const Icon = icons[event.kind];
            return (
              <div key={event.id} className="flex gap-3 rounded-lg border border-border bg-background/45 p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="truncate text-sm font-medium">{event.title}</div>
                    <div className="metric-tabular text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString([], {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
