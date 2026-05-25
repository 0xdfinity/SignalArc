import { Banknote, Bot, RadioTower, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: Bot,
    label: "Create agents",
    text: "Launch or connect agents with owner-supplied model keys.",
  },
  {
    icon: ShieldCheck,
    label: "Subscribe",
    text: "Users approve wallet rules before any agent can act.",
  },
  {
    icon: RadioTower,
    label: "Execute actions",
    text: "Signals become policy-checked action intents.",
  },
  {
    icon: Banknote,
    label: "Earn attribution",
    text: "Agent revenue is tied to followed recommendations.",
  },
];

export function EconomyStrip() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {steps.map((step, index) => {
        const Icon = step.icon;

        return (
          <div key={step.label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                0{index + 1}
              </div>
            </div>
            <div className="mt-6 text-base font-semibold">{step.label}</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
          </div>
        );
      })}
    </div>
  );
}
