begin;
select plan(12);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('a0000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-user@example.test', '', now(), now(), now(), '{"provider":"google"}', '{"name":"Admin"}'),
  ('b0000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student-user@example.test', '', now(), now(), now(), '{"provider":"google"}', '{"name":"Student"}');

insert into auth.sessions (id, user_id, created_at, updated_at)
values
  ('a0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000001', now(), now()),
  ('b0000000-0000-4000-8000-000000000020', 'b0000000-0000-4000-8000-000000000002', now(), now());

insert into public.app_admins (user_id, email, role)
values ('a0000000-0000-4000-8000-000000000001', 'admin-user@example.test', 'admin');

-- Set JWT for Admin
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.session_id', 'a0000000-0000-4000-8000-000000000010', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select is(public.is_app_admin(), true, 'admin user is recognized by is_app_admin');
select is((select shared_ai_enabled from public.ai_system_config where id = 1), true, 'system config is readable');
select is((select monthly_authenticated_credits from public.ai_credit_policies where id = 1), 1000, 'credit policy is readable');

-- Switch to ordinary student
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.session_id', 'b0000000-0000-4000-8000-000000000020', true);

select is(public.is_app_admin(), false, 'student user is not recognized as admin');

-- Test credit reservation for authenticated user
select is((select status from public.reserve_ai_credits('req-idemp-001', '@cf/meta/llama-3.3-70b-instruct', 1.0)), 'reserved', 'reserve_ai_credits reserves credits for authenticated user');
select is((select credits_reserved from public.ai_credit_periods where user_id = 'b0000000-0000-4000-8000-000000000002'), 1.0, 'credit period reflects reserved amount');

-- Test idempotency
select is((select status from public.reserve_ai_credits('req-idemp-001', '@cf/meta/llama-3.3-70b-instruct', 1.0)), 'idempotent', 'idempotent reservation returns idempotent status');

-- Test settlement
select is((select status from public.settle_ai_credits(
  (select id from public.ai_credit_reservations where idempotency_key = 'req-idemp-001'),
  100, 200, 1.2, false
)), 'settled', 'settle_ai_credits settles reservation with actual credits');

select is((select credits_reserved from public.ai_credit_periods where user_id = 'b0000000-0000-4000-8000-000000000002'), 0.0, 'settlement releases reservation');
select is((select credits_used from public.ai_credit_periods where user_id = 'b0000000-0000-4000-8000-000000000002'), 1.2, 'settlement increments credits_used');

-- Test guest trial session
reset role;
select is((select status from public.reserve_ai_credits('guest-req-001', '@cf/meta/llama-3.3-70b-instruct', 1.0, '12345678-1234-1234-1234-123456789abc')), 'error', 'fails if guest session does not exist');

-- Initialize guest session and reserve
select public.get_or_create_guest_session('12345678-1234-1234-1234-123456789abc', 'test-ip-hash', now() + interval '30 days');
select is((select status from public.reserve_ai_credits('guest-req-002', '@cf/meta/llama-3.3-70b-instruct', 1.0, '12345678-1234-1234-1234-123456789abc')), 'reserved', 'guest credit reservation succeeds');

select * from finish();
rollback;
