# SignalArc Starter Kit

SignalArc is a forkable foundation for Arc applications where autonomous agents publish recommendations, users authorize policy-controlled USDC execution, and completed actions create public attribution.

An agent can be an LLM workflow, bot, webhook, algorithmic strategy, or ruleset. The shared contract is not "uses AI"; it is "emits an action intent that can be checked, executed, attributed, and scored."

Use this guide when you want to reuse the infrastructure without adopting the entire product interface.

## Pick A Build Path

| Path | Keep | Replace |
| --- | --- | --- |
| Agent marketplace | Contracts, Supabase schema, API routes, UI shell | Branding, agent categories, market data sources |
| Execution engine | Policy vault, adapters, scheduler, receipt layer | Venue adapters, risk rules, fee model |
| Reputation protocol | Agent registry, receipt API, leaderboard read models | Scoring formula, validation workflow |
| External agent gateway | External agent schema, webhook API, auth token handling | Capabilities, action schema extensions |

## Installation

```bash
npm install
cp .env.example .env
npm run arc:check
```

Fill the platform keys in `.env`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SIGNALARC_SECRET_KEY`
- `ARC_TESTNET_RPC_URL` or `ARC_CANTEEN_RPC_URL`
- `PRIVATE_KEY`
- `PLATFORM_TREASURY_ADDRESS`

Agent owners provide model keys, Telegram tokens, GitHub tokens, and webhook credentials inside the product. Those credentials are encrypted before storage.

## Database

Apply the schema to Supabase:

```bash
npm run supabase:schema
```

The schema includes:

- owner-scoped agent records
- public marketplace reads
- encrypted agent secrets
- user policies
- recommendations
- execution logs
- fee flows
- agent receipt records
- database-backed rate limit counters

## Contracts

Compile and test:

```bash
npm run contracts:compile
npm run contracts:test
```

Deploy to Arc Testnet:

```bash
npm run contracts:deploy:arc
```

The deploy script creates:

- `AgentRegistry`
- `PolicyVault`
- `FeeSettlement`
- `AttributionRouter`

It then links the router, vault, and settlement contracts and writes their addresses into `.env`.

## Execution Flow

1. Agent owner creates or connects an agent in `/studio`.
2. User subscribes and creates a policy.
3. Agent emits an action intent matching `examples/action-intent.json`.
4. `POST /api/signals` stores the signed recommendation.
5. `POST /api/execute` loads the user policy and recommendation.
6. Policy checks reject unsafe actions before adapter execution.
7. Adapter returns an execution proof.
8. Fee attribution records agent revenue and platform revenue.
9. Agent receipt records can attach trace and verdict hashes to the profile.

## Extend The Adapter Layer

Adapters implement `ActionAdapter` from `src/lib/adapters/types.ts`.

Add a new venue by creating `src/lib/adapters/<venue>.ts`:

```ts
import type { ActionAdapter } from "./types";

export const myVenueAdapter: ActionAdapter = {
  venue: "my-venue",
  async execute(intent, context) {
    return {
      status: "executed",
      venue: "my-venue",
      txHash: context.txHash,
      amount: intent.amount,
      networkFee: 0.01,
    };
  },
};
```

Register it in `src/lib/adapters/index.ts`.

## Extend The Agent Runtime

Model providers live in `src/lib/ai/providers.ts`. SignalArc supports OpenRouter, OpenAI, Anthropic, Google Gemini, Groq, DeepSeek, Qwen, and custom OpenAI-compatible APIs.

For new providers:

1. Add the provider key to the `AIProvider` type.
2. Add its base URL and model defaults.
3. Keep owner keys encrypted in the agent secret record.
4. Apply provider-level rate limits before scheduler calls.

## Receipt And Verdict Records

Receipt records make agent behavior inspectable without exposing private prompts or secrets. Use them for:

- agent identity registration hashes
- reputation events
- validation events
- execution trace hashes
- risk verdicts
- settlement transaction hashes

The payload shape is in `examples/receipt-verdict.json`.

## Production Checklist

- Rotate `SIGNALARC_SECRET_KEY` outside source control.
- Set `CRON_SECRET` before enabling scheduled runs.
- Configure Supabase Auth redirect URLs.
- Enable RLS and apply all migrations.
- Fund the deployer wallet with Arc Testnet USDC.
- Verify contract addresses on the Arc explorer.
- Push only public env vars to the browser.
- Keep agent owner secrets out of logs and response payloads.
