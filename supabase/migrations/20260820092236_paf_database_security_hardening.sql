-- Harden the PAF objects without breaking the legacy field-collection schema
-- that shares this Supabase project.

do $$
declare
  sequence_record record;
begin
  for sequence_record in
    select sequence_schema, sequence_name
    from information_schema.sequences
    where sequence_schema = 'public'
      and sequence_name like 'paf\_%' escape '\'
  loop
    execute format(
      'revoke all on sequence %I.%I from anon, authenticated',
      sequence_record.sequence_schema,
      sequence_record.sequence_name
    );
    execute format(
      'grant usage, select on sequence %I.%I to service_role',
      sequence_record.sequence_schema,
      sequence_record.sequence_name
    );
  end loop;
end;
$$;

-- These helpers belong to the legacy schema. Authenticated users still need
-- the first two in RLS policies, but unauthenticated RPC access is unnecessary.
do $$
begin
  if to_regprocedure('public.current_profile_id()') is not null then
    revoke all on function public.current_profile_id() from public, anon;
    grant execute on function public.current_profile_id() to authenticated, service_role;
  end if;

  if to_regprocedure('public.is_admin()') is not null then
    revoke all on function public.is_admin() from public, anon;
    grant execute on function public.is_admin() to authenticated, service_role;
  end if;

  if to_regprocedure('public.set_updated_at()') is not null then
    alter function public.set_updated_at() set search_path = '';
    revoke all on function public.set_updated_at() from public, anon, authenticated;
    grant execute on function public.set_updated_at() to service_role;
  end if;
end;
$$;

-- Cover the two foreign keys reported by the database advisor. Both tables
-- are part of the legacy schema and contain production records.
create index if not exists forms_device_id_idx
  on public.forms (device_id);

create index if not exists sync_logs_device_id_idx
  on public.sync_logs (device_id);

-- These SELECT policies duplicate their corresponding ALL policies exactly.
-- Removing them preserves authorization while avoiding duplicate evaluation.
drop policy if exists photos_select_own_or_admin on public.photos;
drop policy if exists stakeholders_select_own_or_admin on public.stakeholders;
