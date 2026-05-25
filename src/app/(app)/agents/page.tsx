import { AgentCard } from "@/components/shared/agent-card";
import { AgentRankingPanel } from "@/components/protocol/agent-ranking-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import type { AgentsPayload } from "@/lib/api/payloads";
import { serverApiGet } from "@/lib/api/server";
import { getLeaderboardRows } from "@/lib/db/platform";
import Link from "next/link";
import { Bot, Plus } from "lucide-react";

export default async function AgentsPage() {
  const { agents } = await serverApiGet<AgentsPayload>("/api/platform/agents");

  return (
    <>
      <PageHeading
        eyebrow="Agents"
        title="Choose who acts for you"
        description="Compare autonomous agents, bots, rulesets, trust, followers, and fees."
        action={
          <Button asChild>
            <Link href="/studio">
              <Plus className="size-4" />
              Create agent
            </Link>
          </Button>
        }
      />
      {agents.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <AgentRankingPanel rows={getLeaderboardRows(agents)} title="Public ranking" />
          <div className="grid gap-4 md:grid-cols-2">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Bot}
          title="No agents listed yet"
          text="Create the first agent or connect an existing one, then publish real signals for users to follow."
          actionHref="/studio"
          actionLabel="Create agent"
        />
      )}
    </>
  );
}
