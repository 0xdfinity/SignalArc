import type { AgentCategory, AIProvider, Venue } from "@/lib/types";
import { AGENT_CATEGORIES } from "@/lib/types";

export const APP_NAME = "SignalArc";

export const ARC_TESTNET = {
  name: "Arc Testnet",
  chainId: 5042002,
  rpcUrl: "https://rpc.testnet.arc.network",
  websocketUrl: "wss://rpc.testnet.arc.network",
  explorerUrl: "https://testnet.arcscan.app",
  faucetUrl: "https://faucet.circle.com",
  usdcAddress: "0x3600000000000000000000000000000000000000",
  usdcDecimals: 6,
  nativeGasDecimals: 18,
  cctpDomain: 26,
} as const;

export const AGENTIC_CONTRACTS = {
  erc8004IdentityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  erc8004ReputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  erc8183AgenticCommerce: "0x0747EEf0706327138c69792bF28Cd525089e4583",
} as const;

export const VENUE_LABELS: Record<Venue, string> = {
  "arc-prediction": "Arc Prediction",
  "arc-swap": "Arc Swap",
  "arc-perps": "Arc Perps",
};

export const CATEGORY_COLORS: Record<AgentCategory, string> = {
  "Trading & Portfolio Optimization": "text-sky-300 bg-sky-400/10 border-sky-400/25",
  "Prediction & Betting": "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
  Yield: "text-cyan-300 bg-cyan-400/10 border-cyan-400/25",
  "Market Intelligence & Analysis": "text-violet-300 bg-violet-400/10 border-violet-400/25",
};

export const CATEGORY_DETAILS: Record<AgentCategory, string> = {
  "Trading & Portfolio Optimization": "Portfolio allocation, hedging, rebalancing, DEX and perps execution logic.",
  "Prediction & Betting": "Forecasting, probability edges, event markets, and betting-style outcome agents.",
  Yield: "Stablecoin yield scouting, vault selection, rate monitoring, and policy-aware allocation.",
  "Market Intelligence & Analysis": "Sentiment, fundamental, news, technical, and multi-factor research agents.",
};

export { AGENT_CATEGORIES };

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agents", label: "Agents" },
  { href: "/studio", label: "Studio" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/activity", label: "Activity" },
  { href: "/settings", label: "Settings" },
];

export const DEFAULT_USER_ID = "user-001";

export const MAX_NETWORK_FEE_USDC = 0.01;

export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  anthropic: "Anthropic Claude",
  google: "Google Gemini",
  groq: "Groq",
  deepseek: "DeepSeek",
  qwen: "Qwen",
  custom: "Custom OpenAI-compatible",
};

export const DEFAULT_POLICY_LIMITS = {
  maxSpend: 2500,
  maxDailySpend: 600,
  maxPerTrade: 180,
  stopLossPercent: 8,
};
