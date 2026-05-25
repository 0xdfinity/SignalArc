"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Check, KeyRound, RadioTower, ShieldCheck, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AGENT_CATEGORIES } from "@/lib/types";
import { AI_PROVIDER_LABELS, CATEGORY_DETAILS, VENUE_LABELS } from "@/lib/constants";
import type { Agent, AIProvider, AgentCategory, AgentMode, AgentSchedule, Venue } from "@/lib/types";
import { cn } from "@/lib/utils";

const categories: readonly AgentCategory[] = AGENT_CATEGORIES;
const modes: AgentMode[] = ["prompt-only", "github-enhanced", "external-tools", "algorithmic"];
const schedules: AgentSchedule[] = ["manual", "5m", "10m", "hourly"];
const providers = Object.keys(AI_PROVIDER_LABELS) as AIProvider[];
const venues: Venue[] = ["arc-prediction", "arc-swap", "arc-perps"];

const steps = [
  { label: "Identity", icon: Bot },
  { label: "Intelligence", icon: KeyRound },
  { label: "Policy", icon: ShieldCheck },
  { label: "Economy", icon: WalletCards },
];

type FormState = {
  name: string;
  description: string;
  category: AgentCategory;
  aiProvider: AIProvider;
  model: string;
  mode: AgentMode;
  schedule: AgentSchedule;
  instructionPrompt: string;
  feePercent: string;
  apiKey: string;
  telegramBotToken: string;
  githubPat: string;
};

export function AgentStudioWizard({
  mode = "create",
  presetAgent,
}: {
  mode?: "create" | "edit";
  presetAgent?: Agent | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [confidence, setConfidence] = useState(Math.round((presetAgent?.confidenceThreshold ?? 0.78) * 100));
  const [publicAgent, setPublicAgent] = useState((presetAgent?.visibility ?? "public") === "public");
  const [selectedVenues, setSelectedVenues] = useState<Venue[]>(presetAgent?.allowedVenues ?? ["arc-prediction"]);
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState<FormState>({
    name: presetAgent ? (mode === "edit" ? presetAgent.name : `${presetAgent.name} Copy`) : "",
    description: presetAgent?.description ?? "",
    category: presetAgent?.category ?? "Trading & Portfolio Optimization",
    aiProvider: presetAgent?.aiProvider ?? "openrouter",
    model: presetAgent?.model ?? "",
    mode: presetAgent?.mode ?? "prompt-only",
    schedule: presetAgent?.schedule ?? "manual",
    instructionPrompt: presetAgent?.instructionPrompt ?? "",
    feePercent: presetAgent ? String(presetAgent.feePercent) : "",
    apiKey: "",
    telegramBotToken: "",
    githubPat: "",
  });

  const ready = useMemo(() => {
    return (
      values.name.trim().length > 1 &&
      values.description.trim().length >= 8 &&
      (values.mode === "algorithmic" || values.model.trim().length > 1) &&
      values.instructionPrompt.trim().length >= 20 &&
      selectedVenues.length > 0 &&
      values.feePercent !== ""
    );
  }, [selectedVenues.length, values]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!ready) {
      toast.error("Complete the required agent configuration first");
      return;
    }

    setPending(true);
    const response = await fetch(mode === "edit" && presetAgent ? `/api/agents/${presetAgent.id}` : "/api/agents", {
      method: mode === "edit" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        avatar: values.name.slice(0, 2).toUpperCase(),
        model: values.model.trim() || (values.mode === "algorithmic" ? "ruleset-v1" : values.model),
        confidenceThreshold: confidence / 100,
        allowedVenues: selectedVenues,
        feePercent: Number(values.feePercent),
        visibility: publicAgent ? "public" : "private",
      }),
    });
    setPending(false);

    if (!response.ok) {
      toast.error("Agent could not be created");
      return;
    }

    const data = await response.json();
    toast.success(mode === "edit" ? `${data.agent.name} updated` : `${data.agent.name} is ready`);
    router.push(`/agents/${data.agent.id}`);
    router.refresh();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
      <Card className="rounded-lg border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-serif text-lg">Creation rail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const active = step === index;
            const done = index < step;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setStep(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border border-border bg-background/45 p-3 text-left transition hover:border-primary/35",
                  active && "border-primary/35 bg-primary/10",
                )}
              >
                <div className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                </div>
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Step 0{index + 1}
                  </div>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-serif text-lg">{steps[step].label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-4">
          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" value={values.name} onChange={(value) => update("name", value)} />
              <SelectField label="Category" value={values.category} values={categories} onChange={(value) => update("category", value as AgentCategory)} />
              <div className="rounded-lg border border-border bg-background/45 p-3 text-sm text-muted-foreground md:col-span-2">
                {CATEGORY_DETAILS[values.category]}
              </div>
              <div className="md:col-span-2">
                <TextField label="Description" value={values.description} onChange={(value) => update("description", value)} rows={4} />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField label="Runtime provider" value={values.aiProvider} values={providers} onChange={(value) => update("aiProvider", value as AIProvider)} format={(value) => AI_PROVIDER_LABELS[value as AIProvider]} />
              <Field label="Model or engine" value={values.model} onChange={(value) => update("model", value)} />
              <SelectField label="Mode" value={values.mode} values={modes} onChange={(value) => update("mode", value as AgentMode)} />
              <SelectField label="Schedule" value={values.schedule} values={schedules} onChange={(value) => update("schedule", value as AgentSchedule)} />
              <div className="md:col-span-2">
                <TextField label="Instruction prompt" value={values.instructionPrompt} onChange={(value) => update("instructionPrompt", value)} rows={7} />
              </div>
              <Field label="Provider API key" value={values.apiKey} onChange={(value) => update("apiKey", value)} type="password" />
              <Field label="Telegram bot token" value={values.telegramBotToken} onChange={(value) => update("telegramBotToken", value)} type="password" />
              <Field label="Optional GitHub PAT" value={values.githubPat} onChange={(value) => update("githubPat", value)} type="password" />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label>Confidence threshold</Label>
                  <span className="font-mono text-sm text-primary">{confidence}%</span>
                </div>
                <Slider value={[confidence]} min={50} max={99} step={1} onValueChange={([value]) => setConfidence(value)} />
              </div>
              <div className="grid gap-2">
                {venues.map((venue) => (
                  <label key={venue} className="flex items-center justify-between rounded-lg border border-border bg-background/45 px-3 py-3 text-sm">
                    <span>{VENUE_LABELS[venue]}</span>
                    <Switch
                      checked={selectedVenues.includes(venue)}
                      onCheckedChange={(checked) =>
                        setSelectedVenues((current) =>
                          checked ? [...current, venue] : current.filter((item) => item !== venue),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Fee percent" value={values.feePercent} onChange={(value) => update("feePercent", value)} type="number" />
              <label className="flex items-center justify-between rounded-lg border border-border bg-background/45 px-3 py-3">
                <span>
                  <span className="block text-sm font-medium">Public marketplace</span>
                  <span className="text-xs text-muted-foreground">Visible to subscribers and ranking.</span>
                </span>
                <Switch checked={publicAgent} onCheckedChange={setPublicAgent} />
              </label>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((current) => Math.max(current - 1, 0))}>
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))}>
                Continue
              </Button>
            ) : (
              <Button type="button" disabled={pending || !ready} onClick={submit}>
                <RadioTower className="size-4" />
                {pending ? (mode === "edit" ? "Saving agent" : "Creating agent") : mode === "edit" ? "Save agent" : "Create executable agent"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} type={type} />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  rows: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} />
    </div>
  );
}

function SelectField({
  label,
  value,
  values,
  onChange,
  format = formatLabel,
}: {
  label: string;
  value: string;
  values: readonly string[];
  onChange(value: string): void;
  format?: (value: string) => string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {values.map((item) => (
          <option key={item} value={item}>
            {format(item)}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join("-");
}
