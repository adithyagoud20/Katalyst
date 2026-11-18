begin;
select plan(27);

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
select is((select count(*)::integer from public.ai_system_config where id = 1), 0, 'browser roles cannot read server AI configuration');
select is((select count(*)::integer from public.ai_credit_policies where id = 1), 0, 'browser roles cannot read internal credit policies');

-- Switch to ordinary student
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.session_id', 'b0000000-0000-4000-8000-000000000020', true);

select is(public.is_app_admin(), false, 'student user is not recognized as admin');

select is(has_function_privilege('anon', 'public.reserve_ai_credits(text,text,numeric,text,uuid)', 'execute'), false, 'anonymous clients cannot reserve credits directly');
select is(has_function_privilege('authenticated', 'public.reserve_ai_credits(text,text,numeric,text,uuid)', 'execute'), false, 'signed-in clients cannot reserve credits directly');
select is(has_function_privilege('service_role', 'public.reserve_ai_credits(text,text,numeric,text,uuid)', 'execute'), true, 'the server service role can reserve credits');
select is(has_function_privilege('anon', 'public.get_or_create_guest_session(text,text,timestamptz)', 'execute'), false, 'anonymous clients cannot create guest credit records directly');
select is(has_function_privilege('authenticated', 'public.get_or_create_guest_session(text,text,timestamptz)', 'execute'), false, 'signed-in clients cannot create guest credit records directly');
select is(has_function_privilege('service_role', 'public.get_or_create_guest_session(text,text,timestamptz)', 'execute'), true, 'the server service role can initialize guest credit records');
select is(has_function_privilege('anon', 'public.create_profile_for_auth_user()', 'execute'), false, 'anonymous clients cannot invoke the profile trigger function');
select is(has_function_privilege('authenticated', 'public.create_profile_for_auth_user()', 'execute'), false, 'signed-in clients cannot invoke the profile trigger function');
select is(has_function_privilege('anon', 'public.get_or_create_user_credit_period(uuid,timestamptz,timestamptz)', 'execute'), false, 'anonymous clients cannot allocate user credit periods directly');
select is(has_function_privilege('authenticated', 'public.get_or_create_user_credit_period(uuid,timestamptz,timestamptz)', 'execute'), false, 'signed-in clients cannot allocate user credit periods directly');
select is(has_function_privilege('anon', 'public.settle_ai_credits(uuid,integer,integer,numeric,boolean)', 'execute'), false, 'anonymous clients cannot settle credit reservations directly');
select is(has_function_privilege('authenticated', 'public.settle_ai_credits(uuid,integer,integer,numeric,boolean)', 'execute'), false, 'signed-in clients cannot settle credit reservations directly');
select is(has_function_privilege('anon', 'public.release_ai_reservation(uuid,text,text)', 'execute'), false, 'anonymous clients cannot release credit reservations directly');
select is(has_function_privilege('authenticated', 'public.release_ai_reservation(uuid,text,text)', 'execute'), false, 'signed-in clients cannot release credit reservations directly');
select is(
  has_function_privilege('service_role', 'public.get_or_create_user_credit_period(uuid,timestamptz,timestamptz)', 'execute')
  and has_function_privilege('service_role', 'public.settle_ai_credits(uuid,integer,integer,numeric,boolean)', 'execute')
  and has_function_privilege('service_role', 'public.release_ai_reservation(uuid,text,text)', 'execute'),
  true,
  'the server service role can complete the credit lifecycle'
);

-- The application server supplies the verified user ID and calls these RPCs
-- with its service-role client. Browser JWT roles never call credit functions.
reset role;

-- Test credit reservation for authenticated user
select is((select status from public.reserve_ai_credits('req-idemp-001', '@cf/meta/llama-3.3-70b-instruct', 1.0, null, 'b0000000-0000-4000-8000-000000000002')), 'reserved', 'reserve_ai_credits reserves credits for the server-verified user');
select is((select credits_reserved from public.ai_credit_periods where user_id = 'b0000000-0000-4000-8000-000000000002'), 1.0, 'credit period reflects reserved amount');

-- Test idempotency
select is((select status from public.reserve_ai_credits('req-idemp-001', '@cf/meta/llama-3.3-70b-instruct', 1.0, null, 'b0000000-0000-4000-8000-000000000002')), 'idempotent', 'idempotent reservation returns idempotent status');

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
