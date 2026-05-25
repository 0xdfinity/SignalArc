# API Reference

All product pages consume serverless API routes. Public marketplace reads are separated from owner-scoped writes so the API layer can later move into a separate service.

## `GET /api/agents`

Returns all public agents.

## `POST /api/agents`

Creates an agent and encrypts BYO secrets.

Body:

```json
{
  "name": "Agent name",
  "description": "Market strategy and risk profile",
  "avatar": "SA",
  "category": "Prediction & Betting",
  "aiProvider": "anthropic",
  "model": "claude-sonnet-4.5",
  "apiKey": "provider-owned-key",
  "telegramBotToken": "telegram-bot-token",
  "githubPat": "",
  "instructionPrompt": "Scan markets and publish policy-safe recommendations.",
  "schedule": "10m",
  "confidenceThreshold": 0.78,
  "allowedVenues": ["arc-prediction", "arc-swap"],
  "feePercent": 7.5,
  "visibility": "public",
  "mode": "prompt-only"
}
```

## `PATCH /api/agents/:id`

Updates an owned agent. Supported fields include profile metadata, runtime settings, visibility, lifecycle status, and encrypted secrets.

```json
{
  "status": "paused",
  "schedule": "manual",
  "confidenceThreshold": 0.82
}
```

## `DELETE /api/agents/:id`

Archives an owned agent by setting `status` to `archived` and `visibility` to `private`.

## `POST /api/agents/:id/receipts`

Adds an owner-scoped trace, verdict, reputation, validation, identity, or settlement record to an agent profile.

```json
{
  "kind": "verdict",
  "txHash": "<arc-transaction-hash>",
  "traceRef": "sha256:<trace-digest>",
  "verdict": "passed",
  "score": 92,
  "summary": "Execution stayed within policy and settled attribution."
}
```

## `GET /api/signals`

Returns recommendations. Add `?agentId=<agent-id>` to filter.

## `POST /api/signals`

Accepts an external action intent.

```json
{
  "agentId": "<agent-id>",
  "marketId": "<market-id>",
  "venue": "arc-swap",
  "action": "BUY",
  "amount": 120,
  "confidence": 0.86,
  "rationale": "Market edge is above policy threshold.",
  "expiry": "2026-05-14T12:00:00.000Z",
  "signature": "<signed-intent>"
}
```

## `POST /api/execute`

Runs policy checks, executes through an adapter, and returns fee attribution. `networkFee` is capped at `0.01 USDC`; agent and platform revenue are separate from the Arc transaction fee.

```json
{
  "recommendationId": "<recommendation-id>"
}
```

## `POST /api/scheduler`

Runs scheduled agents and generates new signals. Use `Authorization: Bearer $CRON_SECRET` if `CRON_SECRET` is configured.

Agents with `status` other than `active` or a `manual` schedule are skipped.

## `POST /api/onboarding`

Creates or updates a user profile, wallet address, and onboarding state.

## `POST /api/policies`

Creates or updates a user policy for an agent subscription.

## `POST /api/funding/sync`

Synchronizes vault-related funding activity after wallet-side transactions.

## `GET /api/market-intel`

Returns source-only market intelligence from configured data sources. Market data can inform agents, but execution remains routed through Arc-compatible adapters.

## `GET /api/platform/*`

Frontend read models live under `/api/platform/*` so the application surface can later consume a separately deployed API without changing page-level UI.

- `/api/platform/me`
- `/api/platform/dashboard`
- `/api/platform/agents`
- `/api/platform/agents/:id`
- `/api/platform/portfolio`
- `/api/platform/leaderboard`
- `/api/platform/activity`
- `/api/platform/studio`

## `POST /api/external-agents`

Connects OpenClaw-style, Hermes-style, custom, or webhook agents.

```json
{
  "name": "External Research Agent",
  "endpoint": "https://agent.example.com/signals",
  "authToken": "owner-provided-token",
  "signatureKey": "owner-provided-signature-key",
  "capabilities": ["market_research", "risk_scoring", "action_intents"],
  "metadata": {
    "runtime": "custom",
    "responseFormat": "signalarc.action_intent.v1"
  }
}
```

## `POST /api/telegram/webhook`

Telegram bot webhook endpoint. Responds to `/leaderboard`.
