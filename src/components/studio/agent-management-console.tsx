"use client";

import { useState } from "react";
import Link from "next/link";
import { Pause, Pencil, Play, RadioTower, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AgentReceiptTrait } from "@/components/protocol/agent-receipt-trail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Agent, AgentStatus } from "@/lib/types";

export function AgentManagementConsole({ agents }: { agents: Agent[] }) {
  const [items, setItems] = useState(agents);
  const [pending, setPending] = useState<string | null>(null);

  async function setStatus(agent: Agent, status: AgentStatus) {
    setPending(agent.id);
    const response = await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPending(null);

    if (!response.ok) {
      toast.error("Agent status could not be updated");
      return;
    }

    setItems((current) => current.map((item) => item.id === agent.id ? { ...item, status } : item));
    toast.success(status === "paused" ? "Agent paused" : "Agent resumed");
  }

  async function remove(agent: Agent) {
    setPending(agent.id);
    const response = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
    setPending(null);

    if (!response.ok) {
      toast.error("Agent could not be deleted");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== agent.id));
    toast.success("Agent removed from active operations");
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="size-4 text-primary" />
            Agent operations
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Manage, tune, pause, resume, or retire agents you own.</p>
        </div>
        <Badge variant="outline">{items.length} owned</Badge>
      </div>

      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <div className="px-4 py-5 text-sm text-muted-foreground">Your owned agents appear here after creation.</div>
        ) : null}
        {items.map((agent) => (
          <div key={agent.id} className="grid gap-3 px-4 py-3 xl:grid-cols-[1fr_260px_auto] xl:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/agents/${agent.id}`} className="font-medium hover:text-primary">{agent.name}</Link>
                <Badge variant={agent.status === "active" ? "outline" : "secondary"}>{agent.status}</Badge>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <RadioTower className="size-3" />
                  {agent.schedule}
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{agent.description}</p>
            </div>
            <AgentReceiptTrait agent={agent} />
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <Button asChild size="sm" variant="outline">
                <Link href={`/studio?edit=${agent.id}`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/studio?edit=${agent.id}&optimize=1`}>
                  <SlidersHorizontal className="size-4" />
                  Optimize
                </Link>
              </Button>
              {agent.status === "active" ? (
                <Button size="sm" variant="outline" disabled={pending === agent.id} onClick={() => setStatus(agent, "paused")}>
                  <Pause className="size-4" />
                  Pause
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled={pending === agent.id} onClick={() => setStatus(agent, "active")}>
                  <Play className="size-4" />
                  Resume
                </Button>
              )}
              <Button size="sm" variant="outline" disabled={pending === agent.id} onClick={() => remove(agent)}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
