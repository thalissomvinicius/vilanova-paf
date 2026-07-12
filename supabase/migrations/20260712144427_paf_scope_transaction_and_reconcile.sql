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
