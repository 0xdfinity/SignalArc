import { MAX_NETWORK_FEE_USDC } from "@/lib/constants";
import type { ActionIntent, Agent, Policy, User } from "@/lib/types";

export type PolicyDecision = {
  allowed: boolean;
  result: "passed" | "manual_review" | "blocked";
  reasons: string[];
};

export function evaluatePolicy({
  policy,
  intent,
  agent,
  user,
}: {
  policy?: Policy;
  intent: Pick<ActionIntent, "amount" | "confidence" | "venue" | "expiry">;
  agent: Agent;
  user: User;
}): PolicyDecision {
  const reasons: string[] = [];

  if (!policy) {
    return {
      allowed: false,
      result: "blocked",
      reasons: ["No active policy exists for this agent."],
    };
  }

  if (new Date(policy.expiry).getTime() < Date.now()) {
    reasons.push("Policy has expired.");
  }

  if (new Date(intent.expiry).getTime() < Date.now()) {
    reasons.push("Action intent has expired.");
  }

  if (intent.amount > policy.maxPerTrade) {
    reasons.push(`Amount exceeds max per trade of ${policy.maxPerTrade} USDC.`);
  }

  if (policy.spentToday + intent.amount > policy.maxDailySpend) {
    reasons.push(`Daily spend would exceed ${policy.maxDailySpend} USDC.`);
  }

  if (intent.amount > user.usdcBalance) {
    reasons.push("User balance is below requested spend.");
  }

  if (!policy.marketCategories.includes(agent.category)) {
    reasons.push(`${agent.category} is outside the policy market categories.`);
  }

  if (!agent.allowedVenues.includes(intent.venue)) {
    reasons.push(`${intent.venue} is not allowed by the agent configuration.`);
  }

  if (intent.confidence < agent.confidenceThreshold) {
    reasons.push(
      `Confidence ${Math.round(intent.confidence * 100)}% is below the agent threshold.`,
    );
  }

  if (reasons.length > 0) {
    return { allowed: false, result: "blocked", reasons };
  }

  if (policy.manualReview) {
    return {
      allowed: false,
      result: "manual_review",
      reasons: ["Policy requires manual review before execution."],
    };
  }

  return {
    allowed: true,
    result: "passed",
    reasons: ["Policy checks passed."],
  };
}

export function calculateFeeSplit(amount: number, agentFeePercent: number) {
  const totalFee = Number(((amount * agentFeePercent) / 100).toFixed(2));
  const agentFee = Number((totalFee * 0.75).toFixed(2));
  const platformFee = Number((totalFee - agentFee).toFixed(2));
  const executionAmount = Number((amount - totalFee).toFixed(2));

  return {
    totalFee,
    agentFee,
    platformFee,
    executionAmount,
    networkFee: MAX_NETWORK_FEE_USDC,
  };
}
