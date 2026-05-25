import { decryptSecret } from "@/lib/crypto/secrets";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  ActivityEvent,
  Agent,
  AgentReceipt,
  Execution,
  GraphEdge,
  GraphNode,
  LeaderboardRow,
  PlatformState,
  Policy,
  PortfolioPoint,
  Recommendation,
  User,
  ExternalAgent,
} from "@/lib/types";
import { MAX_NETWORK_FEE_USDC } from "@/lib/constants";

export const guestUser: User = {
  id: "guest",
  name: "Guest",
  email: "",
  walletAddress: "",
  role: "guest",
  usdcBalance: 0,
  joinedAt: new Date().toISOString(),
};

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string;
  telegram_handle: string | null;
  wallet_address: string | null;
  role: "guest" | "user" | "admin";
  usdc_balance: number | string;
  created_at: string;
};

type AgentRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  avatar: string;
  category: Agent["category"];
  ai_provider: Agent["aiProvider"];
  model: string;
  mode: Agent["mode"];
  schedule: Agent["schedule"];
  confidence_threshold: number | string;
  allowed_venues: Agent["allowedVenues"];
  fee_percent: number | string;
  visibility: Agent["visibility"];
  status: Agent["status"];
  instruction_prompt: string;
  followers: number;
  trust_score: number | string;
  roi: number | string;
  win_rate: number | string;
  fees_earned: number | string;
  total_executions: number;
  erc8004_agent_id: string | null;
  erc8004_registration_uri: string | null;
  created_at: string;
};

type AgentReceiptRow = {
  id: string;
  agent_id: string;
  kind: AgentReceipt["kind"];
  registry: AgentReceipt["registry"];
  chain_id: number;
  tx_hash: string | null;
  trace_ref: string | null;
  verdict: AgentReceipt["verdict"] | null;
  summary: string;
  created_at: string;
};

type RecommendationRow = {
  id: string;
  agent_id: string;
  market_id: string;
  venue: Recommendation["venue"];
  action: Recommendation["action"];
  amount: number | string;
  confidence: number | string;
  rationale: string;
  expiry: string;
  signature: string;
  title: string;
  category: Recommendation["category"];
  expected_move: number | string;
  realized_move: number | string;
  status: Recommendation["status"];
  created_at: string;
};

type PolicyRow = {
  id: string;
  user_id: string;
  agent_id: string;
  max_spend: number | string;
  max_daily_spend: number | string;
  max_per_trade: number | string;
  market_categories: Policy["marketCategories"];
  stop_loss_percent: number | string;
  expiry: string;
  manual_review: boolean;
  spent_today: number | string;
  created_at: string;
};

type ExecutionRow = {
  id: string;
  user_id: string;
  agent_id: string;
  recommendation_id: string;
  venue: Execution["venue"];
  action: Execution["action"];
  amount: number | string;
  network_fee: number | string;
  fee_paid: number | string;
  agent_fee: number | string;
  status: Execution["status"];
  tx_hash: string;
  pnl: number | string;
  policy_result: Execution["policyResult"];
  created_at: string;
  settled_at: string | null;
};

type ActivityRow = {
  id: string;
  kind: ActivityEvent["kind"];
  title: string;
  detail: string;
  entity_id: string | null;
  created_at: string;
};

type ExternalAgentRow = {
  id: string;
  owner_id: string;
  provider: ExternalAgent["provider"];
  endpoint: string;
  auth_token_hash: string;
  signature_key_hash: string;
  capabilities: string[];
  metadata: Record<string, string>;
  connected_at: string;
};

type AgentSecretRow = {
  encrypted_model_key: string | null;
};

const numberValue = (value: number | string | null | undefined) => Number(value ?? 0);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.display_name,
    email: row.email ?? "",
    telegram: row.telegram_handle ?? undefined,
    walletAddress: row.wallet_address ?? "",
    role: row.role,
    usdcBalance: numberValue(row.usdc_balance),
    joinedAt: row.created_at,
  };
}

function mapAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    avatar: row.avatar,
    category: row.category,
    aiProvider: row.ai_provider,
    model: row.model,
    mode: row.mode,
    schedule: row.schedule,
    confidenceThreshold: numberValue(row.confidence_threshold),
    allowedVenues: row.allowed_venues,
    feePercent: numberValue(row.fee_percent),
    visibility: row.visibility,
    status: row.status ?? "active",
    followers: row.followers,
    trustScore: numberValue(row.trust_score),
    roi: numberValue(row.roi),
    winRate: numberValue(row.win_rate),
    feesEarned: numberValue(row.fees_earned),
    totalExecutions: row.total_executions,
    createdAt: row.created_at,
    instructionPrompt: row.instruction_prompt,
    erc8004AgentId: row.erc8004_agent_id ?? undefined,
    erc8004RegistrationUri: row.erc8004_registration_uri ?? undefined,
    receiptCount: 0,
    latestVerdict: "pending",
  };
}

function mapAgentReceipt(row: AgentReceiptRow): AgentReceipt {
  return {
    id: row.id,
    agentId: row.agent_id,
    kind: row.kind,
    registry: row.registry,
    chainId: row.chain_id,
    txHash: row.tx_hash ?? undefined,
    traceRef: row.trace_ref ?? undefined,
    verdict: row.verdict ?? undefined,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

function mapRecommendation(row: RecommendationRow): Recommendation {
  return {
    id: row.id,
    agentId: row.agent_id,
    marketId: row.market_id,
    venue: row.venue,
    action: row.action,
    amount: numberValue(row.amount),
    confidence: numberValue(row.confidence),
    rationale: row.rationale,
    expiry: row.expiry,
    signature: row.signature,
    createdAt: row.created_at,
    title: row.title,
    category: row.category,
    expectedMove: numberValue(row.expected_move),
    realizedMove: numberValue(row.realized_move),
    status: row.status,
  };
}

function mapPolicy(row: PolicyRow): Policy {
  return {
    id: row.id,
    userId: row.user_id,
    agentId: row.agent_id,
    maxSpend: numberValue(row.max_spend),
    maxDailySpend: numberValue(row.max_daily_spend),
    maxPerTrade: numberValue(row.max_per_trade),
    marketCategories: row.market_categories,
    stopLossPercent: numberValue(row.stop_loss_percent),
    expiry: row.expiry,
    manualReview: row.manual_review,
    spentToday: numberValue(row.spent_today),
    createdAt: row.created_at,
  };
}

function mapExecution(row: ExecutionRow): Execution {
  return {
    id: row.id,
    userId: row.user_id,
    agentId: row.agent_id,
    recommendationId: row.recommendation_id,
    venue: row.venue,
    action: row.action,
    amount: numberValue(row.amount),
    networkFee: numberValue(row.network_fee),
    feePaid: numberValue(row.fee_paid),
    agentFee: numberValue(row.agent_fee),
    status: row.status,
    txHash: row.tx_hash,
    pnl: numberValue(row.pnl),
    createdAt: row.created_at,
    settledAt: row.settled_at ?? undefined,
    policyResult: row.policy_result,
  };
}

function mapActivity(row: ActivityRow): ActivityEvent {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    detail: row.detail,
    entityId: row.entity_id ?? undefined,
    timestamp: row.created_at,
  };
}

function mapExternalAgent(row: ExternalAgentRow): ExternalAgent {
  return {
    id: row.id,
    ownerId: row.owner_id,
    provider: row.provider,
    endpoint: row.endpoint,
    authTokenHash: row.auth_token_hash,
    signatureKeyHash: row.signature_key_hash,
    capabilities: row.capabilities,
    metadata: row.metadata ?? {},
    connectedAt: row.connected_at,
  };
}

export async function getCurrentProfile(userId?: string | null): Promise<User> {
  if (!userId) {
    return guestUser;
  }

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return guestUser;
  }

  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data ? mapProfile(data as ProfileRow) : guestUser;
}

export async function getPublicAgents(): Promise<Agent[]> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("agents")
    .select("*")
    .eq("visibility", "public")
    .neq("status", "archived")
    .order("trust_score", { ascending: false });

  return attachReceiptStats(((data ?? []) as AgentRow[]).map(mapAgent));
}

export async function getOwnerAgents(ownerId: string): Promise<Agent[]> {
  if (ownerId === "guest") {
    return [];
  }

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("agents")
    .select("*")
    .eq("owner_id", ownerId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  return attachReceiptStats(((data ?? []) as AgentRow[]).map(mapAgent));
}

export async function getAgent(id: string): Promise<Agent | null> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return null;
  }

  const query = supabase.from("agents").select("*");
  const { data } = uuidPattern.test(id)
    ? await query.or(`id.eq.${id},slug.eq.${id}`).maybeSingle()
    : await query.eq("slug", id).maybeSingle();

  const agent = data ? mapAgent(data as AgentRow) : null;

  if (!agent) {
    return null;
  }

  const [withStats] = await attachReceiptStats([agent]);
  return withStats ?? agent;
}

export async function getAgentReceipts(agentId: string): Promise<AgentReceipt[]> {
  const supabase = getSupabaseServiceClient();

  if (!supabase || !uuidPattern.test(agentId)) {
    return [];
  }

  const { data } = await supabase
    .from("agent_receipts")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(24);

  return ((data ?? []) as AgentReceiptRow[]).map(mapAgentReceipt);
}

async function attachReceiptStats(agents: Agent[]): Promise<Agent[]> {
  if (!agents.length) {
    return agents;
  }

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return agents;
  }

  const { data } = await supabase
    .from("agent_receipts")
    .select("agent_id,kind,trace_ref,verdict,created_at")
    .in("agent_id", agents.map((agent) => agent.id))
    .order("created_at", { ascending: false });

  const stats = new Map<string, {
    count: number;
    latestReceiptAt?: string;
    latestTraceRef?: string;
    latestVerdict?: Agent["latestVerdict"];
  }>();

  for (const receipt of (data ?? []) as Pick<AgentReceiptRow, "agent_id" | "kind" | "trace_ref" | "verdict" | "created_at">[]) {
    const current = stats.get(receipt.agent_id) ?? { count: 0 };
    current.count += 1;

    if (!current.latestReceiptAt) {
      current.latestReceiptAt = receipt.created_at;
    }

    if (!current.latestTraceRef && receipt.trace_ref) {
      current.latestTraceRef = receipt.trace_ref;
    }

    if (!current.latestVerdict && receipt.verdict) {
      current.latestVerdict = receipt.verdict;
    }

    stats.set(receipt.agent_id, current);
  }

  return agents.map((agent) => {
    const receiptStats = stats.get(agent.id);

    return {
      ...agent,
      receiptCount: receiptStats?.count ?? 0,
      latestReceiptAt: receiptStats?.latestReceiptAt,
      latestTraceRef: receiptStats?.latestTraceRef,
      latestVerdict: receiptStats?.latestVerdict ?? "pending",
    };
  });
}

export async function getRecommendation(id: string): Promise<Recommendation | null> {
  const supabase = getSupabaseServiceClient();

  if (!supabase || !uuidPattern.test(id)) {
    return null;
  }

  const { data } = await supabase.from("recommendations").select("*").eq("id", id).maybeSingle();
  return data ? mapRecommendation(data as RecommendationRow) : null;
}

export async function getRecommendations(agentId?: string): Promise<Recommendation[]> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return [];
  }

  let query = supabase.from("recommendations").select("*").order("created_at", { ascending: false });

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data } = await query;
  return ((data ?? []) as RecommendationRow[]).map(mapRecommendation);
}

export async function getPolicies(userId: string): Promise<Policy[]> {
  if (userId === "guest") {
    return [];
  }

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase.from("policies").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return ((data ?? []) as PolicyRow[]).map(mapPolicy);
}

export async function getExecutions(userId: string): Promise<Execution[]> {
  if (userId === "guest") {
    return [];
  }

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase.from("executions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return ((data ?? []) as ExecutionRow[]).map(mapExecution);
}

export async function getActivity(userId?: string): Promise<ActivityEvent[]> {
  const supabase = getSupabaseServiceClient();

  if (!supabase || !userId || userId === "guest") {
    return [];
  }

  const { data } = await supabase.from("activity_events").select("*").order("created_at", { ascending: false }).limit(20);
  return ((data ?? []) as ActivityRow[]).map(mapActivity);
}

export async function getPublicActivity(): Promise<ActivityEvent[]> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase.from("activity_events").select("*").order("created_at", { ascending: false }).limit(20);
  return ((data ?? []) as ActivityRow[]).map(mapActivity);
}

export async function getExternalAgents(ownerId: string): Promise<ExternalAgent[]> {
  if (ownerId === "guest") {
    return [];
  }

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("external_agents")
    .select("*")
    .eq("owner_id", ownerId)
    .order("connected_at", { ascending: false });

  return ((data ?? []) as ExternalAgentRow[]).map(mapExternalAgent);
}

export async function getAgentProviderKey(agentId: string): Promise<string | null> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("agent_secrets")
    .select("encrypted_model_key")
    .eq("agent_id", agentId)
    .maybeSingle();

  const encrypted = (data as AgentSecretRow | null)?.encrypted_model_key;

  if (!encrypted) {
    return null;
  }

  try {
    return decryptSecret(encrypted, `agent:${agentId}`);
  } catch {
    return null;
  }
}

export async function createRecommendation(input: {
  agent: Agent;
  marketId: string;
  venue: Recommendation["venue"];
  action: Recommendation["action"];
  amount: number;
  confidence: number;
  rationale: string;
  expiry: string;
  signature: string;
  title?: string;
  expectedMove?: number;
}) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Data service unavailable.");
  }

  const { data, error } = await supabase
    .from("recommendations")
    .insert({
      agent_id: input.agent.id,
      market_id: input.marketId,
      venue: input.venue,
      action: input.action,
      amount: input.amount,
      confidence: input.confidence,
      rationale: input.rationale,
      expiry: input.expiry,
      signature: input.signature,
      title: input.title ?? `${input.action} ${input.marketId}`,
      category: input.agent.category,
      expected_move: input.expectedMove ?? 0,
      realized_move: 0,
      status: "open",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Signal could not be published.");
  }

  await supabase.from("activity_events").insert({
    kind: "signal_published",
    title: `${input.agent.name} published a signal`,
    detail: `${input.action} ${input.marketId} with ${Math.round(input.confidence * 100)}% confidence.`,
    entity_id: data.id,
  });

  return mapRecommendation(data as RecommendationRow);
}

export async function recordExecution(input: {
  user: User;
  agent: Agent;
  recommendation: Recommendation;
  networkFee: number;
  feePaid: number;
  agentFee: number;
  status: Execution["status"];
  txHash: string;
  pnl: number;
  policyResult: Execution["policyResult"];
}) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Data service unavailable.");
  }

  const { data, error } = await supabase
    .from("executions")
    .insert({
      user_id: input.user.id,
      agent_id: input.agent.id,
      recommendation_id: input.recommendation.id,
      venue: input.recommendation.venue,
      action: input.recommendation.action,
      amount: input.recommendation.amount,
      network_fee: input.networkFee,
      fee_paid: input.feePaid,
      agent_fee: input.agentFee,
      status: input.status,
      tx_hash: input.txHash,
      pnl: input.pnl,
      policy_result: input.policyResult,
      settled_at: input.status === "settled" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Execution could not be recorded.");
  }

  await supabase.from("fee_flows").insert({
    execution_id: data.id,
    payer_user_id: input.user.id,
    agent_id: input.agent.id,
    gross_amount: input.recommendation.amount,
    agent_fee: input.agentFee,
    platform_fee: Number((input.feePaid - input.agentFee).toFixed(6)),
  });

  await supabase.from("activity_events").insert({
    kind: "execution_settled",
    title: `${input.agent.name} execution recorded`,
    detail: `${input.recommendation.action} ${input.recommendation.marketId} for ${input.recommendation.amount} USDC.`,
    entity_id: data.id,
  });

  return mapExecution(data as ExecutionRow);
}

export async function getExecution(id: string): Promise<Execution | null> {
  const supabase = getSupabaseServiceClient();

  if (!supabase || !uuidPattern.test(id)) {
    return null;
  }

  const { data } = await supabase.from("executions").select("*").eq("id", id).maybeSingle();
  return data ? mapExecution(data as ExecutionRow) : null;
}

export function getMetrics(user: User, policies: Policy[], executions: Execution[]) {
  const settled = executions.filter((execution) => execution.status === "settled");
  const pnl = executions.reduce((total, execution) => total + execution.pnl, 0);
  const agentRevenue = executions.reduce((total, execution) => total + execution.agentFee, 0);
  const networkFees = executions.reduce((total, execution) => total + execution.networkFee, 0);
  const activePolicies = policies.filter((policy) => new Date(policy.expiry).getTime() > Date.now());

  return {
    balance: user.usdcBalance,
    pnl,
    agentRevenue,
    networkFees,
    networkFeeCap: MAX_NETWORK_FEE_USDC,
    activePolicies: activePolicies.length,
    executions: executions.length,
    settled: settled.length,
    trustWeightedRoi: 0,
  };
}

export function getPortfolio(balance: number, executions: Execution[]): PortfolioPoint[] {
  if (!executions.length) {
    return [{ day: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }), balance, pnl: 0 }];
  }

  return executions
    .slice()
    .reverse()
    .map((execution) => ({
      day: new Date(execution.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      balance: balance + execution.pnl,
      pnl: execution.pnl,
    }));
}

export function getGraph(user: User, agents: Agent[], recommendations: Recommendation[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (!agents.length && !recommendations.length) {
    return { nodes: [], edges: [] };
  }

  const nodes: GraphNode[] = [
    ...(user.walletAddress ? [{ id: "user", label: user.name, type: "user" as const, value: `${user.usdcBalance.toLocaleString()} USDC` }] : []),
    ...agents.slice(0, 3).map((agent) => ({
      id: agent.id,
      label: agent.name,
      type: "agent" as const,
      value: `${agent.trustScore} trust`,
    })),
    ...recommendations.slice(0, 3).map((recommendation) => ({
      id: recommendation.id,
      label: recommendation.title,
      type: "action" as const,
      value: `${Math.round(recommendation.confidence * 100)}%`,
    })),
  ];

  const firstAgent = agents[0];
  const firstRecommendation = recommendations[0];
  const edges: GraphEdge[] = [];

  if (user.walletAddress && firstAgent) {
    edges.push({ id: "follow-agent", source: "user", target: firstAgent.id, label: "follows", animated: true });
  }

  if (firstAgent && firstRecommendation) {
    edges.push({ id: "agent-signal", source: firstAgent.id, target: firstRecommendation.id, label: "signal", animated: true });
  }

  return { nodes, edges };
}

export function getLeaderboardRows(agents: Agent[]): LeaderboardRow[] {
  return agents
    .map((agent) => ({
      agentId: agent.id,
      name: agent.name,
      category: agent.category,
      roi: agent.roi,
      winRate: agent.winRate,
      followers: agent.followers,
      feesEarned: agent.feesEarned,
      trustScore: agent.trustScore,
      totalExecutions: agent.totalExecutions,
    }))
    .sort((a, b) => b.trustScore + b.roi - (a.trustScore + a.roi));
}

export const emptyPlatformState: PlatformState = {
  users: [],
  agents: [],
  externalAgents: [],
  recommendations: [],
  policies: [],
  executions: [],
  feeFlows: [],
  activity: [],
  portfolio: [],
};
