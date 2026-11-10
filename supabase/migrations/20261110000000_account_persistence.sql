create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace jsonb not null,
  learning_progress jsonb not null,
  preferences jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.guest_migrations (
  user_id uuid not null references auth.users(id) on delete cascade,
  migration_id text not null check (migration_id ~ '^[0-9a-fA-F-]{36}$'),
  snapshot_revision integer not null,
  applied_at timestamptz not null default now(),
  primary key (user_id, migration_id)
);

alter table public.profiles enable row level security;
alter table public.account_snapshots enable row level security;
alter table public.guest_migrations enable row level security;

revoke all on public.profiles, public.account_snapshots, public.guest_migrations from anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.account_snapshots to authenticated;

create or replace function public.has_active_auth_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from auth.sessions as s
    where s.id::text = (auth.jwt() ->> 'session_id')
      and s.user_id = auth.uid()
  );
$$;

revoke all on function public.has_active_auth_session() from public, anon;
grant execute on function public.has_active_auth_session() to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select public.has_active_auth_session()) and id = (select auth.uid()));
drop policy if exists "account_snapshots_select_own" on public.account_snapshots;
create policy "account_snapshots_select_own" on public.account_snapshots
  for select to authenticated using ((select public.has_active_auth_session()) and user_id = (select auth.uid()));

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', ''), 2_000)
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_auth_user();

create or replace function public.save_account_snapshot(
  p_workspace jsonb,
  p_learning_progress jsonb,
  p_preferences jsonb,
  p_expected_revision integer,
  p_migration_id text default null
)
returns table (status text, revision integer, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_revision integer;
  v_updated_at timestamptz;
begin
  if v_user_id is null or not public.has_active_auth_session() then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_expected_revision < 0 then
    raise exception 'Invalid expected revision' using errcode = '22023';
  end if;
  if p_migration_id is not null and p_migration_id !~ '^[0-9a-fA-F-]{36}$' then
    raise exception 'Invalid migration ID' using errcode = '22023';
  end if;

  if p_migration_id is not null then
    select g.snapshot_revision into v_revision
      from public.guest_migrations as g
      where g.user_id = v_user_id and g.migration_id = p_migration_id;
    if found then
      select s.revision, s.updated_at into v_revision, v_updated_at
        from public.account_snapshots as s where s.user_id = v_user_id;
      return query select 'already_migrated'::text, coalesce(v_revision, 0), v_updated_at;
      return;
    end if;
  end if;

  insert into public.account_snapshots as current_snapshot
    (user_id, workspace, learning_progress, preferences, revision, updated_at)
  values
    (v_user_id, p_workspace, p_learning_progress, p_preferences, 1, now())
  on conflict (user_id) do update set
    workspace = excluded.workspace,
    learning_progress = excluded.learning_progress,
    preferences = excluded.preferences,
    revision = current_snapshot.revision + 1,
    updated_at = now()
  where current_snapshot.revision = p_expected_revision
  returning current_snapshot.revision, current_snapshot.updated_at
    into v_revision, v_updated_at;

  if not found then
    select s.revision, s.updated_at into v_revision, v_updated_at
      from public.account_snapshots as s where s.user_id = v_user_id;
    return query select 'conflict'::text, coalesce(v_revision, 0), v_updated_at;
    return;
  end if;

  if p_migration_id is not null then
    insert into public.guest_migrations (user_id, migration_id, snapshot_revision)
      values (v_user_id, p_migration_id, v_revision);
  end if;
  return query select 'saved'::text, v_revision, v_updated_at;
end;
$$;

revoke all on function public.save_account_snapshot(jsonb, jsonb, jsonb, integer, text) from public, anon;
grant execute on function public.save_account_snapshot(jsonb, jsonb, jsonb, integer, text) to authenticated;
