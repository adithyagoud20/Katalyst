begin;
select plan(7);

select ok((select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'ai_global_daily_budgets'), 'daily budget totals enable RLS');
select ok((select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'ai_global_daily_reservations'), 'daily reservations enable RLS');
select is(has_table_privilege('anon', 'public.ai_global_daily_budgets', 'select'), false, 'anonymous users cannot inspect the shared budget');
select is(has_table_privilege('authenticated', 'public.ai_global_daily_reservations', 'insert'), false, 'signed-in clients cannot create budget reservations');
select is(has_function_privilege('anon', 'public.reserve_ai_global_daily_budget(uuid,date,numeric,numeric)', 'execute'), false, 'anonymous users cannot reserve shared AI budget');
select is(has_function_privilege('service_role', 'public.reserve_ai_global_daily_budget(uuid,date,numeric,numeric)', 'execute'), true, 'server service role can reserve shared AI budget');

select is((select allowed from public.reserve_ai_global_daily_budget('d0000000-0000-4000-8000-000000000001', current_date, 2, 3)), true, 'daily budget accepts reservation within limit');
select * from finish();
rollback;
