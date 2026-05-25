import { ExecutionFeed } from "@/components/protocol/execution-feed";
import { PageHeading } from "@/components/shared/page-heading";
import type { ActivityPayload } from "@/lib/api/payloads";
import { serverApiGet } from "@/lib/api/server";

export default async function ActivityPage() {
  const { activity } = await serverApiGet<ActivityPayload>("/api/platform/activity");

  return (
    <>
      <PageHeading
        eyebrow="Activity"
        title="Recent decisions"
        description="Signals, approvals, results, and payouts."
      />
      <ExecutionFeed activity={activity} title="Account execution feed" />
    </>
  );
}
