-- Shared AI burst limits must be consistent across serverless instances.
-- Keys are SHA-256 digests of server-verified user or guest identities.
create table if not exists public.ai_request_rate_limits (
  identifier_hash text primary key check (identifier_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  requests_used integer not null check (requests_used >= 0),
  updated_at timestamptz not null default clock_timestamp()
);
create index if not exists ai_request_rate_limits_updated_at_idx
  on public.ai_request_rate_limits(updated_at);

alter table public.ai_request_rate_limits enable row level security;
revoke all on table public.ai_request_rate_limits from public, anon, authenticated;

create or replace function public.consume_ai_request_rate_limit(
  p_identifier_hash text,
  p_max_requests integer,
  p_window_seconds integer default 60
)
returns table (allowed boolean, retry_after_seconds integer, requests_used integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_started_at timestamptz;
  v_requests_used integer;
begin
  if p_identifier_hash is null or p_identifier_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid rate-limit identifier';
  end if;
  if p_max_requests < 1 or p_max_requests > 120 or p_window_seconds < 1 or p_window_seconds > 3600 then
    raise exception 'Invalid rate-limit window';
  end if;

  -- Opportunistically prune a bounded batch of identities inactive for 30 days.
  if mod(hashtext(p_identifier_hash), 64) = 0 then
    with expired as (
      select identifier_hash
      from public.ai_request_rate_limits
      where updated_at < clock_timestamp() - interval '30 days'
      order by updated_at
      limit 500
    )
    delete from public.ai_request_rate_limits as stale
    using expired
    where stale.identifier_hash = expired.identifier_hash;
  end if;

  insert into public.ai_request_rate_limits as current_limit
    (identifier_hash, window_started_at, requests_used, updated_at)
  values (p_identifier_hash, clock_timestamp(), 1, clock_timestamp())
  on conflict (identifier_hash) do update
  set window_started_at = case
        when current_limit.window_started_at <= clock_timestamp() - make_interval(secs => p_window_seconds)
          then clock_timestamp()
        else current_limit.window_started_at
      end,
      requests_used = case
        when current_limit.window_started_at <= clock_timestamp() - make_interval(secs => p_window_seconds)
          then 1
        else current_limit.requests_used + 1
      end,
      updated_at = clock_timestamp()
  returning current_limit.window_started_at, current_limit.requests_used
    into v_window_started_at, v_requests_used;

  return query
    select
      v_requests_used <= p_max_requests,
      case
        when v_requests_used <= p_max_requests then 0
        else greatest(1, ceil(extract(epoch from (v_window_started_at + make_interval(secs => p_window_seconds) - clock_timestamp())))::integer)
      end,
      v_requests_used;
end;
$$;

revoke all on function public.consume_ai_request_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_request_rate_limit(text, integer, integer) to service_role;
