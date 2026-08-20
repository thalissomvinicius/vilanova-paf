begin;

select plan(12);

select ok(
  not has_function_privilege('anon', 'public.current_profile_id()', 'EXECUTE'),
  'anonymous users cannot execute current_profile_id'
);

select ok(
  has_function_privilege('authenticated', 'public.current_profile_id()', 'EXECUTE'),
  'authenticated legacy policies can execute current_profile_id'
);

select ok(
  not has_function_privilege('anon', 'public.is_admin()', 'EXECUTE'),
  'anonymous users cannot execute is_admin'
);

select ok(
  has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE'),
  'authenticated legacy policies can execute is_admin'
);

select is(
  (
    select p.proconfig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'set_updated_at'
  ),
  array['search_path=""']::text[],
  'shared trigger helper has an immutable search_path'
);

select ok(
  not has_function_privilege('anon', 'public.set_updated_at()', 'EXECUTE'),
  'anonymous users cannot call the shared trigger helper'
);

select ok(
  not has_function_privilege('authenticated', 'public.set_updated_at()', 'EXECUTE'),
  'authenticated users cannot call the shared trigger helper directly'
);

select ok(
  has_function_privilege('service_role', 'public.set_updated_at()', 'EXECUTE'),
  'service role retains trigger helper access'
);

select is(
  (
    select count(*)
    from information_schema.sequences s
    where s.sequence_schema = 'public'
      and s.sequence_name like 'paf\_%' escape '\'
      and has_sequence_privilege('anon', format('%I.%I', s.sequence_schema, s.sequence_name), 'USAGE')
  ),
  0::bigint,
  'anonymous users have no PAF sequence privileges'
);

select is(
  (
    select count(*)
    from information_schema.sequences s
    where s.sequence_schema = 'public'
      and s.sequence_name like 'paf\_%' escape '\'
      and has_sequence_privilege('authenticated', format('%I.%I', s.sequence_schema, s.sequence_name), 'USAGE')
  ),
  0::bigint,
  'authenticated users have no PAF sequence privileges'
);

select is(
  (
    select count(*)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name like 'paf\_%' escape '\'
      and grantee in ('anon', 'authenticated')
  ),
  0::bigint,
  'browser roles have no direct grants on PAF tables'
);

select is(
  (
    select count(*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname like 'paf\_%' escape '\'
      and not c.relrowsecurity
  ),
  0::bigint,
  'RLS remains enabled on every PAF table'
);

select * from finish();

rollback;
