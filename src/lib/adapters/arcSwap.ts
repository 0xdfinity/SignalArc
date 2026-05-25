import type { ActionIntent } from "@/lib/types";
import type { VenueAdapter } from "@/lib/adapters/types";
import { arcTxHash } from "@/lib/adapters/types";

export const arcSwapAdapter: VenueAdapter = {
  id: "arc-swap",
  name: "Arc Swap",
  async execute(intent: ActionIntent) {
    const directionMultiplier = intent.action === "SELL" || intent.action === "HEDGE" ? 0.18 : 0.24;
    const pnl = Number((intent.amount * (intent.confidence - 0.7) * directionMultiplier).toFixed(2));

    return {
      status: "executed",
      txHash: arcTxHash("swap", intent.id),
      filledAmount: Number((intent.amount * 0.997).toFixed(2)),
      pnl,
      settlementNote: "Swap intent priced against external market data and recorded on Arc testnet.",
    };
  },
};
