begin;
select plan(15);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-one@example.test', '', now(), now(), now(), '{"provider":"google","providers":["google"]}', '{"name":"Owner One"}'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-two@example.test', '', now(), now(), now(), '{"provider":"google","providers":["google"]}', '{"name":"Owner Two"}');
insert into auth.sessions (id, user_id, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', now(), now()),
  ('20000000-0000-4000-8000-000000000020', '20000000-0000-4000-8000-000000000002', now(), now());

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.session_id', '10000000-0000-4000-8000-000000000010', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select is((select count(*)::integer from public.profiles), 1, 'a signed-in user can see only their profile');
select is(has_table_privilege('authenticated', 'public.account_snapshots', 'INSERT'), false, 'clients cannot directly insert ownership rows');
select is(public.has_active_auth_session(), true, 'the signed-in JWT matches a live Auth session');
select is((select status from public.save_account_snapshot(
  '{"projects":[],"skills":[],"provider":"cloudflare","models":{"cloudflare":"","openai":"gpt-6-luna","gemini":"gemini-3.8-flash","openrouter":"openrouter/free","ollama":""},"activeChatId":null}',
  '{"version":1,"enrollments":[]}', '{"version":1,"theme":"system","textDensity":"comfortable"}', 0,
  '10000000-0000-4000-8000-000000000010'
)), 'saved', 'the migration RPC writes the first revision for the verified owner');
select is((select revision from public.account_snapshots), 1, 'a first snapshot starts at revision one');
select is((select status from public.save_account_snapshot(
  '{"projects":[],"skills":[],"provider":"cloudflare","models":{"cloudflare":"","openai":"gpt-6-luna","gemini":"gemini-3.8-flash","openrouter":"openrouter/free","ollama":""},"activeChatId":null}',
  '{"version":1,"enrollments":[]}', '{"version":1,"theme":"dark","textDensity":"compact"}', 0,
  '10000000-0000-4000-8000-000000000010'
)), 'already_migrated', 'replaying a completed migration ID is idempotent');
select is((select preferences ->> 'theme' from public.account_snapshots), 'system', 'a replay does not replace the original migration snapshot');
select is((select status from public.save_account_snapshot(
  '{"projects":[],"skills":[],"provider":"cloudflare","models":{"cloudflare":"","openai":"gpt-6-luna","gemini":"gemini-3.8-flash","openrouter":"openrouter/free","ollama":""},"activeChatId":null}',
  '{"version":1,"enrollments":[]}', '{"version":1,"theme":"system","textDensity":"comfortable"}', 0, null
)), 'conflict', 'a stale revision cannot overwrite newer data');

select set_config('request.jwt.claim.session_id', '30000000-0000-4000-8000-000000000030', true);
select is(public.has_active_auth_session(), false, 'a revoked session is not accepted by the database policy helper');
select is((select count(*)::integer from public.account_snapshots), 0, 'a revoked JWT cannot read account snapshots while it remains otherwise well formed');

select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.session_id', '20000000-0000-4000-8000-000000000020', true);
select is((select count(*)::integer from public.account_snapshots), 0, 'a different signed-in user cannot read the first user snapshot');
select is((select count(*)::integer from public.profiles), 1, 'a different signed-in user sees only their own profile');
select is((select status from public.save_account_snapshot(
  '{"projects":[],"skills":[],"provider":"cloudflare","models":{"cloudflare":"","openai":"gpt-6-luna","gemini":"gemini-3.8-flash","openrouter":"openrouter/free","ollama":""},"activeChatId":null}',
  '{"version":1,"enrollments":[]}', '{"version":1,"theme":"system","textDensity":"comfortable"}', 0, null
)), 'saved', 'the same RPC creates a separate snapshot for the second verified user');
select is((select count(*)::integer from public.account_snapshots), 1, 'the second user can read only the snapshot they own');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.session_id', '10000000-0000-4000-8000-000000000010', true);
select is((select count(*)::integer from public.account_snapshots), 1, 'the first user cannot read the second user snapshot');

select * from finish();
rollback;
