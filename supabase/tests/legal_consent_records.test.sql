begin;
select plan(5);

select ok(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'legal_consent_records'),
  'legal consent records enable row-level security'
);
select is(has_table_privilege('anon', 'public.legal_consent_records', 'select'), false, 'anonymous users cannot read consent records');
select is(has_table_privilege('authenticated', 'public.legal_consent_records', 'insert'), false, 'signed-in clients cannot forge consent records');
select is(has_table_privilege('service_role', 'public.legal_consent_records', 'insert'), true, 'server service role can persist consent records');
select is(
  (select confdeltype::text from pg_constraint where conrelid = 'public.legal_consent_records'::regclass and contype = 'f'),
  'c',
  'account deletion cascades to consent records'
);

select * from finish();
rollback;
