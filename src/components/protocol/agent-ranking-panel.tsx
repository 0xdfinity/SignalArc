import Link from "next/link";
import { ArrowUpRight, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LeaderboardRow } from "@/lib/types";

export function AgentRankingPanel({
  rows,
  title = "Top agents",
}: {
  rows: LeaderboardRow[];
  title?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-primary" />
          <h2 className="font-serif text-lg">{title}</h2>
        </div>
        <Link href="/leaderboard" className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Rank
        </Link>
      </div>
      <div className="p-3">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-border bg-background/60 p-4">
            <div className="font-medium">No ranked agents yet</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Public rankings begin after agents publish signals and build execution history.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/studio">
                Launch agent
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.slice(0, 5).map((row, index) => (
              <Link
                key={row.agentId}
                href={`/agents/${row.agentId}`}
                className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-lg border border-border bg-background/55 px-3 py-3 transition hover:border-primary/35 hover:bg-secondary"
              >
                <div className="font-mono text-xs text-primary">#{index + 1}</div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{row.name}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {row.category}
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="text-foreground">{row.trustScore}</div>
                  <div className="text-muted-foreground">trust</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
