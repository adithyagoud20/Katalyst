begin;
select plan(5);

select ok((select relrowsecurity from pg_class where oid = 'public.site_content'::regclass), 'RLS is enabled for site content');
select ok(not has_table_privilege('anon', 'public.site_content', 'SELECT'), 'anonymous clients cannot read site content directly');
select ok(not has_table_privilege('authenticated', 'public.site_content', 'SELECT'), 'signed-in clients cannot read site content directly');
select ok(not has_table_privilege('authenticated', 'public.site_content', 'UPDATE'), 'signed-in clients cannot modify site content directly');
select ok(has_table_privilege('service_role', 'public.site_content', 'SELECT,INSERT,UPDATE'), 'the server service role can read and update site content');

select * from finish();
rollback;
