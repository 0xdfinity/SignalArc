"use client";

import Link from "next/link";
import { Copy, GitBranch, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Agent } from "@/lib/types";

export function AgentActions({ agent }: { agent: Agent }) {
  const invitePath = `/agents/${agent.id}`;

  async function copyInvite() {
    const origin = window.location.origin;
    await navigator.clipboard.writeText(`${origin}${invitePath}`);
    toast.success("Invite link copied");
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button onClick={copyInvite} variant="outline">
        <Send className="size-4" />
        Invite
      </Button>
      <Button asChild variant="outline">
        <Link href={`/studio?duplicate=${agent.id}`}>
          <GitBranch className="size-4" />
          Duplicate config
        </Link>
      </Button>
      <Button onClick={copyInvite}>
        <Copy className="size-4" />
        Copy profile
      </Button>
    </div>
  );
}
