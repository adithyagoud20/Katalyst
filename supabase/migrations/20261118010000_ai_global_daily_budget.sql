create table if not exists public.ai_global_daily_budgets (
  usage_date date primary key,
  credits_used numeric not null default 0 check (credits_used >= 0),
  credits_reserved numeric not null default 0 check (credits_reserved >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_global_daily_reservations (
  reservation_id uuid primary key,
  usage_date date not null references public.ai_global_daily_budgets(usage_date) on delete cascade,
  credits_reserved numeric not null check (credits_reserved > 0),
  status text not null check (status in ('reserved', 'settled', 'released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_global_daily_budgets enable row level security;
alter table public.ai_global_daily_reservations enable row level security;
revoke all on public.ai_global_daily_budgets, public.ai_global_daily_reservations from public, anon, authenticated;
grant all on public.ai_global_daily_budgets, public.ai_global_daily_reservations to service_role;

create or replace function public.reserve_ai_global_daily_budget(
  p_reservation_id uuid,
  p_usage_date date,
  p_reserve_credits numeric,
  p_daily_limit_credits numeric
)
returns table (allowed boolean, credits_used numeric, credits_reserved numeric)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_reserve_credits <= 0 or p_daily_limit_credits <= 0 then
    raise exception 'Invalid shared AI budget values';
  end if;

  insert into public.ai_global_daily_budgets (usage_date)
  values (p_usage_date)
  on conflict (usage_date) do nothing;

  return query
    update public.ai_global_daily_budgets as b
    set credits_reserved = b.credits_reserved + p_reserve_credits,
        updated_at = now()
    where b.usage_date = p_usage_date
      and b.credits_used + b.credits_reserved + p_reserve_credits <= p_daily_limit_credits
    returning true, b.credits_used, b.credits_reserved;

  if not found then
    return query
      select false, b.credits_used, b.credits_reserved
      from public.ai_global_daily_budgets as b
      where b.usage_date = p_usage_date;
    return;
  end if;

  insert into public.ai_global_daily_reservations (reservation_id, usage_date, credits_reserved, status)
  values (p_reservation_id, p_usage_date, p_reserve_credits, 'reserved');
end;
$$;

create or replace function public.release_ai_global_daily_budget(p_reservation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservation public.ai_global_daily_reservations%rowtype;
begin
  select * into reservation
  from public.ai_global_daily_reservations
  where reservation_id = p_reservation_id and status = 'reserved'
  for update;
  if not found then return false; end if;

  update public.ai_global_daily_budgets
  set credits_reserved = greatest(0, credits_reserved - reservation.credits_reserved), updated_at = now()
  where usage_date = reservation.usage_date;
  update public.ai_global_daily_reservations
  set status = 'released', updated_at = now()
  where reservation_id = p_reservation_id;
  return true;
end;
$$;

create or replace function public.settle_ai_global_daily_budget(p_reservation_id uuid, p_actual_credits numeric)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservation public.ai_global_daily_reservations%rowtype;
begin
  if p_actual_credits < 0 then raise exception 'Invalid shared AI settlement'; end if;
  select * into reservation
  from public.ai_global_daily_reservations
  where reservation_id = p_reservation_id and status = 'reserved'
  for update;
  if not found then return false; end if;

  update public.ai_global_daily_budgets
  set credits_reserved = greatest(0, credits_reserved - reservation.credits_reserved),
      credits_used = credits_used + p_actual_credits,
      updated_at = now()
  where usage_date = reservation.usage_date;
  update public.ai_global_daily_reservations
  set status = 'settled', updated_at = now()
  where reservation_id = p_reservation_id;
  return true;
end;
$$;

revoke all on function public.reserve_ai_global_daily_budget(uuid, date, numeric, numeric) from public, anon, authenticated;
revoke all on function public.release_ai_global_daily_budget(uuid) from public, anon, authenticated;
revoke all on function public.settle_ai_global_daily_budget(uuid, numeric) from public, anon, authenticated;
grant execute on function public.reserve_ai_global_daily_budget(uuid, date, numeric, numeric) to service_role;
grant execute on function public.release_ai_global_daily_budget(uuid) to service_role;
grant execute on function public.settle_ai_global_daily_budget(uuid, numeric) to service_role;
