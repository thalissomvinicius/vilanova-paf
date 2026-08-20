-- Create access accounts and their producer scope in one transaction. This
-- prevents a producer login from existing without exactly one valid producer.

create or replace function public.paf_create_access_account(
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
  p_producer_ids bigint[]
)
returns setof public.paf_access_accounts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  requested_count integer := coalesce(cardinality(p_producer_ids), 0);
  existing_count integer;
  created_account public.paf_access_accounts;
begin
  select count(*)::integer
  into existing_count
  from public.paf_producers
  where id = any(coalesce(p_producer_ids, '{}'::bigint[]));

  if existing_count <> requested_count then
    raise exception 'Um ou mais produtores não existem.';
  end if;
  if p_account_type = 'PRODUTOR' and requested_count <> 1 then
    raise exception 'O acesso de produtor deve estar vinculado a exatamente um produtor.';
  end if;

  insert into public.paf_access_accounts (
    name,
    login,
    access_code_hash,
    code_hint,
    account_type,
    technician_id,
    organization,
    active,
    can_submit_reports,
    can_manage_visits,
    notes
  )
  values (
    p_name,
    p_login,
    p_access_code_hash,
    p_code_hint,
    p_account_type,
    p_technician_id,
    p_organization,
    p_active,
    p_account_type = 'PRODUTOR' and p_can_submit_reports,
    p_account_type in ('TECNICO', 'ORGANIZACAO') and p_can_manage_visits,
    p_notes
  )
  returning * into created_account;

  insert into public.paf_access_account_producers (access_account_id, producer_id)
  select created_account.id, scope.producer_id
  from unnest(coalesce(p_producer_ids, '{}'::bigint[])) as scope(producer_id);

  return next created_account;
end;
$$;

revoke all on function public.paf_create_access_account(
  text, text, text, text, text, bigint, text, boolean, boolean, boolean, text, bigint[]
) from public, anon, authenticated;

grant execute on function public.paf_create_access_account(
  text, text, text, text, text, bigint, text, boolean, boolean, boolean, text, bigint[]
) to service_role;
