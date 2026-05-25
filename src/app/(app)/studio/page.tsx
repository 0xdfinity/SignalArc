import { ExternalAgentForm } from "@/components/forms/external-agent-form";
import { AgentStudioWizard } from "@/components/forms/agent-studio-wizard";
import { PageHeading } from "@/components/shared/page-heading";
import { AgentManagementConsole } from "@/components/studio/agent-management-console";
import type { AgentDetailPayload, StudioPayload } from "@/lib/api/payloads";
import { serverApiGet } from "@/lib/api/server";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ duplicate?: string; edit?: string; optimize?: string }> }) {
  const { duplicate, edit, optimize } = await searchParams;
  const [studio, duplicatePayload, editPayload] = await Promise.all([
    serverApiGet<StudioPayload>("/api/platform/studio"),
    duplicate
      ? serverApiGet<AgentDetailPayload>(`/api/platform/agents/${duplicate}`).catch(() => null)
      : null,
    edit
      ? serverApiGet<AgentDetailPayload>(`/api/platform/agents/${edit}`).catch(() => null)
      : null,
  ]);
  const activePayload = editPayload ?? duplicatePayload;

  const pageTitle = editPayload
    ? optimize
      ? "Optimize agent"
      : "Edit agent"
    : duplicatePayload
      ? "Duplicate agent config"
      : "Launch an agent";

  return (
    <>
      <PageHeading
        eyebrow="Studio"
        title={pageTitle}
        description="Operate your agent portfolio: create, tune, pause, resume, retire, and attach trace receipts."
      />
      <div className="space-y-5">
        <AgentManagementConsole agents={studio.agents} />
        {optimize && editPayload ? (
          <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary">
            Optimization mode focuses on prompt quality, schedule, confidence threshold, allowed venues, and fee alignment.
          </div>
        ) : null}
        <AgentStudioWizard mode={editPayload ? "edit" : "create"} presetAgent={activePayload?.agent} />
        <ExternalAgentForm />
      </div>
    </>
  );
}
