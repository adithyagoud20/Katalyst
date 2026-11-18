-- Public-facing announcement and scheduled launch-event content.
-- Only server routes using the service role may read or write this table.
create table if not exists public.site_content (
  id smallint primary key default 1 check (id = 1),
  announcement_enabled boolean not null default false,
  announcement_tone text not null default 'info' check (announcement_tone in ('info', 'important')),
  announcement_title text not null default '' check (char_length(announcement_title) <= 120),
  announcement_message text not null default '' check (char_length(announcement_message) <= 420),
  announcement_action_label text not null default '' check (char_length(announcement_action_label) <= 36),
  announcement_action_url text not null default '' check (char_length(announcement_action_url) <= 1024),
  announcement_starts_at timestamptz,
  announcement_ends_at timestamptz,
  launch_event_enabled boolean not null default false,
  launch_event_title text not null default '' check (char_length(launch_event_title) <= 120),
  launch_event_message text not null default '' check (char_length(launch_event_message) <= 420),
  launch_event_video_url text not null default '' check (char_length(launch_event_video_url) <= 2048),
  launch_event_starts_at timestamptz,
  launch_event_ends_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  check (announcement_starts_at is null or announcement_ends_at is null or announcement_ends_at > announcement_starts_at),
  check (launch_event_starts_at is null or launch_event_ends_at is null or launch_event_ends_at > launch_event_starts_at),
  check (not announcement_enabled or (announcement_title <> '' and announcement_message <> '' and announcement_starts_at is not null and announcement_ends_at is not null)),
  check (not launch_event_enabled or (launch_event_title <> '' and launch_event_message <> '' and launch_event_video_url <> '' and launch_event_starts_at is not null and launch_event_ends_at is not null))
);

alter table public.site_content enable row level security;
revoke all on table public.site_content from public, anon, authenticated;
grant all on table public.site_content to service_role;

insert into public.site_content (id) values (1) on conflict (id) do nothing;
