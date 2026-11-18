begin;
select plan(9);

select is((select allowed from public.consume_ai_request_rate_limit(repeat('a', 64), 2, 60)), true, 'first request is admitted');
select is((select requests_used from public.consume_ai_request_rate_limit(repeat('a', 64), 2, 60)), 2, 'second request increments the shared bucket');
select is((select allowed from public.consume_ai_request_rate_limit(repeat('a', 64), 2, 60)), false, 'requests beyond the configured maximum are rejected');
select ok((select retry_after_seconds > 0 from public.consume_ai_request_rate_limit(repeat('a', 64), 2, 60)), 'blocked request receives a positive retry delay');
select is((select requests_used from public.consume_ai_request_rate_limit(repeat('b', 64), 2, 60)), 1, 'different identities use independent buckets');
select ok(not has_function_privilege('anon', 'public.consume_ai_request_rate_limit(text,integer,integer)', 'EXECUTE'), 'anonymous clients cannot call the service-only limiter');
select ok(not has_function_privilege('authenticated', 'public.consume_ai_request_rate_limit(text,integer,integer)', 'EXECUTE'), 'signed-in clients cannot call the service-only limiter');
select ok(has_function_privilege('service_role', 'public.consume_ai_request_rate_limit(text,integer,integer)', 'EXECUTE'), 'the server service role can call the limiter');
select ok(not has_table_privilege('anon', 'public.ai_request_rate_limits', 'SELECT'), 'anonymous clients cannot inspect rate-limit identities');

select * from finish();
rollback;
