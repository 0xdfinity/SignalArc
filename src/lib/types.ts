export const AGENT_CATEGORIES = [
  "Trading & Portfolio Optimization",
  "Prediction & Betting",
  "Yield",
  "Market Intelligence & Analysis",
] as const;

export type AgentCategory = (typeof AGENT_CATEGORIES)[number];

export type AgentMode = "prompt-only" | "github-enhanced" | "external-tools" | "algorithmic";

export type AIProvider =
  | "openrouter"
  | "openai"
  | "anthropic"
  | "google"
  | "groq"
  | "deepseek"
  | "qwen"
  | "custom";

export type AgentVisibility = "public" | "private" | "unlisted";

export type AgentSchedule = "manual" | "5m" | "10m" | "hourly";
export type AgentStatus = "active" | "paused" | "archived";

export type Venue = "arc-prediction" | "arc-swap" | "arc-perps";

export type ActionKind = "BUY" | "SELL" | "HEDGE" | "LONG" | "SHORT" | "NOOP";

export type ExecutionStatus =
  | "pending"
  | "policy_blocked"
  | "executed"
  | "settled"
  | "expired";

export type User = {
  id: string;
  name: string;
  email: string;
  telegram?: string;
  walletAddress: string;
  role: "guest" | "user" | "admin";
  usdcBalance: number;
  joinedAt: string;
};

export type Agent = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  avatar: string;
  category: AgentCategory;
  aiProvider: AIProvider;
  model: string;
  mode: AgentMode;
  schedule: AgentSchedule;
  confidenceThreshold: number;
  allowedVenues: Venue[];
  feePercent: number;
  visibility: AgentVisibility;
  status: AgentStatus;
  followers: number;
  trustScore: number;
  roi: number;
  winRate: number;
  feesEarned: number;
  totalExecutions: number;
  createdAt: string;
  instructionPrompt: string;
  erc8004AgentId?: string;
  erc8004RegistrationUri?: string;
  receiptCount: number;
  latestReceiptAt?: string;
  latestTraceRef?: string;
  latestVerdict?: "passed" | "warning" | "failed" | "pending";
};

export type AgentReceipt = {
  id: string;
  agentId: string;
  kind: "identity" | "trace" | "verdict" | "reputation" | "validation";
  registry: "identity" | "reputation" | "validation" | "signalarc";
  chainId: number;
  txHash?: string;
  traceRef?: string;
  verdict?: "passed" | "warning" | "failed" | "pending";
  summary: string;
  createdAt: string;
};

export type ExternalAgent = {
  id: string;
  ownerId: string;
  provider: "OpenClaw" | "Hermes" | "custom" | "webhook";
  endpoint: string;
  authTokenHash: string;
  signatureKeyHash: string;
  capabilities: string[];
  metadata: Record<string, string>;
  connectedAt: string;
};

export type ActionIntent = {
  id: string;
  agentId: string;
  marketId: string;
  venue: Venue;
  action: ActionKind;
  amount: number;
  confidence: number;
  rationale: string;
  expiry: string;
  signature: string;
  createdAt: string;
};

export type Recommendation = ActionIntent & {
  title: string;
  category: AgentCategory;
  expectedMove: number;
  realizedMove: number;
  status: "open" | "won" | "lost" | "settled";
};

export type Policy = {
  id: string;
  userId: string;
  agentId: string;
  maxSpend: number;
  maxDailySpend: number;
  maxPerTrade: number;
  marketCategories: AgentCategory[];
  stopLossPercent: number;
  expiry: string;
  manualReview: boolean;
  spentToday: number;
  createdAt: string;
};

export type Execution = {
  id: string;
  userId: string;
  agentId: string;
  recommendationId: string;
  venue: Venue;
  action: ActionKind;
  amount: number;
  networkFee: number;
  feePaid: number;
  agentFee: number;
  status: ExecutionStatus;
  txHash: string;
  pnl: number;
  createdAt: string;
  settledAt?: string;
  policyResult: "passed" | "manual_review" | "blocked";
};

export type FeeFlow = {
  id: string;
  executionId: string;
  payerUserId: string;
  agentId: string;
  grossAmount: number;
  agentFee: number;
  platformFee: number;
  settledAt: string;
};

export type LeaderboardRow = {
  agentId: string;
  name: string;
  category: AgentCategory;
  roi: number;
  winRate: number;
  followers: number;
  feesEarned: number;
  trustScore: number;
  totalExecutions: number;
};

export type ActivityEvent = {
  id: string;
  kind:
    | "agent_created"
    | "signal_published"
    | "policy_passed"
    | "execution_settled"
    | "fee_paid"
    | "subscription_created";
  title: string;
  detail: string;
  timestamp: string;
  entityId?: string;
};

export type PortfolioPoint = {
  day: string;
  balance: number;
  pnl: number;
};

export type GraphNode = {
  id: string;
  label: string;
  type: "user" | "agent" | "action" | "venue" | "fee";
  value: string;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  animated?: boolean;
};

export type PlatformState = {
  users: User[];
  agents: Agent[];
  externalAgents: ExternalAgent[];
  recommendations: Recommendation[];
  policies: Policy[];
  executions: Execution[];
  feeFlows: FeeFlow[];
  activity: ActivityEvent[];
  portfolio: PortfolioPoint[];
};

export type MarketSource = "Hyperliquid" | "Polymarket" | "Uniswap";

export type MarketIntelItem = {
  source: MarketSource;
  label: string;
  metric: string;
  value: string;
  signal: "bullish" | "bearish" | "neutral";
  confidence: number;
};

export type MarketIntelSource = {
  source: MarketSource;
  status: "live" | "unavailable";
  latencyMs: number;
  items: MarketIntelItem[];
};
