import type { ActionIntent } from "@/lib/types";
import type { VenueAdapter } from "@/lib/adapters/types";
import { arcPerpsAdapter } from "@/lib/adapters/arcPerps";
import { arcPredictionAdapter } from "@/lib/adapters/arcPrediction";
import { arcSwapAdapter } from "@/lib/adapters/arcSwap";

const adapters: Record<ActionIntent["venue"], VenueAdapter> = {
  "arc-prediction": arcPredictionAdapter,
  "arc-swap": arcSwapAdapter,
  "arc-perps": arcPerpsAdapter,
};

export function getVenueAdapter(venue: ActionIntent["venue"]) {
  return adapters[venue];
}

export function getVenueAdapters() {
  return Object.values(adapters);
}
