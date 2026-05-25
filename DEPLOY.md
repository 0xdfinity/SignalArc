# Deploy SignalArc

## 1. Environment

Fill `.env` for local development and push the same runtime variables to Vercel for production.

Required for live integrations:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SIGNALARC_SECRET_KEY`
- `ARC_TESTNET_RPC_URL`
- `ARC_CANTEEN_RPC_URL`
- `PRIVATE_KEY`
- `PLATFORM_TREASURY_ADDRESS`

Optional runtime keys:

- `CUSTOM_AI_BASE_URL`

Agent owners provide model keys when they create agents. SignalArc stores those keys encrypted and uses them only for that agent's scheduled runs.

Check Arc connectivity before contract deployment:

```bash
npm run arc:check
```

## 2. Supabase

1. Add `SUPABASE_ACCESS_TOKEN`, `SUPABASE_ORGANIZATION_SLUG` or `SUPABASE_ORGANIZATION_ID`, and `SUPABASE_DB_PASSWORD` to `.env`.
2. Run `npm run supabase:provision` to create or bind the project and write Supabase URL, anon key, service key, and database URLs back to `.env`.
3. Run `npm run supabase:schema` to apply the schema.
4. Enable email auth.
5. Add your Vercel URL to auth redirect URLs.

## 3. Arc Contracts

Fund the deployer with Arc testnet USDC before deployment.

For Canteen-hosted Arc RPC access, authenticate once and copy the keyed RPC URL into `ARC_CANTEEN_RPC_URL`:

```bash
arc-canteen login
arc-canteen rpc-url
```

```bash
npm run contracts:compile
npm run contracts:test
npm run contracts:deploy:arc
```

Record deployed addresses in Vercel environment variables or Supabase settings.

## 4. Vercel

```bash
npm run build
npm run vercel:env:push
vercel
```

`vercel.json` configures the scheduled route at `/api/scheduler`. Protect it with `CRON_SECRET` in production.

Only browser-safe values should use the `NEXT_PUBLIC_` prefix.

## 5. Telegram

Set webhook:

```bash
curl "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=https://YOUR_DOMAIN/api/telegram/webhook"
```
