begin;
select plan(5);

select ok((select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'account_action_rate_limits'), 'account action limits enable RLS');
select is(has_table_privilege('anon', 'public.account_action_rate_limits', 'select'), false, 'anonymous users cannot inspect action limits');
select is(has_table_privilege('authenticated', 'public.account_action_rate_limits', 'insert'), false, 'signed-in users cannot forge action limits');
select is(has_function_privilege('anon', 'public.consume_account_action_rate_limit(uuid,text,timestamptz,timestamptz,integer)', 'execute'), false, 'anonymous users cannot consume action limits');
select is(has_function_privilege('service_role', 'public.consume_account_action_rate_limit(uuid,text,timestamptz,timestamptz,integer)', 'execute'), true, 'server service role can apply action limits');

select * from finish();
rollback;
