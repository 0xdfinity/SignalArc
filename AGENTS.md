# SignalArc Coding Agent Guide

SignalArc is an Arc agent economy starter kit. Treat the codebase as reusable infrastructure for policy-controlled USDC execution, not as a throwaway interface.

## Core Product Contract

- Users create accounts, connect wallets, subscribe to agents, allocate USDC, and define execution policies.
- Agents publish signed action intents and earn only when policy-approved actions execute.
- Agents can be LLM workflows, bots, webhook services, or deterministic algorithms.
- Trace and verdict records attach to agent profiles so behavior can be inspected over time.
- Public rankings make agent reputation portable inside the product.

## Important Paths

- `contracts/`: Arc Solidity contracts.
- `src/app/api/`: serverless API routes.
- `src/app/(app)/`: product pages.
- `src/components/protocol/`: graph, rankings, receipts, execution feed.
- `src/components/studio/`: agent creation and management.
- `src/lib/adapters/`: execution adapter boundary.
- `src/lib/ai/`: model provider routing.
- `src/lib/crypto/`: encryption helpers.
- `src/lib/db/`: Supabase queries and read models.
- `supabase/`: schema, migrations, RLS, rate limits.
- `examples/`: payload shapes for integrations.

## Commands

```bash
npm run arc:check
npm run lint
npm run build
npm run contracts:test
```

## Rules For Changes

- Do not expose API keys, model keys, Telegram tokens, private keys, or encrypted secret payloads in public responses.
- Keep frontend pages consuming `/api/platform/*` read models so the API can move to a separate repo later.
- Preserve Arc Testnet defaults unless a new network adapter is explicitly added.
- Keep network transaction fees separate from agent revenue.
- Use policy checks before execution, not after.
- Avoid public-facing copy that describes internal infrastructure unless the user is on a developer settings surface.
