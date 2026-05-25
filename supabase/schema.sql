create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text not null,
  telegram_handle text,
  wallet_address text,
  role text not null default 'user',
  usdc_balance numeric(18, 6) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_role_check check (role in ('guest', 'user', 'admin'));

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text not null,
  avatar text not null,
  category text not null,
  ai_provider text not null default 'openrouter',
  model text not null,
  mode text not null,
  schedule text not null,
  confidence_threshold numeric(5, 4) not null,
  allowed_venues text[] not null,
  fee_percent numeric(6, 2) not null,
  visibility text not null,
  status text not null default 'active',
  instruction_prompt text not null,
  followers integer not null default 0,
  trust_score numeric(6, 2) not null default 50,
  roi numeric(8, 2) not null default 0,
  win_rate numeric(6, 2) not null default 0,
  fees_earned numeric(18, 6) not null default 0,
  total_executions integer not null default 0,
  erc8004_agent_id text,
  erc8004_registration_uri text,
  created_at timestamptz not null default now()
);

alter table public.agents
  add constraint agents_category_check check (category in ('Trading & Portfolio Optimization', 'Prediction & Betting', 'Yield', 'Market Intelligence & Analysis')),
  add constraint agents_mode_check check (mode in ('prompt-only', 'github-enhanced', 'external-tools', 'algorithmic')),
  add constraint agents_ai_provider_check check (ai_provider in ('openrouter', 'openai', 'anthropic', 'google', 'groq', 'deepseek', 'qwen', 'custom')),
  add constraint agents_schedule_check check (schedule in ('manual', '5m', '10m', 'hourly')),
  add constraint agents_visibility_check check (visibility in ('public', 'private', 'unlisted')),
  add constraint agents_status_check check (status in ('active', 'paused', 'archived')),
  add constraint agents_confidence_check check (confidence_threshold between 0.5 and 0.99),
  add constraint agents_fee_percent_check check (fee_percent >= 0 and fee_percent <= 30),
  add constraint agents_trust_score_check check (trust_score >= 0 and trust_score <= 100);

create table if not exists public.agent_secrets (
  agent_id uuid primary key references public.agents(id) on delete cascade,
  encrypted_model_key text,
  encrypted_telegram_token text,
  encrypted_github_pat text,
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_receipts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete cascade,
  kind text not null,
  registry text not null,
  chain_id integer not null default 5042002,
  tx_hash text,
  trace_ref text,
  verdict text,
  summary text not null,
  created_at timestamptz not null default now()
);

alter table public.agent_receipts
  add constraint agent_receipts_kind_check check (kind in ('identity', 'trace', 'verdict', 'reputation', 'validation')),
  add constraint agent_receipts_registry_check check (registry in ('identity', 'reputation', 'validation', 'signalarc')),
  add constraint agent_receipts_verdict_check check (verdict is null or verdict in ('passed', 'warning', 'failed', 'pending'));

create table if not exists public.external_agents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  provider text not null,
  endpoint text not null,
  auth_token_hash text not null,
  signature_key_hash text not null,
  capabilities text[] not null,
  metadata jsonb not null default '{}',
  connected_at timestamptz not null default now()
);

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete cascade,
  max_spend numeric(18, 6) not null,
  max_daily_spend numeric(18, 6) not null,
  max_per_trade numeric(18, 6) not null,
  market_categories text[] not null,
  stop_loss_percent numeric(6, 2) not null,
  expiry timestamptz not null,
  manual_review boolean not null default false,
  spent_today numeric(18, 6) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.policies
  add constraint policies_spend_check check (
    max_spend > 0 and max_daily_spend > 0 and max_per_trade > 0 and
    max_per_trade <= max_daily_spend and max_daily_spend <= max_spend
  ),
  add constraint policies_market_categories_check check (
    market_categories <@ array['Trading & Portfolio Optimization', 'Prediction & Betting', 'Yield', 'Market Intelligence & Analysis']::text[]
  ),
  add constraint policies_stop_loss_check check (stop_loss_percent >= 0 and stop_loss_percent <= 100);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete cascade,
  market_id text not null,
  venue text not null,
  action text not null,
  amount numeric(18, 6) not null,
  confidence numeric(5, 4) not null,
  rationale text not null,
  expiry timestamptz not null,
  signature text not null,
  title text not null,
  category text not null,
  expected_move numeric(8, 2) not null default 0,
  realized_move numeric(8, 2) not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.recommendations
  add constraint recommendations_venue_check check (venue in ('arc-prediction', 'arc-swap', 'arc-perps')),
  add constraint recommendations_category_check check (category in ('Trading & Portfolio Optimization', 'Prediction & Betting', 'Yield', 'Market Intelligence & Analysis')),
  add constraint recommendations_action_check check (action in ('BUY', 'SELL', 'HEDGE', 'LONG', 'SHORT', 'NOOP')),
  add constraint recommendations_confidence_check check (confidence between 0 and 1),
  add constraint recommendations_amount_check check (amount > 0),
  add constraint recommendations_status_check check (status in ('open', 'won', 'lost', 'settled'));

create table if not exists public.executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete cascade,
  recommendation_id uuid references public.recommendations(id) on delete cascade,
  venue text not null,
  action text not null,
  amount numeric(18, 6) not null,
  network_fee numeric(18, 6) not null default 0.01,
  fee_paid numeric(18, 6) not null,
  agent_fee numeric(18, 6) not null,
  status text not null,
  tx_hash text not null,
  pnl numeric(18, 6) not null default 0,
  policy_result text not null,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

alter table public.executions
  add constraint executions_status_check check (status in ('pending', 'policy_blocked', 'executed', 'settled', 'expired')),
  add constraint executions_policy_result_check check (policy_result in ('passed', 'manual_review', 'blocked')),
  add constraint executions_amount_check check (amount >= 0),
  add constraint executions_network_fee_check check (network_fee >= 0 and network_fee <= 0.01);

create table if not exists public.fee_flows (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid references public.executions(id) on delete cascade,
  payer_user_id uuid references public.profiles(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete cascade,
  gross_amount numeric(18, 6) not null,
  agent_fee numeric(18, 6) not null,
  platform_fee numeric(18, 6) not null,
  settled_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  title text not null,
  detail text not null,
  entity_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.api_rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.agent_secrets enable row level security;
alter table public.agent_receipts enable row level security;
alter table public.external_agents enable row level security;
alter table public.policies enable row level security;
alter table public.recommendations enable row level security;
alter table public.executions enable row level security;
alter table public.fee_flows enable row level security;
alter table public.activity_events enable row level security;
alter table public.api_rate_limits enable row level security;
alter table public.audit_events enable row level security;

create policy "public agents readable" on public.agents for select using (visibility = 'public' or owner_id = auth.uid());
create policy "owners manage agents" on public.agents for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners manage agent secrets" on public.agent_secrets for all
  using (exists (select 1 from public.agents where agents.id = agent_secrets.agent_id and agents.owner_id = auth.uid()))
  with check (exists (select 1 from public.agents where agents.id = agent_secrets.agent_id and agents.owner_id = auth.uid()));
create policy "public agent receipts readable" on public.agent_receipts for select using (true);
create policy "owners manage agent receipts" on public.agent_receipts for all
  using (exists (select 1 from public.agents where agents.id = agent_receipts.agent_id and agents.owner_id = auth.uid()))
  with check (exists (select 1 from public.agents where agents.id = agent_receipts.agent_id and agents.owner_id = auth.uid()));
create policy "profiles own row" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "public recommendations readable" on public.recommendations for select using (true);
create policy "public leaderboard activity readable" on public.activity_events for select using (true);
create policy "users own policies" on public.policies for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own executions" on public.executions for select using (user_id = auth.uid());
create policy "users own fee flows" on public.fee_flows for select using (payer_user_id = auth.uid());
create policy "owners manage external agents" on public.external_agents for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "admins view audit events" on public.audit_events for select
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create index if not exists agents_visibility_trust_idx on public.agents (visibility, trust_score desc);
create index if not exists agent_receipts_agent_created_idx on public.agent_receipts (agent_id, created_at desc);
create index if not exists recommendations_agent_created_idx on public.recommendations (agent_id, created_at desc);
create index if not exists executions_user_created_idx on public.executions (user_id, created_at desc);
create index if not exists activity_created_idx on public.activity_events (created_at desc);
