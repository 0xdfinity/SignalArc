import type { ActionKind, Agent, AIProvider, Recommendation, Venue } from "@/lib/types";

type ChatChoiceResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type AnthropicResponse = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type ProviderConfig = {
  endpoint: string;
};

const openAiCompatibleProviders: Partial<Record<AIProvider, ProviderConfig>> = {
  openrouter: {
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
  },
  openai: {
    endpoint: "https://api.openai.com/v1/chat/completions",
  },
  groq: {
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  deepseek: {
    endpoint: "https://api.deepseek.com/chat/completions",
  },
  qwen: {
    endpoint: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
  },
};

export type GeneratedSignal = Pick<
  Recommendation,
  "marketId" | "venue" | "action" | "amount" | "confidence" | "rationale" | "title" | "category" | "expectedMove"
>;

export async function generateSignalWithProvider({
  agent,
  apiKey,
  endpoint,
}: {
  agent: Agent;
  apiKey?: string;
  endpoint?: string;
}): Promise<GeneratedSignal> {
  if (agent.mode === "algorithmic") {
    return generateAlgorithmicSignal(agent);
  }

  if (!apiKey) {
    throw new Error("Provider key missing.");
  }

  const prompt = buildPrompt(agent);

  const content =
    agent.aiProvider === "anthropic"
      ? await callAnthropic(agent, apiKey, prompt)
      : agent.aiProvider === "google"
        ? await callGemini(agent, apiKey, prompt)
        : await callOpenAiCompatible(agent, apiKey, prompt, endpoint);

  return normalizeSignal(agent, content);
}

function buildPrompt(agent: Agent) {
  return `${agent.instructionPrompt}

Return JSON only with: title, marketId, venue, action, amount, confidence, rationale, expectedMove.
Allowed venues: ${agent.allowedVenues.join(", ")}.
Agent category: ${agent.category}.
Allowed actions: BUY, SELL, HEDGE, LONG, SHORT, NOOP.
Confidence must be >= ${agent.confidenceThreshold}.
Amount must be a small USDC testnet amount. External venues are source data only; execution proof remains on Arc L1 testnet.`;
}

async function callOpenAiCompatible(agent: Agent, apiKey: string, prompt: string, endpoint?: string) {
  const provider = openAiCompatibleProviders[agent.aiProvider];
  const providerEndpoint = endpoint ?? provider?.endpoint ?? process.env.CUSTOM_AI_BASE_URL ?? "";
  const payload = {
    model: agent.model,
    messages: [
      {
        role: "system",
        content: "You produce compact JSON only for policy-safe market action intents.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 500,
  };
  let response = await fetch(providerEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "SignalArc",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok && response.status === 400) {
    const { response_format: _responseFormat, ...fallbackPayload } = payload;
    void _responseFormat;
    response = await fetch(providerEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "SignalArc",
      },
      body: JSON.stringify(fallbackPayload),
    });
  }

  if (!response.ok) {
    throw new Error(`Provider request failed (${response.status})`);
  }

  const data = (await response.json()) as ChatChoiceResponse;
  return data.choices?.[0]?.message?.content;
}

async function callAnthropic(agent: Agent, apiKey: string, prompt: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: agent.model,
      max_tokens: 700,
      system: "You produce compact JSON only for policy-safe market action intents.",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error("Anthropic request failed");
  }

  const data = (await response.json()) as AnthropicResponse;
  return data.content?.find((part) => part.type === "text")?.text;
}

async function callGemini(agent: Agent, apiKey: string, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(agent.model)}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Gemini request failed");
  }

  const data = (await response.json()) as GeminiResponse;
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

function normalizeSignal(agent: Agent, content?: string | null): GeneratedSignal {
  if (!content) {
    throw new Error("Provider returned an empty signal.");
  }

  const parsed = parseSignalContent(content);
  const venue = isVenue(parsed.venue) && agent.allowedVenues.includes(parsed.venue) ? parsed.venue : agent.allowedVenues[0];
  const action = isAction(parsed.action) ? parsed.action : defaultAction(agent);

  return {
    title: String(parsed.title ?? defaultTitle(agent)),
    marketId: String(parsed.marketId ?? `${agent.slug.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`),
    venue,
    action,
    amount: Math.min(Math.max(Number(parsed.amount ?? 50), 10), 180),
    confidence: Math.min(Math.max(Number(parsed.confidence ?? agent.confidenceThreshold), agent.confidenceThreshold), 0.98),
    rationale: String(parsed.rationale ?? "Provider generated a policy-safe market action intent."),
    category: agent.category,
    expectedMove: Number.isFinite(Number(parsed.expectedMove)) ? Number(parsed.expectedMove) : defaultExpectedMove(agent),
  };
}

function parseSignalContent(content: string): Partial<GeneratedSignal> {
  try {
    return JSON.parse(content) as Partial<GeneratedSignal>;
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Provider returned non-JSON signal content.");
    }

    return JSON.parse(jsonMatch[0]) as Partial<GeneratedSignal>;
  }
}

function defaultTitle(agent: Agent) {
  if (agent.category === "Trading & Portfolio Optimization") {
    return "Rebalance policy-bounded exposure";
  }

  if (agent.category === "Prediction & Betting") {
    return "Back verified probability edge";
  }

  if (agent.category === "Yield") {
    return "Allocate to policy-aware yield spread";
  }

  return "Act on multi-factor market signal";
}

function defaultAction(agent: Agent): ActionKind {
  if (agent.category === "Trading & Portfolio Optimization") {
    return "HEDGE";
  }

  return "BUY";
}

function defaultExpectedMove(agent: Agent) {
  if (agent.category === "Prediction & Betting") {
    return 3.8;
  }

  if (agent.category === "Yield") {
    return 1.2;
  }

  if (agent.category === "Market Intelligence & Analysis") {
    return 2.1;
  }

  return 2.4;
}

function generateAlgorithmicSignal(agent: Agent): GeneratedSignal {
  const confidence = Math.min(Math.max(agent.confidenceThreshold + 0.04, agent.confidenceThreshold), 0.96);

  return {
    title: defaultTitle(agent),
    marketId: `${agent.slug.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    venue: agent.allowedVenues[0],
    action: defaultAction(agent),
    amount: 20,
    confidence,
    rationale: "Deterministic rule engine produced a policy-safe action intent from configured category, venue, and confidence rules.",
    category: agent.category,
    expectedMove: defaultExpectedMove(agent),
  };
}

function isVenue(value: unknown): value is Venue {
  return value === "arc-prediction" || value === "arc-swap" || value === "arc-perps";
}

function isAction(value: unknown): value is ActionKind {
  return value === "BUY" || value === "SELL" || value === "HEDGE" || value === "LONG" || value === "SHORT" || value === "NOOP";
}
