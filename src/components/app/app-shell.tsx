"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  Home,
  KeyRound,
  LayoutDashboard,
  Menu,
  Settings,
  Trophy,
  WalletCards,
} from "lucide-react";

import { NAV_ITEMS } from "@/lib/constants";
import type { CurrentUserPayload } from "@/lib/api/payloads";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const icons: Record<string, ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Agents: Bot,
  Studio: KeyRound,
  Portfolio: WalletCards,
  Leaderboard: Trophy,
  Activity,
  Settings,
};

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: CurrentUserPayload["user"];
}) {
  const walletLabel = user.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : "No wallet";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] border-r border-border bg-sidebar px-3 py-4 lg:block">
        <Brand />
        <div className="mt-6 rounded-lg border border-border bg-card p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Session</div>
          <div className="mt-2 text-sm font-medium">{user.walletAddress ? "Account active" : "Guest browse"}</div>
          <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{walletLabel}</div>
        </div>
        <nav className="mt-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
        <div className="absolute inset-x-3 bottom-4 rounded-lg border border-border bg-card p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Protocol access</div>
          <div className="mt-2 text-sm font-medium">{user.walletAddress ? "Find agents to follow" : "Create account to execute"}</div>
          <Button asChild size="sm" variant="outline" className="mt-3 w-full">
            <Link href={user.walletAddress ? "/agents" : "/onboarding"}>
              {user.walletAddress ? "Find agents" : "Start setup"}
            </Link>
          </Button>
        </div>
      </aside>

      <div className="lg:pl-[17rem]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 lg:px-7">
          <div className="flex items-center gap-3">
            <MobileNav />
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <Home className="size-4 text-primary" />
              <span className="font-semibold">SignalArc</span>
            </Link>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden rounded-lg border border-border bg-card px-3 py-2 md:block">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Operator</div>
              <div className="mt-0.5 text-xs">{user.walletAddress ? user.name : "Guest"}</div>
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">USDC</div>
              <div className="metric-tabular text-sm font-semibold">{user.usdcBalance.toLocaleString()} USDC</div>
            </div>
          </div>
        </header>
        <main className="px-4 py-5 lg:px-7 lg:py-7">{children}</main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 px-2">
      <div className="flex size-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/15">
        <BarChart3 className="size-5 text-primary" />
      </div>
      <div>
        <div className="font-semibold leading-tight">SignalArc</div>
        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Protocol console</div>
      </div>
    </Link>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = icons[label] ?? Activity;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground",
            active && "bg-sidebar-accent text-foreground shadow-[inset_0_0_0_1px_rgba(125,211,252,0.14)]",
          )}
        >
          <Icon className="size-4" />
          <span>{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetTitle className="sr-only">SignalArc navigation</SheetTitle>
        <Brand />
        <nav className="mt-7 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
