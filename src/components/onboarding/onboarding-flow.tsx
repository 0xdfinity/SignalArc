"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "ethers";
import { ArrowRight, Check, Mail, ShieldCheck, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { connectArcWallet } from "@/lib/arc/browser-wallet";

type WalletState = {
  address: string;
  recoveryPhrase?: string;
  source: "browser" | "generated";
};

export function OnboardingFlow() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [maxPerTrade, setMaxPerTrade] = useState(100);
  const [maxDailySpend, setMaxDailySpend] = useState(500);
  const [manualReview, setManualReview] = useState(true);
  const [pending, setPending] = useState(false);

  const ready = useMemo(() => {
    return name.trim().length > 1 && email.includes("@") && Boolean(wallet?.address) && maxDailySpend >= maxPerTrade;
  }, [email, maxDailySpend, maxPerTrade, name, wallet?.address]);

  async function connectWallet() {
    try {
      const address = await connectArcWallet();
      setWallet({ address, source: "browser" });
      toast.success("Wallet connected on Arc testnet");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet connection failed");
    }
  }

  function createWallet() {
    const generated = Wallet.createRandom();
    const recoveryPhrase = generated.mnemonic?.phrase;
    setWallet({ address: generated.address, recoveryPhrase, source: "generated" });
    toast.success("Wallet created");
  }

  async function finish() {
    if (!ready || !wallet) {
      toast.error("Complete the account, wallet, and rules first");
      return;
    }

    setPending(true);
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        walletAddress: wallet.address,
        rules: { maxPerTrade, maxDailySpend, manualReview },
      }),
    });
    setPending(false);

    if (!response.ok) {
      toast.error("Account could not be created");
      return;
    }

    localStorage.setItem("signalarc_wallet_address", wallet.address);
    toast.success("Account ready");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="rounded-lg border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="display-title text-3xl">Start in four steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Step done={name.trim().length > 1 && email.includes("@")} icon={Mail} title="Create account" text="Use your email and display name." />
          <Step done={Boolean(wallet?.address)} icon={WalletCards} title="Add wallet" text="Connect a wallet or create a new one." />
          <Step done={maxDailySpend >= maxPerTrade} icon={ShieldCheck} title="Set rules" text="Choose how much agents can use." />
          <Step done={ready} icon={Check} title="Follow agents" text="Start only when your setup is complete." />
        </CardContent>
      </Card>

      <div className="grid gap-5">
        <Card className="rounded-lg border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Mail className="size-4 text-primary" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Display name" value={name} onChange={setName} />
            <Field label="Email" value={email} onChange={setEmail} type="email" />
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <WalletCards className="size-4 text-primary" />
              Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={connectWallet} variant="outline" type="button">
                Connect wallet
              </Button>
              <Button onClick={createWallet} type="button">
                Create wallet
              </Button>
            </div>
            {wallet ? (
              <div className="rounded-lg border border-border bg-background/45 p-3">
                <div className="text-xs text-muted-foreground">Wallet address</div>
                <div className="mt-1 break-all font-mono text-sm">{wallet.address}</div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  {wallet.source === "browser" ? "Arc testnet connected" : "Generated account wallet"}
                </div>
                {wallet.recoveryPhrase ? (
                  <div className="mt-4 rounded-md border border-primary/25 bg-primary/10 p-3">
                    <div className="text-xs text-muted-foreground">Recovery phrase</div>
                    <div className="mt-2 font-mono text-sm leading-6">{wallet.recoveryPhrase}</div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <ShieldCheck className="size-4 text-primary" />
              Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <NumberField label="Max per trade" value={maxPerTrade} onChange={setMaxPerTrade} />
            <NumberField label="Daily limit" value={maxDailySpend} onChange={setMaxDailySpend} />
            <label className="flex items-center justify-between rounded-lg border border-border bg-background/45 px-3 py-3 md:col-span-2">
              <span>
                <span className="block text-sm font-medium">Review first</span>
                <span className="text-xs text-muted-foreground">Ask before larger actions.</span>
              </span>
              <Switch checked={manualReview} onCheckedChange={setManualReview} />
            </label>
          </CardContent>
        </Card>

        <Button disabled={!ready || pending} onClick={finish} size="lg" className="w-full">
          {pending ? "Creating account" : "Enter SignalArc"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function Step({
  done,
  icon: Icon,
  title,
  text,
}: {
  done: boolean;
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-background/45 p-3">
      <div className={done ? "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground" : "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 text-muted-foreground"}>
        <Icon className="size-4" />
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{text}</div>
      </div>
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

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange(value: number): void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        min={1}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
      />
    </div>
  );
}
