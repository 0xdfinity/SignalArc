# SignalArc

SignalArc is an Arc agent economy starter kit for policy-controlled USDC execution.

It packages the primitives needed to launch a live agent marketplace: users create wallets and spending policies, agents publish signed action intents, serverless APIs verify policy limits, Arc contracts record execution and attribution, and agents earn only when their recommendations are followed.

In SignalArc, an agent can be an LLM workflow, Telegram bot, webhook service, quantitative ruleset, or any autonomous system that senses market state, decides, and emits policy-checkable actions.

The repository is designed to be forked as infrastructure, not studied as a closed product. Builders can reuse the contracts, database schema, API routes, adapters, scheduler, receipt layer, and interface patterns independently.

## What Builders Get

- Agent marketplace with public profiles, rankings, subscriptions, and share cards
- Agent studio with BYO model provider keys, encrypted secrets, schedules, fee settings, and lifecycle controls
- External agent onboarding for webhook agents, custom APIs, OpenClaw-style agents, and Hermes-style agents
- Policy vault flow for per-action, daily, category, stop-loss, expiry, and manual-review constraints
- Arc testnet contracts for registry, vault, attribution routing, and fee settlement
- Serverless execution engine that separates network transaction fees from agent revenue
- Trace and verdict records tied to Arc transaction hashes for agent accountability
- Source-only market intelligence adapters for Hyperliquid, Polymarket, Uniswap, and Arc-native venue mocks
- Vercel + Supabase deployment path with no dedicated backend server

## Agent Categories

SignalArc currently supports four deployment tracks:

- Trading & Portfolio Optimization
- Prediction & Betting
- Yield
- Market Intelligence & Analysis

## Reusable Arc Primitives

| Primitive | Paths | Reuse It For |
| --- | --- | --- |
| Agent identity and ownership | `contracts/AgentRegistry.sol`, `src/app/api/agents` | Register agent metadata, owner address, category, and fee bps |
| Policy-controlled custody | `contracts/PolicyVault.sol`, `src/lib/policy.ts`, `src/app/api/policies` | Let users authorize USDC limits before any autonomous action executes |
| Action attribution | `contracts/AttributionRouter.sol`, `src/app/api/execute` | Publish intents, execute policy-safe actions, and bind outcomes to agents |
| Fee settlement | `contracts/FeeSettlement.sol` | Route agent revenue and platform revenue after completed executions |
| Adapter interface | `src/lib/adapters/*`, `src/lib/adapters/types.ts` | Swap in any venue while preserving one execution contract for the app |
| Receipt rail | `src/app/api/agents/[id]/receipts`, `src/components/protocol/agent-receipt-trail.tsx` | Attach trace, verdict, reputation, and validation records to agent profiles |
| Agent scheduler | `src/app/api/scheduler`, `vercel.json` | Run prompt-only, GitHub-enhanced, or external agents from serverless cron |
| Public economy UI | `src/components/protocol/*`, `src/app/(app)/*` | Show live graph, ranking, execution feed, portfolio, and agent operations |

## What This Adds To Existing Arc Examples

The existing Arc examples cover focused payment flows such as commerce checkout and peer-to-peer payments. SignalArc adds a reusable agent economy layer on top of Arc:

1. User-owned policy constraints before autonomous execution.
2. Signed action intents emitted by internal or external agents.
3. Attribution and fee settlement between users, agents, and the platform treasury.
4. Public agent reputation through rankings, trace records, and verdict history.
5. A serverless architecture that can run on Vercel and Supabase without a paid backend server.

## Quickstart

```bash
npm install
cp .env.example .env
npm run arc:check
npm run dev
```

Open `http://localhost:3000`.

For a complete build path, read `STARTER_KIT.md`.

## Arc Testnet

SignalArc targets Arc Testnet.

| Setting | Value |
| --- | --- |
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Faucet | `https://faucet.circle.com` |
| ERC-20 USDC | `0x3600000000000000000000000000000000000000` |

Arc uses USDC as the native gas token. SignalArc keeps native gas accounting separate from ERC-20 USDC balances so the policy vault can use 6-decimal USDC amounts without confusing wallet gas display.

## Run Contracts

```bash
npm run contracts:compile
npm run contracts:test
```

Deploy after setting `PRIVATE_KEY`, `PLATFORM_TREASURY_ADDRESS`, and an Arc RPC URL:

```bash
npm run contracts:deploy:arc
```

Deployment writes the contract addresses back to `.env` for local use.

## Repository Map

```text
contracts/                 Arc contracts for registry, policy, attribution, settlement
src/app/api/               Serverless API surface consumed by the frontend
src/app/(app)/             Authenticated product routes
src/components/protocol/   Live economy graph, ranking, receipts, execution feed
src/components/studio/     Agent creation and management console
src/lib/adapters/          Venue adapter contract and Arc execution stubs
src/lib/ai/                BYO model provider routing
src/lib/crypto/            Secret encryption and hashing
src/lib/db/                Supabase read and write models
supabase/                  Schema, migrations, RLS, rate limit function
examples/                  Copyable payload shapes for agents and integrations
docs/                      Builder-facing primitive guides
```

## Documentation

- `STARTER_KIT.md` explains how to fork SignalArc into a new Arc agent economy project.
- `docs/ARC_PRIMITIVES.md` maps each reusable primitive to code.
- `docs/INCENTIVE_DESIGN.md` explains the retention, reputation, data, and economic loops.
- `docs/CONTEXT_STRATEGY.md` documents token, cache, memory, and trace decisions.
- `ARCHITECTURE.md` explains product boundaries and the execution loop.
- `API_REFERENCE.md` lists the serverless API contract.
- `DEPLOY.md` covers Supabase, Vercel, and Arc deployment.
- `SECURITY.md` documents key handling, RLS, rate limits, and reporting.
- `AGENTS.md` gives coding agents a compact repo orientation.

## Security Model

Agent owner secrets are encrypted with AES-256-GCM before storage. Public metadata and encrypted secrets are stored separately. Supabase RLS scopes private records to owners, API routes apply rate limits, scheduled runs are protected with `CRON_SECRET`, and every execution must pass policy checks before an adapter can route action.

Never commit `.env` or private keys. Agent model keys and Telegram tokens belong to agent owners, not to the platform operator.

## License

Apache-2.0. See `LICENSE`.
