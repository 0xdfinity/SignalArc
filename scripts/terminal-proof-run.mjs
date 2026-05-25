import "dotenv/config";

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  Contract,
  Interface,
  JsonRpcProvider,
  Wallet,
  formatEther,
  formatUnits,
  id,
  parseUnits,
} from "ethers";

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  white: "\x1b[37m",
};

const ARC_CHAIN_ID = 5042002;
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const BASE_URL = trimSlash(process.env.SIGNALARC_PROOF_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
const RPC_URL = process.env.ARC_CANTEEN_RPC_URL || process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";
const EXPLORER = "https://testnet.arcscan.app";
const TARGET_VAULT_USDC = parseUnits("25", 6);
const ONCHAIN_ACTION_USDC = parseUnits("1.5", 6);
const API_MAX_TRADE = 20;

let cookie = "";
const proof = {
  baseUrl: BASE_URL,
  runId: RUN_ID,
  wallet: "",
  onchain: {},
  api: {},
};

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GROQ_API_KEY",
  "PRIVATE_KEY",
  "AGENT_REGISTRY_ADDRESS",
  "POLICY_VAULT_ADDRESS",
  "ATTRIBUTION_ROUTER_ADDRESS",
  "FEE_SETTLEMENT_ADDRESS",
  "CRON_SECRET",
];

function color(value, tone) {
  return `${COLORS[tone]}${value}${COLORS.reset}`;
}

function banner() {
  const line = "=".repeat(74);
  console.log(color(line, "cyan"));
  console.log(color("SIGNALARC TERMINAL PROOF RUN", "bold"));
  console.log(color("Arc agent economy: account -> agent -> policy -> execution -> receipt", "white"));
  console.log(color(line, "cyan"));
}

function section(title) {
  console.log("");
  console.log(color(`-- ${title}`, "cyan"));
}

async function step(label, task) {
  const started = Date.now();
  process.stdout.write(`${color("[....]", "yellow")} ${label}`);

  try {
    const result = await task();
    const elapsed = `${Date.now() - started}ms`;
    const detail = result?.detail ? ` ${color(result.detail, "dim")}` : "";
    process.stdout.write(`\r${color("[PASS]", "green")} ${label}${detail} ${color(elapsed, "dim")}\n`);
    return result?.value ?? result;
  } catch (error) {
    process.stdout.write(`\r${color("[FAIL]", "red")} ${label}\n`);
    console.error(color(error instanceof Error ? error.message : String(error), "red"));
    process.exitCode = 1;
    throw error;
  }
}

function requireEnvironment() {
  const missing = requiredEnv.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function loadArtifact(name) {
  return JSON.parse(fs.readFileSync(`artifacts/contracts/${name}.sol/${name}.json`, "utf8"));
}

function short(value) {
  if (!value) {
    return "-";
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function txUrl(hash) {
  return `${EXPLORER}/tx/${hash}`;
}

function trimSlash(value) {
  return value.replace(/\/$/, "");
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (cookie) {
    headers.cookie = cookie;
  }

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const setCookie = response.headers.get("set-cookie");

  if (setCookie) {
    cookie = setCookie.split(";")[0];
  }

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text.slice(0, 240) };
  }

  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}: ${JSON.stringify(payload).slice(0, 360)}`);
  }

  return payload;
}

async function rawPage(path) {
  const response = await fetch(`${BASE_URL}${path}`, cookie ? { headers: { cookie } } : undefined);

  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }

  return response.text();
}

function parseEvent(receipt, artifact, eventName) {
  const iface = new Interface(artifact.abi);

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);

      if (parsed?.name === eventName) {
        return parsed;
      }
    } catch {
      // Ignore logs from other contracts in the same transaction.
    }
  }

  return null;
}

async function pickGroqModel() {
  const response = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
  });

  if (!response.ok) {
    throw new Error(`Groq model lookup failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  const models = (payload.data || []).map((model) => model.id).filter(Boolean);
  const preferred = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "qwen/qwen3-32b"];
  const selected = preferred.find((model) => models.includes(model)) || models[0];

  if (!selected) {
    throw new Error("Groq returned no usable models.");
  }

  return selected;
}

async function telegramCheck(token, label) {
  if (!token) {
    return `${label}: missing`;
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const payload = await response.json().catch(() => ({}));

  if (!payload.ok) {
    throw new Error(`${label} Telegram token failed getMe.`);
  }

  return `${label}: @${payload.result.username}`;
}

async function main() {
  banner();
  requireEnvironment();

  const provider = new JsonRpcProvider(RPC_URL);
  const signer = new Wallet(process.env.PRIVATE_KEY, provider);
  proof.wallet = signer.address;

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const registryArtifact = loadArtifact("AgentRegistry");
  const vaultArtifact = loadArtifact("PolicyVault");
  const routerArtifact = loadArtifact("AttributionRouter");
  const erc20Abi = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
  ];

  const registry = new Contract(process.env.AGENT_REGISTRY_ADDRESS, registryArtifact.abi, signer);
  const vault = new Contract(process.env.POLICY_VAULT_ADDRESS, vaultArtifact.abi, signer);
  const router = new Contract(process.env.ATTRIBUTION_ROUTER_ADDRESS, routerArtifact.abi, signer);
  const usdc = new Contract(process.env.ARC_USDC_ADDRESS || USDC_ADDRESS, erc20Abi, signer);

  section("Runtime Health");
  await step("Environment loaded without printing secrets", async () => ({
    detail: `${requiredEnv.length} required keys present`,
  }));
  await step("SignalArc API health", async () => {
    const config = await api("/api/arc/config");
    return { detail: `${BASE_URL} chain=${config.chain.chainId}` };
  });
  await step("Arc testnet RPC", async () => {
    const network = await provider.getNetwork();
    const block = await provider.getBlockNumber();

    if (Number(network.chainId) !== ARC_CHAIN_ID) {
      throw new Error(`Expected Arc chain ${ARC_CHAIN_ID}, got ${network.chainId}`);
    }

    return { detail: `chain=${network.chainId} block=${block}` };
  });
  await step("Contract bytecode present", async () => {
    const contracts = {
      AgentRegistry: process.env.AGENT_REGISTRY_ADDRESS,
      PolicyVault: process.env.POLICY_VAULT_ADDRESS,
      AttributionRouter: process.env.ATTRIBUTION_ROUTER_ADDRESS,
      FeeSettlement: process.env.FEE_SETTLEMENT_ADDRESS,
    };

    for (const [name, address] of Object.entries(contracts)) {
      const code = await provider.getCode(address);

      if (code === "0x") {
        throw new Error(`${name} has no bytecode at ${address}`);
      }
    }

    return { detail: "registry/vault/router/settlement online" };
  });

  section("Arc Wallet And Vault");
  await step("Wallet balances", async () => {
    const [nativeGas, walletUsdc, vaultUsdc] = await Promise.all([
      provider.getBalance(signer.address),
      usdc.balanceOf(signer.address),
      vault.balances(signer.address),
    ]);

    proof.api.vaultBefore = formatUnits(vaultUsdc, 6);

    return {
      detail: `wallet=${short(signer.address)} gas=${Number(formatEther(nativeGas)).toFixed(4)} walletUSDC=${formatUnits(walletUsdc, 6)} vaultUSDC=${formatUnits(vaultUsdc, 6)}`,
      value: { walletUsdc, vaultUsdc },
    };
  });
  await step("Top up PolicyVault if needed", async () => {
    const walletUsdc = await usdc.balanceOf(signer.address);
    const vaultUsdc = await vault.balances(signer.address);

    if (vaultUsdc >= TARGET_VAULT_USDC) {
      return { detail: `vault already has ${formatUnits(vaultUsdc, 6)} USDC` };
    }

    const needed = TARGET_VAULT_USDC - vaultUsdc;

    if (walletUsdc < needed) {
      throw new Error(`Need ${formatUnits(needed, 6)} more ERC-20 USDC in wallet. Fund ${short(signer.address)} at https://faucet.circle.com.`);
    }

    const allowance = await usdc.allowance(signer.address, process.env.POLICY_VAULT_ADDRESS);

    if (allowance < needed) {
      const approval = await usdc.approve(process.env.POLICY_VAULT_ADDRESS, needed);
      await approval.wait();
    }

    const tx = await vault.depositUSDC(needed);
    const receipt = await tx.wait();
    proof.onchain.vaultDepositTx = tx.hash;

    return { detail: `${formatUnits(needed, 6)} USDC deposited block=${receipt.blockNumber}` };
  });

  section("Onchain Protocol Proof");
  const onchainAgent = await step("AgentRegistry.registerAgent", async () => {
    const agentId = await registry.nextAgentId();
    const tx = await registry.registerAgent(`signalarc://terminal-proof/${RUN_ID}`, "Yield", 400);
    const receipt = await tx.wait();
    proof.onchain.agentId = agentId.toString();
    proof.onchain.registerAgentTx = tx.hash;
    return { detail: `agentId=${agentId} tx=${short(tx.hash)} block=${receipt.blockNumber}`, value: agentId };
  });
  await step("PolicyVault.createPolicy + subscribeAgent", async () => {
    const expiry = Math.floor(Date.now() / 1000) + 60 * 60;
    const categoryHash = id("Yield");
    const policyTx = await vault.createPolicy(
      onchainAgent,
      parseUnits("25", 6),
      parseUnits("25", 6),
      parseUnits("5", 6),
      categoryHash,
      800,
      expiry,
      false,
    );
    const policyReceipt = await policyTx.wait();
    const subscribeTx = await vault.subscribeAgent(onchainAgent);
    const subscribeReceipt = await subscribeTx.wait();
    proof.onchain.policyTx = policyTx.hash;
    proof.onchain.subscribeTx = subscribeTx.hash;
    return { detail: `policyBlock=${policyReceipt.blockNumber} subscribeBlock=${subscribeReceipt.blockNumber}` };
  });
  const actionId = await step("AttributionRouter.publishAction", async () => {
    const expiry = Math.floor(Date.now() / 1000) + 60 * 30;
    const tx = await router.publishAction(
      onchainAgent,
      `yield-proof-${RUN_ID}`,
      signer.address,
      id("Yield"),
      id("BUY"),
      ONCHAIN_ACTION_USDC,
      8600,
      `signalarc://trace/${RUN_ID}`,
      expiry,
      "0x",
    );
    const receipt = await tx.wait();
    const event = parseEvent(receipt, routerArtifact, "ActionPublished");

    if (!event) {
      throw new Error("ActionPublished event was not found.");
    }

    proof.onchain.publishActionTx = tx.hash;
    proof.onchain.actionId = event.args.actionId;
    return { detail: `actionId=${short(event.args.actionId)} tx=${short(tx.hash)}`, value: event.args.actionId };
  });
  await step("AttributionRouter.executeAction + FeeSettlement", async () => {
    const tx = await router.executeAction(actionId, signer.address);
    const receipt = await tx.wait();
    const event = parseEvent(receipt, routerArtifact, "ActionExecuted");

    if (!event) {
      throw new Error("ActionExecuted event was not found.");
    }

    proof.onchain.executeActionTx = tx.hash;
    proof.onchain.executionId = event.args.executionId;
    return { detail: `executionId=${short(event.args.executionId)} tx=${short(tx.hash)} block=${receipt.blockNumber}` };
  });

  section("Agent Runtime Proof");
  const groqModel = await step("Groq model handshake", async () => {
    const model = await pickGroqModel();
    proof.api.groqModel = model;
    return { detail: model, value: model };
  });
  await step("Telegram bot identity check", async () => {
    const primary = await telegramCheck(process.env.TELEGRAM_BOT_TOKEN, "primary");
    const secondary = await telegramCheck(process.env.TELEGRAM_BOT_TOKEN2, "secondary");
    return { detail: `${primary}; ${secondary}` };
  });
  await step("POST /api/onboarding creates account", async () => {
    const response = await api("/api/onboarding", {
      method: "POST",
      body: JSON.stringify({
        name: "SignalArc Terminal Operator",
        email: `terminal-${RUN_ID}@signalarc.test`,
        walletAddress: signer.address,
        rules: {
          maxPerTrade: API_MAX_TRADE,
          maxDailySpend: 25,
          manualReview: false,
        },
      }),
    });
    proof.api.userId = response.user.id;
    return { detail: `user=${short(response.user.id)} wallet=${short(response.user.walletAddress)}`, value: response.user };
  });
  const synced = await step("POST /api/funding/sync reads PolicyVault", async () => {
    const response = await api("/api/funding/sync", {
      method: "POST",
      body: JSON.stringify({ walletAddress: signer.address }),
    });
    proof.api.syncedVaultUsdc = response.usdcBalance;
    return { detail: `${response.usdcBalance.toFixed(4)} USDC` };
  });
  const agent = await step("POST /api/agents creates encrypted Groq agent", async () => {
    if (synced.usdcBalance < API_MAX_TRADE) {
      throw new Error(`Vault sync returned ${synced.usdcBalance} USDC; need at least ${API_MAX_TRADE} USDC for API execution.`);
    }

    const response = await api("/api/agents", {
      method: "POST",
      body: JSON.stringify({
        name: `Groq Portfolio Agent ${RUN_ID}`,
        description: "A Groq-powered portfolio agent that emits compact Arc testnet action intents.",
        avatar: "GP",
        category: "Trading & Portfolio Optimization",
        aiProvider: "groq",
        model: groqModel,
        mode: "prompt-only",
        schedule: "5m",
        confidenceThreshold: 0.76,
        allowedVenues: ["arc-swap"],
        feePercent: 4,
        visibility: "public",
        instructionPrompt:
          "Return JSON only. Create one conservative Arc testnet action intent with amount exactly 10, venue arc-swap, action BUY or HEDGE, confidence above threshold, and a concise rationale.",
        apiKey: process.env.GROQ_API_KEY,
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
        githubPat: "",
      }),
    });
    proof.api.agentId = response.agent.id;
    return { detail: `agent=${short(response.agent.id)} secrets=${response.secretStatus}`, value: response.agent };
  });
  await step("POST /api/policies subscribes account to agent", async () => {
    const response = await api("/api/policies", {
      method: "POST",
      body: JSON.stringify({
        agentId: agent.id,
        maxSpend: 25,
        maxDailySpend: 25,
        maxPerTrade: API_MAX_TRADE,
        stopLossPercent: 8,
        manualReview: false,
        expiryDays: 30,
      }),
    });
    proof.api.policyId = response.policy.id;
    return { detail: `policy=${short(response.policy.id)} category=${response.policy.market_categories[0]}` };
  });
  const recommendation = await step("POST /api/scheduler calls Groq and publishes signal", async () => {
    const response = await api("/api/scheduler", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const item = response.generated.find((entry) => entry.agentId === agent.id);

    if (!item) {
      throw new Error("Scheduler did not return the created agent.");
    }

    if (item.status !== "published") {
      throw new Error(`Scheduler status for created agent: ${item.status}${item.error ? ` (${item.error})` : ""}`);
    }

    proof.api.recommendationId = item.recommendation.id;
    return {
      detail: `recommendation=${short(item.recommendation.id)} amount=${item.recommendation.amount} confidence=${Math.round(item.recommendation.confidence * 100)}%`,
      value: item.recommendation,
    };
  });
  const execution = await step("POST /api/execute passes policy and records attribution", async () => {
    const response = await api("/api/execute", {
      method: "POST",
      body: JSON.stringify({ recommendationId: recommendation.id }),
    });
    proof.api.executionId = response.execution.id;
    proof.api.adapterTxHash = response.execution.txHash;
    return {
      detail: `execution=${short(response.execution.id)} policy=${response.execution.policyResult} fee=${response.execution.agentFee} tx=${short(response.execution.txHash)}`,
      value: response.execution,
    };
  });
  await step("POST /api/agents/:id/receipts attaches verdict", async () => {
    const response = await api(`/api/agents/${agent.id}/receipts`, {
      method: "POST",
      body: JSON.stringify({
        kind: "verdict",
        registry: "signalarc",
        txHash: execution.txHash,
        traceRef: `sha256:${"d".repeat(64)}`,
        verdict: "passed",
        summary: "Terminal proof run passed policy, execution, fee attribution, and receipt attachment.",
      }),
    });
    proof.api.receiptId = response.receipt.id;
    return { detail: `receipt=${short(response.receipt.id)} verdict=${response.receipt.verdict}`, value: response.receipt };
  });
  await step("GET /share/:executionId returns public share card page", async () => {
    const html = await rawPage(`/share/${execution.id}`);

    if (!html.includes("SignalArc")) {
      throw new Error("Share page did not render expected SignalArc content.");
    }

    return { detail: `/share/${execution.id}` };
  });

  section("Public Read Model Proof");
  await step("GET platform read models", async () => {
    const routes = [
      "/api/platform/me",
      "/api/platform/studio",
      "/api/platform/dashboard",
      "/api/platform/agents",
      "/api/platform/portfolio",
      "/api/platform/leaderboard",
      "/api/platform/activity",
    ];

    for (const route of routes) {
      await api(route);
    }

    return { detail: `${routes.length} read models returned 200` };
  });
  await step("Supabase rows confirm persisted proof", async () => {
    const checks = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("id", proof.api.userId),
      supabase.from("agents").select("id", { count: "exact", head: true }).eq("id", proof.api.agentId),
      supabase.from("recommendations").select("id", { count: "exact", head: true }).eq("id", proof.api.recommendationId),
      supabase.from("executions").select("id", { count: "exact", head: true }).eq("id", proof.api.executionId),
      supabase.from("agent_receipts").select("id", { count: "exact", head: true }).eq("id", proof.api.receiptId),
    ]);

    const failed = checks.find((check) => check.error || check.count !== 1);

    if (failed) {
      throw new Error(failed.error?.message || "A persisted proof row was not found.");
    }

    return { detail: "profile/agent/recommendation/execution/receipt found" };
  });

  section("Receipts And Links");
  const rows = [
    ["Run ID", RUN_ID],
    ["Wallet", signer.address],
    ["API user", proof.api.userId],
    ["Groq model", proof.api.groqModel],
    ["API agent", proof.api.agentId],
    ["Recommendation", proof.api.recommendationId],
    ["Execution", proof.api.executionId],
    ["Receipt", proof.api.receiptId],
    ["Onchain agent ID", proof.onchain.agentId],
    ["Onchain action ID", proof.onchain.actionId],
    ["Onchain execution ID", proof.onchain.executionId],
    ["Register tx", txUrl(proof.onchain.registerAgentTx)],
    ["Policy tx", txUrl(proof.onchain.policyTx)],
    ["Publish tx", txUrl(proof.onchain.publishActionTx)],
    ["Execute tx", txUrl(proof.onchain.executeActionTx)],
    ["Share page", `${BASE_URL}/share/${proof.api.executionId}`],
  ];

  for (const [label, value] of rows) {
    console.log(`${color(label.padEnd(20), "dim")} ${value}`);
  }

  console.log("");
  console.log(color("SIGNALARC PROOF COMPLETE", "green"));
  console.log(color("Created records are intentionally kept so the UI can show the run after recording.", "dim"));
}

main().catch(() => {
  console.log("");
  console.log(color("Proof run stopped. Fix the failed line above and run the same command again.", "red"));
});
