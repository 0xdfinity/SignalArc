update public.agents
set allowed_venues = array_replace(array_replace(array_replace(allowed_venues, 'mock-prediction', 'arc-prediction'), 'mock-dex', 'arc-swap'), 'mock-perps', 'arc-perps')
where allowed_venues && array['mock-prediction', 'mock-dex', 'mock-perps'];

update public.recommendations
set venue = case venue
  when 'mock-prediction' then 'arc-prediction'
  when 'mock-dex' then 'arc-swap'
  when 'mock-perps' then 'arc-perps'
  else venue
end
where venue in ('mock-prediction', 'mock-dex', 'mock-perps');

update public.executions
set venue = case venue
  when 'mock-prediction' then 'arc-prediction'
  when 'mock-dex' then 'arc-swap'
  when 'mock-perps' then 'arc-perps'
  else venue
end
where venue in ('mock-prediction', 'mock-dex', 'mock-perps');

alter table public.recommendations
  drop constraint if exists recommendations_venue_check;

alter table public.recommendations
  add constraint recommendations_venue_check check (venue in ('arc-prediction', 'arc-swap', 'arc-perps'));
