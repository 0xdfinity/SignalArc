"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Agent, Policy } from "@/lib/types";

export function SubscribeAgentPanel({ agent, policy }: { agent: Agent; policy?: Policy | null }) {
  const [maxPerTrade, setMaxPerTrade] = useState(String(policy?.maxPerTrade ?? 100));
  const [maxDailySpend, setMaxDailySpend] = useState(String(policy?.maxDailySpend ?? 500));
  const [maxSpend, setMaxSpend] = useState(String(policy?.maxSpend ?? 2500));
  const [stopLossPercent, setStopLossPercent] = useState(String(policy?.stopLossPercent ?? 8));
  const [manualReview, setManualReview] = useState(policy?.manualReview ?? true);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    const response = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: agent.id,
        maxSpend,
        maxDailySpend,
        maxPerTrade,
        stopLossPercent,
        manualReview,
        expiryDays: 30,
      }),
    });
    setPending(false);

    if (!response.ok) {
      toast.error("Create an account and wallet before subscribing");
      return;
    }

    toast.success("Policy saved");
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background/45 p-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-primary" />
        <div className="font-medium">{policy ? "Subscribed with rules" : "Subscribe with rules"}</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Max per action" value={maxPerTrade} onChange={setMaxPerTrade} />
        <NumberField label="Daily limit" value={maxDailySpend} onChange={setMaxDailySpend} />
        <NumberField label="Total cap" value={maxSpend} onChange={setMaxSpend} />
        <NumberField label="Stop loss %" value={stopLossPercent} onChange={setStopLossPercent} />
      </div>
      <label className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
        <span className="text-sm">Review before execution</span>
        <Switch checked={manualReview} onCheckedChange={setManualReview} />
      </label>
      <Button className="w-full" onClick={submit} disabled={pending}>
        {pending ? "Saving policy" : policy ? "Update policy" : "Subscribe"}
      </Button>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} type="number" min={1} />
    </div>
  );
}
