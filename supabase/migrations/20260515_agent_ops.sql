alter table public.agents
  add column if not exists status text not null default 'active';

alter table public.agents
  drop constraint if exists agents_status_check;

alter table public.agents
  add constraint agents_status_check check (status in ('active', 'paused', 'archived'));

alter table public.agent_receipts
  add column if not exists trace_ref text;

update public.agent_receipts
set trace_ref = coalesce(trace_ref, trace_uri, ipfs_cid)
where trace_ref is null;

alter table public.agent_receipts
  drop column if exists trace_uri,
  drop column if exists ipfs_cid;
