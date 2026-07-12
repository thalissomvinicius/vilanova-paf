-- The first version of the hardening migration touched a shared helper in the
-- existing project. Restore its previous configuration without assuming that
-- the helper exists in a clean PAF-only database.
do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'alter function public.set_updated_at() reset search_path';
  end if;
end;
$$;

create or replace function public.paf_replace_access_scope(
  p_access_account_id bigint,
  p_producer_ids bigint[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  requested_count integer := coalesce(cardinality(p_producer_ids), 0);
  existing_count integer;
begin
  if not exists (
    select 1
    from public.paf_access_accounts
    where id = p_access_account_id
  ) then
    raise exception 'Acesso não encontrado.';
  end if;

  select count(*)::integer
  into existing_count
  from public.paf_producers
  where id = any(coalesce(p_producer_ids, '{}'::bigint[]));

  if existing_count <> requested_count then
    raise exception 'Um ou mais produtores não existem.';
  end if;

  delete from public.paf_access_account_producers
  where access_account_id = p_access_account_id;

  insert into public.paf_access_account_producers (access_account_id, producer_id)
  select p_access_account_id, scope.producer_id
  from unnest(coalesce(p_producer_ids, '{}'::bigint[])) as scope(producer_id);
end;
$$;

revoke all on function public.paf_replace_access_scope(bigint, bigint[])
from public, anon, authenticated;

grant execute on function public.paf_replace_access_scope(bigint, bigint[])
to service_role;

create or replace function public.paf_update_access_account(
  p_access_account_id bigint,
  p_name text,
  p_login text,
  p_access_code_hash text,
  p_code_hint text,
  p_account_type text,
  p_technician_id bigint,
  p_organization text,
  p_active boolean,
  p_can_submit_reports boolean,
  p_can_manage_visits boolean,
  p_notes text,
  p_producer_ids bigint[],
  p_revoke_sessions boolean
)
returns setof public.paf_access_accounts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  requested_count integer := coalesce(cardinality(p_producer_ids), 0);
  existing_count integer;
  updated_account public.paf_access_accounts;
begin
  select count(*)::integer
  into existing_count
  from public.paf_producers
  where id = any(coalesce(p_producer_ids, '{}'::bigint[]));

  if existing_count <> requested_count then
    raise exception 'Um ou mais produtores não existem.';
  end if;
  if p_account_type = 'PRODUTOR' and requested_count <> 1 then
    raise exception 'O acesso de produtor deve estar vinculado a um produtor.';
  end if;

  update public.paf_access_accounts
  set name = p_name,
      login = p_login,
      access_code_hash = p_access_code_hash,
      code_hint = p_code_hint,
      account_type = p_account_type,
      technician_id = p_technician_id,
      organization = p_organization,
      active = p_active,
      can_submit_reports = p_can_submit_reports,
      can_manage_visits = p_can_manage_visits,
      notes = p_notes
  where id = p_access_account_id
    and account_type <> 'ADMIN'
  returning * into updated_account;

  if not found then
    return;
  end if;

  delete from public.paf_access_account_producers
  where access_account_id = p_access_account_id;

  insert into public.paf_access_account_producers (access_account_id, producer_id)
  select p_access_account_id, scope.producer_id
  from unnest(coalesce(p_producer_ids, '{}'::bigint[])) as scope(producer_id);

  if p_revoke_sessions then
    delete from public.paf_auth_sessions
    where access_account_id = p_access_account_id;
  end if;

  return next updated_account;
end;
$$;

create or replace function public.paf_change_access_secret(
  p_access_account_id bigint,
  p_access_code_hash text,
  p_code_hint text
)
returns setof public.paf_access_accounts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_account public.paf_access_accounts;
begin
  update public.paf_access_accounts
  set access_code_hash = p_access_code_hash,
      code_hint = p_code_hint
  where id = p_access_account_id
  returning * into updated_account;

  if not found then
    return;
  end if;

  delete from public.paf_auth_sessions
  where access_account_id = p_access_account_id;

  return next updated_account;
end;
$$;

revoke all on function public.paf_update_access_account(
  bigint, text, text, text, text, text, bigint, text, boolean, boolean,
  boolean, text, bigint[], boolean
) from public, anon, authenticated;

revoke all on function public.paf_change_access_secret(bigint, text, text)
from public, anon, authenticated;

grant execute on function public.paf_update_access_account(
  bigint, text, text, text, text, text, bigint, text, boolean, boolean,
  boolean, text, bigint[], boolean
) to service_role;

grant execute on function public.paf_change_access_secret(bigint, text, text)
to service_role;
