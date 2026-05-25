import type { ActionIntent, Execution } from "@/lib/types";

export type VenueExecutionResult = {
  status: Execution["status"];
  txHash: string;
  filledAmount: number;
  pnl: number;
  settlementNote: string;
};

export type VenueAdapter = {
  id: ActionIntent["venue"];
  name: string;
  execute(intent: ActionIntent): Promise<VenueExecutionResult>;
};

export function arcTxHash(prefix: string, id: string) {
  const body = Buffer.from(`${prefix}:${id}`).toString("hex").padEnd(64, "0").slice(0, 64);
  return `0x${body}`;
}
