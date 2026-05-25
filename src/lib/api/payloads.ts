import type {
  ActivityEvent,
  Agent,
  AgentReceipt,
  ExternalAgent,
  Execution,
  GraphEdge,
  GraphNode,
  LeaderboardRow,
  MarketIntelSource,
  Policy,
  PortfolioPoint,
  Recommendation,
  User,
} from "@/lib/types";

export type DashboardMetrics = {
  balance: number;
  pnl: number;
  agentRevenue: number;
  networkFees: number;
  networkFeeCap: number;
  activePolicies: number;
  executions: number;
  settled: number;
  trustWeightedRoi: number;
};

export type DashboardPayload = {
  user: User;
  metrics: DashboardMetrics;
  portfolio: PortfolioPoint[];
  marketIntel: MarketIntelSource[];
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  leaderboard: LeaderboardRow[];
  recommendations: Recommendation[];
  activity: ActivityEvent[];
};

export type AgentsPayload = {
  agents: Agent[];
};

export type StudioPayload = {
  user: User;
  agents: Agent[];
  externalAgents: ExternalAgent[];
};

export type AgentDetailPayload = {
  agent: Agent;
  receipts: AgentReceipt[];
  recommendations: Recommendation[];
  policy: Policy | null;
};

export type PortfolioPayload = {
  user: User;
  metrics: DashboardMetrics;
  portfolio: PortfolioPoint[];
  policies: Policy[];
  executions: Execution[];
};

export type LeaderboardPayload = {
  leaderboard: LeaderboardRow[];
};

export type ActivityPayload = {
  activity: ActivityEvent[];
};

export type CurrentUserPayload = {
  user: Pick<User, "id" | "name" | "email" | "walletAddress" | "usdcBalance" | "role">;
};
