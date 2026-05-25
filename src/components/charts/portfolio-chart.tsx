"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useIsClient } from "@/lib/hooks/use-is-client";
import type { PortfolioPoint } from "@/lib/types";

export function PortfolioChart({ data }: { data: PortfolioPoint[] }) {
  const isClient = useIsClient();

  if (data.length < 2) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-border/70 bg-background/45 px-4 text-center text-sm text-muted-foreground">
        Balance history appears after account activity is recorded.
      </div>
    );
  }

  if (!isClient) {
    return <div className="h-72 w-full" />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="balance" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.38} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={46} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--foreground)",
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--chart-1)"
            fill="url(#balance)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
