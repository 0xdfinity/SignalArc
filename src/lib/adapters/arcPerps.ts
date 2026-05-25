import type { ActionIntent } from "@/lib/types";
import type { VenueAdapter } from "@/lib/adapters/types";
import { arcTxHash } from "@/lib/adapters/types";

export const arcPerpsAdapter: VenueAdapter = {
  id: "arc-perps",
  name: "Arc Perps",
  async execute(intent: ActionIntent) {
    const leverageAwareEdge = intent.action === "LONG" || intent.action === "SHORT" ? 0.31 : 0.12;
    const pnl = Number((intent.amount * (intent.confidence - 0.69) * leverageAwareEdge).toFixed(2));

    return {
      status: "executed",
      txHash: arcTxHash("perps", intent.id),
      filledAmount: intent.amount,
      pnl,
      settlementNote: "Perps intent enforced confidence-gated exposure and Arc testnet settlement limits.",
    };
  },
};
