begin;

select plan(12);

select ok(
  case
    when to_regprocedure('public.current_profile_id()') is null then true
    else not has_function_privilege('anon', to_regprocedure('public.current_profile_id()'), 'EXECUTE')
  end,
  'anonymous users cannot execute current_profile_id when the legacy helper exists'
);

select ok(
  case
    when to_regprocedure('public.current_profile_id()') is null then true
    else has_function_privilege('authenticated', to_regprocedure('public.current_profile_id()'), 'EXECUTE')
  end,
  'authenticated legacy policies retain current_profile_id when it exists'
);

select ok(
  case
    when to_regprocedure('public.is_admin()') is null then true
    else not has_function_privilege('anon', to_regprocedure('public.is_admin()'), 'EXECUTE')
  end,
  'anonymous users cannot execute is_admin when the legacy helper exists'
);

select ok(
  case
    when to_regprocedure('public.is_admin()') is null then true
    else has_function_privilege('authenticated', to_regprocedure('public.is_admin()'), 'EXECUTE')
  end,
  'authenticated legacy policies retain is_admin when it exists'
);

select ok(
  to_regprocedure('public.set_updated_at()') is null
  or exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'set_updated_at'
      and p.proconfig = array['search_path=""']::text[]
  ),
  'shared trigger helper has an immutable search_path when it exists'
);

select ok(
  case
    when to_regprocedure('public.set_updated_at()') is null then true
    else not has_function_privilege('anon', to_regprocedure('public.set_updated_at()'), 'EXECUTE')
  end,
  'anonymous users cannot call the shared trigger helper when it exists'
);

select ok(
  case
    when to_regprocedure('public.set_updated_at()') is null then true
    else not has_function_privilege('authenticated', to_regprocedure('public.set_updated_at()'), 'EXECUTE')
  end,
  'authenticated users cannot call the shared trigger helper directly when it exists'
);

select ok(
  case
    when to_regprocedure('public.set_updated_at()') is null then true
    else has_function_privilege('service_role', to_regprocedure('public.set_updated_at()'), 'EXECUTE')
  end,
  'service role retains trigger helper access when it exists'
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
