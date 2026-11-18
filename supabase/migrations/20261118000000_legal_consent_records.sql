create table if not exists public.legal_consent_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null check (length(terms_version) between 1 and 40),
  privacy_version text not null check (length(privacy_version) between 1 and 40),
  accepted_at timestamptz not null,
  consent_method text not null check (consent_method in ('google', 'email-sign-in', 'email-sign-up')),
  created_at timestamptz not null default now(),
  primary key (user_id, terms_version, privacy_version)
);

alter table public.legal_consent_records enable row level security;
revoke all on public.legal_consent_records from public, anon, authenticated;
grant all on public.legal_consent_records to service_role;
