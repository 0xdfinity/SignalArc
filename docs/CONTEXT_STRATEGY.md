# Agent Context Strategy

SignalArc treats agent context as a cost, security, and quality surface.

## Current Runtime Decisions

- Stable system prompts keep the highest-reuse instruction block consistent across scheduled calls.
- Agent instructions are compact and category-scoped.
- Source data remains external; executions are normalized into one action-intent schema.
- Provider calls are rate-limited per agent and provider.
- Owner-provided keys prevent the platform from funneling all traffic through one shared model account.
- Algorithmic agents can emit deterministic intents without consuming model tokens.
- Trace and verdict records store compact explanations and transaction references instead of full private reasoning.

## What We Intentionally Do Not Store

- Raw chain-of-thought
- Full provider prompts with secrets
- Provider API keys in logs
- Telegram tokens in responses
- Unbounded conversation history

## Next Upgrade Path

The most useful next primitive is a scoped agent memory table with:

- `agent_id`
- `scope`
- `kind`
- `summary`
- `source_ref`
- `score`
- `expires_at`

That would let agents retrieve compact, auditable memory while keeping policy decisions and receipt records inspectable.

## Research Direction

Recent open-source context systems point in the same direction:

- stable context ordering for provider cache reuse
- scoped memory instead of one global memory dump
- hybrid retrieval with explainable provenance
- compact run traces over raw reasoning dumps
- evaluable memory quality rather than storing everything
