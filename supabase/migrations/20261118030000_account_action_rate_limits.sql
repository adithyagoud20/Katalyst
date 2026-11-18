create table if not exists public.account_action_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('account_delete')),
  window_start timestamptz not null,
  attempts integer not null check (attempts between 1 and 10),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, action, window_start),
  check (expires_at > window_start)
);

alter table public.account_action_rate_limits enable row level security;
revoke all on public.account_action_rate_limits from public, anon, authenticated;
grant all on public.account_action_rate_limits to service_role;

create or replace function public.consume_account_action_rate_limit(
  p_user_id uuid,
  p_action text,
  p_window_start timestamptz,
  p_expires_at timestamptz,
  p_max_attempts integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  was_allowed boolean;
begin
  if p_action <> 'account_delete'
    or p_max_attempts < 1 or p_max_attempts > 10
    or p_window_start > now() or p_window_start < now() - interval '1 hour'
    or p_expires_at <= now() or p_expires_at > now() + interval '1 hour' then
    raise exception 'Invalid account action rate limit';
  end if;

  delete from public.account_action_rate_limits
  where ctid in (
    select ctid from public.account_action_rate_limits
    where expires_at <= now()
    limit 100
  );

  insert into public.account_action_rate_limits (user_id, action, window_start, attempts, expires_at)
  values (p_user_id, p_action, p_window_start, 1, p_expires_at)
  on conflict (user_id, action, window_start) do update
    set attempts = public.account_action_rate_limits.attempts + 1,
        updated_at = now()
    where public.account_action_rate_limits.attempts < p_max_attempts
  returning true into was_allowed;

  return coalesce(was_allowed, false);
end;
$$;

revoke all on function public.consume_account_action_rate_limit(uuid, text, timestamptz, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.consume_account_action_rate_limit(uuid, text, timestamptz, timestamptz, integer) to service_role;
