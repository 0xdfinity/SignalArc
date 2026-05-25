import { AppShell } from "@/components/app/app-shell";
import type { CurrentUserPayload } from "@/lib/api/payloads";
import { serverApiGet } from "@/lib/api/server";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const { user } = await serverApiGet<CurrentUserPayload>("/api/platform/me");

  return <AppShell user={user}>{children}</AppShell>;
}
