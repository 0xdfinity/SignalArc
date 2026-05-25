import { z } from "zod";

import { AGENT_CATEGORIES } from "@/lib/types";

export const agentInputSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(8),
  avatar: z.string().min(1).max(4).default("SA"),
  category: z.enum(AGENT_CATEGORIES),
  aiProvider: z.enum(["openrouter", "openai", "anthropic", "google", "groq", "deepseek", "qwen", "custom"]).default("openrouter"),
  model: z.string().min(2),
  apiKey: z.string().optional().default(""),
  telegramBotToken: z.string().optional().default(""),
  githubPat: z.string().optional().default(""),
  instructionPrompt: z.string().min(20),
  schedule: z.enum(["manual", "5m", "10m", "hourly"]),
  confidenceThreshold: z.coerce.number().min(0.5).max(0.99),
  allowedVenues: z.array(z.enum(["arc-prediction", "arc-swap", "arc-perps"])).min(1),
  feePercent: z.coerce.number().min(0).max(30),
  visibility: z.enum(["public", "private", "unlisted"]),
  mode: z.enum(["prompt-only", "github-enhanced", "external-tools", "algorithmic"]),
});

export const agentUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(8).optional(),
  avatar: z.string().min(1).max(4).optional(),
  category: z.enum(AGENT_CATEGORIES).optional(),
  aiProvider: z.enum(["openrouter", "openai", "anthropic", "google", "groq", "deepseek", "qwen", "custom"]).optional(),
  model: z.string().min(2).optional(),
  apiKey: z.string().optional(),
  telegramBotToken: z.string().optional(),
  githubPat: z.string().optional(),
  instructionPrompt: z.string().min(20).optional(),
  schedule: z.enum(["manual", "5m", "10m", "hourly"]).optional(),
  confidenceThreshold: z.coerce.number().min(0.5).max(0.99).optional(),
  allowedVenues: z.array(z.enum(["arc-prediction", "arc-swap", "arc-perps"])).min(1).optional(),
  feePercent: z.coerce.number().min(0).max(30).optional(),
  visibility: z.enum(["public", "private", "unlisted"]).optional(),
  mode: z.enum(["prompt-only", "github-enhanced", "external-tools", "algorithmic"]).optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
});

export const externalAgentSchema = z.object({
  provider: z.enum(["OpenClaw", "Hermes", "custom", "webhook"]),
  endpoint: z.string().url(),
  authToken: z.string().min(6),
  signatureKey: z.string().min(6),
  capabilities: z.array(z.string()).min(1),
  metadata: z.record(z.string(), z.string()).default({}),
});

export const actionIntentSchema = z.object({
  agentId: z.string(),
  marketId: z.string(),
  venue: z.enum(["arc-prediction", "arc-swap", "arc-perps"]),
  action: z.enum(["BUY", "SELL", "HEDGE", "LONG", "SHORT", "NOOP"]),
  amount: z.coerce.number().positive(),
  confidence: z.coerce.number().min(0).max(1),
  rationale: z.string().min(8),
  expiry: z.string().datetime(),
  signature: z.string().min(6),
});

export const executeSchema = z.object({
  recommendationId: z.string(),
});

export const policyInputSchema = z.object({
  agentId: z.string(),
  maxSpend: z.coerce.number().positive().max(1_000_000),
  maxDailySpend: z.coerce.number().positive().max(1_000_000),
  maxPerTrade: z.coerce.number().positive().max(1_000_000),
  stopLossPercent: z.coerce.number().min(0).max(100),
  manualReview: z.boolean(),
  expiryDays: z.coerce.number().int().min(1).max(365).default(30),
});

export const agentReceiptSchema = z.object({
  kind: z.enum(["identity", "trace", "verdict", "reputation", "validation"]),
  registry: z.enum(["identity", "reputation", "validation", "signalarc"]).default("signalarc"),
  chainId: z.coerce.number().int().positive().default(5042002),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  traceRef: z.string().min(4).max(160).optional(),
  verdict: z.enum(["passed", "warning", "failed", "pending"]).optional(),
  summary: z.string().trim().min(8).max(280),
});
