"use client";

import { motion } from "framer-motion";
import { Banknote, CheckCircle2, RadioTower, Route, ShieldCheck } from "lucide-react";

import type { ActivityEvent, Recommendation } from "@/lib/types";
import { cn } from "@/lib/utils";

type FeedItem = {
  id: string;
  label: string;
  detail: string;
  meta: string;
  tone: "signal" | "policy" | "execute" | "fee";
};

const toneIcon = {
  signal: RadioTower,
  policy: ShieldCheck,
  execute: Route,
  fee: Banknote,
};

const idleItems: FeedItem[] = [
  {
    id: "idle-signal",
    label: "Signal rail",
    detail: "Waiting for the first public recommendation.",
    meta: "idle",
    tone: "signal",
  },
  {
    id: "idle-policy",
    label: "Policy rail",
    detail: "User rules will gate every action before execution.",
    meta: "armed",
    tone: "policy",
  },
  {
    id: "idle-fee",
    label: "Attribution rail",
    detail: "Agent revenue appears after policy-approved actions settle.",
    meta: "ready",
    tone: "fee",
  },
];

export function ExecutionFeed({
  activity,
  recommendations = [],
  title = "Execution feed",
  className,
}: {
  activity: ActivityEvent[];
  recommendations?: Recommendation[];
  title?: string;
  className?: string;
}) {
  const items = buildItems(activity, recommendations);
  const displayed = items.length > 0 ? items : idleItems;

  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-primary" />
          <h2 className="font-serif text-lg">{title}</h2>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {items.length > 0 ? "Live" : "No executions"}
        </div>
      </div>
      <div className="divide-y divide-border">
        {displayed.slice(0, 6).map((item, index) => {
          const Icon = toneIcon[item.tone];

          return (
            <motion.div
              key={item.id}
              className="grid gap-3 px-4 py-3 sm:grid-cols-[36px_1fr_auto]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <div className="relative flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Icon className="size-4" />
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{item.label}</div>
                <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.detail}</div>
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {item.meta}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function buildItems(activity: ActivityEvent[], recommendations: Recommendation[]): FeedItem[] {
  const signalItems = recommendations.slice(0, 3).map((recommendation) => ({
    id: recommendation.id,
    label: recommendation.title,
    detail: `${recommendation.action} ${recommendation.marketId} for ${recommendation.amount} USDC`,
    meta: `${Math.round(recommendation.confidence * 100)}%`,
    tone: "signal" as const,
  }));

  const activityItems: FeedItem[] = activity.slice(0, 4).map((event) => {
    const tone: FeedItem["tone"] =
      event.kind === "fee_paid" ? "fee" : event.kind === "policy_passed" ? "policy" : "execute";

    return {
      id: event.id,
      label: event.title,
      detail: event.detail,
      meta: new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      tone,
    };
  });

  return [...signalItems, ...activityItems];
}
