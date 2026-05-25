import type { MarketIntelItem, MarketIntelSource, MarketSource } from "@/lib/types";

const sources: MarketSource[] = ["Hyperliquid", "Polymarket", "Uniswap"];

function unavailable(source: MarketSource): MarketIntelSource {
  return {
    source,
    status: "unavailable",
    latencyMs: 0,
    items: [],
  };
}

async function timed<T>(task: () => Promise<T>) {
  const startedAt = performance.now();
  const data = await task();
  return { data, latencyMs: Math.round(performance.now() - startedAt) };
}

function compactPrice(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "n/a";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: number > 100 ? 0 : 2,
  }).format(number);
}

async function getHyperliquid(): Promise<MarketIntelSource> {
  const { data, latencyMs } = await timed(async () => {
    const response = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "allMids" }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Hyperliquid source unavailable");
    }

    return response.json() as Promise<Record<string, string>>;
  });

  const items: MarketIntelItem[] = ["BTC", "ETH", "SOL"].map((symbol) => ({
    source: "Hyperliquid",
    label: `${symbol} perp mid`,
    metric: "Perps",
    value: compactPrice(data[symbol]),
    signal: Number(data[symbol]) > 0 ? "neutral" : "bearish",
    confidence: 0.74,
  }));

  return { source: "Hyperliquid", status: "live", latencyMs, items };
}

async function getPolymarket(): Promise<MarketIntelSource> {
  const { data, latencyMs } = await timed(async () => {
    const response = await fetch(
      "https://gamma-api.polymarket.com/markets?closed=false&limit=3&order=volume&ascending=false",
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error("Polymarket source unavailable");
    }

    return response.json() as Promise<Array<Record<string, unknown>>>;
  });

  const items: MarketIntelItem[] = data.slice(0, 3).map((market) => ({
    source: "Polymarket",
    label: String(market.question ?? market.title ?? "Prediction market"),
    metric: "Odds",
    value: `${Number(market.volumeNum ?? market.volume ?? 0).toLocaleString()} vol`,
    signal: "neutral",
    confidence: 0.68,
  }));

  return { source: "Polymarket", status: "live", latencyMs, items };
}

async function getUniswap(): Promise<MarketIntelSource> {
  const { data, latencyMs } = await timed(async () => {
    const response = await fetch("https://tokens.uniswap.org", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Uniswap token source unavailable");
    }

    return response.json() as Promise<{ tokens?: Array<{ symbol?: string; name?: string; chainId?: number }> }>;
  });

  const tokens = data.tokens?.filter((token) => token.chainId === 1).slice(0, 3) ?? [];
  const items: MarketIntelItem[] = tokens.map((token) => ({
    source: "Uniswap",
    label: token.symbol ?? "Token",
    metric: "Spot",
    value: token.name ?? "Listed asset",
    signal: "neutral",
    confidence: 0.64,
  }));

  return { source: "Uniswap", status: "live", latencyMs, items };
}

export async function getMarketIntel(): Promise<MarketIntelSource[]> {
  const tasks = [getHyperliquid(), getPolymarket(), getUniswap()];
  const settled = await Promise.allSettled(tasks);

  return settled.map((result, index) => (result.status === "fulfilled" ? result.value : unavailable(sources[index])));
}
