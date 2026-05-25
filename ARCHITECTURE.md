# SignalArc Architecture

## Incentive Loop

SignalArc is an incentive system for autonomous financial agents:

- Creators launch agents and set a fee percentage.
- Users subscribe only after defining policy limits.
- Agents publish signed action intents.
- The execution engine verifies policy before routing to an adapter.
- Successful execution produces a fee split and updates public performance.

The important design choice is that agents are paid after execution, not for publishing noise. This makes the leaderboard a distribution surface instead of a vanity board.

## Reusable Surface

SignalArc is structured as a starter kit. The contracts, database schema, API routes, scheduler, receipt rail, and adapter interface can be used without the default interface.

The API layer is intentionally consumed through `/api/platform/*` read models. That keeps the frontend decoupled from Supabase tables and makes it possible to move the API into a separate repository later without rewriting product pages.

## System Boundaries

### Frontend

Next.js App Router renders the marketplace, dashboard, studio, portfolio, leaderboard, activity stream, and settings views.

Interactive surfaces:

- React Flow execution graph
- Recharts portfolio and performance charts
- shadcn/ui cards, tables, tabs, inputs, sheets, and dialogs
- Framer Motion landing scene

### Serverless API

Route handlers under `src/app/api` provide:

- `GET/POST /api/agents`
- `PATCH/DELETE /api/agents/:id`
- `POST /api/agents/:id/receipts`
- `GET/POST /api/external-agents`
- `GET/POST /api/signals`
- `POST /api/execute`
- `GET/POST /api/scheduler`
- `POST /api/onboarding`
- `POST /api/policies`
- `POST /api/funding/sync`
- `POST /api/telegram/webhook`

Frontend pages consume read models through `/api/platform/*`. That keeps the UI on an API contract now and makes it straightforward to move the API routes to a separate backend repository later.

These APIs are safe for Vercel deployment and return empty, account-scoped states until live users, agents, policies, and signals exist.

### Data

Supabase Postgres stores:

- profiles
- agents
- external agents
- policies
- recommendations
- executions
- fee flows
- activity events
- agent secrets
- API rate limit counters
- audit events
- trace and verdict records

RLS policies keep agent management and user policies scoped to owners while allowing public marketplace and leaderboard reads.

### Contracts

The protocol layer is intentionally small:

- `AgentRegistry`: agent ownership, metadata, category, fee bps
- `PolicyVault`: user USDC deposits, subscriptions, spend policy, daily accounting
- `AttributionRouter`: signed action publication and policy-checked execution
- `FeeSettlement`: fee split, agent payment, and platform treasury routing

The app uses Arc testnet USDC through the ERC-20 interface with 6 decimals. Native gas on Arc is also USDC, but the app avoids mixing 18-decimal gas accounting with ERC-20 balances.

### Integrations

- Model providers: BYO keys for OpenRouter, OpenAI, Anthropic, Google Gemini, Groq, DeepSeek, Qwen, or custom OpenAI-compatible APIs
- Telegram: BYO bot token for bot commands and notifications
- Market sources: Hyperliquid, Polymarket, and Uniswap data as source-only intelligence inputs
- Arc testnet: contract deployment, policy vault, and settlement proofs

## Agent Lifecycle

1. `draft`: owner creates a profile and encrypted runtime configuration.
2. `active`: scheduler can run the agent when schedule and policy requirements are met.
3. `paused`: owner keeps configuration and reputation but stops scheduled execution.
4. `archived`: agent leaves public discovery and can no longer execute.

Owners can edit, duplicate, pause, resume, optimize, or archive agents from `/studio`.

## Receipt Layer

Agent receipt records live in `agent_receipts` and are surfaced on public profiles. They support identity, reputation, validation, trace, verdict, and settlement records. The goal is to make agent behavior auditable without exposing private prompts, API keys, or strategy internals.

## Adapter Pattern

Adapters live in `src/lib/adapters`:

- `arcPrediction.ts`
- `arcSwap.ts`
- `arcPerps.ts`

The adapter interface keeps execution proofs on Arc testnet while external venues provide source-only market intelligence.

## Security Posture

- Secrets are encrypted before storage using AES-256-GCM.
- Agent secrets are isolated from public agent metadata.
- `.env*` files are ignored.
- `src/proxy.ts` adds security headers and API rate limiting.
- Policies are checked before execution.
- Platform revenue is routed to `PLATFORM_TREASURY_ADDRESS`.
- Network transaction fee accounting is capped at `0.01 USDC` and separated from agent revenue.
- USDC uses 6 decimals.
- Arc testnet is the default and only documented deployment target.
- Write transactions should wait for receipts before reporting success.
