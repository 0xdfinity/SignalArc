"use client";

import { motion } from "framer-motion";
import { Banknote, Bot, RadioTower, Route, ShieldCheck, Users } from "lucide-react";

import { cn } from "@/lib/utils";

type ProtocolGraphProps = {
  agentCount: number;
  signalCount: number;
  executionCount: number;
  subscriberCount?: number;
  className?: string;
};

const nodes = [
  { id: "agents", label: "Agents", icon: Bot, x: "8%", y: "18%" },
  { id: "subscribers", label: "Subscribers", icon: Users, x: "8%", y: "66%" },
  { id: "signals", label: "Signals", icon: RadioTower, x: "40%", y: "18%" },
  { id: "policy", label: "Policy vault", icon: ShieldCheck, x: "40%", y: "66%" },
  { id: "router", label: "Execution router", icon: Route, x: "70%", y: "38%" },
  { id: "fees", label: "Attribution", icon: Banknote, x: "70%", y: "76%" },
];

export function ProtocolGraph({
  agentCount,
  signalCount,
  executionCount,
  subscriberCount = 0,
  className,
}: ProtocolGraphProps) {
  const values: Record<string, string> = {
    agents: `${agentCount} registered`,
    subscribers: `${subscriberCount} subscribers`,
    signals: `${signalCount} open`,
    policy: "User limits",
    router: `${executionCount} executions`,
    fees: "Fees routed",
  };

  return (
    <div className={cn("relative min-h-[430px] overflow-hidden rounded-lg border border-border bg-card", className)}>
      <div className="absolute inset-0 signal-grid text-primary/40" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {[
          "M18 24 C30 24 31 24 40 24",
          "M18 72 C30 72 31 72 40 72",
          "M52 24 C61 28 64 34 70 44",
          "M52 72 C61 67 64 58 70 44",
          "M78 48 C83 56 83 68 78 80",
        ].map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke={index === 4 ? "rgba(125,211,252,0.54)" : "rgba(125,211,252,0.34)"}
            strokeWidth="0.35"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="0.12 0.08"
            animate={{ strokeDashoffset: [0, -0.4] }}
            transition={{ duration: 4 + index * 0.4, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </svg>

      <div className="absolute right-4 top-4 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
        Live rails
      </div>

      {nodes.map((node, index) => {
        const Icon = node.icon;

        return (
          <motion.div
            key={node.id}
            className="absolute w-[clamp(112px,24vw,168px)] rounded-lg border border-border bg-[#050b14] p-3 shadow-2xl"
            style={{ left: node.x, top: node.y }}
            initial={false}
            animate={{ y: [0, -2, 0] }}
            transition={{ delay: index * 0.08, duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <motion.span
                className="size-2 rounded-full bg-primary"
                animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.35, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.2 }}
              />
            </div>
            <div className="mt-4 text-sm font-semibold">{node.label}</div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {values[node.id]}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
