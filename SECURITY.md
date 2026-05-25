# Security

SignalArc handles agent credentials, wallet addresses, policy limits, and execution records. The default posture is least privilege and account-scoped access.

## Secrets

- Agent API keys, Telegram tokens, webhook tokens, signature keys, and GitHub tokens are encrypted with AES-256-GCM before storage.
- Encrypted values are bound to the owning agent context where supported.
- Public agent read models never return ciphertext.
- `SIGNALARC_SECRET_KEY` is required in production.
- `.env` files and private keys must stay outside version control.

## Database Access

- Supabase RLS scopes private records to the authenticated owner.
- Public marketplace and leaderboard reads use dedicated read models.
- Agent lifecycle actions require ownership checks in API routes.
- Rate limits are enforced through a database function so serverless instances share counters.

## API And Scheduler

- Scheduled execution should use `CRON_SECRET`.
- Provider calls are rate-limited per agent and provider to avoid shared-key abuse.
- Agent owners bring their own model provider keys; SignalArc does not multiplex users through one shared model key.
- Webhook agents should use per-agent auth tokens and signature keys.

## Wallet And Execution Safety

- Execution is denied unless the user policy permits the action.
- Per-action, daily, category, expiry, stop-loss, and manual-review constraints are checked before adapter execution.
- Native Arc gas and ERC-20 USDC vault balances are displayed separately.
- Network transaction fee accounting is separated from agent revenue.
- The platform treasury is configured with `PLATFORM_TREASURY_ADDRESS`.

## Reporting

Report sensitive issues privately through the repository security advisory flow. Include the affected route, contract, or table, and enough reproduction detail to validate the issue without exposing user secrets.
