-- ==============================================================================
-- KATALYST M15: Shared AI Gateway, Credits, BYOK, Admin Controls & Usage Ledger
-- ==============================================================================

-- 1. App Admins Table
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;
grant select on public.app_admins to authenticated;

drop policy if exists "app_admins_select_own" on public.app_admins;
create policy "app_admins_select_own" on public.app_admins
  for select to authenticated
  using ((select public.has_active_auth_session()) and user_id = (select auth.uid()));

-- Admin check helper
create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_active_auth_session() and exists (
    select 1 from public.app_admins as a
    where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_app_admin() from public, anon;
grant execute on function public.is_app_admin() to authenticated;

-- 2. System AI Configuration (Singleton id=1)
create table if not exists public.ai_system_config (
  id integer primary key default 1 check (id = 1),
  shared_ai_enabled boolean not null default true,
  kill_switch_active boolean not null default false,
  selected_model_id text not null default '@cf/meta/llama-3.3-70b-instruct',
  global_daily_threshold_credits integer not null default 100000,
  global_warning_threshold_credits integer not null default 80000,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.ai_system_config enable row level security;
revoke all on public.ai_system_config from anon, authenticated;
grant select on public.ai_system_config to anon, authenticated;

drop policy if exists "ai_system_config_select_all" on public.ai_system_config;
create policy "ai_system_config_select_all" on public.ai_system_config
  for select using (true);

-- 3. AI Model Configurations & Credit Weights
create table if not exists public.ai_model_config (
  model_id text primary key,
  enabled boolean not null default true,
  credit_weight numeric not null default 1.0 check (credit_weight > 0),
  token_cost_multiplier numeric not null default 1.0 check (token_cost_multiplier > 0),
  max_input_tokens integer not null default 4096 check (max_input_tokens > 0),
  max_output_tokens integer not null default 2048 check (max_output_tokens > 0),
  updated_at timestamptz not null default now()
);

alter table public.ai_model_config enable row level security;
revoke all on public.ai_model_config from anon, authenticated;
grant select on public.ai_model_config to anon, authenticated;

drop policy if exists "ai_model_config_select_all" on public.ai_model_config;
create policy "ai_model_config_select_all" on public.ai_model_config
  for select using (true);

-- 4. AI Credit Policies (Singleton id=1)
create table if not exists public.ai_credit_policies (
  id integer primary key default 1 check (id = 1),
  monthly_authenticated_credits integer not null default 1000 check (monthly_authenticated_credits >= 0),
  guest_trial_credits integer not null default 50 check (guest_trial_credits >= 0),
  max_input_characters integer not null default 44000 check (max_input_characters > 0),
  max_request_bytes integer not null default 192000 check (max_request_bytes > 0),
  user_requests_per_minute integer not null default 15 check (user_requests_per_minute > 0),
  guest_requests_per_minute integer not null default 6 check (guest_requests_per_minute > 0),
  updated_at timestamptz not null default now()
);

alter table public.ai_credit_policies enable row level security;
revoke all on public.ai_credit_policies from anon, authenticated;
grant select on public.ai_credit_policies to anon, authenticated;

drop policy if exists "ai_credit_policies_select_all" on public.ai_credit_policies;
create policy "ai_credit_policies_select_all" on public.ai_credit_policies
  for select using (true);

-- 5. Authenticated Monthly Credit Periods
create table if not exists public.ai_credit_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  credits_allocated integer not null check (credits_allocated >= 0),
  credits_used numeric not null default 0 check (credits_used >= 0),
  credits_reserved numeric not null default 0 check (credits_reserved >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_user_period unique (user_id, period_start)
);

create index if not exists idx_credit_periods_user_period on public.ai_credit_periods(user_id, period_start);

alter table public.ai_credit_periods enable row level security;
revoke all on public.ai_credit_periods from anon, authenticated;
grant select on public.ai_credit_periods to authenticated;

drop policy if exists "ai_credit_periods_select_own" on public.ai_credit_periods;
create policy "ai_credit_periods_select_own" on public.ai_credit_periods
  for select to authenticated
  using ((select public.has_active_auth_session()) and user_id = (select auth.uid()));

-- 6. Guest Sessions & Trial Tracking
create table if not exists public.ai_guest_sessions (
  guest_id text primary key check (guest_id ~ '^[0-9a-fA-F-]{32,64}$'),
  ip_hash text not null,
  trial_credits_allocated integer not null check (trial_credits_allocated >= 0),
  trial_credits_used numeric not null default 0 check (trial_credits_used >= 0),
  trial_credits_reserved numeric not null default 0 check (trial_credits_reserved >= 0),
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_guest_ip_hash on public.ai_guest_sessions(ip_hash);

alter table public.ai_guest_sessions enable row level security;
revoke all on public.ai_guest_sessions from anon, authenticated;

-- 7. Credit Reservations (In-Flight Mutex)
create table if not exists public.ai_credit_reservations (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  user_id uuid references auth.users(id) on delete cascade,
  guest_id text references public.ai_guest_sessions(guest_id) on delete cascade,
  model_id text not null,
  credits_reserved numeric not null check (credits_reserved > 0),
  status text not null check (status in ('reserved', 'settled', 'released', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reservations_user on public.ai_credit_reservations(user_id);
create index if not exists idx_reservations_guest on public.ai_credit_reservations(guest_id);

alter table public.ai_credit_reservations enable row level security;
revoke all on public.ai_credit_reservations from anon, authenticated;
grant select on public.ai_credit_reservations to authenticated;

drop policy if exists "ai_credit_reservations_select_own" on public.ai_credit_reservations;
create policy "ai_credit_reservations_select_own" on public.ai_credit_reservations
  for select to authenticated
  using ((select public.has_active_auth_session()) and user_id = (select auth.uid()));

-- 8. AI Usage Ledger (Permanent Accounting & Audit)
create table if not exists public.ai_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.ai_credit_reservations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  guest_id text,
  provider text not null default 'cloudflare',
  model_id text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  credits_deducted numeric not null default 0 check (credits_deducted >= 0),
  is_estimated boolean not null default false,
  outcome text not null check (outcome in ('success', 'failure', 'cancelled')),
  error_kind text,
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_user on public.ai_usage_ledger(user_id);
create index if not exists idx_usage_created on public.ai_usage_ledger(created_at);

alter table public.ai_usage_ledger enable row level security;
revoke all on public.ai_usage_ledger from anon, authenticated;
grant select on public.ai_usage_ledger to authenticated;

drop policy if exists "ai_usage_ledger_select_own" on public.ai_usage_ledger;
create policy "ai_usage_ledger_select_own" on public.ai_usage_ledger
  for select to authenticated
  using ((select public.has_active_auth_session()) and user_id = (select auth.uid()));

-- 9. Admin Audit Log
create table if not exists public.ai_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  action text not null,
  previous_state jsonb,
  new_state jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

alter table public.ai_admin_audit_log enable row level security;
revoke all on public.ai_admin_audit_log from anon, authenticated;

-- Seed Default Configurations
insert into public.ai_system_config (id, shared_ai_enabled, kill_switch_active, selected_model_id)
values (1, true, false, '@cf/meta/llama-3.3-70b-instruct')
on conflict (id) do nothing;

insert into public.ai_credit_policies (id, monthly_authenticated_credits, guest_trial_credits)
values (1, 1000, 50)
on conflict (id) do nothing;

insert into public.ai_model_config (model_id, enabled, credit_weight, token_cost_multiplier, max_input_tokens, max_output_tokens)
values 
  ('@cf/meta/llama-3.3-70b-instruct', true, 1.0, 1.0, 4096, 2048),
  ('@cf/meta/llama-3.1-8b-instruct', true, 0.5, 0.5, 4096, 2048),
  ('@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', true, 1.0, 1.0, 4096, 2048)
on conflict (model_id) do nothing;

-- ==============================================================================
-- Gateway Atomic Functions & Stored Procedures
-- ==============================================================================

-- Helper: Get or initialize active monthly credit period for a user
create or replace function public.get_or_create_user_credit_period(
  p_user_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns table (
  period_id uuid,
  credits_allocated integer,
  credits_used numeric,
  credits_reserved numeric,
  credits_available numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_default_allowance integer;
  v_row record;
begin
  select monthly_authenticated_credits into v_default_allowance
  from public.ai_credit_policies where id = 1;
  if v_default_allowance is null then
    v_default_allowance := 1000;
  end if;

  insert into public.ai_credit_periods (user_id, period_start, period_end, credits_allocated, credits_used, credits_reserved)
  values (p_user_id, p_period_start, p_period_end, v_default_allowance, 0, 0)
  on conflict (user_id, period_start) do nothing;

  select cp.id, cp.credits_allocated, cp.credits_used, cp.credits_reserved,
         (cp.credits_allocated - cp.credits_used - cp.credits_reserved) as credits_available
  into v_row
  from public.ai_credit_periods as cp
  where cp.user_id = p_user_id and cp.period_start = p_period_start;

  return query select v_row.id, v_row.credits_allocated, v_row.credits_used, v_row.credits_reserved, v_row.credits_available;
end;
$$;

revoke all on function public.get_or_create_user_credit_period(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.get_or_create_user_credit_period(uuid, timestamptz, timestamptz) to authenticated;

-- Helper: Get or initialize guest trial session
create or replace function public.get_or_create_guest_session(
  p_guest_id text,
  p_ip_hash text,
  p_expires_at timestamptz
)
returns table (
  session_guest_id text,
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
  select guest_trial_credits into v_default_trial
  from public.ai_credit_policies where id = 1;
  if v_default_trial is null then
    v_default_trial := 50;
  end if;

  insert into public.ai_guest_sessions (guest_id, ip_hash, trial_credits_allocated, trial_credits_used, trial_credits_reserved, expires_at)
  values (p_guest_id, p_ip_hash, v_default_trial, 0, 0, p_expires_at)
  on conflict (guest_id) do update set
    last_active_at = now();

  select gs.guest_id, gs.trial_credits_allocated, gs.trial_credits_used, gs.trial_credits_reserved,
         (gs.trial_credits_allocated - gs.trial_credits_used - gs.trial_credits_reserved) as trial_credits_available
  into v_row
  from public.ai_guest_sessions as gs
  where gs.guest_id = p_guest_id;

  return query select v_row.guest_id as session_guest_id, v_row.trial_credits_allocated, v_row.trial_credits_used, v_row.trial_credits_reserved, v_row.trial_credits_available;
end;
$$;

revoke all on function public.get_or_create_guest_session(text, text, timestamptz) from public, anon;
grant execute on function public.get_or_create_guest_session(text, text, timestamptz) to anon, authenticated;

-- Core: Reserve AI credits atomically before dispatching inference
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

revoke all on function public.reserve_ai_credits(text, text, numeric, text, uuid) from public, anon;
grant execute on function public.reserve_ai_credits(text, text, numeric, text, uuid) to anon, authenticated;

-- Core: Settle AI credits upon successful response
create or replace function public.settle_ai_credits(
  p_reservation_id uuid,
  p_input_tokens integer,
  p_output_tokens integer,
  p_actual_credits numeric,
  p_is_estimated boolean default false
)
returns table (
  status text,
  credits_settled numeric,
  credits_remaining numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_res record;
  v_period_start timestamptz;
  v_remaining numeric;
begin
  select r.id, r.user_id, r.guest_id, r.model_id, r.credits_reserved, r.status
  into v_res
  from public.ai_credit_reservations as r
  where r.id = p_reservation_id
  for update;

  if not found or v_res.status != 'reserved' then
    return query select 'invalid_reservation'::text, 0::numeric, 0::numeric;
    return;
  end if;

  if v_res.user_id is not null then
    v_period_start := date_trunc('month', now() at time zone 'utc') at time zone 'utc';

    update public.ai_credit_periods
    set credits_reserved = greatest(0, credits_reserved - v_res.credits_reserved),
        credits_used = credits_used + p_actual_credits,
        updated_at = now()
    where user_id = v_res.user_id and period_start = v_period_start;

    select (cp.credits_allocated - cp.credits_used - cp.credits_reserved) into v_remaining
    from public.ai_credit_periods as cp
    where cp.user_id = v_res.user_id and cp.period_start = v_period_start;

  elsif v_res.guest_id is not null then
    update public.ai_guest_sessions
    set trial_credits_reserved = greatest(0, trial_credits_reserved - v_res.credits_reserved),
        trial_credits_used = trial_credits_used + p_actual_credits,
        last_active_at = now()
    where guest_id = v_res.guest_id;

    select (gs.trial_credits_allocated - gs.trial_credits_used - gs.trial_credits_reserved) into v_remaining
    from public.ai_guest_sessions as gs
    where gs.guest_id = v_res.guest_id;
  end if;

  update public.ai_credit_reservations
  set status = 'settled', updated_at = now()
  where id = p_reservation_id;

  insert into public.ai_usage_ledger (reservation_id, user_id, guest_id, provider, model_id, input_tokens, output_tokens, credits_deducted, is_estimated, outcome)
  values (p_reservation_id, v_res.user_id, v_res.guest_id, 'cloudflare', v_res.model_id, p_input_tokens, p_output_tokens, p_actual_credits, p_is_estimated, 'success');

  return query select 'settled'::text, p_actual_credits, coalesce(v_remaining, 0::numeric);
end;
$$;

revoke all on function public.settle_ai_credits(uuid, integer, integer, numeric, boolean) from public, anon;
grant execute on function public.settle_ai_credits(uuid, integer, integer, numeric, boolean) to anon, authenticated;

-- Core: Release reservation on provider failure or cancellation
create or replace function public.release_ai_reservation(
  p_reservation_id uuid,
  p_outcome text,
  p_error_kind text default null
)
returns table (
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_res record;
  v_period_start timestamptz;
begin
  select r.id, r.user_id, r.guest_id, r.model_id, r.credits_reserved, r.status
  into v_res
  from public.ai_credit_reservations as r
  where r.id = p_reservation_id
  for update;

  if not found or v_res.status != 'reserved' then
    return query select 'already_finalized'::text;
    return;
  end if;

  if v_res.user_id is not null then
    v_period_start := date_trunc('month', now() at time zone 'utc') at time zone 'utc';

    update public.ai_credit_periods
    set credits_reserved = greatest(0, credits_reserved - v_res.credits_reserved),
        updated_at = now()
    where user_id = v_res.user_id and period_start = v_period_start;

  elsif v_res.guest_id is not null then
    update public.ai_guest_sessions
    set trial_credits_reserved = greatest(0, trial_credits_reserved - v_res.credits_reserved),
        last_active_at = now()
    where guest_id = v_res.guest_id;
  end if;

  update public.ai_credit_reservations
  set status = 'released', updated_at = now()
  where id = p_reservation_id;

  insert into public.ai_usage_ledger (reservation_id, user_id, guest_id, provider, model_id, input_tokens, output_tokens, credits_deducted, is_estimated, outcome, error_kind)
  values (p_reservation_id, v_res.user_id, v_res.guest_id, 'cloudflare', v_res.model_id, 0, 0, 0, false, p_outcome, p_error_kind);

  return query select 'released'::text;
end;
$$;

revoke all on function public.release_ai_reservation(uuid, text, text) from public, anon;
grant execute on function public.release_ai_reservation(uuid, text, text) to anon, authenticated;
