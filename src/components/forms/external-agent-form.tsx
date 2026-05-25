"use client";

import { useState } from "react";
import { Link2, Webhook } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExternalAgentForm() {
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    const payload = {
      provider: formData.get("provider"),
      endpoint: formData.get("endpoint"),
      authToken: formData.get("authToken"),
      signatureKey: formData.get("signatureKey"),
      capabilities: String(formData.get("capabilities") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      metadata: {},
    };

    const response = await fetch("/api/external-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setPending(false);

    if (!response.ok) {
      toast.error("External agent connection failed");
      return;
    }

    toast.success("External agent connected");
  }

  return (
    <Card className="rounded-lg border-border bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 font-serif text-lg">
          <Webhook className="size-4 text-primary" />
          Connect external agent
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={submit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <select id="provider" name="provider" defaultValue="OpenClaw" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              {["OpenClaw", "Hermes", "custom", "webhook"].map((provider) => (
                <option key={provider} value={provider}>
                  {provider.slice(0, 1).toUpperCase() + provider.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <Field label="Endpoint" name="endpoint" />
          <Field label="Auth token" name="authToken" type="password" />
          <Field label="Signature key" name="signatureKey" type="password" />
          <div className="md:col-span-2">
            <Field label="Capabilities" name="capabilities" />
            <div className="mt-1 text-xs text-muted-foreground">Separate capabilities with commas.</div>
          </div>
          <div className="md:col-span-2">
            <Button disabled={pending} type="submit" className="w-full">
              <Link2 className="size-4" />
              {pending ? "Connecting" : "Connect external agent"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} type={type} />
    </div>
  );
}
