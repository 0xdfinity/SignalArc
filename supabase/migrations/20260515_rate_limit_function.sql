create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.api_rate_limits%rowtype;
  window_end timestamptz;
begin
  if p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'Invalid rate limit arguments';
  end if;

  select * into current_row
  from public.api_rate_limits
  where key = p_key
  for update;

  if not found then
    insert into public.api_rate_limits (key, window_start, count, updated_at)
    values (p_key, now(), 1, now());

    allowed := true;
    remaining := greatest(p_limit - 1, 0);
    reset_at := now() + make_interval(secs => p_window_seconds);
    return next;
    return;
  end if;

  window_end := current_row.window_start + make_interval(secs => p_window_seconds);

  if window_end <= now() then
    update public.api_rate_limits
    set window_start = now(), count = 1, updated_at = now()
    where key = p_key;

    allowed := true;
    remaining := greatest(p_limit - 1, 0);
    reset_at := now() + make_interval(secs => p_window_seconds);
    return next;
    return;
  end if;

  if current_row.count < p_limit then
    update public.api_rate_limits
    set count = count + 1, updated_at = now()
    where key = p_key;

    allowed := true;
    remaining := greatest(p_limit - current_row.count - 1, 0);
    reset_at := window_end;
    return next;
    return;
  end if;

  allowed := false;
  remaining := 0;
  reset_at := window_end;
  return next;
end;
$$;
