alter table public.agents drop constraint if exists agents_category_check;
alter table public.agents drop constraint if exists agents_mode_check;
alter table public.recommendations drop constraint if exists recommendations_category_check;
alter table public.policies drop constraint if exists policies_market_categories_check;

update public.agents
set category = case category
  when 'Prediction' then 'Prediction & Betting'
  when 'Events' then 'Prediction & Betting'
  when 'DEX' then 'Trading & Portfolio Optimization'
  when 'Perps' then 'Trading & Portfolio Optimization'
  when 'Macro' then 'Market Intelligence & Analysis'
  when 'Risk' then 'Market Intelligence & Analysis'
  else category
end
where category in ('Prediction', 'Macro', 'Events', 'DEX', 'Perps', 'Risk');

update public.recommendations
set category = case category
  when 'Prediction' then 'Prediction & Betting'
  when 'Events' then 'Prediction & Betting'
  when 'DEX' then 'Trading & Portfolio Optimization'
  when 'Perps' then 'Trading & Portfolio Optimization'
  when 'Macro' then 'Market Intelligence & Analysis'
  when 'Risk' then 'Market Intelligence & Analysis'
  else category
end
where category in ('Prediction', 'Macro', 'Events', 'DEX', 'Perps', 'Risk');

update public.policies
set market_categories = (
  select array_agg(distinct mapped_category)
  from (
    select case category
      when 'Prediction' then 'Prediction & Betting'
      when 'Events' then 'Prediction & Betting'
      when 'DEX' then 'Trading & Portfolio Optimization'
      when 'Perps' then 'Trading & Portfolio Optimization'
      when 'Macro' then 'Market Intelligence & Analysis'
      when 'Risk' then 'Market Intelligence & Analysis'
      else category
    end as mapped_category
    from unnest(market_categories) as category
  ) as mapped
)
where exists (
  select 1
  from unnest(market_categories) as category
  where category in ('Prediction', 'Macro', 'Events', 'DEX', 'Perps', 'Risk')
);

alter table public.agents
  add constraint agents_category_check check (category in (
    'Trading & Portfolio Optimization',
    'Prediction & Betting',
    'Yield',
    'Market Intelligence & Analysis'
  )),
  add constraint agents_mode_check check (mode in ('prompt-only', 'github-enhanced', 'external-tools', 'algorithmic'));

alter table public.recommendations
  add constraint recommendations_category_check check (category in (
    'Trading & Portfolio Optimization',
    'Prediction & Betting',
    'Yield',
    'Market Intelligence & Analysis'
  ));

alter table public.policies
  add constraint policies_market_categories_check check (
    market_categories <@ array[
      'Trading & Portfolio Optimization',
      'Prediction & Betting',
      'Yield',
      'Market Intelligence & Analysis'
    ]::text[]
  );
