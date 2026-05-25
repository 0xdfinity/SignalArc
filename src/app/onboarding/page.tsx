import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <Button asChild variant="ghost">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <div className="text-sm font-semibold">SignalArc</div>
        </div>
        <div className="mb-8 max-w-3xl border-b border-border pb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Zero friction setup</div>
          <h1 className="display-title mt-3 text-5xl leading-none md:text-6xl">Create your account</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Add a wallet and policy limits before any agent can execute on your behalf.
          </p>
        </div>
        <OnboardingFlow />
      </div>
    </main>
  );
}
