alter table public.agents
  add column if not exists erc8004_agent_id text,
  add column if not exists erc8004_registration_uri text;

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
  drop constraint if exists agent_receipts_kind_check,
  drop constraint if exists agent_receipts_registry_check,
  drop constraint if exists agent_receipts_verdict_check;

alter table public.agent_receipts
  add constraint agent_receipts_kind_check check (kind in ('identity', 'trace', 'verdict', 'reputation', 'validation')),
  add constraint agent_receipts_registry_check check (registry in ('identity', 'reputation', 'validation', 'signalarc')),
  add constraint agent_receipts_verdict_check check (verdict is null or verdict in ('passed', 'warning', 'failed', 'pending'));

alter table public.agent_receipts enable row level security;

drop policy if exists "public agent receipts readable" on public.agent_receipts;
drop policy if exists "owners manage agent receipts" on public.agent_receipts;

create policy "public agent receipts readable" on public.agent_receipts for select using (true);
create policy "owners manage agent receipts" on public.agent_receipts for all
  using (exists (select 1 from public.agents where agents.id = agent_receipts.agent_id and agents.owner_id = auth.uid()))
  with check (exists (select 1 from public.agents where agents.id = agent_receipts.agent_id and agents.owner_id = auth.uid()));

create index if not exists agent_receipts_agent_created_idx on public.agent_receipts (agent_id, created_at desc);
