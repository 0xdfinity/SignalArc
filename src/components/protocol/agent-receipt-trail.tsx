import { ArrowUpRight, BrainCircuit, FileText, Fingerprint, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AGENTIC_CONTRACTS, ARC_TESTNET } from "@/lib/constants";
import type { Agent, AgentReceipt } from "@/lib/types";
import { cn } from "@/lib/utils";

const verdictLabel: Record<NonNullable<Agent["latestVerdict"]>, string> = {
  passed: "Verified",
  warning: "Review",
  failed: "Failed",
  pending: "Pending",
};

export function AgentReceiptTrait({ agent }: { agent: Agent }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      <Trait label="ERC-8004" value={agent.erc8004AgentId ? "Registered" : "Ready"} />
      <Trait label="Receipts" value={agent.receiptCount.toString()} />
      <Trait label="Verdict" value={verdictLabel[agent.latestVerdict ?? "pending"]} tone={agent.latestVerdict} />
    </div>
  );
}

export function AgentReceiptTrail({ agent, receipts }: { agent: Agent; receipts: AgentReceipt[] }) {
  return (
    <div className="rounded-lg border border-border bg-background/45 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Fingerprint className="size-4 text-primary" />
            Agent receipts
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            ERC-8004 identity, reputation, validation, trace, and verdict records on Arc testnet.
          </p>
        </div>
        <Badge variant="outline" className="border-primary/25 bg-primary/10 font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
          Arc {ARC_TESTNET.chainId}
        </Badge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Trait label="Identity registry" value={shortAddress(AGENTIC_CONTRACTS.erc8004IdentityRegistry)} />
        <Trait label="Reputation registry" value={shortAddress(AGENTIC_CONTRACTS.erc8004ReputationRegistry)} />
        <Trait label="Trace records" value={agent.receiptCount.toString()} />
      </div>

      <div className="mt-3 space-y-2">
        {receipts.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs leading-5 text-muted-foreground">
            The receipt rail is active. Trace and verdict records appear here when agents attach Arc testnet receipt hashes.
          </div>
        ) : null}
        {receipts.slice(0, 5).map((receipt) => (
          <div key={receipt.id} className="grid gap-3 rounded-md border border-border bg-card/80 p-3 text-xs sm:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ReceiptIcon kind={receipt.kind} />
                <span className="font-mono uppercase tracking-[0.14em] text-primary">{receipt.kind}</span>
                {receipt.verdict ? <Badge variant="outline">{verdictLabel[receipt.verdict]}</Badge> : null}
              </div>
              <div className="mt-2 line-clamp-2 leading-5 text-muted-foreground">{receipt.summary}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {receipt.txHash ? <ReceiptLink href={`${ARC_TESTNET.explorerUrl}/tx/${receipt.txHash}`} label="Tx" /> : null}
              {receipt.traceRef ? <span className="font-mono text-[10px] text-muted-foreground">{shortRef(receipt.traceRef)}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Trait({
  label,
  value,
  tone = "pending",
}: {
  label: string;
  value: string;
  tone?: Agent["latestVerdict"];
}) {
  return (
    <div className={cn(
      "rounded-md border border-border bg-background/45 px-2.5 py-2",
      tone === "passed" && "border-emerald-400/25 bg-emerald-400/10",
      tone === "warning" && "border-amber-400/25 bg-amber-400/10",
      tone === "failed" && "border-red-400/25 bg-red-400/10",
    )}>
      <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-xs font-semibold">{value}</div>
    </div>
  );
}

function ReceiptIcon({ kind }: { kind: AgentReceipt["kind"] }) {
  const Icon = kind === "trace" ? BrainCircuit : kind === "verdict" ? ShieldCheck : FileText;
  return <Icon className="size-3.5 text-primary" />;
}

function ReceiptLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:border-primary/40">
      {label}
      <ArrowUpRight className="size-3" />
    </a>
  );
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function shortRef(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}
