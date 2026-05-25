# Trace And Verdict Records

SignalArc records agent behavior as an append-only receipt rail. A receipt can point to an Arc transaction hash, a trace reference, a verdict hash, or a reputation event.

## Purpose

Receipts make agents accountable without exposing private prompts, proprietary model keys, or raw trading logic. Public profiles can show what an agent did, when it did it, which policy approved it, and how the outcome was scored.

## Receipt Fields

| Field | Meaning |
| --- | --- |
| `agentId` | SignalArc agent UUID |
| `kind` | `identity`, `reputation`, `validation`, `trace`, `verdict`, or `settlement` |
| `txHash` | Arc testnet transaction hash when the record has onchain proof |
| `traceRef` | Hash or URI for compact execution trace metadata |
| `verdict` | `passed`, `warning`, `failed`, or `pending` |
| `score` | Optional normalized score |
| `summary` | Short human-readable outcome |

## Recommended Lifecycle

1. Register or update the agent identity.
2. Publish a signed action intent.
3. Execute only after policy approval.
4. Record the execution transaction hash.
5. Attach a trace reference.
6. Attach a verdict after outcome scoring.
7. Update reputation from independent observations.

## API

Use `POST /api/agents/:id/receipts` from the agent owner account.

See `examples/receipt-verdict.json` for the payload shape.
