-- Shared configuration is read through server APIs; browser roles do not need
-- direct access to the selected Kat model or server credit policies.
revoke all on public.ai_system_config, public.ai_model_config, public.ai_credit_policies from anon, authenticated;
drop policy if exists "ai_system_config_select_all" on public.ai_system_config;
drop policy if exists "ai_model_config_select_all" on public.ai_model_config;
drop policy if exists "ai_credit_policies_select_all" on public.ai_credit_policies;

-- Guest identities are validated by the server's HMAC cookie before use. Do not
-- allow public RPC calls to manufacture persistent trial rows directly.
create or replace function public.get_or_create_guest_session(
  p_guest_id text,
  p_ip_hash text,
  p_expires_at timestamptz
)
returns table (
  guest_id text,
  trial_credits_allocated integer,
  trial_credits_used numeric,
  trial_credits_reserved numeric,
  trial_credits_available numeric
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_default_trial integer;
  v_row record;
begin
  -- Expired guest trial records are ignored for reuse and pruned in small
  -- batches on normal guest initialization requests.
  with expired as (
    select guest_id
    from public.ai_guest_sessions
    where expires_at <= now()
    order by expires_at
    limit 250
  )
  delete from public.ai_guest_sessions as sessions
  using expired
  where sessions.guest_id = expired.guest_id;

  select guest_trial_credits into v_default_trial
  from public.ai_credit_policies where id = 1;
  if v_default_trial is null then v_default_trial := 50; end if;

  insert into public.ai_guest_sessions (guest_id, ip_hash, trial_credits_allocated, trial_credits_used, trial_credits_reserved, expires_at)
  values (p_guest_id, p_ip_hash, v_default_trial, 0, 0, p_expires_at)
  on conflict (guest_id) do update set last_active_at = now();

  select gs.guest_id, gs.trial_credits_allocated, gs.trial_credits_used, gs.trial_credits_reserved,
         (gs.trial_credits_allocated - gs.trial_credits_used - gs.trial_credits_reserved) as trial_credits_available
  into v_row
  from public.ai_guest_sessions as gs
  where gs.guest_id = p_guest_id;

  return query select v_row.guest_id, v_row.trial_credits_allocated, v_row.trial_credits_used, v_row.trial_credits_reserved, v_row.trial_credits_available;
end;
$$;

revoke all on function public.get_or_create_guest_session(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.get_or_create_guest_session(text, text, timestamptz) to service_role;

-- The live database had a stale four-argument reservation RPC. Replace it
-- atomically with the current server API so authenticated-user reservations
-- receive the explicitly verified user ID from the trusted server route.
drop function if exists public.reserve_ai_credits(text, text, numeric, text);

create or replace function public.reserve_ai_credits(
  p_idempotency_key text,
  p_model_id text,
  p_estimated_credits numeric,
  p_guest_id text default null,
  p_user_id uuid default null
)
returns table (
  status text,
  reservation_id uuid,
  credits_reserved numeric,
  credits_remaining numeric,
  error_message text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := coalesce(p_user_id, auth.uid());
  v_sys_config record;
  v_period record;
  v_guest record;
  v_reservation_id uuid;
  v_existing_reserved numeric;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_available numeric;
begin
  -- 1. Check Kill-switch & System enablement
  select shared_ai_enabled, kill_switch_active into v_sys_config
  from public.ai_system_config where id = 1;

  if v_sys_config.kill_switch_active then
    return query select 'error'::text, null::uuid, 0::numeric, 0::numeric, 'KATALYST AI is temporarily paused for maintenance.'::text;
    return;
  end if;
  if not v_sys_config.shared_ai_enabled then
    return query select 'error'::text, null::uuid, 0::numeric, 0::numeric, 'Shared KATALYST AI inference is currently disabled.'::text;
    return;
  end if;

  -- 2. Idempotency Check
  select r.id, r.credits_reserved into v_reservation_id, v_existing_reserved
  from public.ai_credit_reservations as r where r.idempotency_key = p_idempotency_key;
  if found then
    return query select 'idempotent'::text, v_reservation_id, v_existing_reserved, 0::numeric, null::text;
    return;
  end if;

  -- 3. Authenticated User Flow
  if v_user_id is not null and (p_user_id is not null or public.has_active_auth_session()) then
    v_period_start := date_trunc('month', now() at time zone 'utc') at time zone 'utc';
    v_period_end := (date_trunc('month', now() at time zone 'utc') + interval '1 month') at time zone 'utc';

    -- Ensure period exists
    perform public.get_or_create_user_credit_period(v_user_id, v_period_start, v_period_end);

    -- Row Lock with FOR UPDATE to prevent race-condition overspending
    select cp.id, cp.credits_allocated, cp.credits_used, cp.credits_reserved
    into v_period
    from public.ai_credit_periods as cp
    where cp.user_id = v_user_id and cp.period_start = v_period_start
    for update;

    v_available := v_period.credits_allocated - v_period.credits_used - v_period.credits_reserved;

    if v_available < p_estimated_credits then
      return query select 'quota_exhausted'::text, null::uuid, 0::numeric, v_available,
        'Your monthly KATALYST shared AI credit allowance has been exhausted for this period.'::text;
      return;
    end if;

    -- Reserve atomically
    update public.ai_credit_periods
    set credits_reserved = credits_reserved + p_estimated_credits, updated_at = now()
    where id = v_period.id;

    insert into public.ai_credit_reservations (idempotency_key, user_id, guest_id, model_id, credits_reserved, status)
    values (p_idempotency_key, v_user_id, null, p_model_id, p_estimated_credits, 'reserved')
    returning id into v_reservation_id;

    return query select 'reserved'::text, v_reservation_id, p_estimated_credits, (v_available - p_estimated_credits), null::text;
    return;

  -- 4. Guest Flow
  elsif p_guest_id is not null then
    select gs.guest_id, gs.trial_credits_allocated, gs.trial_credits_used, gs.trial_credits_reserved, gs.expires_at
    into v_guest
    from public.ai_guest_sessions as gs
    where gs.guest_id = p_guest_id
    for update;

    if not found or v_guest.expires_at < now() then
      return query select 'error'::text, null::uuid, 0::numeric, 0::numeric, 'Guest session not found or expired.'::text;
      return;
    end if;

    v_available := v_guest.trial_credits_allocated - v_guest.trial_credits_used - v_guest.trial_credits_reserved;

    if v_available < p_estimated_credits then
      return query select 'guest_trial_exhausted'::text, null::uuid, 0::numeric, v_available,
        'Guest trial exhausted. Sign in with Google to continue using KATALYST shared AI.'::text;
      return;
    end if;

    -- Reserve atomically
    update public.ai_guest_sessions
    set trial_credits_reserved = trial_credits_reserved + p_estimated_credits, last_active_at = now()
    where guest_id = p_guest_id;

    insert into public.ai_credit_reservations (idempotency_key, user_id, guest_id, model_id, credits_reserved, status)
    values (p_idempotency_key, null, p_guest_id, p_model_id, p_estimated_credits, 'reserved')
    returning id into v_reservation_id;

    return query select 'reserved'::text, v_reservation_id, p_estimated_credits, (v_available - p_estimated_credits), null::text;
    return;

  else
    return query select 'error'::text, null::uuid, 0::numeric, 0::numeric, 'Authentication or valid guest session required.'::text;
    return;
  end if;
end;
$$;

-- Credit and profile RPCs are server-owned. The application calls the credit
-- functions with its service-role client; browser roles must not be able to
-- allocate, settle, or release credits directly. Trigger execution for profile
-- creation continues to work after removing direct RPC privileges.
revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;
revoke all on function public.get_or_create_user_credit_period(uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.reserve_ai_credits(text, text, numeric, text, uuid) from public, anon, authenticated;
revoke all on function public.settle_ai_credits(uuid, integer, integer, numeric, boolean) from public, anon, authenticated;
revoke all on function public.release_ai_reservation(uuid, text, text) from public, anon, authenticated;

grant execute on function public.get_or_create_user_credit_period(uuid, timestamptz, timestamptz) to service_role;
grant execute on function public.reserve_ai_credits(text, text, numeric, text, uuid) to service_role;
grant execute on function public.settle_ai_credits(uuid, integer, integer, numeric, boolean) to service_role;
grant execute on function public.release_ai_reservation(uuid, text, text) to service_role;
